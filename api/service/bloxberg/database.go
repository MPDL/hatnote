package bloxberg

import (
	"api/database"
	"api/utils/log"
	"api/utils/mail"
	"encoding/hex"
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"time"
)

type Database struct {
	db           *sqlx.DB
	Config       database.Config
	isConnecting bool
}
type DatabaseInterface interface {
	Init() error
	IsInitialised() bool
	IsConnecting() bool
	SetIsConnecting(bool)
	Ping() error
	CloseConnection() error
	LoadBlocks(fromTimepoint string, toTimepoint string) (validData []ValidBlock, queryError error)
	LoadConfirmedTransactions(fromTimepoint string, toTimepoint string) (validData []ValidConfirmedTransaction, queryError error)
	LoadLicensedContributors(fromTimepoint string, toTimepoint string) (validData []ValidLicensedContributor, queryError error)
}

func (dbc *Database) Init() error {
	log.Info("Bloxberg init db.", log.Bloxberg, log.Database)
	// for parameter description see: https://pkg.go.dev/github.com/lib/pq  password
	dataSourceName := fmt.Sprintf("user=%s password=%s dbname=%s host=%s port=%d connect_timeout=10 sslmode=disable",
		dbc.Config.User, dbc.Config.Password, dbc.Config.DBName, dbc.Config.Host, dbc.Config.Port)
	dbc.isConnecting = true
	db, err := sqlx.Connect("postgres", dataSourceName)
	if err != nil {
		dbc.db = nil
		dbc.isConnecting = false
		logMessage := "Can not connect to Minerva DB"
		log.Error(logMessage, err, log.Bloxberg, log.Database)
		mail.SendErrorMail(logMessage, err)
		return err
	}

	dbc.isConnecting = false
	dbc.db = db

	return err
}

func (dbc *Database) IsInitialised() bool {
	if dbc.db == nil {
		return false
	} else {
		return true
	}
}

func (dbc *Database) IsConnecting() bool {
	return dbc.isConnecting
}

func (dbc *Database) SetIsConnecting(isConnecting bool) {
	dbc.isConnecting = isConnecting
}

func (dbc *Database) Ping() error {
	return dbc.db.Ping()
}

func (dbc *Database) CloseConnection() error {
	log.Warn("Closing Bloxberg DB connection.", log.Bloxberg, log.Database)
	err := dbc.db.Close()
	if err != nil {
		log.Error("Can not close Minerva DB connection", err, log.Bloxberg, log.Database)
	}
	dbc.db = nil

	return err
}

func (dbc *Database) LoadBlocks(fromTimepoint string, toTimepoint string) (validData []ValidBlock, queryError error) {
	if dbc.db == nil {
		log.Warn("Bloxberg DB not initialised.", log.Bloxberg, log.Database)
		return
	}

	bloxbergBlocks := []DBBlock{}

	blocksQuery := fmt.Sprintf("%s%s%s%s%s%s",
		"SELECT size, inserted_at, miner_hash, ("+
			"SELECT name "+
			"FROM address_names "+
			"WHERE address_hash = a.miner_hash "+
			") "+
			"FROM blocks a "+
			"WHERE inserted_at BETWEEN '", fromTimepoint, "' AND '", toTimepoint, "' ",
		"ORDER BY inserted_at ASC")

	queryStart := time.Now()
	// do the query
	queryError = dbc.db.Select(&bloxbergBlocks, blocksQuery)
	queryElapsed := time.Since(queryStart)
	if queryElapsed.Milliseconds() > 1000 {
		logMessage := fmt.Sprint("Query for loading bloxberg blocks took unexpectedly long: ", queryElapsed.Milliseconds(), " ms")
		log.Warn(logMessage, log.Bloxberg, log.Database)
	}
	if queryError != nil {
		logMessage := "Error while loading bloxberg blocks."
		log.Error(logMessage, queryError, log.Bloxberg, log.Database)
		mail.SendErrorMail(logMessage, queryError)
		return validData, queryError
	}

	// validate db data
	for _, block := range bloxbergBlocks {
		ByteSize := int32(0)
		if block.ByteSize.Valid {
			ByteSize = block.ByteSize.Int32
			if ByteSize < 0 {
				ByteSize = 0
				log.Warn("ByteSize was smaller than 0. Setting it to 0.", log.Bloxberg, log.Database)
			}
		}

		InsertedAt, err := time.Parse(time.RFC3339, block.InsertedAt)
		if err != nil {
			log.Error("There was a problem converting bloxberg db string date to Time object", err, log.Bloxberg, log.Database)
		}
		TimestampMs := InsertedAt.UnixMilli()

		MinerName := ""
		if block.Miner.Valid {
			MinerName = block.Miner.String
		}

		MinerHash := hex.EncodeToString(block.BlockMinerHash)

		validBlock := ValidBlock{ByteSize: ByteSize, InsertedAt: TimestampMs, Miner: MinerName, MinerHash: MinerHash}
		validData = append(validData, validBlock)
	}

	return
}

func (dbc *Database) LoadConfirmedTransactions(fromTimepoint string, toTimepoint string) (validData []ValidConfirmedTransaction, queryError error) {
	if dbc.db == nil {
		log.Warn("Bloxberg DB not initialised.", log.Bloxberg, log.Database)
		return
	}

	bloxbergConfirmedTransactions := []DBConfirmedTransaction{}

	confirmedTransactionsQuery := fmt.Sprintf("%s%s%s%s%s%s",
		"SELECT gas_price, gas_used, updated_at, ("+
			"SELECT (SELECT name "+
			"FROM address_names "+
			"WHERE address_hash = b.miner_hash"+
			") "+
			"FROM blocks b "+
			"WHERE a.block_hash=b.hash"+
			"), ("+
			"SELECT miner_hash "+
			"FROM blocks b "+
			"WHERE a.block_hash=b.hash"+
			") "+
			"FROM transactions a "+
			"WHERE status=1 AND updated_at BETWEEN '", fromTimepoint, "' AND '", toTimepoint, "' ",
		"ORDER BY updated_at ASC")

	queryStart := time.Now()
	// do the query
	queryError = dbc.db.Select(&bloxbergConfirmedTransactions, confirmedTransactionsQuery)
	queryElapsed := time.Since(queryStart)
	if queryElapsed.Milliseconds() > 1000 {
		logMessage := fmt.Sprint("Query for loading bloxberg confirmed transactions took unexpectedly long: ", queryElapsed.Milliseconds(), " ms")
		log.Warn(logMessage, log.Bloxberg, log.Database)
	}
	if queryError != nil {
		logMessage := "Error while loading bloxberg confirmed transactions."
		log.Error(logMessage, queryError, log.Bloxberg, log.Database)
		mail.SendErrorMail(logMessage, queryError)
		return validData, queryError
	}

	// validate db data
	for _, confirmedTransaction := range bloxbergConfirmedTransactions {
		var GasUsed float64 = 0
		if confirmedTransaction.GasUsed.Valid {
			GasUsed = confirmedTransaction.GasUsed.Float64
		}
		if GasUsed < 0 {
			GasUsed = 0
			log.Warn("GasUsed was smaller than 0. Setting it to 0.", log.Bloxberg, log.Database)
		}

		var GasPrice float64 = 0
		if confirmedTransaction.GasPrice.Valid {
			GasPrice = confirmedTransaction.GasPrice.Float64
		}
		if GasPrice < 0 {
			GasPrice = 0
			log.Warn("GasUsed was smaller than 0. Setting it to 0.", log.Bloxberg, log.Database)
		}
		// 1000000000000000000 conversion rate from gwei to ether
		TransactionFee := (GasPrice / 1000000000000000000) * GasUsed

		UpdatedAt, err := time.Parse(time.RFC3339, confirmedTransaction.UpdatedAt)
		if err != nil {
			log.Error("There was a problem converting bloxberg db string date to Time object", err, log.Bloxberg, log.Database)
		}
		TimestampMs := UpdatedAt.UnixMilli()

		BlockMiner := ""
		if confirmedTransaction.BlockMiner.Valid {
			BlockMiner = confirmedTransaction.BlockMiner.String
		}

		BlockMinerHash := hex.EncodeToString(confirmedTransaction.BlockMinerHash)

		validConfirmedTransaction := ValidConfirmedTransaction{TransactionFee: TransactionFee, UpdatedAt: TimestampMs,
			BlockMiner: BlockMiner, BlockMinerHash: BlockMinerHash}
		validData = append(validData, validConfirmedTransaction)
	}

	return
}

func (dbc *Database) LoadLicensedContributors(fromTimepoint string, toTimepoint string) (validData []ValidLicensedContributor, queryError error) {
	if dbc.db == nil {
		log.Warn("Bloxberg DB not initialised.", log.Bloxberg, log.Database)
		return
	}

	bloxbergLicensedContributors := []DBLicensedContributor{}

	licensedContributorsQuery := fmt.Sprintf("%s%s%s%s%s%s",
		"SELECT name, inserted_at "+
			"FROM address_names "+
			"WHERE \"primary\" IS TRUE AND inserted_at BETWEEN '", fromTimepoint, "' AND '", toTimepoint, "' ",
		"ORDER BY inserted_at ASC")

	queryStart := time.Now()
	// do the query
	queryError = dbc.db.Select(&bloxbergLicensedContributors, licensedContributorsQuery)
	queryElapsed := time.Since(queryStart)
	if queryElapsed.Milliseconds() > 1000 {
		logMessage := fmt.Sprint("Query for loading bloxberg LicensedContributors took unexpectedly long: ", queryElapsed.Milliseconds(), " ms")
		log.Warn(logMessage, log.Bloxberg, log.Database)
	}
	if queryError != nil {
		logMessage := "Error while loading bloxberg LicensedContributors."
		log.Error(logMessage, queryError, log.Bloxberg, log.Database)
		mail.SendErrorMail(logMessage, queryError)
		return validData, queryError
	}

	// validate db data
	for _, licensedContributor := range bloxbergLicensedContributors {
		InsertedAt, err := time.Parse(time.RFC3339, licensedContributor.InsertedAt)
		if err != nil {
			log.Error("There was a problem converting bloxberg db string date to Time object", err, log.Bloxberg, log.Database)
		}
		TimestampMs := InsertedAt.UnixMilli()

		validLicensedContributor := ValidLicensedContributor{InsertedAt: TimestampMs, Name: licensedContributor.Name}
		validData = append(validData, validLicensedContributor)
	}

	return
}
