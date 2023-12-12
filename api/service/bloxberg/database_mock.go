package bloxberg

import (
	"api/service"
	"api/utils/log"
	"github.com/jmoiron/sqlx"
	"math/rand"
	"time"
)

type DatabaseMock struct {
	db       *sqlx.DB
	Config   service.ServiceConfig
	location *time.Location
}

func (dbc *DatabaseMock) Init() error {
	// 'time.ParseInLocation' is necessary because 'time.DateTime' string format which is used for db queries returns UTC timezone when it is
	// parsed with 'time.parse'. 'time.now' however will per default return a local timezone. 'time.now' is used for
	// setting the fromTimepoint variable in the websocket event info to have a reference point when the db queries
	// have been executed. To make all times have the same timezone the time here
	// is converted to local timezone.
	location, errLocalTime := time.LoadLocation("Local")
	if errLocalTime != nil {
		log.Error("There was a problem when getting the local time zone1", errLocalTime, log.Bloxberg, log.Mock, log.Database)
	} else {
		dbc.location = location
	}

	return errLocalTime
}

func (dbc *DatabaseMock) IsInitialised() bool {
	return dbc.location != nil
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
func (dbc *DatabaseMock) LoadBlocks(fromTimepoint string, toTimepoint string) (validData []ValidBlock, queryError error) {
	var plusTime = rand.Int63n(dbc.Config.QueryInterval)
	if dbc.location == nil {
		log.Warn("database time location is nil", log.Bloxberg, log.Mock, log.Database)
		return
	}
	var fromTimePointTime, err = time.ParseInLocation(time.DateTime, fromTimepoint, dbc.location)
	if err != nil {
		log.Error("There was a problem converting db string date to Time object", err, log.Bloxberg, log.Mock, log.Database)
		return
	}

	// this array should be ordered as the front end expects
	validData = append(validData,
		ValidBlock{
			ByteSize:   11255,
			InsertedAt: fromTimePointTime.UnixMilli() + plusTime,
			Miner:      "aaaaa",
			MinerHash:  "xcvxcvcx",
		},
		ValidBlock{
			ByteSize:   66,
			InsertedAt: fromTimePointTime.UnixMilli() + plusTime,
			Miner:      "cccc",
			MinerHash:  "bnmbnmnb",
		},
		ValidBlock{
			ByteSize:   22222,
			InsertedAt: fromTimePointTime.UnixMilli() + plusTime,
			Miner:      "ffff",
			MinerHash:  "zxczxcxz",
		},
		ValidBlock{
			ByteSize:   7777,
			InsertedAt: fromTimePointTime.UnixMilli() + plusTime,
			Miner:      "jjjjj",
			MinerHash:  "fghfghgf",
		},
		ValidBlock{
			ByteSize:   1212121,
			InsertedAt: fromTimePointTime.UnixMilli() + plusTime,
			Miner:      "ttttt",
			MinerHash:  "kiuliul",
		},
	)

	return
}

func (dbc *DatabaseMock) LoadConfirmedTransactions(fromTimepoint string, toTimepoint string) (validData []ValidConfirmedTransaction, queryError error) {
	var plusTime = rand.Int63n(dbc.Config.QueryInterval)
	if dbc.location == nil {
		log.Warn("database time location is nil", log.Bloxberg, log.Mock, log.Database)
		return
	}
	var fromTimePointTime, err = time.ParseInLocation(time.DateTime, fromTimepoint, dbc.location)
	if err != nil {
		log.Error("There was a problem converting db string date to Time object", err, log.Bloxberg, log.Mock, log.Database)
		return
	}

	validData = append(validData,
		ValidConfirmedTransaction{
			TransactionFee: 0.000000112472,
			UpdatedAt:      fromTimePointTime.UnixMilli() + plusTime,
			BlockMiner:     "aaaa",
			BlockMinerHash: "ipoipoioppo",
		},
		ValidConfirmedTransaction{
			TransactionFee: 0.000002442419,
			UpdatedAt:      fromTimePointTime.UnixMilli() + plusTime,
			BlockMiner:     "",
			BlockMinerHash: "kfdkgpofdkgop",
		},
	)

	return
}

func (dbc *DatabaseMock) LoadLicensedContributors(fromTimepoint string, toTimepoint string) (validData []ValidLicensedContributor, queryError error) {
	var plusTime = rand.Int63n(dbc.Config.QueryInterval)
	if dbc.location == nil {
		log.Warn("database time location is nil", log.Bloxberg, log.Mock, log.Database)
		return
	}
	var fromTimePointTime, err = time.ParseInLocation(time.DateTime, fromTimepoint, dbc.location)
	if err != nil {
		log.Error("There was a problem converting db string date to Time object", err, log.Bloxberg, log.Mock, log.Database)
		return
	}

	validData = append(validData,
		ValidLicensedContributor{
			InsertedAt: fromTimePointTime.UnixMilli() + plusTime,
			Name:       "qqqqq",
		},
		ValidLicensedContributor{
			InsertedAt: fromTimePointTime.UnixMilli() + plusTime,
			Name:       "rrrrrr",
		},
	)

	return
}
