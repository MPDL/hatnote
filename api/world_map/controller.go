package world_map

import (
	"api/utils/file_download"
	"api/utils/log"
	"api/utils/observer"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

type Controller struct {
	config Config
	ticker *time.Ticker
	done   chan bool
}

func (idc *Controller) Init(config Config) {
	idc.config = config
}

func (idc *Controller) Load() (worldMapDataMap map[string]Location, e error) {
	jsonString, err := file_download.GetJsonStringFromFile(idc.config.SourceUrl, map[string]string{"bloxberg-api-password": idc.config.ApiPassword})
	if err != nil {
		log.Error("Error while loading world map data.", err, log.WorldMap)
		e = errors.New("could not load world map data")
		return
	}

	worldMapDataMap = make(map[string]Location)
	var worldMapDataArray []WorldMapEditorData
	err = json.Unmarshal([]byte(jsonString), &worldMapDataArray)
	if err != nil {
		return worldMapDataMap, errors.New(fmt.Sprint("Failed to unmarshal json from WorldMapData json: ", idc.config.SourceUrl, "error: ", err))
	}

	log.Info(Top3ToString(worldMapDataArray), log.WorldMap)

	// generate map from array and use this in bloxberg service
	for _, worldMapEntry := range worldMapDataArray {
		worldMapDataMap[worldMapEntry.Id] = Location{
			Coordinate: worldMapEntry.Coordinate,
			Country:    worldMapEntry.Country,
		}
	}

	log.Debug(fmt.Sprintf("Location map:"), log.WorldMap)
	for k, v := range worldMapDataMap {
		log.Debug(fmt.Sprintf("Location map: id: %s, lat: %f,%f", k, v.Coordinate.Lat, v.Coordinate.Long), log.WorldMap)
	}

	return
}

func (idc *Controller) StartPeriodicSync(updatableControllers ...observer.UpdatableWorldMapData) *chan bool {
	if idc.config.PeriodicSync <= 0 {
		log.Warn("Periodic world map data sync disabled.", log.WorldMap)
		return nil
	}
	oneDayInHours := 24
	idc.ticker = time.NewTicker(time.Duration(idc.config.PeriodicSync*oneDayInHours) * time.Hour)
	idc.done = make(chan bool)

	go func() {
		for {
			select {
			case <-idc.done:
				return
			case <-idc.ticker.C:
				log.Info("Syncing world map data ...", log.WorldMap)
				for _, controller := range updatableControllers {
					controller.UpdateWorldMapData()
				}
			}
		}
	}()

	return &idc.done
}

func (idc *Controller) StopPeriodicSync() {
	if idc.ticker != nil {
		log.Info("Stopping periodic world map data sync.", log.WorldMap)
		idc.ticker.Stop()
	}
	if idc.done != nil {
		idc.done <- true
	}
}
