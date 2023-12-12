// This file is not intended to be a unit test file. Rather it is used to test query calls to the db during development
// to see if the connection works and to inspect the results. Therefore there is no hosted test db to use here. You
// can change the db config in the config file that is loaded here and use a local, qa or prod database.

package minerva

import (
	"api/database"
	"testing"
	"time"
)

func SetupMinervaDbTest() (db *Database, err error) {
	db = &Database{Config: database.Config{
		User:            "",
		Password:        "",
		Host:            "",
		Port:            0,
		DBName:          "",
		ReconnectTimout: 20,
	}}

	err = db.Init()
	return
}

func TestLoadMessagesFromTimepointUntilNow(t *testing.T) {
	dbc, err := SetupMinervaDbTest()
	if err != nil {
		t.Errorf("Keeper db could not be initiated. Error: %v", err)
	}

	var fromTimepoint, _ = time.Parse(time.DateTime, "2023-07-02 09:04:05")
	var toTimepoint, _ = time.Parse(time.DateTime, "2023-07-02 10:04:05")

	messages, _ := dbc.LoadMessagesFromTimepointUntilNow(fromTimepoint.UnixMilli(), toTimepoint.UnixMilli())
	if "mpdl.mpg.de" != messages[0].EmailDomain {
		t.Errorf("First entry should have a user domain. Expected: %v, Got: %v", "mpdl.mpg.de", messages[0].EmailDomain)
	}

	dbc.CloseConnection()
	if err != nil {
		t.Errorf("Could not close db connection.")
	}
}

func TestLoadIpAddressesFromUserFromTimepointUntilNow(t *testing.T) {
	dbc, err := SetupMinervaDbTest()
	if err != nil {
		t.Errorf("Keeper db could not be initiated. Error: %v", err)
	}

	var fromTimepoint, _ = time.Parse(time.DateTime, "2023-07-02 09:04:05")
	var toTimepoint, _ = time.Parse(time.DateTime, "2023-07-02 10:04:05")

	ipAddresses, _ := dbc.LoadIpAddressesFromUserFromTimepointUntilNow("userid", fromTimepoint.UnixMilli(), toTimepoint.UnixMilli())
	if "127.0.0.1" != ipAddresses[0].IpAdress {
		t.Errorf("First entry should have a user domain. Expected: %v, Got: %v", "127.0.0.1", ipAddresses[0].IpAdress)
	}

	dbc.CloseConnection()
	if err != nil {
		t.Errorf("Could not close db connection.")
	}
}
