package minerva

import (
	"api/database"
	"api/globals"
	"api/institutes"
	"api/service"
	"api/utils/log"
	"api/utils/mail"
	"api/websocket"
	"encoding/json"
	"fmt"
	"net"
	"time"
)

type Service struct {
	DatabaseController        DatabaseInterface
	WebsocketController       websocket.WebsocketInterface
	InstitutesController      institutes.Controller
	InstitutesData            institutes.InstituteData
	Config                    service.ServiceConfig
	ticker                    *time.Ticker
	done                      chan bool
	userIpAddressesQueryCache map[string][]ValidUserIpAddress
	wsErrorCheckerDone        chan bool
	dbReconnector             database.Reconnector
}

func (mmhc *Service) Init(institutesController institutes.Controller) {
	log.Info("Init Minerva service.", log.Minerva, log.Service)
	mmhc.InstitutesController = institutesController
	var institutesData, instituteErr = mmhc.InstitutesController.Load()
	if instituteErr != nil {
		logMessage := "Error while loading institute data."
		log.Error(logMessage, instituteErr, log.Minerva, log.Service)
		mail.SendErrorMail(logMessage, instituteErr)
	} else {
		mmhc.InstitutesData = institutesData
	}
	mmhc.dbReconnector = database.Reconnector{
		NextDbReconnect:       time.Time{},
		NumberOfDbReconnects:  0,
		InitDatabase:          mmhc.DatabaseController.Init,
		IsDatabaseInitialised: mmhc.DatabaseController.IsInitialised,
		ReconnectTimout:       mmhc.Config.Database.ReconnectTimout,
		ServiceName:           mmhc.Config.Name,
	}
	// because of the async execution this has to be set. This could be solved in a better way
	mmhc.DatabaseController.SetIsConnecting(true)
	mmhc.userIpAddressesQueryCache = make(map[string][]ValidUserIpAddress)
	mmhc.wsErrorCheckerDone = make(chan bool)
	wsErrorChannel := mmhc.WebsocketController.GetErrorChannel()
	go func() {
		for {
			select {
			case <-mmhc.wsErrorCheckerDone:
				return
			case <-*wsErrorChannel:
				log.Error("While trying to serve a websocket connection for Minerva there was an error.", <-*wsErrorChannel, log.Minerva, log.Service)
				mmhc.StopService()
				return
			}
		}
	}()
	mmhc.WebsocketController.InitAndStartOnce(mmhc.Config.Websocket)
}

func (mmhc *Service) GetName() string {
	return mmhc.Config.Name
}

func (mmhc *Service) GetDatabaseController() interface{} {
	return mmhc.DatabaseController
}

func (mmhc *Service) StartService() *chan bool {
	log.Info("Starting minerva service.", log.Minerva, log.Service)
	if mmhc.ticker != nil {
		mmhc.ticker.Stop()
	}
	mmhc.ticker = time.NewTicker(time.Duration(mmhc.Config.QueryInterval) * time.Millisecond)
	mmhc.done = make(chan bool)

	go func() {
		for {
			select {
			case <-mmhc.done:
				return
			case <-mmhc.ticker.C:
				mmhc.processEvent()
			}
		}
	}()

	return &mmhc.done
}

func (mmhc *Service) StopService() {
	log.Info("Stop minerva messenger service controller ticker.", log.Minerva, log.Service)
	if mmhc.ticker != nil {
		mmhc.ticker.Stop()
	}

	mmhc.WebsocketController.StopWebsocket()

	if mmhc.wsErrorCheckerDone != nil {
		select {
		case mmhc.wsErrorCheckerDone <- true:
		default:
		}
		close(mmhc.wsErrorCheckerDone)
		mmhc.wsErrorCheckerDone = nil
	}

	if mmhc.done != nil {
		mmhc.done <- true
		close(mmhc.done)
		mmhc.done = nil
	}
}

func (mmhc *Service) processEvent() {
	log.Info("Process minerva messenger service controller event.", log.Minerva, log.Service)

	// Check if a websocket connection exists
	if mmhc.WebsocketController.GetActiveConnections() == 0 {
		log.Info("There are no active websocket connections. Skipping db queries.", log.Minerva, log.Service)
		if mmhc.DatabaseController.IsInitialised() {
			log.Info("minerva db initialised. Closing connection.", log.Minerva, log.Service)
			mmhc.DatabaseController.CloseConnection()
		} else {
			log.Info("minerva db not initialised. Stopping db reconnector if active.", log.Minerva, log.Service)
			mmhc.dbReconnector.Stop()
		}
		mmhc.DatabaseController.SetIsConnecting(true)
		return
	}

	// Check if already initialised
	if !mmhc.DatabaseController.IsInitialised() {
		log.Info("minerva db not initialised. Starting reconnector.", log.Minerva, log.Service)
		go mmhc.dbReconnector.StartRepeatingDbReconnectOnce()
	}

	// Calculate timepoint from query interval
	var toTimepoint = time.Now()
	var fromTimePoint int64 = toTimepoint.UnixMilli() - mmhc.Config.QueryInterval

	// Load last messages
	log.Debug("minerva messenger: Load last messages.", log.Minerva, log.Service)
	messages, msgQueryError := mmhc.DatabaseController.LoadMessagesFromTimepointUntilNow(fromTimePoint, toTimepoint.UnixMilli())

	if msgQueryError != nil {
		pingError := mmhc.DatabaseController.Ping()
		if pingError != nil {
			log.Error("Can not ping minerva DB", pingError, log.Minerva, log.Service)
			mmhc.DatabaseController.CloseConnection()
			log.Info("Starting reconnector.", log.Minerva, log.Service)
			go mmhc.dbReconnector.StartRepeatingDbReconnectOnce()
		}
	}

	// Find institute names for messages
	log.Debug("minerva messenger: Find institute names for messages.", log.Minerva, log.Service)
	var websocketEventData websocket.MinervaData
	for _, message := range messages {
		if _, exists := mmhc.InstitutesData.DomainDuplicates[message.EmailDomain]; exists {
			// email domain is a duplicate, determine institute name by checking ip address
			ipAddresses := mmhc.loadIpAddressesFromUserFromTimepointUntilNowWithCaching(message.UserId, fromTimePoint, toTimepoint.UnixMilli())
			instituteName := mmhc.detemineInstituteName(message.EmailDomain, ipAddresses)

			websocketEventData.Messages = append(websocketEventData.Messages, websocket.MinervaMessage{
				InstituteName: instituteName,
				CreatedAt:     message.CreatedAt,
				MessageLength: message.Length,
				ChannelType:   message.Type,
			})
		} else {
			if institute, exists := mmhc.InstitutesData.Institutes[message.EmailDomain]; exists {
				// email domain is not a duplicate and exists in institute data
				instituteName := institute.InstituteNameDe
				if len(instituteName) == 0 {
					// Inside the json file from rena.mpdl.mpg.de there was no institute name given for the domain.
					// Fall back to just the domain
					instituteName = message.EmailDomain
				}

				websocketEventData.Messages = append(websocketEventData.Messages, websocket.MinervaMessage{
					InstituteName: instituteName,
					CreatedAt:     message.CreatedAt,
					MessageLength: message.Length,
					ChannelType:   message.Type,
				})
			} else {
				log.Debug(fmt.Sprint("minerva messenger: Domain ", message.EmailDomain, " does not exist in institute data."), log.Minerva, log.Service)
			}
		}
	}

	// build hatnoteWebsocketEventData
	var serviceDataJSON, err = json.Marshal(websocketEventData)
	if err != nil {
		log.Error("Could not convert minerva data to json string.", err, log.Minerva, log.Service)
		return
	}
	var hatnoteWebsocketEventData websocket.EventData
	hatnoteWebsocketEventData.EventInfo.ActiveConnections = mmhc.WebsocketController.GetActiveConnections()
	hatnoteWebsocketEventData.EventInfo.FromTimepoint = fromTimePoint
	hatnoteWebsocketEventData.EventInfo.Service = "minerva"
	hatnoteWebsocketEventData.EventInfo.Version = globals.VERSION
	hatnoteWebsocketEventData.EventInfo.ExpectedFrontendVersion = globals.EXPECTED_FRONTEND_VERSION
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.IsConnectionEstablished = mmhc.DatabaseController.IsInitialised()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.IsConnecting = mmhc.DatabaseController.IsConnecting()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.NextReconnect = mmhc.dbReconnector.NextDbReconnect.UnixMilli()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.NumberOfDbReconnects = mmhc.dbReconnector.NumberOfDbReconnects
	hatnoteWebsocketEventData.Data = string(serviceDataJSON)

	// Clear cache for this query interval
	mmhc.clearUserIpAddressesQueryCache()

	// Send websocket data in bulk
	log.Info("minerva messenger: Send websocket data in bulk", log.Minerva, log.Service)
	mmhc.WebsocketController.SendDataInBulk(hatnoteWebsocketEventData)
}

func (mmhc *Service) loadIpAddressesFromUserFromTimepointUntilNowWithCaching(userid string, fromTimepointMs int64, toTimepointMs int64) (validUserIpAddresses []ValidUserIpAddress) {
	if ipAddresses, exists := mmhc.userIpAddressesQueryCache[userid]; exists {
		validUserIpAddresses = ipAddresses
	} else {
		var queryError error
		validUserIpAddresses, queryError = mmhc.DatabaseController.LoadIpAddressesFromUserFromTimepointUntilNow(userid, fromTimepointMs, toTimepointMs)
		if queryError != nil {
			pingError := mmhc.DatabaseController.Ping()
			if pingError != nil {
				log.Error("Can not ping minerva DB", pingError, log.Minerva, log.Service)
				mmhc.DatabaseController.CloseConnection()
				log.Info("Starting reconnector.", log.Minerva, log.Service)
				mmhc.dbReconnector.StartRepeatingDbReconnectOnce()
			}
		}
		mmhc.userIpAddressesQueryCache[userid] = validUserIpAddresses
	}
	return
}

func (mmhc *Service) clearUserIpAddressesQueryCache() {
	mmhc.userIpAddressesQueryCache = make(map[string][]ValidUserIpAddress)
}

func (mmhc *Service) detemineInstituteName(emailDomain string, ipAddresses []ValidUserIpAddress) (instituteName string) {
	instituteName = emailDomain

	for _, ipAddress := range ipAddresses {
		for _, ipRangesData := range mmhc.InstitutesData.Institutes[emailDomain].DomainIpRanges {
			if mmhc.ipWithinIpRanges(ipRangesData.IpRanges, ipAddress.IpAdress) {
				instituteName = ipRangesData.InstituteNameDe
				return
			}
		}
	}

	// message came from a user that has a email domain that can be mapped to multiple institutes AND the message
	// has a ip address that is not within any ip ranges that can be mapped to the email domain
	return
}

func (mmhc *Service) ipWithinIpRanges(ipRanges map[string]struct{}, ipToCheck string) bool {

	for ipRange := range ipRanges {
		_, subnet, err := net.ParseCIDR(ipRange)
		if err != nil {
			log.Error("Could not detemine if ip is in ip range.", err, log.Minerva, log.Service)
			return false
		}

		ip := net.ParseIP(ipToCheck)
		if subnet.Contains(ip) {
			return true
		}
	}

	return false
}

func (mmhc *Service) UpdateInstitutesData() {
	// no need to use mutex lock/unlock since the usage of the data is not sensible
	var institutesData, instituteErr = mmhc.InstitutesController.Load()
	if instituteErr != nil {
		logMessage := "Error while loading institute data."
		log.Error(logMessage, instituteErr, log.Minerva, log.Service)
		mail.SendErrorMail(logMessage, instituteErr)
	} else {
		mmhc.InstitutesData = institutesData
	}
}
