package websocket

import "api/world_map"

type Config struct {
	EndpointPath   string `yaml:"endpointPath"`
	MaxConnections int    `yaml:"maxConnections"`
}

/******************************************
 ** websocket data structures **
 *****************************************/

type EventData struct {
	Data      string    `json:"Data"`
	EventInfo EventInfo `json:"EventInfo"`
}

type EventInfo struct {
	Service                 string       `json:"Service"`
	Version                 string       `json:"Version"`
	ExpectedFrontendVersion int64        `json:"ExpectedFrontendVersion"`
	ActiveConnections       int          `json:"ActiveConnections"`
	FromTimepoint           int64        `json:"FromTimepoint"`
	DatabaseInfo            DatabaseInfo `json:"DatabaseInfo"`
}

type DatabaseInfo struct {
	IsConnectionEstablished bool  `json:"IsConnectionEstablished"`
	IsConnecting            bool  `json:"IsConnecting"`
	NextReconnect           int64 `json:"NextReconnect"`
	NumberOfDbReconnects    int   `json:"NumberOfDbReconnects"`
}

/******************************************
 ** minerva websocket data structures **
 *****************************************/

type MinervaMessage struct {
	InstituteName string `json:"InstituteName"`
	CreatedAt     int64  `json:"CreatedAt"`
	MessageLength int64  `json:"MessageLength"`
	ChannelType   string `json:"ChannelType"`
}

type MinervaData struct {
	Messages []MinervaMessage `json:"Messages"`
}

/******************************************
 ** keeper websocket data structures **
 *****************************************/

type KeeperFileCreationAndEditing struct {
	OperationSize int64  `json:"OperationSize"`
	OperationType string `json:"OperationType"`
	Timestamp     int64  `json:"Timestamp"`
	InstituteName string `json:"InstituteName"`
}

type KeeperLibraryCreation struct {
	Timestamp     int64  `json:"Timestamp"`
	InstituteName string `json:"InstituteName"`
}

type KeeperActivatedUser struct {
	Timestamp     int64  `json:"Timestamp"`
	InstituteName string `json:"InstituteName"`
}

type KeeperData struct {
	FileCreationsAndEditings []KeeperFileCreationAndEditing `json:"FileCreationsAndEditings"`
	LibraryCreations         []KeeperLibraryCreation        `json:"LibraryCreations"`
	ActivatedUsers           []KeeperActivatedUser          `json:"ActivatedUsers"`
}

/******************************************
 ** bloxberg websocket data structures **
 *****************************************/

type BloxbergBlock struct {
	ByteSize   int32              `json:"ByteSize"`
	InsertedAt int64              `json:"InsertedAt"`
	Miner      string             `json:"Miner"`
	MinerHash  string             `json:"MinerHash"`
	Location   world_map.Location `json:"Location"`
}

type BloxbergConfirmedTransaction struct {
	TransactionFee float64            `json:"TransactionFee"`
	UpdatedAt      int64              `json:"UpdatedAt"`
	BlockMiner     string             `json:"BlockMiner"`
	BlockMinerHash string             `json:"BlockMinerHash"`
	Location       world_map.Location `json:"Location"`
}

type BloxbergLicensedContributor struct {
	InsertedAt int64  `json:"InsertedAt"`
	Name       string `json:"Name"`
}

type BloxbergData struct {
	Blocks                []BloxbergBlock                `json:"Blocks"`
	ConfirmedTransactions []BloxbergConfirmedTransaction `json:"ConfirmedTransactions"`
	LicensedContributors  []BloxbergLicensedContributor  `json:"LicensedContributors"`
}
