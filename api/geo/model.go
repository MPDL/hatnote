package geo

import (
	"fmt"
	"strings"
)

type Config struct {
	BloxbergValidatorsSourceUrl string `yaml:"bloxbergValidatorsSourceUrl"` // can be a http resource or a local file
	MpgInstitutesSourceUrl      string `yaml:"mpgInstitutesSourceUrl"`      // can be a http resource or a local file
	PeriodicSync                int    `yaml:"periodicSync"`                // days
	ApiPassword                 string `yaml:"apiPassword"`
}

type Information struct {
	Name       string     `json:"name"`
	Id         string     `json:"id"`
	Coordinate Coordinate `json:"coordinate"`
	CountryId  string     `json:"countryId"`
	StateId    string     `json:"stateId"`
}

type Location struct {
	Coordinate Coordinate `json:"coordinate"`
	CountryId  string     `json:"countryId"`
	StateId    string     `json:"stateId"`
}

type Coordinate struct {
	Lat  float64 `json:"lat"`
	Long float64 `json:"long"`
}

func Top3ToString(information []Information) string {
	var sb strings.Builder
	counter := 0
	sb.WriteString("\n")
	sb.WriteString("Top 3 geo information data:\n\n")
	for _, informationItem := range information {
		sb.WriteString(fmt.Sprintln("  Name: ", informationItem.Name))
		sb.WriteString(fmt.Sprintln("  Id: ", informationItem.Id))
		sb.WriteString(fmt.Sprintln("  CountryId: ", informationItem.CountryId))
		sb.WriteString(fmt.Sprintln("  StateId: ", informationItem.StateId))
		sb.WriteString(fmt.Sprintln("  Coordinate: "))
		sb.WriteString(fmt.Sprintln("    Latitude: ", informationItem.Coordinate.Lat))
		sb.WriteString(fmt.Sprintln("    Longitude: ", informationItem.Coordinate.Long))
		sb.WriteString("  ----------\n")
		counter++
		if counter == 3 {
			break
		}
	}
	return sb.String()
}
