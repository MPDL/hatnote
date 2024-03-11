package service

import (
	"api/institutes"
	"api/utils/observer"
	"api/world_map"
)

type ServiceInterface interface {
	observer.UpdatableInstitutesData
	observer.UpdatableWorldMapData

	Init(institutesController institutes.Controller, worldMapController world_map.Controller)
	StartService() *chan bool
	StopService()
	GetName() string
	GetDatabaseController() interface{}
}
