/******************************************
 ** hatnote websocket data structures **
 *****************************************/
import ReconnectingWebSocket from "reconnecting-websocket";

export interface WebsocketEventInfo {
    Service: string,
    Version: string,
    ExpectedFrontendVersion: number,
    ActiveConnections: number,
    FromTimepoint: number,
    DatabaseInfo: DatabaseInfo
}

export interface HatnoteWebsocketEventData {
    Data: string,
    EventInfo: WebsocketEventInfo
}

export interface DatabaseInfo {
    IsConnectionEstablished: boolean,
    IsConnecting: boolean,
    NextReconnect: number,
    NumberOfDbReconnects: number
}

/******************************************
 ** minerva websocket data structures **
 *****************************************/

export interface MinervaWebsocketMessage {
    InstituteName: string,
    CreatedAt: number,
    MessageLength: number,
    ChannelType: string,
    Location: Location
}

export interface MinervaWebsocketData {
    Messages: MinervaWebsocketMessage[],
}

/******************************************
 ** keeper websocket data structures **
 *****************************************/

export interface KeeperWebsocketFileCreationsAndEditings {
    OperationSize: number,
    OperationType: string,
    Timestamp: number,
    InstituteName: string,
    Location: Location
}

export interface KeeperWebsocketLibraryCreations {
    LibraryName: string,
    Timestamp: number,
    InstituteName: string,
    Location: Location
}

export interface KeeperWebsocketActivatedUsers {
    Timestamp: number,
    InstituteName: string,
}

export interface KeeperWebsocketData {
    FileCreationsAndEditings: KeeperWebsocketFileCreationsAndEditings[],
    LibraryCreations: KeeperWebsocketLibraryCreations[],
    ActivatedUsers: KeeperWebsocketActivatedUsers[],
}

/******************************************
 ** bloxberg websocket data structures **
 *****************************************/

export interface BloxbergWebsocketBlock {
    ByteSize: number,
    InsertedAt: number,
    Miner: string,
    MinerHash: string,
    Location: Location
}

export interface BloxbergWebsocketConfirmedTransaction {
    TransactionFee: number,
    UpdatedAt: number,
    BlockMiner: string,
    BlockMinerHash: string,
    Location: Location
}

export interface Location {
    coordinate: Coordinate,
    countryId: string,
    stateId: string
}

export interface Coordinate {
    lat: number,
    long: number
}

export interface BloxbergWebsocketLicensedContributor {
    InsertedAt: number,
    Name: string,
}

export interface BloxbergWebsocketData {
    Blocks: BloxbergWebsocketBlock[],
    ConfirmedTransactions: BloxbergWebsocketConfirmedTransaction[],
    LicensedContributors: BloxbergWebsocketLicensedContributor[],
}

export interface IHatnoteSocket {
    reconnectingWebsocket: ReconnectingWebSocket | undefined;
    ws_url: string;
    websocket_name: string;
    number_of_reconnects: number;

    connect(): void;
}