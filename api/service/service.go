package service

import (
	"api/institutes"
	"api/utils/observer"
)

type ServiceInterface interface {
	observer.UpdatableInstitutesData

	Init(institutesController institutes.Controller)
	StartService() *chan bool
	StopService()
	GetName() string
	GetDatabaseController() interface{}
}
