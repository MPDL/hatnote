package keeper

import "database/sql"

type DBFileCreationAndEditing struct {
	OperationSize     int64          `db:"size"`
	OperationType     string         `db:"op_type"`
	Timestamp         string         `db:"timestamp"`
	InvitedFromDomain sql.NullString `db:"invited_from_domain"` // invited_from_domain column in subquery is nullable
	UserDomain        string         `db:"domain"`
}

type ValidFileCreationAndEditing struct {
	OperationSize     int64
	OperationType     string
	Timestamp         int64
	InvitedFromDomain string
	UserDomain        string
}

type DBLibraryCreation struct {
	Timestamp         string         `db:"timestamp"`
	InvitedFromDomain sql.NullString `db:"invited_from_domain"` // invited_from_domain column in subquery is nullable
	UserDomain        string         `db:"domain"`
}

type ValidLibraryCreation struct {
	Timestamp         int64
	InvitedFromDomain string
	UserDomain        string
}

type DBActivatedUser struct {
	Timestamp         int64          `db:"timestamp"`
	InvitedFromDomain sql.NullString `db:"invited_from_domain"` // invited_from_domain column in subquery is nullable
	UserDomain        string         `db:"domain"`
}

type ValidActivatedUser struct {
	Timestamp         int64
	InvitedFromDomain string
	UserDomain        string
}
