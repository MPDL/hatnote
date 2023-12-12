// This file is not intended to be a unit test file. Rather it is used to test query calls to the db during development
// to see if the connection works and to inspect the results. Therefore there is no hosted test db to use here. You
// can change the db config in the config file that is loaded here and use a local, qa or prod database.

package bloxberg

import (
	"api/database"
	"testing"
)

func SetupBloxbergDbTest() (db *Database, err error) {
	db = &Database{Config: database.Config{
		User:            "postgresqa",
		Password:        "postgresqa",
		Host:            "localhost",
		Port:            5432,
		DBName:          "blockscout",
		ReconnectTimout: 20,
	}}

	err = db.Init()
	return
}

func TestLoadBlocks(t *testing.T) {
	dbc, err := SetupBloxbergDbTest()
	if err != nil {
		t.Errorf("bloxberg db could not be initiated. Error: %v", err)
	}

	blocks, _ := dbc.LoadBlocks("2023-08-12 09:04:05", "2023-08-12 10:04:05")
	if "Fraunhofer Institute for Applied Information Technology FIT" != blocks[0].Miner {
		t.Errorf("First entry should have a miner. Expected: %v, Got: %v", "Fraunhofer Institute for Applied Information Technology FIT", blocks[0].Miner)
	}

	dbc.CloseConnection()
	if err != nil {
		t.Errorf("Could not close db connection.")
	}
}

func TestLoadConfirmedTransactions(t *testing.T) {
	dbc, err := SetupBloxbergDbTest()
	if err != nil {
		t.Errorf("bloxberg db could not be initiated. Error: %v", err)
	}

	confirmedTransactions, _ := dbc.LoadConfirmedTransactions("2023-08-13 12:04:05", "2023-08-13 13:04:05")
	if "University of West Attica Consert lab" != confirmedTransactions[0].BlockMiner {
		t.Errorf("First entry should have a block miner. Expected: %v, Got: %v", "University of West Attica Consert lab", confirmedTransactions[0].BlockMiner)
	}

	dbc.CloseConnection()
	if err != nil {
		t.Errorf("Could not close db connection.")
	}
}

func TestLoadLicensedContributors(t *testing.T) {
	dbc, err := SetupBloxbergDbTest()
	if err != nil {
		t.Errorf("bloxberg db could not be initiated. Error: %v", err)
	}

	licensedContributors, _ := dbc.LoadLicensedContributors("2020-08-13 12:04:05", "2023-08-13 12:04:05")
	if "Mendel University in Brno" != licensedContributors[0].Name {
		t.Errorf("First entry should have a name. Expected: %v, Got: %v", "Mendel University in Brno", licensedContributors[0].Name)
	}

	dbc.CloseConnection()
	if err != nil {
		t.Errorf("Could not close db connection.")
	}
}
