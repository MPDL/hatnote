package websocket

import (
	"api/utils/log"
	"api/utils/mail"
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Websocket struct {
	wsConnections             map[string]*websocket.Conn
	server                    *http.Server
	config                    Config
	serverShuttingDown        bool
	initialisedAndStartedOnce bool
	initLock                  sync.Mutex
	sendLock                  sync.Mutex
	errorChannel              chan error
}

type WebsocketInterface interface {
	SendDataInBulk(data EventData)
	InitAndStartOnce(config Config)
	GetErrorChannel() *chan error
	StopWebsocket()
	GetActiveConnections() int
}

func (wsc *Websocket) InitAndStartOnce(config Config) {
	wsc.initLock.Lock()
	if !wsc.initialisedAndStartedOnce {
		wsc.init(config)
		wsc.startWebsocket()
		wsc.initialisedAndStartedOnce = true
	}
	wsc.initLock.Unlock()
}

func (wsc *Websocket) GetErrorChannel() *chan error {
	if wsc.errorChannel == nil {
		wsc.errorChannel = make(chan error)
	}
	return &wsc.errorChannel
}

func (wsc *Websocket) SendDataInBulk(data EventData) {
	wsc.sendLock.Lock()

	if len(wsc.wsConnections) == 0 {
		log.Warn("There is no active websocket connection yet.", log.Websocket)
		wsc.sendLock.Unlock()
		return
	}

	for remoteAddr, wsConnection := range wsc.wsConnections {
		err := wsConnection.WriteJSON(data)
		if err != nil {
			e := wsConnection.Close()
			if e != nil {
				log.Error("Could not close websocket connection.", e, log.Websocket)
			}
			log.Info(fmt.Sprint("Will delete websocket connection: ", remoteAddr), log.Websocket)
			delete(wsc.wsConnections, remoteAddr)
			log.Error(fmt.Sprint("Could not write JSON data to remote websocket ", remoteAddr), err, log.Websocket)
		}
	}

	wsc.sendLock.Unlock()
}

func (wsc *Websocket) init(config Config) {
	wsc.config = config
	if wsc.errorChannel == nil {
		wsc.errorChannel = make(chan error)
	}
	wsc.wsConnections = make(map[string]*websocket.Conn)
	wsc.serverShuttingDown = false

	wsc.server = &http.Server{Addr: fmt.Sprintf(":%d", 8080), Handler: nil}

	// setup endpoint route
	http.HandleFunc(wsc.config.EndpointPath, wsc.wsEndpoint)
}

func (wsc *Websocket) startWebsocket() {
	wsc.serverShuttingDown = false
	if wsc.server == nil {
		err := errors.New("websocket server not initialised")
		log.Error("Can not start websocket.", err, log.Websocket)
		wsc.errorChannel <- err
	}
	log.Info(fmt.Sprint("Starting websocket on port ", 8080, "."), log.Websocket)
	go func() {
		err := wsc.server.ListenAndServe()
		if err != nil {
			if wsc.serverShuttingDown {
				log.Info(fmt.Sprint("Server shutting down. Error: ", err), log.Websocket)
			} else {
				logMessage := fmt.Sprint("Could not listen and serve websocket on port ", 8080, ".")
				log.Error(logMessage, err, log.Websocket)
				mail.SendErrorMail(logMessage, err)
				wsc.errorChannel <- err
			}
		}
	}()
}

func (wsc *Websocket) StopWebsocket() {
	if wsc.serverShuttingDown {
		log.Info("Server is already shutting down or has finished shutdown.", log.Websocket)
		return
	}

	log.Info("Closing open connections and stopping websocket server.", log.Websocket)
	wsc.serverShuttingDown = true
	for _, wsConnection := range wsc.wsConnections {
		closeNormalClosure := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Server shut down.")
		if err := wsConnection.WriteControl(websocket.CloseMessage, closeNormalClosure, time.Now().Add(time.Second)); err != nil {
			log.Error("Error while stopping websocket connections", err, log.Websocket)
		}
		wsConnection.Close()
	}
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	err := wsc.server.Shutdown(ctx)
	if err != nil {
		log.Error("Could not stop websocket server", err, log.Websocket)
	}
}

func (wsc *Websocket) GetActiveConnections() int {
	return len(wsc.wsConnections)
}

func (wsc *Websocket) wsEndpoint(w http.ResponseWriter, r *http.Request) {
	if len(wsc.wsConnections) > wsc.config.MaxConnections {
		log.Warn(fmt.Sprint("Max websocket connections of ", wsc.config.MaxConnections, " reached. Ignoring new connection."), log.Websocket)
		return
	}

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Error("Could not upgrade http connection to websocket.", err, log.Websocket)
	}

	wsc.wsConnections[ws.RemoteAddr().String()] = ws

	wsc.reader(ws)
}

func (wsc *Websocket) reader(conn *websocket.Conn) {
	for {
		remoteAddr := conn.RemoteAddr().String()
		if _, exists := wsc.wsConnections[remoteAddr]; !exists {
			return
		}
		// read in a message
		_, p, err := conn.ReadMessage()
		if err != nil {
			log.Error("Could not read incomming message.", err, log.Websocket)
			e := conn.Close()
			if e != nil {
				log.Error("Could not close websocket connection.", e, log.Websocket)
			}
			log.Info(fmt.Sprint("Will delete websocket connection: ", remoteAddr), log.Websocket)
			delete(wsc.wsConnections, remoteAddr)
			return
		}

		log.Debug(fmt.Sprint("Incomming message was:\n", string(p)), log.Websocket)
	}
}
