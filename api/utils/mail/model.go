package mail

type Config struct {
	SmtpServer  string `yaml:"smtpServer"`
	SmtpPort    int    `yaml:"smtpPort"`
	FromAddress string `yaml:"fromAddress"`
	ToAddress   string `yaml:"toAddress"`
}
