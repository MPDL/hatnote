package keeper

import (
	"api/database"
	"api/geo"
	"api/globals"
	"api/institutes"
	"api/service"
	"api/utils/log"
	"api/utils/mail"
	"api/websocket"
	"encoding/json"
	"fmt"
	"time"
)

type Service struct {
	DatabaseController   DatabaseInterface
	WebsocketController  websocket.WebsocketInterface
	InstitutesController institutes.Controller
	InstitutesData       institutes.InstituteData
	GeoController        geo.Controller
	geoInformation       map[string]geo.Location
	Config               service.ServiceConfig
	ticker               *time.Ticker
	done                 chan bool
	wsErrorCheckerDone   chan bool
	dbReconnector        database.Reconnector
}

func (sc *Service) Init(institutesController institutes.Controller, geoController geo.Controller) {
	log.Info("Init Keeper service.", log.Keeper, log.Service)
	// world map controller
	sc.GeoController = geoController
	sc.loadGeoInformation()
	// institute controller
	sc.InstitutesController = institutesController
	var institutesData, instituteErr = sc.InstitutesController.Load()
	if instituteErr != nil {
		logMessage := "Error while loading institute data."
		log.Error(logMessage, instituteErr, log.Keeper, log.Service)
		mail.SendErrorMail(logMessage, instituteErr)
	} else {
		sc.InstitutesData = institutesData
	}

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
				log.Error("While trying to serve a websocket connection for Keeper there was an error.", err, log.Keeper, log.Service)
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
	log.Info("Starting keeper service.", log.Keeper, log.Service)
	if sc.ticker != nil {
		sc.ticker.Stop()
	}

	sc.ticker = time.NewTicker(time.Duration(sc.Config.QueryInterval) * time.Second)
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
	log.Info("Stop keeper service controller ticker.", log.Keeper, log.Service)
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
	log.Info("Process keeper service controller event.", log.Keeper, log.Service)

	// Check if a websocket connection exists
	if sc.WebsocketController.GetActiveConnections() == 0 {
		log.Info("There are no active websocket connections. Skipping db queries.", log.Keeper, log.Service)
		if sc.DatabaseController.IsInitialised() {
			log.Info("Keeper db initialised. Closing connection.", log.Keeper, log.Service)
			sc.DatabaseController.CloseConnection()
		} else {
			log.Info("Keeper db not initialised. Stopping db reconnector if active.", log.Keeper, log.Service)
			sc.dbReconnector.Stop()
		}
		sc.DatabaseController.SetIsConnecting(true)
		return
	}

	// Check if already initialised
	if !sc.DatabaseController.IsInitialised() {
		log.Info("Keeper db not initialised. Starting reconnector.", log.Keeper, log.Service)
		go sc.dbReconnector.StartRepeatingDbReconnectOnce()
	}

	// Calculate timepoint from query interval
	// keeper db runs two hours behind
	negativeServerTimeDifference := time.Duration(-2) * time.Hour
	var toTimepoint = time.Now().Add(negativeServerTimeDifference)
	negativeQueryDuration := time.Duration(-sc.Config.QueryInterval) * time.Second
	var fromTimePoint time.Time = toTimepoint.Add(negativeQueryDuration)
	var fromTimePointStr = fromTimePoint.Format(time.DateTime)
	var toTimepointStr = toTimepoint.Format(time.DateTime)

	// Load last messages
	log.Debug("Load keeper data.", log.Keeper, log.Service)
	fileCreationsAndEditings, fileQueryError := sc.DatabaseController.LoadFileCreationsAndEditings(fromTimePointStr, toTimepointStr)
	libraryCreations, libraryQueryError := sc.DatabaseController.LoadLibraryCreations(fromTimePointStr, toTimepointStr)
	activatedUsers, userQueryError := sc.DatabaseController.LoadActivatedUsers(fromTimePoint.Unix(), toTimepoint.Unix())

	if fileQueryError != nil || libraryQueryError != nil || userQueryError != nil {
		pingError := sc.DatabaseController.Ping()
		if pingError != nil {
			log.Error("Can not ping Keeper DB", pingError, log.Keeper, log.Service)
			sc.DatabaseController.CloseConnection()
			log.Info("Starting reconnector.", log.Keeper, log.Service)
			go sc.dbReconnector.StartRepeatingDbReconnectOnce()
		}
	}

	// Find institute names for keeper data and build websocket data
	log.Debug("Find institute names for keeper data and build websocket data.", log.Keeper, log.Service)
	var websocketEventData websocket.KeeperData

	// create websocket data for file creations and editings
	for _, fileCreationAndEditing := range fileCreationsAndEditings {
		emailDomain := sc.determineDomainForInstituteNameEvaluation(fileCreationAndEditing.UserDomain, fileCreationAndEditing.InvitedFromDomain)
		// ignore the case if institute name is not found and just take the domain to display
		instituteName, _ := sc.evaluateInstituteName(emailDomain)

		websocketEventData.FileCreationsAndEditings = append(websocketEventData.FileCreationsAndEditings, websocket.KeeperFileCreationAndEditing{
			OperationSize: fileCreationAndEditing.OperationSize,
			OperationType: fileCreationAndEditing.OperationType,
			// Keeper db stores dates only with seconds precision but front end operates with milliseconds.
			// Therefore, multiply seconds by 1000. That way the front end works homogeneously.
			Timestamp:     fileCreationAndEditing.Timestamp * 1000,
			InstituteName: instituteName,
			Location:      sc.geoInformation[emailDomain],
		})
	}

	// create websocket data for library creations
	for _, libraryCreation := range libraryCreations {
		emailDomain := sc.determineDomainForInstituteNameEvaluation(libraryCreation.UserDomain, libraryCreation.InvitedFromDomain)
		// ignore the case if institute name is not found and just take the domain to display
		instituteName, _ := sc.evaluateInstituteName(emailDomain)

		websocketEventData.LibraryCreations = append(websocketEventData.LibraryCreations, websocket.KeeperLibraryCreation{
			// Keeper db stores dates only with seconds precision but front end operates with milliseconds.
			// Therefore, multiply seconds by 1000. That way the front end works homogeneously.
			Timestamp:     libraryCreation.Timestamp * 1000,
			InstituteName: instituteName,
			Location:      sc.geoInformation[emailDomain],
		})
	}

	// create websocket data for activated users
	for _, activatedUser := range activatedUsers {
		emailDomain := sc.determineDomainForInstituteNameEvaluation(activatedUser.UserDomain, activatedUser.InvitedFromDomain)
		// ignore the case if institute name is not found and just take the domain to display
		instituteName, _ := sc.evaluateInstituteName(emailDomain)

		websocketEventData.ActivatedUsers = append(websocketEventData.ActivatedUsers, websocket.KeeperActivatedUser{
			// Keeper db stores dates only with seconds precision but front end operates with milliseconds.
			// Therefore, multiply seconds by 1000. That way the front end works homogeneously.
			Timestamp:     activatedUser.Timestamp * 1000,
			InstituteName: instituteName,
		})
	}

	// build hatnoteWebsocketEventData
	var serviceDataJSON, err = json.Marshal(websocketEventData)
	if err != nil {
		log.Error("Could not convert keeper data to json string.", err, log.Keeper, log.Service)
		return
	}
	var hatnoteWebsocketEventData websocket.EventData
	hatnoteWebsocketEventData.EventInfo.ActiveConnections = sc.WebsocketController.GetActiveConnections()
	// Keeper db stores dates only with seconds precision but front end operates with milliseconds.
	// Therefore, multiply seconds by 1000. That way the front end works homogeneously.
	hatnoteWebsocketEventData.EventInfo.FromTimepoint = fromTimePoint.UnixMilli()
	hatnoteWebsocketEventData.EventInfo.Service = "keeper"
	hatnoteWebsocketEventData.EventInfo.Version = globals.VERSION
	hatnoteWebsocketEventData.EventInfo.ExpectedFrontendVersion = globals.EXPECTED_FRONTEND_VERSION
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.IsConnectionEstablished = sc.DatabaseController.IsInitialised()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.IsConnecting = sc.DatabaseController.IsConnecting()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.NextReconnect = sc.dbReconnector.NextDbReconnect.UnixMilli()
	hatnoteWebsocketEventData.EventInfo.DatabaseInfo.NumberOfDbReconnects = sc.dbReconnector.NumberOfDbReconnects
	hatnoteWebsocketEventData.Data = string(serviceDataJSON)

	// Send websocket data in bulk
	log.Info("Send websocket data in bulk", log.Keeper, log.Service)
	sc.WebsocketController.SendDataInBulk(hatnoteWebsocketEventData)
}

func (sc *Service) determineDomainForInstituteNameEvaluation(userDomain string, invitedFromDomain string) (emailDomain string) {
	// determine if user is a guest/external or not
	if _, exists := sc.InstitutesData.Institutes[userDomain]; exists {
		// user is not a guest
		emailDomain = userDomain
	} else {
		if _, exists := sc.InstitutesData.Institutes[invitedFromDomain]; exists {
			// user is a guest invited by some at MPG
			emailDomain = invitedFromDomain
		} else {
			// user is a guest invited by system administrator. In this case 'InvitedFromDomain' is null. At the time
			// of writing this there is no possibility for guests to invite guests.
			emailDomain = "mpdl.mpg.de"
		}
	}

	return
}

func (sc *Service) evaluateInstituteName(domain string) (instituteName string, domainDoesNotExist bool) {
	if _, exists := sc.InstitutesData.DomainDuplicates[domain]; exists {
		// email domain is a duplicate, determine institute name by checking ip address
		// at the moment of writing this there is no ip address data available from keeper db
		instituteName = domain // set duplicated email domain here for now
	} else {
		if institute, exists := sc.InstitutesData.Institutes[domain]; exists {
			// email domain is not a duplicate and exists in institute data
			instituteName = institute.InstituteNameDe
			if len(instituteName) == 0 {
				// Inside the json file from rena.mpdl.mpg.de there was no institute name given for the domain.
				// Fall back to just the domain
				instituteName = domain
			}
		} else {
			domainDoesNotExist = true
			log.Debug(fmt.Sprint("Domain ", domain, " does not exist in institute data."), log.Keeper, log.Service)
			return
		}
	}
	domainDoesNotExist = false

	return
}

func (sc *Service) UpdateInstitutesData() {
	// no need to to use mutex lock/unlock since the usage of the data is not sensible
	var institutesData, instituteErr = sc.InstitutesController.Load()
	if instituteErr != nil {
		logMessage := "Error while loading institute data."
		log.Error(logMessage, instituteErr, log.Keeper, log.Service)
		mail.SendErrorMail(logMessage, instituteErr)
	} else {
		sc.InstitutesData = institutesData
	}
}

func (sc *Service) UpdateGeoInformation() {
	sc.loadGeoInformation()
}

func (sc *Service) loadGeoInformation() {
	// no need to use mutex lock/unlock since the usage of the data is not sensible
	var geoInformation, geoInformationErr = sc.GeoController.Load("mpg-institutes")
	if geoInformationErr != nil {
		logMessage := "Error while loading geo information data."
		log.Error(logMessage, geoInformationErr, log.Keeper, log.Service)
		mail.SendErrorMail(logMessage, geoInformationErr)
	} else {
		sc.geoInformation = geoInformation
	}
}
