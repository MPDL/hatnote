package minerva

import (
	"api/service"
	"github.com/jmoiron/sqlx"
	"math/rand"
)

type DatabaseMock struct {
	db     *sqlx.DB
	Config service.ServiceConfig
}

func (dbc *DatabaseMock) Init() error { return nil }
func (dbc *DatabaseMock) IsInitialised() bool {
	return true
}
func (dbc *DatabaseMock) IsConnecting() bool {
	return false
}
func (dbc *DatabaseMock) SetIsConnecting(isConnecting bool) {
	return
}
func (dbc *DatabaseMock) Ping() error {
	return nil
}
func (dbc *DatabaseMock) CloseConnection() error { return nil }
func (dbc *DatabaseMock) LoadMessagesFromTimepointUntilNow(fromTimepointMs int64, toTimepointMs int64) (validData []ValidMessage, queryError error) {
	var plusTime = rand.Int63n(dbc.Config.QueryInterval)
	// this array should be ordered as the front end expects
	validData = append(validData,
		ValidMessage{
			UserId:      "test121",
			Length:      70,
			CreatedAt:   fromTimepointMs + plusTime,
			Type:        "O",
			EmailDomain: "bbb.de"}, // domain only exists once
		ValidMessage{
			UserId:      "test120",
			Length:      70,
			CreatedAt:   fromTimepointMs + plusTime,
			Type:        "O",
			EmailDomain: "aaa.de"}, // domain only exists once
		ValidMessage{
			UserId:      "test122",
			Length:      2,
			CreatedAt:   fromTimepointMs + plusTime,
			Type:        "P",
			EmailDomain: "zzz.de"}, // domain exists multiple times
		ValidMessage{
			UserId:      "test122", // same user as before to check if user ip addresses cache works
			Length:      3,
			CreatedAt:   fromTimepointMs + plusTime,
			Type:        "G",
			EmailDomain: "zzz.de"}, // domain exists multiple times
		ValidMessage{
			UserId:      "test124",
			Length:      4,
			CreatedAt:   fromTimepointMs + plusTime,
			Type:        "D",
			EmailDomain: "nonExistingDomain"}, // domain does not exist
	)

	return
}

func (dbc *DatabaseMock) LoadIpAddressesFromUserFromTimepointUntilNow(userid string, fromTimepointMs int64, toTimepointMs int64) (validUserIpAddresses []ValidUserIpAddress, queryError error) {
	validUserIpAddresses = append(validUserIpAddresses,
		ValidUserIpAddress{
			IpAdress: "777.77.77.777",
		},
		ValidUserIpAddress{
			IpAdress: "999.99.99.999", // this ip address is inside the ip ranges of institute "Max-Planck-Institut für Intelligente Systeme" that is mapped to domain "tuebingen.mpg.de"
		},
		ValidUserIpAddress{
			IpAdress: "333.333.333.3",
		},
		ValidUserIpAddress{
			IpAdress: "555.55.5.5",
		},
	)

	return
}
