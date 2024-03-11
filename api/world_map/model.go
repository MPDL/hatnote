package world_map

import (
	"fmt"
	"strings"
)

type Config struct {
	SourceUrl    string `yaml:"sourceUrl"`    // can be a http resource or a local file
	PeriodicSync int    `yaml:"periodicSync"` // days
	ApiPassword  string `yaml:"apiPassword"`
}

type WorldMapEditorData struct {
	Name       string     `json:"name"`
	Id         string     `json:"id"`
	Coordinate Coordinate `json:"coordinate"`
	Country    string     `json:"country"`
}

type Location struct {
	Coordinate Coordinate `json:"coordinate"`
	Country    string     `json:"country"`
}

type Coordinate struct {
	Lat  float64 `json:"lat"`
	Long float64 `json:"long"`
}

func Top3ToString(worldMapData []WorldMapEditorData) string {
	var sb strings.Builder
	counter := 0
	sb.WriteString("\n")
	sb.WriteString("Top 3 world map data:\n\n")
	for _, worldMapEntry := range worldMapData {
		sb.WriteString(fmt.Sprintln("  Name: ", worldMapEntry.Name))
		sb.WriteString(fmt.Sprintln("  Id: ", worldMapEntry.Id))
		sb.WriteString(fmt.Sprintln("  Country: ", worldMapEntry.Country))
		sb.WriteString(fmt.Sprintln("  Coordinate: "))
		sb.WriteString(fmt.Sprintln("    Latitude: ", worldMapEntry.Coordinate.Lat))
		sb.WriteString(fmt.Sprintln("    Longitude: ", worldMapEntry.Coordinate.Long))
		sb.WriteString("  ----------\n")
		counter++
		if counter == 3 {
			break
		}
	}

	return sb.String()
}
