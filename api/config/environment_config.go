package config

import (
	"api/institutes"
	"api/service"
	"api/utils/mail"
	"fmt"
	"strings"
)

type EnvironmentConfig struct {
	Services      []service.ServiceConfig `yaml:"services"`
	InstituteData institutes.Config       `yaml:"instituteData"`
	Email         mail.Config             `yaml:"email"`
}

func (c EnvironmentConfig) ConfigToString() string {
	var sb strings.Builder
	sb.WriteString("\n")
	sb.WriteString("Environment file data:\n")
	sb.WriteString("  Services:\n")
	for _, service := range c.Services {
		sb.WriteString(fmt.Sprintln("    Name: ", service.Name))
		sb.WriteString(fmt.Sprintln("    QueryInterval: ", service.QueryInterval))
		sb.WriteString("    Database:\n")
		sb.WriteString(fmt.Sprintln("      User: ", service.Database.User))
		sb.WriteString(fmt.Sprintln("      Host: ", service.Database.Host))
		sb.WriteString(fmt.Sprintln("      Port: ", service.Database.Port))
		sb.WriteString(fmt.Sprintln("      DBName: ", service.Database.DBName))
		sb.WriteString(fmt.Sprintln("      ReconnectTimout: ", service.Database.ReconnectTimout))
		sb.WriteString("    Websocket:\n")
		sb.WriteString(fmt.Sprintln("      EndpointPath: ", service.Websocket.EndpointPath))
		sb.WriteString(fmt.Sprintln("      MaxConnections: ", service.Websocket.MaxConnections))
		sb.WriteString("    ----------\n")
	}
	sb.WriteString("  Institutes data:\n")
	sb.WriteString(fmt.Sprintln("    SourceUrl: ", c.InstituteData.SourceUrl))
	sb.WriteString(fmt.Sprintln("    PeriodicSync: ", c.InstituteData.PeriodicSync))
	sb.WriteString("  Email:\n")
	sb.WriteString(fmt.Sprintln("    SmtpServer: ", c.Email.SmtpServer))
	sb.WriteString(fmt.Sprintln("    SmtpPort: ", c.Email.SmtpPort))
	sb.WriteString(fmt.Sprintln("    FromAddress: ", c.Email.FromAddress))
	sb.WriteString(fmt.Sprintln("    ToAddress: ", c.Email.ToAddress))
	return sb.String()
}
