package minerva

import (
	"api/database"
	"api/utils/log"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
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
	LoadMessagesFromTimepointUntilNow(fromTimepointMs int64, toTimepointMs int64) (validData []ValidMessage, queryError error)
	LoadIpAddressesFromUserFromTimepointUntilNow(userid string, fromTimepointMs int64, toTimepointMs int64) (validUserIpAddresses []ValidUserIpAddress, queryError error)
}

func (dbc *Database) Init() error {
	log.Info("Minerva init db.", log.Minerva, log.Database)
	// for parameter description see: https://pkg.go.dev/github.com/lib/pq  password
	dataSourceName := fmt.Sprintf("user=%s password=%s dbname=%s host=%s port=%d connect_timeout=10 sslmode=disable",
		dbc.Config.User, dbc.Config.Password, dbc.Config.DBName, dbc.Config.Host, dbc.Config.Port)
	dbc.isConnecting = true
	db, err := sqlx.Connect("postgres", dataSourceName)
	if err != nil {
		dbc.db = nil
		dbc.isConnecting = false
		logMessage := "Can not connect to Minerva DB"
		log.Error(logMessage, err, log.Minerva, log.Database)
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
	log.Warn("Closing Minerva DB connection.", log.Minerva, log.Database)
	err := dbc.db.Close()
	if err != nil {
		log.Error("Can not close Minerva DB connection", err, log.Minerva, log.Database)
	}
	dbc.db = nil

	return err
}

// createat column in posts table has type BigInt which is int64
// throws items with NULL away
func (dbc *Database) LoadMessagesFromTimepointUntilNow(fromTimepointMs int64, toTimepointMs int64) (validData []ValidMessage, queryError error) {
	if dbc.db == nil {
		log.Warn("Minerva DB not initialised.", log.Minerva, log.Database)
		return
	}

	mmMessage := []DBMessage{}

	msgQuery := fmt.Sprintf("%s%d%s%d%s%s",
		"SELECT c.id, LENGTH(a.message) AS msglen, a.createat, b.type, c.email "+
			"FROM posts a, channels b, users c "+
			"WHERE a.userid = c.id AND a.channelid = b.id "+
			"AND a.createat BETWEEN ", fromTimepointMs, " AND ", toTimepointMs, " ",
		"ORDER BY a.createat ASC")

	queryStart := time.Now()
	// do the query
	queryError = dbc.db.Select(&mmMessage, msgQuery)
	queryElapsed := time.Since(queryStart)
	if queryElapsed.Milliseconds() > 1000 {
		logMessage := fmt.Sprint("Query for loading messages took unexpectedly long: ", queryElapsed.Milliseconds(), " ms")
		log.Warn(logMessage, log.Minerva, log.Database)
	}
	if queryError != nil {
		logMessage := "Error while loading messages."
		log.Error(logMessage, queryError, log.Minerva, log.Database)
		return validData, queryError
	}

	// validate db data
	for _, msg := range mmMessage {
		if !msg.Length.Valid || !msg.CreatedAt.Valid || !msg.Type.Valid || !msg.Email.Valid {
			log.Warn("After loading messages: For one message one of the following was null: length, createdAt, type, email. This message will be ignored.", log.Minerva, log.Database)
		} else {
			// get domain from email
			emailSplit := strings.Split(msg.Email.String, "@")
			var emailDomain string
			if len(emailSplit) == 2 {
				emailDomain = emailSplit[1]
				if len(emailDomain) == 0 {
					emailDomain = "domain unknown"
				}

				var messageLength int64 = msg.Length.Int64
				if messageLength < 0 {
					messageLength = 0
					log.Warn("Message length was smaller than 0. Setting it to 0.", log.Minerva, log.Database)
				}

				var createdAt int64 = msg.CreatedAt.Int64
				if createdAt < 0 {
					createdAt = 0
					log.Warn("'Created at' value was smaller than 0. Setting it to 0.", log.Minerva, log.Database)
				}

				// append valid data to return array
				validMessage := ValidMessage{UserId: msg.UserId, Length: messageLength, CreatedAt: createdAt, Type: msg.Type.String, EmailDomain: emailDomain}
				validData = append(validData, validMessage)
			} else {
				log.Warn(fmt.Sprint("There was an email '", msg.Email.String, "' which unexpectedly consists of more than one '@'."), log.Minerva, log.Database)
			}
		}
	}

	return
}

func (dbc *Database) LoadIpAddressesFromUserFromTimepointUntilNow(userid string, fromTimepointMs int64, toTimepointMs int64) (validUserIpAddresses []ValidUserIpAddress, queryError error) {
	if dbc.db == nil {
		log.Warn("Minerva DB not initialised.", log.Minerva, log.Database)
		return
	}

	userIpAddresses := []DBUserIpAddress{}

	// selects the ip adresses of last active sessions within the query intervall
	ipAddressesQuery := fmt.Sprintf("%s%s%s%d%s%d%s",
		"SELECT DISTINCT ipaddress FROM audits "+
			"WHERE sessionid IN "+
			"(SELECT id FROM sessions WHERE userid = ", userid, " AND lastactivityat BETWEEN ", fromTimepointMs, " AND ", toTimepointMs, " ORDER BY lastactivityat DESC);")

	queryStart := time.Now()
	// do the query
	queryError = dbc.db.Select(&userIpAddresses, ipAddressesQuery)
	queryElapsed := time.Since(queryStart)
	if queryElapsed.Milliseconds() > 1000 {
		logMessage := fmt.Sprint("Query for loading user ip addresses took unexpectedly long: ", queryElapsed.Milliseconds(), " ms")
		log.Warn(logMessage, log.Minerva, log.Database)
	}
	if queryError != nil {
		logMessage := "Error while loading user ip addresses."
		log.Error(logMessage, queryError, log.Minerva, log.Database)
		return validUserIpAddresses, queryError
	}

	for _, ip := range userIpAddresses {
		if !ip.IpAdress.Valid {
			log.Warn("After loading user ip addresses: one of the ip address was null and will be ignored.", log.Minerva, log.Database)
		} else {
			validUserIpAddresses = append(validUserIpAddresses, ValidUserIpAddress{IpAdress: ip.IpAdress.String})
		}
	}

	return
}
