package database

import (
	"api/utils/log"
	"fmt"
	"time"
)

type Reconnector struct {
	isRepeatingDbReconnect bool
	NextDbReconnect        time.Time
	NumberOfDbReconnects   int
	InitDatabase           InitDatabase
	IsDatabaseInitialised  IsDatabaseInitialised
	ReconnectTimout        int
	ServiceName            string
	reconnectTimer         *time.Timer
}

type InitDatabase func() error

type IsDatabaseInitialised func() bool

func (dr *Reconnector) StartRepeatingDbReconnectOnce() {
	if !dr.isRepeatingDbReconnect {
		log.Info("Start repeating db reconnect once", log.Database)
		dr.isRepeatingDbReconnect = true
		dr.NumberOfDbReconnects = 0
		timerDuration := time.Duration(dr.ReconnectTimout) * time.Minute
		dr.NextDbReconnect = time.Now().Add(timerDuration)
		initErr := dr.InitDatabase()
		if initErr != nil {
			log.Error(fmt.Sprint("Could not reconnect to ", dr.ServiceName, " DB"), initErr, log.Database)
			dr.startRepeatingDbReconnect()
		} else {
			log.Info(fmt.Sprint("Established connection to ", dr.ServiceName, " DB"), log.Database)
			dr.isRepeatingDbReconnect = false
		}
	}
}

func (dr *Reconnector) startRepeatingDbReconnect() {
	log.Info(fmt.Sprint("Starting ", dr.ServiceName, " DB repeating reconnect."), log.Database)
	if !dr.IsDatabaseInitialised() {
		timerDuration := time.Duration(dr.ReconnectTimout) * time.Minute
		dr.NextDbReconnect = time.Now().Add(timerDuration)

		dr.reconnectTimer = time.AfterFunc(timerDuration, func() {
			dr.NumberOfDbReconnects = dr.NumberOfDbReconnects + 1
			initErr := dr.InitDatabase()
			if initErr != nil {
				log.Error(fmt.Sprint("Could not reconnect to ", dr.ServiceName, " DB"), initErr, log.Database)
				dr.startRepeatingDbReconnect()
			} else {
				log.Info(fmt.Sprint("Established connection to ", dr.ServiceName, " DB"), log.Database)
				dr.isRepeatingDbReconnect = false
			}
		})
	}
}

func (dr *Reconnector) Stop() {
	log.Info(fmt.Sprint("Stop ", dr.ServiceName, " db reconnector."), log.Database)
	if dr.reconnectTimer != nil {
		dr.reconnectTimer.Stop()
		dr.isRepeatingDbReconnect = false
	}
}
