package institutes

import (
	"api/utils/file_download"
	"api/utils/log"
	"api/utils/observer"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
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

func (idc *Controller) Load() (institutesData InstituteData, e error) {
	jsonString, err := file_download.GetJsonStringFromFile(idc.config.SourceUrl, make(map[string]string))
	if err != nil {
		log.Error("Error while loading institute data.", err, log.Institutes)
		e = errors.New("could not load institute data")
		return
	}

	jsonInstitutesData := idc.getJsonObjectromString(jsonString)

	institutesData = idc.convertJsonObjectToInstituteData(jsonInstitutesData)

	log.Info(institutesData.Top3ToString(), log.Institutes)
	return
}

func (idc *Controller) StartPeriodicSync(updatableControllers ...observer.UpdatableInstitutesData) *chan bool {
	if idc.config.PeriodicSync <= 0 {
		log.Warn("Periodic instutute data sync disabled.", log.Institutes)
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
				log.Info("Syncing institute data ...", log.Institutes)
				for _, controller := range updatableControllers {
					controller.UpdateInstitutesData()
				}
			}
		}
	}()

	return &idc.done

}

func (idc *Controller) StopPeriodicSync() {
	if idc.ticker != nil {
		log.Info("Stopping periodic institute data sync.", log.Institutes)
		idc.ticker.Stop()
	}
	if idc.done != nil {
		idc.done <- true
	}
}

func (idc *Controller) convertJsonObjectToInstituteData(jsonInstitutesData InstituteDataJson) (institutesData InstituteData) {
	duplicatedDomains := make(map[string]struct{})
	institutesData = *NewInstitutesData()

	// iterate over all domains that was loaded from the json file
	for _, instituteDetail := range jsonInstitutesData.Institutes {
		for _, domain := range instituteDetail.InstituteDetail.Domains {
			// transform ip ranges array into map
			ipRanges := make(map[string]struct{})
			for _, ip := range instituteDetail.InstituteDetail.IpRanges {
				ipRanges[ip] = struct{}{}
			}

			// fill institutesData.Institutes map with entries
			if institute, exists := institutesData.Institutes[domain]; !exists {
				// if domain does not exist just add all the data to the map
				institutesData.Institutes[domain] = &Institute{InstituteNameDe: instituteDetail.InstituteDetail.InstituteNameDe,
					DomainIpRanges: []IpRangesData{{IpRanges: ipRanges, InstituteNameDe: instituteDetail.InstituteDetail.InstituteNameDe}}}
			} else {
				// if domain does already exist than add the ip ranges of that entry to the ip ranges of the already existing entry
				log.Debug(fmt.Sprintf("Domain %s already exists. Adding ip range %v to existing domain.", institute, ipRanges), log.Institutes)
				institute.DomainIpRanges = append(institute.DomainIpRanges, IpRangesData{IpRanges: ipRanges,
					InstituteNameDe: instituteDetail.InstituteDetail.InstituteNameDe})
				duplicatedDomains[domain] = struct{}{}
			}

		}
	}
	institutesData.DomainDuplicates = duplicatedDomains

	return
}

func (idc *Controller) getJsonObjectromString(jsonString string) (institutesData InstituteDataJson) {
	m1 := regexp.MustCompile(` *\"\d+\" *: *{ *`)
	formatedJsonString := m1.ReplaceAllString(jsonString, "\"detail\" : {")

	formatedJsonBytes := []byte(formatedJsonString)

	json.Unmarshal(formatedJsonBytes, &institutesData)

	return
}
