package config

import (
	"api/institutes"
	"api/service"
	"api/service/bloxberg"
	"api/service/keeper"
	"api/service/minerva"
	"api/utils/log"
	"api/websocket"
	"errors"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"os"
)

type Dependencies struct {
	InstitutesDataController institutes.Controller
	HatnoteServiceController []service.ServiceInterface
}

type Environment struct {
	Config       EnvironmentConfig
	Dependencies *Dependencies
}

func LoadEnvironment(envName string, appEnvironmentFileDir string) (environment Environment, err error) {
	var appConfig EnvironmentConfig
	var dependencies *Dependencies

	// Load from config file
	appConfig, err = loadConfigFromFile(appEnvironmentFileDir + ".env." + envName + ".yml")
	if err != nil {
		log.Error("Error while loading environment. Could not load config from file: ", err, log.Config)
		return
	}

	// Check for breaking values
	// You have to work with indices here, otherwise you only modify a copy of an array item
	for i, service := range appConfig.Services {
		if (service.Name == "minerva" || service.Name == "bloxberg") && appConfig.Services[i].QueryInterval < 1000 {
			appConfig.Services[i].QueryInterval = 1000
		} else if service.Name == "keeper" && appConfig.Services[i].QueryInterval < 1 {
			appConfig.Services[i].QueryInterval = 1
		}
		if appConfig.Services[i].Websocket.MaxConnections <= 0 {
			appConfig.Services[i].Websocket.MaxConnections = 1
		}
	}

	switch envName {
	case "prod":
		dependencies = hatnoteDependencies(appConfig.Services)
	case "qa":
		dependencies = hatnoteDependencies(appConfig.Services)
	case "mock-db":
		dependencies = hatnoteMockDbDependencies(appConfig.Services)
	case "mock-db-ws":
		dependencies = hatnoteMockWsDbDependencies(appConfig.Services)
	default:
		err = errors.New("environment not known")
		log.Error("Error while loading environment: ", err, log.Config)
		return
	}

	environment = Environment{
		Config:       appConfig,
		Dependencies: dependencies,
	}

	return
}

func loadConfigFromFile(fileName string) (config EnvironmentConfig, loadError error) {
	ymlFile, loadError := os.Open(fileName)
	if loadError != nil {
		log.Error("Cannot open config file: ", loadError, log.Config)
		return
	}
	defer ymlFile.Close()

	byteValue, loadError := ioutil.ReadAll(ymlFile)
	if loadError != nil {
		log.Error("Cannot read config file: ", loadError, log.Config)
		return
	}

	loadError = yaml.Unmarshal(byteValue, &config)
	if loadError != nil {
		log.Error("Cannot unmarshal config file: ", loadError, log.Config)
		return
	}
	return
}

func hatnoteDependencies(services []service.ServiceConfig) *Dependencies {
	dependencies := &Dependencies{
		InstitutesDataController: institutes.Controller{},
		HatnoteServiceController: make([]service.ServiceInterface, len(services)),
	}

	var websocketController websocket.WebsocketInterface = new(websocket.Websocket)
	for i, serviceItem := range services {
		switch serviceItem.Name {
		case "minerva":
			var mmDatabaseController minerva.DatabaseInterface = &minerva.Database{Config: serviceItem.Database}
			var mmServiceController service.ServiceInterface = &minerva.Service{
				DatabaseController: mmDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = mmServiceController
		case "keeper":
			var keeperDatabaseController keeper.DatabaseInterface = &keeper.Database{Config: serviceItem.Database}
			var keeperServiceController service.ServiceInterface = &keeper.Service{
				DatabaseController: keeperDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = keeperServiceController
		case "bloxberg":
			var bloxbergDatabaseController bloxberg.DatabaseInterface = &bloxberg.Database{Config: serviceItem.Database}
			var bloxbergServiceController service.ServiceInterface = &bloxberg.Service{
				DatabaseController: bloxbergDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = bloxbergServiceController
		}
	}

	return dependencies
}

// mock only database controller
func hatnoteMockDbDependencies(services []service.ServiceConfig) *Dependencies {
	dependencies := &Dependencies{
		InstitutesDataController: institutes.Controller{},
		HatnoteServiceController: make([]service.ServiceInterface, len(services)),
	}

	var websocketController websocket.WebsocketInterface = new(websocket.Websocket)
	for i, serviceItem := range services {
		switch serviceItem.Name {
		case "minerva":
			var mmDatabaseController minerva.DatabaseInterface = &minerva.DatabaseMock{Config: serviceItem}
			var mmServiceController service.ServiceInterface = &minerva.Service{
				DatabaseController: mmDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = mmServiceController
		case "keeper":
			var keeperDatabaseController keeper.DatabaseInterface = &keeper.DatabaseMock{Config: serviceItem}
			var keeperServiceController service.ServiceInterface = &keeper.Service{
				DatabaseController: keeperDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = keeperServiceController
		case "bloxberg":
			var bloxbergDatabaseController bloxberg.DatabaseInterface = &bloxberg.DatabaseMock{Config: serviceItem}
			var bloxbergServiceController service.ServiceInterface = &bloxberg.Service{
				DatabaseController: bloxbergDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = bloxbergServiceController
		}
	}

	return dependencies
}

// mock websocket and database controller
func hatnoteMockWsDbDependencies(services []service.ServiceConfig) *Dependencies {
	dependencies := &Dependencies{
		InstitutesDataController: institutes.Controller{},
		HatnoteServiceController: make([]service.ServiceInterface, len(services)),
	}

	var websocketController websocket.WebsocketInterface = new(websocket.WebsocketMock)
	for i, serviceItem := range services {
		switch serviceItem.Name {
		case "minerva":
			var mmDatabaseController minerva.DatabaseInterface = &minerva.DatabaseMock{}
			var mmServiceController service.ServiceInterface = &minerva.Service{
				DatabaseController: mmDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = mmServiceController
		case "keeper":
			var keeperDatabaseController keeper.DatabaseInterface = &keeper.DatabaseMock{}
			var keeperServiceController service.ServiceInterface = &keeper.Service{
				DatabaseController: keeperDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = keeperServiceController
		case "bloxberg":
			var bloxbergDatabaseController bloxberg.DatabaseInterface = &bloxberg.DatabaseMock{Config: serviceItem}
			var bloxbergServiceController service.ServiceInterface = &bloxberg.Service{
				DatabaseController: bloxbergDatabaseController, WebsocketController: websocketController, Config: serviceItem}
			dependencies.HatnoteServiceController[i] = bloxbergServiceController
		}
	}

	return dependencies
}

// Define further environments ...
