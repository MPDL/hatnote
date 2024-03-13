package geo

import (
	"api/utils/file_download"
	"api/utils/log"
	"api/utils/observer"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
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

func (idc *Controller) Load(geoInformationType string) (geoInformationMap map[string]Location, e error) {
	var sourceUrl = ""
	if geoInformationType == "bloxberg-validators" {
		sourceUrl = idc.config.BloxbergValidatorsSourceUrl
	} else {
		sourceUrl = idc.config.MpgInstitutesSourceUrl
	}
	jsonString, err := file_download.GetJsonStringFromFile(sourceUrl, map[string]string{"hatnote-gis-api-password": idc.config.ApiPassword})
	if err != nil {
		log.Error("Error while loading geo information data.", err, log.Geo)
		e = errors.New("could not load geo information data")
		return
	}

	geoInformationMap = make(map[string]Location)
	var geoInformation []Information
	err = json.Unmarshal([]byte(jsonString), &geoInformation)
	if err != nil {
		return geoInformationMap, errors.New(fmt.Sprint("Failed to unmarshal json from geoInformation json: ", sourceUrl, "error: ", err))
	}

	log.Info(Top3ToString(geoInformation), log.Geo)

	// generate map from array and use this in bloxberg service
	for _, geoItem := range geoInformation {
		geoInformationMap[strings.ToLower(geoItem.Id)] = Location{
			Coordinate: geoItem.Coordinate,
			CountryId:  geoItem.CountryId,
			StateId:    geoItem.StateId,
		}
	}

	if log.LogLevel >= 5 {
		log.Debug(fmt.Sprintf("geo information map:"), log.Geo)
		for k, v := range geoInformationMap {
			log.Debug(fmt.Sprintf("id: %s, lat,long: %f,%f", k, v.Coordinate.Lat, v.Coordinate.Long), log.Geo)
		}
	}

	return
}

func (idc *Controller) StartPeriodicSync(updatableControllers ...observer.UpdatableGeoInformation) *chan bool {
	if idc.config.PeriodicSync <= 0 {
		log.Warn("Periodic geo information data sync disabled.", log.Geo)
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
				log.Info("Syncing geo information data ...", log.Geo)
				for _, controller := range updatableControllers {
					controller.UpdateGeoInformation()
				}
			}
		}
	}()

	return &idc.done
}

func (idc *Controller) StopPeriodicSync() {
	if idc.ticker != nil {
		log.Info("Stopping periodic geo information data sync.", log.Geo)
		idc.ticker.Stop()
	}
	if idc.done != nil {
		idc.done <- true
	}
}
