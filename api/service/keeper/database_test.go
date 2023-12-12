// This file is not intended to be a unit test file. Rather it is used to test query calls to the db during development
// to see if the connection works and to inspect the results. Therefore there is no hosted test db to use here. You
// can change the db config in the config file that is loaded here and use a local, qa or prod database.

package keeper

import (
	"api/database"
	"testing"
	"time"
)

func SetupKeeperDbTest() (db *Database, err error) {
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

func TestLoadFileCreationsAndEditings(t *testing.T) {
	dbc, err := SetupKeeperDbTest()
	if err != nil {
		t.Errorf("Keeper db could not be initiated. Error: %v", err)
	}

	fce, _ := dbc.LoadFileCreationsAndEditings("2023-07-02 09:04:05", "2023-07-02 10:04:05")
	if "mpdl.mpg.de" != fce[0].UserDomain {
		t.Errorf("First entry should have a user domain. Expected: %v, Got: %v", "mpdl.mpg.de", fce[0].UserDomain)
	}

	dbc.CloseConnection()
	if err != nil {
		t.Errorf("Could not close db connection.")
	}
}

func TestLoadLibraryCreations(t *testing.T) {
	dbc, err := SetupKeeperDbTest()
	if err != nil {
		t.Errorf("Keeper db could not be initiated. Error: %v", err)
	}

	libraryCreations, _ := dbc.LoadLibraryCreations("2023-07-02 09:04:05", "2023-07-02 10:04:05")
	if "mpdl.mpg.de" != libraryCreations[0].UserDomain {
		t.Errorf("First entry should have a user domain. Expected: %v, Got: %v", "mpdl.mpg.de", libraryCreations[0].UserDomain)
	}

	dbc.CloseConnection()
	if err != nil {
		t.Errorf("Could not close db connection.")
	}
}

func TestLoadActivatedUsers(t *testing.T) {
	dbc, err := SetupKeeperDbTest()
	if err != nil {
		t.Errorf("Keeper db could not be initiated. Error: %v", err)
	}

	var fromTimepoint, _ = time.Parse(time.DateTime, "2023-07-02 09:04:05")
	var toTimepoint, _ = time.Parse(time.DateTime, "2023-07-02 10:04:05")
	activatedUsers, _ := dbc.LoadActivatedUsers(fromTimepoint.Unix(), toTimepoint.Unix())
	if "in.tum.de" != activatedUsers[0].UserDomain {
		t.Errorf("First entry should have a user domain. Expected: %v, Got: %v", "mpdl.mpg.de", activatedUsers[0].UserDomain)
	}

	dbc.CloseConnection()
	if err != nil {
		t.Errorf("Could not close db connection.")
	}
}
