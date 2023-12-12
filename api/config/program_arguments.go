package config

import (
	"fmt"
	"strings"
)

type ProgramArguments struct {
	AppEnvironment        string
	AppEnvironmentFileDir string
	LogAbsolutePath       string
	LogMaxSize            int // megabytes
	LogMaxBackups         int
	LogMaxAge             int  // days
	LogCompress           bool // compress backed up log files
	LogLevel              int
	/*
		Each log level includes the levels that are smaller

		FATAL 1
		ERROR 2
		WARN 3
		INFO 4
		DEBUG 5
		TRACE 6
	*/
}

func (programArgs ProgramArguments) ProgramArgsToString() string {
	var sb strings.Builder
	sb.WriteString("\n")
	sb.WriteString("Program arguments:\n")
	sb.WriteString(fmt.Sprintln("  appEnvironment: ", programArgs.AppEnvironment))
	sb.WriteString(fmt.Sprintln("  appEnvironmentFileDir: ", programArgs.AppEnvironmentFileDir))
	sb.WriteString("  Log config:\n")
	sb.WriteString(fmt.Sprintln("    logAbsPath: ", programArgs.LogAbsolutePath))
	sb.WriteString(fmt.Sprintln("    logMaxSize: ", programArgs.LogMaxSize))
	sb.WriteString(fmt.Sprintln("    logMaxBackups: ", programArgs.LogMaxBackups))
	sb.WriteString(fmt.Sprintln("    logMaxAge: ", programArgs.LogMaxAge))
	sb.WriteString(fmt.Sprintln("    logCompress: ", programArgs.LogCompress))
	sb.WriteString(fmt.Sprintln("    logLevel: ", programArgs.LogLevel))
	return sb.String()
}
