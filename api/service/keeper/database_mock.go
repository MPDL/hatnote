package keeper

import (
	"api/service"
	"api/utils/log"
	"github.com/jmoiron/sqlx"
	"math/rand"
	"time"
)

type DatabaseMock struct {
	db     *sqlx.DB
	Config service.ServiceConfig
}

func (dbc *DatabaseMock) Init() error {
	return nil
}

func (dbc *DatabaseMock) IsInitialised() bool {
	return true
}
func (dbc *DatabaseMock) IsConnecting() bool {
	return false
}
func (dbc *DatabaseMock) SetIsConnecting(isConnecting bool) {
	return
}
func (dbc *DatabaseMock) Ping() error {
	return nil
}
func (dbc *DatabaseMock) CloseConnection() error { return nil }
func (dbc *DatabaseMock) LoadFileCreationsAndEditings(fromTimepoint string, toTimepoint string) (validData []ValidFileCreationAndEditing, queryError error) {
	var plusTime = rand.Int63n(dbc.Config.QueryInterval)
	var fromTimePointTime, err = time.Parse(time.DateTime, fromTimepoint)
	negativeServerTimeDifference := time.Duration(-2) * time.Hour
	fromTimePointTime = fromTimePointTime.Add(negativeServerTimeDifference)
	if err != nil {
		log.Error("There was a problem converting db string date to Time object", err, log.Keeper, log.Mock, log.Database)
	}

	// this array should be ordered as the front end expects
	validData = append(validData,
		ValidFileCreationAndEditing{
			InvitedFromDomain: "",
			OperationSize:     199585,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "aaa.de",
			OperationType:     "create"},
		//keeper.ValidFileCreationAndEditing{
		//	InvitedFromDomain: "",
		//	OperationSize:     1392,
		//	Timestamp:         fromTimePointTime.Unix() + plusTime,
		//	UserDomain:        "bbb.de",
		//	OperationType:     "edit"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
		ValidFileCreationAndEditing{
			InvitedFromDomain: "aaa.de",
			OperationSize:     40568,
			Timestamp:         fromTimePointTime.Unix() + plusTime,
			UserDomain:        "gmail.com",
			OperationType:     "create"},
	)

	return
}

func (dbc *DatabaseMock) LoadLibraryCreations(fromTimepoint string, toTimepoint string) (validData []ValidLibraryCreation, queryError error) {
	//var minusTime = rand.Int63n(dbc.Config.QueryInterval)
	//var fromTimePointTime, err = time.Parse(time.DateTime, fromTimepoint)
	//if err != nil {
	//	Error("There was a problem converting db string date to Time object", err)
	//}

	//validData = append(validData,
	//	keeper.ValidLibraryCreation{
	//		InvitedFromDomain: "",
	//		Timestamp:         fromTimePointTime.Unix() - minusTime,
	//		UserDomain:        "ccc.de"},
	//	keeper.ValidLibraryCreation{
	//		InvitedFromDomain: "",
	//		Timestamp:         fromTimePointTime.Unix() - minusTime,
	//		UserDomain:        "zzz.de"},
	//)

	return
}

func (dbc *DatabaseMock) LoadActivatedUsers(fromTimepointSeconds int64, toTimepointSeconds int64) (validData []ValidActivatedUser, queryError error) {
	//var minusTime = rand.Int63n(dbc.Config.QueryInterval)
	//validData = append(validData,
	//	keeper.ValidActivatedUser{
	//		InvitedFromDomain: "",
	//		Timestamp:         fromTimepointSeconds - minusTime,
	//		UserDomain:        "ccc.de"},
	//	keeper.ValidActivatedUser{
	//		InvitedFromDomain: "",
	//		Timestamp:         fromTimepointSeconds - minusTime,
	//		UserDomain:        "ccc.de"},
	//	keeper.ValidActivatedUser{
	//		InvitedFromDomain: "zzz.de",
	//		Timestamp:         fromTimepointSeconds - minusTime,
	//		UserDomain:        "gmail.com"},
	//	keeper.ValidActivatedUser{
	//		InvitedFromDomain: "aaa.de",
	//		Timestamp:         fromTimepointSeconds - minusTime,
	//		UserDomain:        "gmail.com"},
	//)

	return
}
