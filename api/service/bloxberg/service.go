package bloxberg

import (
	"api/database"
	"api/globals"
	"api/institutes"
	"api/service"
	"api/utils/log"
	"api/utils/mail"
	"api/websocket"
	"api/world_map"
	"encoding/json"
	"time"
)

type Service struct {
	DatabaseController  DatabaseInterface
	WebsocketController websocket.WebsocketInterface
	WorldMapController  world_map.Controller
	WorldMapData        map[string]world_map.Location
	Config              service.ServiceConfig
	ticker              *time.Ticker
	done                chan bool
	wsErrorCheckerDone  chan bool
	dbReconnector       database.Reconnector
}

func (sc *Service) Init(_ institutes.Controller, worldMapController world_map.Controller) {
	log.Info("Init Bloxberg service.", log.Bloxberg, log.Service)
	// world map controller
	sc.WorldMapController = worldMapController
	sc.loadWorldMapData()

	// db reconnector
	sc.dbReconnector = database.Reconnector{
		NextDbReconnect:       time.Time{},
		NumberOfDbReconnects:  0,
		InitDatabase:          sc.DatabaseController.Init,
		IsDatabaseInitialised: sc.DatabaseController.IsInitialised,
		ReconnectTimout:       sc.Config.Database.ReconnectTimout,
		ServiceName:           sc.Config.Name,
	}
	// because of the async execution this has to be set. This could be solved in a better way
	sc.DatabaseController.SetIsConnecting(true)
	sc.wsErrorCheckerDone = make(chan bool)
	wsErrorChannel := sc.WebsocketController.GetErrorChannel()
	go func() {
		for {
			select {
			case <-sc.wsErrorCheckerDone:
				return
			case err := <-*wsErrorChannel:
				log.Error("While trying to serve a websocket connection for Bloxberg there was an error.", err, log.Bloxberg, log.Service)
				sc.StopService()
				return
			}
		}
	}()
	sc.WebsocketController.InitAndStartOnce(sc.Config.Websocket)
}

func (sc *Service) GetName() string {
	return sc.Config.Name
}

func (sc *Service) GetDatabaseController() interface{} {
	return sc.DatabaseController
}

func (sc *Service) StartService() *chan bool {
	log.Info("Starting bloxberg service.", log.Bloxberg, log.Service)
	if sc.ticker != nil {
		sc.ticker.Stop()
	}

	sc.ticker = time.NewTicker(time.Duration(sc.Config.QueryInterval) * time.Millisecond)
	sc.done = make(chan bool)

	go func() {
		for {
			select {
			case <-sc.done:
				return
			case <-sc.ticker.C:
				sc.processEvent()
			}
		}
	}()

	return &sc.done
}
func (sc *Service) StopService() {
	log.Info("Stop keeper service controller ticker.", log.Bloxberg, log.Service)
	if sc.ticker != nil {
		sc.ticker.Stop()
	}

	sc.WebsocketController.StopWebsocket()

	if sc.wsErrorCheckerDone != nil {
		select {
		case sc.wsErrorCheckerDone <- true:
		default:
		}
		close(sc.wsErrorCheckerDone)
		sc.wsErrorCheckerDone = nil
	}

	if sc.done != nil {
		sc.done <- true
		close(sc.done)
		sc.done = nil
	}
}

func (sc *Service) processEvent() {
	log.Info("Process bloxberg service controller event.", log.Bloxberg, log.Service)

	// Check if a websocket connection exists
	if sc.WebsocketController.GetActiveConnections() == 0 {
		log.Info("There are no active websocket connections. Skipping db queries.", log.Bloxberg, log.Service)
		if sc.DatabaseController.IsInitialised() {
			log.Info("bloxberg db initialised. Closing connection.", log.Bloxberg, log.Service)
			sc.DatabaseController.CloseConnection()
		} else {
			log.Info("bloxberg db not initialised. Stopping db reconnector if active.", log.Bloxberg, log.Service)
			sc.dbReconnector.Stop()
		}
		sc.DatabaseController.SetIsConnecting(true)
		return
	}

	// Check if already initialised
	if !sc.DatabaseController.IsInitialised() {
		log.Info("bloxberg db not initialised. Starting reconnector.", log.Bloxberg, log.Service)
		go sc.dbReconnector.StartRepeatingDbReconnectOnce()
	}

	// Calculate timepoint from query interval
	negativeQueryDuration := time.Duration(-sc.Config.QueryInterval) * time.Millisecond
	var toTimepoint = time.Now()
	var fromTimePoint time.Time = toTimepoint.Add(negativeQueryDuration)
	var fromTimePointStr = fromTimePoint.Format(time.DateTime)
	var toTimePointStr = toTimepoint.Format(time.DateTime)

	// Load last messages
	log.Debug("Load bloxberg data.", log.Bloxberg, log.Service)
	blocks, blocksError := sc.DatabaseController.LoadBlocks(fromTimePointStr, toTimePointStr)
	confirmedTransacttions, confirmedTransacttionsQueryError := sc.DatabaseController.LoadConfirmedTransactions(fromTimePointStr, toTimePointStr)
	licensedContributors, licensedContributorsQueryError := sc.DatabaseController.LoadLicensedContributors(fromTimePointStr, toTimePointStr)

	if blocksError != nil || confirmedTransacttionsQueryError != nil || licensedContributorsQueryError != nil {
		pingError := sc.DatabaseController.Ping()
		if pingError != nil {
			log.Error("Can not ping bloxberg DB", pingError, log.Bloxberg, log.Service)
			sc.DatabaseController.CloseConnection()
			log.Info("Starting reconnector.", log.Bloxberg, log.Service)
			go sc.dbReconnector.StartRepeatingDbReconnectOnce()
		}
	}

	// create websocket data for blocks
	log.Debug("create websocket data for bloxberg.", log.Bloxberg, log.Service)
	var websocketEventData websocket.BloxbergData
	for _, block := range blocks {
		websocketEventData.Blocks = append(websocketEventData.Blocks, websocket.BloxbergBlock{
			ByteSize:   block.ByteSize,
			InsertedAt: block.InsertedAt,
			Miner:      block.Miner,
			MinerHash:  block.MinerHash,
			Location:   sc.WorldMapData[block.MinerHash],
		})
	}

	// create websocket data for ConfirmedTransaction
	for _, confirmedTransaction := range confirmedTransacttions {
		websocketEventData.ConfirmedTransactions = append(websocketEventData.ConfirmedTransactions, websocket.BloxbergConfirmedTransaction{
			TransactionFee: confirmedTransaction.TransactionFee,
			UpdatedAt:      confirmedTransaction.UpdatedAt,
			BlockMiner:     confirmedTransaction.BlockMiner,
			BlockMinerHash: confirmedTransaction.BlockMinerHash,
			Location:       sc.WorldMapData[confirmedTransaction.BlockMinerHash],
		})
	}

	// create websocket data for licensedContributors
	for _, licensedContributor := range licensedContributors {
		websocketEventData.LicensedContributors = append(websocketEventData.LicensedContributors, websocket.BloxbergLicensedContributor{
			InsertedAt: licensedContributor.InsertedAt,
			Name:       licensedContributor.Name,
		})
	}

	// build hatnoteWebsocketEventData
	var serviceDataJSON, jsonErr = json.Marshal(websocketEventData)
	if jsonErr != nil {
		log.Error("Could not convert bloxberg data to json string.", jsonErr, log.Bloxberg, log.Service)
		return
	}
	var hatnoteWebsocketEventData websocket.EventData
	hatnoteWebsocketEventData.EventInfo.ActiveConnections = sc.WebsocketController.GetActiveConnections()
	hatnoteWebsocketEventData.EventInfo.FromTimepoint = fromTimePoint.UnixMilli()
	hatnoteWebsocketEventData.EventInfo.Service = "bloxberg"
	hatnoteWebsocketEventData.EventInfo.Version = globals.VERSION
	hatnoteWebsocketEventData.EventInfo.ExpectedFrontendVersion = globals.EXPECTED_FRONTEND_VERSION
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.IsConnectionEstablished = sc.DatabaseController.IsInitialised()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.IsConnecting = sc.DatabaseController.IsConnecting()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.NextReconnect = sc.dbReconnector.NextDbReconnect.UnixMilli()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.NumberOfDbReconnects = sc.dbReconnector.NumberOfDbReconnects
	hatnoteWebsocketEventData.Data = string(serviceDataJSON)

	// Send websocket data in bulk
	log.Info("Send websocket data in bulk", log.Bloxberg, log.Service)
	sc.WebsocketController.SendDataInBulk(hatnoteWebsocketEventData)
}

func (sc *Service) UpdateInstitutesData() {}

func (sc *Service) UpdateWorldMapData() {
	sc.loadWorldMapData()
}

func (sc *Service) loadWorldMapData() {
	// no need to use mutex lock/unlock since the usage of the data is not sensible
	var worldMapData, worldMapErr = sc.WorldMapController.Load()
	if worldMapErr != nil {
		logMessage := "Error while loading world map data."
		log.Error(logMessage, worldMapErr, log.Bloxberg, log.Service)
		mail.SendErrorMail(logMessage, worldMapErr)
	} else {
		sc.WorldMapData = worldMapData
	}
}
