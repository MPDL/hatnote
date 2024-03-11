package log

import (
	"gopkg.in/natefinch/lumberjack.v2"
	"log"
	"strings"
)

var (
	fatalLogger   *log.Logger
	errorLogger   *log.Logger
	warningLogger *log.Logger
	infoLogger    *log.Logger
	debugLogger   *log.Logger
	traceLogger   *log.Logger
	logLevel      int
)

func Init(LogAbsolutePath string, LogMaxSize int, LogMaxBackups int, LogMaxAge int, LogCompress bool, LogLevel int,
	appEnvironment string) {
	// Set up logging
	output := &lumberjack.Logger{
		Filename:   LogAbsolutePath,
		MaxSize:    LogMaxSize, // megabytes
		MaxBackups: LogMaxBackups,
		MaxAge:     LogMaxAge,   // days
		Compress:   LogCompress, // compress backed up log files
	}
	logLevel = LogLevel

	fatalLogger = log.New(output, appEnvironment+" [FATAL] ", log.Ldate|log.Ltime)
	errorLogger = log.New(output, appEnvironment+" [ERROR] ", log.Ldate|log.Ltime)
	warningLogger = log.New(output, appEnvironment+" [WARNING] ", log.Ldate|log.Ltime)
	infoLogger = log.New(output, appEnvironment+" [INFO] ", log.Ldate|log.Ltime)
	debugLogger = log.New(output, appEnvironment+" [DEBUG] ", log.Ldate|log.Ltime)
	traceLogger = log.New(output, appEnvironment+" [TRACE] ", log.Ldate|log.Ltime)
}

func Fatal(msg string, err error, concerns ...Concern) {
	if logLevel >= 1 {
		fatalLogger.Fatalln(concernsToString(concerns...), msgToString(msg, err))
	}
}

func Error(msg string, err error, concerns ...Concern) {
	if logLevel >= 2 {
		errorLogger.Println(concernsToString(concerns...), msgToString(msg, err))
	}
}

func Warn(msg string, concerns ...Concern) {
	if logLevel >= 3 {
		warningLogger.Println(concernsToString(concerns...), msgToString(msg, nil))
	}
}

func Info(msg string, concerns ...Concern) {
	if logLevel >= 4 {
		infoLogger.Println(concernsToString(concerns...), msgToString(msg, nil))
	}
}

func Debug(msg string, concerns ...Concern) {
	if logLevel >= 5 {
		debugLogger.Println(concernsToString(concerns...), msgToString(msg, nil))
	}
}

func Trace(msg string, concerns ...Concern) {
	if logLevel >= 6 {
		traceLogger.Println(concernsToString(concerns...), msgToString(msg, nil))
	}
}

func concernsToString(concerns ...Concern) string {
	var concernsString strings.Builder

	concernsString.WriteString("#(")
	for index, concern := range concerns {
		concernsString.WriteString(concern.String())
		if index != len(concerns)-1 {
			concernsString.WriteString(",")
		}
	}
	concernsString.WriteString(")")

	return concernsString.String()
}

func msgToString(msg string, err error) string {
	var msgString strings.Builder

	msgString.WriteString("\"")
	msgString.WriteString(msg)
	if err != nil {
		msgString.WriteString(" Error: ")
		msgString.WriteString(err.Error())
	}
	msgString.WriteString("\"")

	return msgString.String()
}

type Concern int64

const (
	General Concern = iota
	Main
	Config
	Database
	Institutes
	Bloxberg
	Keeper
	Minerva
	Websocket
	Service
	Mock
	Mail
	WorldMap
)

func (s Concern) String() string {
	switch s {
	case General:
		return "general"
	case Main:
		return "main"
	case Config:
		return "config"
	case Database:
		return "database"
	case Institutes:
		return "institutes"
	case Bloxberg:
		return "bloxberg"
	case Keeper:
		return "keeper"
	case Minerva:
		return "minerva"
	case Websocket:
		return "websocket"
	case Service:
		return "service"
	case Mock:
		return "mock"
	case Mail:
		return "mail"
	}
	return "unknown"
}
