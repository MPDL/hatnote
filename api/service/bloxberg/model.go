package bloxberg

import "database/sql"

type DBBlock struct {
	ByteSize   sql.NullInt32 `db:"size"`
	InsertedAt string        `db:"inserted_at"`
	// while joining tables this could be NULL since it is not enforced to be there with a foreign key
	Miner          sql.NullString `db:"name"`
	BlockMinerHash []byte         `db:"miner_hash"`
}

type ValidBlock struct {
	ByteSize   int32
	InsertedAt int64
	Miner      string
	MinerHash  string
}

type DBConfirmedTransaction struct {
	GasPrice  sql.NullFloat64 `db:"gas_price"`
	GasUsed   sql.NullFloat64 `db:"gas_used"`
	UpdatedAt string          `db:"updated_at"`
	// while joining tables this could be NULL since it is not enforced to be there with a foreign key
	BlockMiner     sql.NullString `db:"name"`
	BlockMinerHash []byte         `db:"miner_hash"`
}

type ValidConfirmedTransaction struct {
	TransactionFee float64
	UpdatedAt      int64
	BlockMiner     string
	BlockMinerHash string
}

type DBLicensedContributor struct {
	InsertedAt string `db:"inserted_at"`
	Name       string `db:"name"`
}

type ValidLicensedContributor struct {
	InsertedAt int64
	Name       string
}
