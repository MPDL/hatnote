package minerva

import "database/sql"

type DBMessage struct {
	UserId    string         `db:"id"`       // id column in users table is not nullable
	Length    sql.NullInt64  `db:"msglen"`   // message column in posts table is nullable, in SQL LEN(NULL) returns NULL
	CreatedAt sql.NullInt64  `db:"createat"` // createat column in posts table is nullable
	Type      sql.NullString `db:"type"`     // type column in channels table is nullable
	Email     sql.NullString `db:"email"`    // email column in users table is nullable
}

type ValidMessage struct {
	UserId      string
	Length      int64
	CreatedAt   int64
	Type        string
	EmailDomain string
}

type DBUserIpAddress struct {
	IpAdress sql.NullString `db:"ipaddress"` // ipaddress column in audits table is nullable
}

type ValidUserIpAddress struct {
	IpAdress string
}
