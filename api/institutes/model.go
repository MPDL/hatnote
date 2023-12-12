package institutes

import (
	"fmt"
	"strings"
)

type Config struct {
	SourceUrl    string `yaml:"sourceUrl"`    // can be a http resource or a local file
	PeriodicSync int    `yaml:"periodicSync"` // days
}

// This data structure exists for easier access to relevant data
type InstituteData struct {
	Institutes       map[string]*Institute // keys are domains of email adresses
	DomainDuplicates map[string]struct{}   // use map to have unique entries
}

func NewInstitutesData() *InstituteData {
	return &InstituteData{Institutes: make(map[string]*Institute), DomainDuplicates: make(map[string]struct{})}
}

type Institute struct {
	// This seems to be a duplicated field but some institutes do not have ip ranges in the source file.
	// In those cases you can not store the name in the IpRangesData struct.
	InstituteNameDe string
	DomainIpRanges  []IpRangesData // a domain may be mapped to multiple institues with different ip ranges
}

type IpRangesData struct {
	IpRanges        map[string]struct{} // use map to have unique entries
	InstituteNameDe string
}

type InstituteDataJson struct {
	Institutes []InstituteJson `json:"details"`
	Timestamp  string          `json:"timestamp"`
}

type InstituteJson struct {
	InstituteDetail InstituteDetailJson `json:"detail"`
}

type InstituteDetailJson struct {
	Domains         []string `json:"domains"`
	InstituteCode   string   `json:"inst_code"`
	InstituteNameDe string   `json:"inst_name_en"`
	IpRanges        []string `json:"ip_ranges"`
}

func (inst InstituteData) Top3ToString() string {
	var sb strings.Builder
	counter := 0
	sb.WriteString("\n")
	sb.WriteString("Top 3 institute data:\n")
	sb.WriteString("  Institutes:\n")
	for domain, institute := range inst.Institutes {
		sb.WriteString(fmt.Sprintln("    Domain: ", domain))
		sb.WriteString(fmt.Sprintln("    Name: ", institute.InstituteNameDe))
		sb.WriteString(fmt.Sprintln("    DomainIpRanges: "))
		for index, ipRangesData := range institute.DomainIpRanges {
			sb.WriteString(fmt.Sprintln("      Number #", index))
			sb.WriteString("      IP ranges: ")
			for key := range ipRangesData.IpRanges {
				sb.WriteString(fmt.Sprintf("%s ", key))
			}
			sb.WriteString(fmt.Sprintln(""))
			sb.WriteString(fmt.Sprintln("      Name: ", ipRangesData.InstituteNameDe))
		}
		sb.WriteString("  ----------\n")
		counter++
		if counter == 3 {
			break
		}
	}
	sb.WriteString(fmt.Sprintln("  DomainDuplicates: ", inst.DomainDuplicates))

	return sb.String()
}
