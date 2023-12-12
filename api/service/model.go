package service

import (
	"api/database"
	"api/websocket"
)

type ServiceConfig struct {
	Name          string           `yaml:"name"`
	QueryInterval int64            `yaml:"queryInterval"`
	Database      database.Config  `yaml:"database"`
	Websocket     websocket.Config `yaml:"websocket"`
}
