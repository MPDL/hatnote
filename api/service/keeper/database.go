package keeper

import (
	"api/database"
	"api/utils/log"
	"fmt"
	"github.com/jmoiron/sqlx"
	"time"

	_ "github.com/go-sql-driver/mysql"
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
	LoadFileCreationsAndEditings(fromTimepoints string, toTimepoint string) (validData []ValidFileCreationAndEditing, queryError error)
	LoadLibraryCreations(fromTimepoint string, toTimepoint string) (validData []ValidLibraryCreation, queryError error)
	LoadActivatedUsers(fromTimepointSeconds int64, toTimepointSeconds int64) (validData []ValidActivatedUser, queryError error)
}

func (dbc *Database) Init() error {
	log.Info("Keeper init db.", log.Keeper, log.Database)
	// for parameter description see: https://github.com/go-sql-driver/mysql#dsn-data-source-name
	// for more info: https://pkg.go.dev/github.com/go-sql-driver/mysql
	dataSourceName := fmt.Sprintf("%s:%s@(%s:%d)/%s",
		dbc.Config.User, dbc.Config.Password, dbc.Config.Host, dbc.Config.Port, dbc.Config.DBName)
	dbc.isConnecting = true
	db, err := sqlx.Connect("mysql", dataSourceName)
	if err != nil {
		dbc.db = nil
		dbc.isConnecting = false
		logMessage := "Can not connect to Keeper DB"
		log.Error(logMessage, err, log.Keeper, log.Database)
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
	log.Warn("Closing Keeper DB connection.", log.Keeper, log.Database)
	err := dbc.db.Close()
	if err != nil {
		log.Error("Can not close Keeper DB connection", err, log.Keeper, log.Database)
	}
	dbc.db = nil

	return err
}

func (dbc *Database) LoadFileCreationsAndEditings(fromTimepoint string, toTimepoint string) (validData []ValidFileCreationAndEditing, queryError error) {
	if dbc.db == nil {
		log.Warn("Keeper DB not initialised.", log.Keeper, log.Database)
		return
	}

	keeperFileOperations := []DBFileCreationAndEditing{}

	fileOperationsQuery := fmt.Sprintf("%s%s%s%s%s%s",
		"SELECT timestamp,"+
			"REGEXP_REPLACE((SELECT inviter FROM `seahub-db`.invitations_invitation WHERE accepter = a.op_user "+
			"ORDER BY accept_time DESC LIMIT 1), '.+(?=@).', '') as invited_from_domain,"+
			"SUBSTRING(op_user, POSITION('@' IN op_user) + 1) as domain,"+
			"op_type,"+
			"CAST(SUBSTRING(REGEXP_SUBSTR(detail, '\"size\": \\\\d+'), 9) AS UNSIGNED) as size "+
			"FROM `seahub-db`.Activity a "+
			"WHERE op_type in ('create', 'edit') "+
			"AND obj_type = 'file' "+
			"AND detail not like '%\"size\": 0,%' "+
			"AND timestamp BETWEEN '", fromTimepoint, "' AND '", toTimepoint, "' ",
		"ORDER BY timestamp ASC")

	queryStart := time.Now()
	// do the query
	queryError = dbc.db.Select(&keeperFileOperations, fileOperationsQuery)
	queryElapsed := time.Since(queryStart)
	if queryElapsed.Milliseconds() > 1000 {
		logMessage := fmt.Sprint("Query for loading keeper file creations and editings took unexpectedly long: ", queryElapsed.Milliseconds(), " ms")
		log.Warn(logMessage, log.Keeper, log.Database)
	}
	if queryError != nil {
		logMessage := "Error while loading keeper file creations and editings."
		log.Error(logMessage, queryError, log.Keeper, log.Database)
		return validData, queryError
	}

	// validate db data
	for _, file_operation := range keeperFileOperations {
		InvitedFromDomain := ""
		if file_operation.InvitedFromDomain.Valid {
			InvitedFromDomain = file_operation.InvitedFromDomain.String
		}

		dbDateTime, err := time.Parse(time.DateTime, file_operation.Timestamp)
		if err != nil {
			log.Error("There was a problem converting db string date to Time object", err, log.Keeper, log.Database)
		}
		TimestampSec := dbDateTime.Unix()

		OperationSize := file_operation.OperationSize
		if OperationSize < 0 {
			OperationSize = 0
			log.Warn("OperationSize was smaller than 0. Setting it to 0.", log.Keeper, log.Database)
		}

		validFileOperation := ValidFileCreationAndEditing{InvitedFromDomain: InvitedFromDomain, OperationSize: OperationSize,
			Timestamp: TimestampSec, UserDomain: file_operation.UserDomain, OperationType: file_operation.OperationType}
		validData = append(validData, validFileOperation)
	}

	return
}

func (dbc *Database) LoadLibraryCreations(fromTimepoint string, toTimepoint string) (validData []ValidLibraryCreation, queryError error) {
	if dbc.db == nil {
		log.Warn("Keeper DB not initialised.", log.Keeper, log.Database)
		return
	}

	keeperLibraryCreations := []DBLibraryCreation{}

	libraryCreationsQuery := fmt.Sprintf("%s%s%s%s%s%s",
		"SELECT timestamp as timestamp,"+
			"REGEXP_REPLACE((SELECT inviter	FROM `seahub-db`.invitations_invitation	WHERE accepter = a.op_user "+
			"ORDER BY accept_time DESC LIMIT 1), '.+(?=@).', '') as invited_from_domain,"+
			"SUBSTRING(op_user, POSITION('@' IN op_user) + 1) as domain "+
			"FROM `seahub-db`.Activity a "+
			"WHERE op_type = 'create' AND path = '/' AND timestamp BETWEEN '", fromTimepoint, "' AND '", toTimepoint, "' ",
		"ORDER BY timestamp ASC")

	queryStart := time.Now()
	// do the query
	queryError = dbc.db.Select(&keeperLibraryCreations, libraryCreationsQuery)
	queryElapsed := time.Since(queryStart)
	if queryElapsed.Milliseconds() > 1000 {
		logMessage := fmt.Sprint("Query for loading library creations took unexpectedly long: ", queryElapsed.Milliseconds(), " ms")
		log.Warn(logMessage, log.Keeper, log.Database)
	}
	if queryError != nil {
		logMessage := "Error while loading library creations."
		log.Error(logMessage, queryError, log.Keeper, log.Database)
		return validData, queryError
	}

	// validate db data
	for _, library_creation := range keeperLibraryCreations {
		InvitedFromDomain := ""
		if library_creation.InvitedFromDomain.Valid {
			InvitedFromDomain = library_creation.InvitedFromDomain.String
		}

		dbDateTime, err := time.Parse(time.DateTime, library_creation.Timestamp)
		if err != nil {
			log.Error("There was a problem converting db string date to Time object", err, log.Keeper, log.Database)
		}
		TimestampSec := dbDateTime.Unix()

		validLibraryCreation := ValidLibraryCreation{InvitedFromDomain: InvitedFromDomain,
			Timestamp: TimestampSec, UserDomain: library_creation.UserDomain}
		validData = append(validData, validLibraryCreation)
	}

	return
}

func (dbc *Database) LoadActivatedUsers(fromTimepointSeconds int64, toTimepointSeconds int64) (validData []ValidActivatedUser, queryError error) {
	if dbc.db == nil {
		log.Warn("Keeper DB not initialised.", log.Keeper, log.Database)
		return
	}

	keeperActivatedUsers := []DBActivatedUser{}

	activatedUsersQuery := fmt.Sprintf("%s%d%s%s%s%s",
		"SELECT floor(ctime/1000000) as timestamp,"+
			"REGEXP_REPLACE((SELECT inviter "+
			"FROM `seahub-db`.invitations_invitation WHERE accepter = t.email ORDER BY accept_time DESC "+
			"LIMIT 1), '.+(?=@).', '') as invited_from_domain,"+
			"SUBSTRING(email, POSITION('@' IN email) + 1) as domain "+
			"FROM `ccnet-db`.EmailUser t "+
			"WHERE is_active = 1 AND floor(ctime/1000000) BETWEEN '", fromTimepointSeconds, "' AND '", toTimepointSeconds, "' ",
		"ORDER BY ctime ASC")

	queryStart := time.Now()
	// do the query
	queryError = dbc.db.Select(&keeperActivatedUsers, activatedUsersQuery)
	queryElapsed := time.Since(queryStart)
	if queryElapsed.Milliseconds() > 1000 {
		logMessage := fmt.Sprint("Query for loading activated users took unexpectedly long: ", queryElapsed.Milliseconds(), " ms")
		log.Warn(logMessage, log.Keeper, log.Database)
	}
	if queryError != nil {
		logMessage := "Error while loading activated users."
		log.Error(logMessage, queryError, log.Keeper, log.Database)
		return validData, queryError
	}

	// validate db data
	for _, activated_user := range keeperActivatedUsers {
		InvitedFromDomain := ""
		if activated_user.InvitedFromDomain.Valid {
			InvitedFromDomain = activated_user.InvitedFromDomain.String
		}

		Timestamp := activated_user.Timestamp
		if Timestamp < 0 {
			Timestamp = 0
			log.Warn("Timestamp was smaller than 0. Setting it to 0.", log.Keeper, log.Database)
		}

		validActivatedUser := ValidActivatedUser{InvitedFromDomain: InvitedFromDomain,
			Timestamp: Timestamp, UserDomain: activated_user.UserDomain}
		validData = append(validData, validActivatedUser)
	}

	return
}
