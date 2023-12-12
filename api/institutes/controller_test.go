package institutes

import (
	"testing"
)

// source https://blog.alexellis.io/golang-writing-unit-tests/
// within this directory: go test
// to visualise:
// go test -cover -coverprofile=c.out
// go tool cover -html=c.out -o coverage.html

func TestConvertJsonObjectToInstituteData(t *testing.T) {
	idc := Controller{}

	jsonData := InstituteDataJson{
		Institutes: []InstituteJson{
			{
				InstituteDetail: InstituteDetailJson{
					Domains:         []string{"aaa.de", "bbb.de"},
					InstituteCode:   "ABC1",
					InstituteNameDe: "ABC1 Institute",
					IpRanges:        []string{"11.11.11.11/24", "22.22.22.22/24"},
				},
			},
			{
				InstituteDetail: InstituteDetailJson{
					Domains:         []string{"aaa.de", "ccc.de"},
					InstituteCode:   "ABC2",
					InstituteNameDe: "ABC2 Institute",
					IpRanges:        []string{"44.44.44.44/24", "22.22.22.22/24"},
				},
			},
			{
				InstituteDetail: InstituteDetailJson{
					Domains:         []string{"bbb.de"},
					InstituteCode:   "ABC3",
					InstituteNameDe: "ABC3 Institute",
					IpRanges:        []string{"33.33.33.33/24"},
				},
			},
		},
		Timestamp: "now",
	}

	instituteData := idc.convertJsonObjectToInstituteData(jsonData)

	// check duplicates
	numOfDuplicates := len(instituteData.DomainDuplicates)
	numOfDuplicatesExpected := 2
	if numOfDuplicates != numOfDuplicatesExpected {
		t.Errorf("There should be %v duplicates but got: %v", numOfDuplicatesExpected, numOfDuplicates)
	}
	duplicatedDomains := []struct {
		domain      string
		shouldExist bool
	}{
		{"aaa.de", true},
		{"bbb.de", true},
		{"ccc.de", false},
	}
	for _, domainTest := range duplicatedDomains {
		_, exists := instituteData.DomainDuplicates[domainTest.domain]
		if exists != domainTest.shouldExist {
			t.Errorf("Check if domain %v is a duplicate. Expected: %v, Got: %v", domainTest.domain, domainTest.shouldExist, exists)
		}
	}

	// check institute data
	numOfDomains := len(instituteData.Institutes)
	numOfDomainsExpected := 3
	if numOfDomains != numOfDomainsExpected {
		t.Errorf("There should be %v but got: %v", numOfDomainsExpected, numOfDomains)
	}

	// check ip ranges
	ipRangesForDomain := []struct {
		ipRange     string
		domain      string
		shouldExist bool
	}{
		{"44.44.44.44/24", "aaa.de", true},
		{"33.33.33.33/24", "aaa.de", false},
		{"22.22.22.22/24", "ccc.de", true},
	}
	for _, ipRangesForDomainTest := range ipRangesForDomain {
		institute := instituteData.Institutes[ipRangesForDomainTest.domain]
		if exists := contains(institute.DomainIpRanges, ipRangesForDomainTest.ipRange); exists != ipRangesForDomainTest.shouldExist {
			t.Errorf("Check if domain %v has ip range %v. Expected: %v, Got: %v",
				ipRangesForDomainTest.domain, ipRangesForDomainTest.ipRange, ipRangesForDomainTest.shouldExist, exists)
		}
	}

}

func contains(s []IpRangesData, e string) bool {
	for _, a := range s {
		if _, exists := a.IpRanges[e]; exists {
			return true
		}
	}
	return false
}
