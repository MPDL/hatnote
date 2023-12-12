package mail

import (
	"api/utils/log"
	"fmt"
	"gopkg.in/gomail.v2"
	"time"
)

var (
	smtpServer  string
	smtpPort    int
	fromAddress string
	toAddress   string
)

func Init(config Config) {
	smtpServer = config.SmtpServer
	smtpPort = config.SmtpPort
	fromAddress = config.FromAddress
	toAddress = config.ToAddress
}

func SendMail(message string, subject string) {
	// this needs to be executed concurrently to avoid waiting for the mail dialer response. If using the GWDG mailer
	// for example, and the program runs not on a GWDG server the connection can not be established after several seconds.
	go sendMailAsync(message, subject)
}

func SendErrorMail(message string, err error) {
	// this needs to be executed concurrently to avoid waiting for the mail dialer response. If using the GWDG mailer
	// for example, and the program runs not on a GWDG server the connection can not be established after several seconds.
	go sendMailAsync(fmt.Sprint("Error: ", message, " Detail: ", err, " Time: ", time.Now()), "Error")
}

func SendInfoMail(message string) {
	// this needs to be executed concurrently to avoid waiting for the mail dialer response. If using the GWDG mailer
	// for example, and the program runs not on a GWDG server the connection can not be established after several seconds.
	go sendMailAsync(fmt.Sprint("Info: ", message, " Time: ", time.Now()), "Info")
}

func SendWarnMail(message string) {
	// this needs to be executed concurrently to avoid waiting for the mail dialer response. If using the GWDG mailer
	// for example, and the program runs not on a GWDG server the connection can not be established after several seconds.
	go sendMailAsync(fmt.Sprint("Warning: ", message, " Time: ", time.Now()), "Warning")
}

func sendMailAsync(message string, subject string) {
	m := gomail.NewMessage()
	m.SetHeader("From", fromAddress)
	m.SetHeader("To", toAddress)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", message)

	d := gomail.Dialer{Host: smtpServer, Port: smtpPort}
	if err := d.DialAndSend(m); err != nil {
		log.Error(fmt.Sprint("There was a problem sending an email to ", toAddress), err, log.Mail)
	}
}
