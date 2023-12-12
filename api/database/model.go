package database

type Config struct {
	User            string `yaml:"user"`
	Password        string `yaml:"password"`
	Host            string `yaml:"host"`
	Port            int    `yaml:"port"`
	DBName          string `yaml:"dbname"`
	ReconnectTimout int    `yaml:"reconnectTimout"`
}
