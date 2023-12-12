package websocket

import (
	"encoding/json"
	"fmt"
	"time"
)

type WebsocketMock struct{}

func (wsc *WebsocketMock) SendDataInBulk(data EventData) {
	fmt.Println("--- Data bulk received: ", time.Now().String(), " ---")
	fmt.Println("#### Websocket event data ####")
	fmt.Printf("IActiveConnections: %d\n", data.EventInfo.ActiveConnections)
	fmt.Printf("FromTimepoint: %d\n", data.EventInfo.FromTimepoint)
	fmt.Printf("service: %s\n", data.EventInfo.Service)

	var service = data.EventInfo.Service

	if service == "keeper" {
		serviceData := KeeperData{}
		json.Unmarshal([]byte(data.Data), &serviceData)

		fmt.Println("## FileCreationsAndEditings data ##")
		for _, wsEventData := range serviceData.FileCreationsAndEditings {
			fmt.Printf("Institute name: %s\n", wsEventData.InstituteName)
			fmt.Printf("OperationType: %s\n", wsEventData.OperationType)
			fmt.Printf("OperationSize: %d\n", wsEventData.OperationSize)
			fmt.Printf("Timestamp: %d\n", wsEventData.Timestamp)
			fmt.Println("")
		}
		fmt.Println("## ActivatedUsers data ##")
		for _, wsEventData := range serviceData.ActivatedUsers {
			fmt.Printf("Institute name: %s\n", wsEventData.InstituteName)
			fmt.Printf("Timestamp: %d\n", wsEventData.Timestamp)
			fmt.Println("")
		}
		fmt.Println("## LibraryCreations data ##")
		for _, wsEventData := range serviceData.LibraryCreations {
			fmt.Printf("Institute name: %s\n", wsEventData.InstituteName)
			fmt.Printf("Timestamp: %d\n", wsEventData.Timestamp)
			fmt.Println("")
		}
	} else if service == "minerva" {
		serviceData := MinervaData{}
		json.Unmarshal([]byte(data.Data), &serviceData)

		fmt.Println("## Messages data ##")
		for _, wsEventData := range serviceData.Messages {
			fmt.Printf("Institute name: %s\n", wsEventData.InstituteName)
			fmt.Printf("Posted at: %d\n", wsEventData.CreatedAt)
			fmt.Printf("Type: %s\n", wsEventData.ChannelType)
			fmt.Printf("Length: %d\n", wsEventData.MessageLength)
			fmt.Println("")
		}
	}
}

func (wsc *WebsocketMock) InitAndStartOnce(config Config) {
	fmt.Println("Websocket initialised and started")
}

func (wsc *WebsocketMock) init(config Config) {
	fmt.Println("Websocket initialised")
}
func (wsc *WebsocketMock) GetErrorChannel() *chan error {
	fmt.Println("Websocket GetErrorChannel")
	return nil
}
func (wsc *WebsocketMock) startWebsocket() {
	fmt.Println("Websocket started")
}

func (wsc *WebsocketMock) StopWebsocket() {
	fmt.Println("Websocket stopped")
}

func (wsc *WebsocketMock) GetActiveConnections() int {
	return 0
}
