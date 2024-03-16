package service

import (
	"api/geo"
	"api/institutes"
	"api/utils/observer"
)

type ServiceInterface interface {
	observer.UpdatableInstitutesData
	observer.UpdatableGeoInformation

	Init(institutesController institutes.Controller, worldMapController geo.Controller)
	StartService() *chan bool
	StopService()
	GetName() string
	GetDatabaseController() interface{}
}
