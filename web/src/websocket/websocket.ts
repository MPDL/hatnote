import ReconnectingWebSocket from "reconnecting-websocket";
import {
    BloxbergWebsocketData,
    HatnoteWebsocketEventData,
    IHatnoteSocket,
    KeeperWebsocketData,
    MinervaWebsocketData,
    WebsocketEventInfo
} from "./model";
import {SettingsData} from "../configuration/hatnote_settings";
import {Subject} from "rxjs";
import {DatabaseInfo, NetworkInfoboxData} from "../observable/model";
import {InfoboxType} from "../ui/info_box";
import {EventBridge} from "../service_event/event_bridge";
import {HatnoteVisService} from "../service_event/model";


export class WebsocketManager{
    private readonly websockets: Map<string, HatnoteSocket>
    constructor(settings_data: SettingsData, showNetworkInfoboxSubject: Subject<NetworkInfoboxData>, updateDatabaseInfoSubject: Subject<DatabaseInfo>, event_bridge: EventBridge) {
        this.websockets = new Map<string, HatnoteSocket>

        settings_data.serviceWebsocketUrl.forEach((url: string, service: string) => {
            let socket = new HatnoteSocket(url, service, showNetworkInfoboxSubject, updateDatabaseInfoSubject, event_bridge)
            this.websockets.set(service, socket);
            socket.connect();
        });
    }
}

// This websocket implementation allows the usage of more than one socket simultaneously. E.g. if a service
// has its own websocket on which it sends data.
class HatnoteSocket implements IHatnoteSocket {
    reconnectingWebsocket: ReconnectingWebSocket | undefined;
    ws_url: string;
    websocket_name: string;
    number_of_reconnects: number = 0;
    showNetworkInfoboxSubject: Subject<NetworkInfoboxData>;
    event_bridge: EventBridge;
    updateDatabaseInfoSubject: Subject<DatabaseInfo>;

    constructor(ws_url: string, websocket_name: string, showNetworkInfoboxSubject: Subject<NetworkInfoboxData>,
                updateDatabaseInfoSubject: Subject<DatabaseInfo>, event_bridge: EventBridge) {
        this.showNetworkInfoboxSubject = showNetworkInfoboxSubject
        this.updateDatabaseInfoSubject = updateDatabaseInfoSubject
        this.ws_url = ws_url;
        this.websocket_name = websocket_name;
        this.event_bridge = event_bridge
    }
    connect () {
        this.showNetworkInfoboxSubject.next({show:true, infoboxType: InfoboxType.network_websocket_connecting,
            target_url: this.ws_url, number_of_reconnects:this.number_of_reconnects})

        this.reconnectingWebsocket = new ReconnectingWebSocket(this.ws_url);

        this.reconnectingWebsocket.onopen = () => {
            this.number_of_reconnects = 0;
            this.showNetworkInfoboxSubject.next({show:false, infoboxType: InfoboxType.network_websocket_connecting,
                target_url: this.ws_url, number_of_reconnects: this.number_of_reconnects})
            console.log('Connection open to ' + this.ws_url);
        };

        this.reconnectingWebsocket.onclose = () => {
            this.showNetworkInfoboxSubject.next({show:true, infoboxType: InfoboxType.network_websocket_connecting,
                target_url: this.ws_url, number_of_reconnects: this.number_of_reconnects})
            console.log('Connection closed to ' + this.ws_url);
        };

        this.reconnectingWebsocket.onerror = () => {
            this.number_of_reconnects++;
            this.showNetworkInfoboxSubject.next({show:true, infoboxType: InfoboxType.network_websocket_connecting,
                target_url: this.ws_url, next_reconnect_date: '', number_of_reconnects: this.number_of_reconnects})
            console.log('Connection Error to ' + this.ws_url + ': ');
        };

        this.reconnectingWebsocket.onmessage = (resp) => {
            var data = JSON.parse(resp.data);

            this.handle_websocket_event(data)
        };
    }

    private handle_websocket_event(eventData: HatnoteWebsocketEventData) {
        let hatnote_service: HatnoteVisService | undefined;

        switch (eventData.EventInfo.Service) {
            case 'keeper':
                hatnote_service = HatnoteVisService.Keeper;
                if(this.event_bridge.currentService === hatnote_service) {
                    const keeperData: KeeperWebsocketData = JSON.parse(eventData.Data) as KeeperWebsocketData;
                    this.event_bridge.addKeeperEvents(keeperData, eventData.EventInfo)
                    this.handleNetworkInfobox(eventData.EventInfo, hatnote_service)
                }
                break;
            case 'minerva':
                hatnote_service = HatnoteVisService.Minerva;
                if(this.event_bridge.currentService === hatnote_service) {
                    let minervaData: MinervaWebsocketData = JSON.parse(eventData.Data);
                    this.event_bridge.addMinervaEvents(minervaData, eventData.EventInfo)
                    this.handleNetworkInfobox(eventData.EventInfo, hatnote_service)
                }
                break;
            case 'bloxberg':
                hatnote_service = HatnoteVisService.Bloxberg;
                if(this.event_bridge.currentService === hatnote_service) {
                    let bloxbergData: BloxbergWebsocketData = JSON.parse(eventData.Data);
                    this.event_bridge.addBloxbergEvents(bloxbergData, eventData.EventInfo)
                    this.handleNetworkInfobox(eventData.EventInfo, hatnote_service)
                }
                break;
            default:
               console.log('Service provided by hatnote data not found.');
                break;
        }

        if (hatnote_service !== undefined){
            this.updateDatabaseInfoSubject.next({
                IsConnectionEstablished: eventData.EventInfo.DatabaseInfo.IsConnectionEstablished,
                IsConnecting: eventData.EventInfo.DatabaseInfo.IsConnecting,
                service: hatnote_service,
                NextReconnect: eventData.EventInfo.DatabaseInfo.NextReconnect,
                NumberOfDbReconnects: eventData.EventInfo.DatabaseInfo.NumberOfDbReconnects
            })
        }
    }

    private handleNetworkInfobox(eventInfo: WebsocketEventInfo, service: HatnoteVisService){
        if(!eventInfo.DatabaseInfo.IsConnectionEstablished) {
            if(eventInfo.DatabaseInfo.IsConnecting){
                this.showNetworkInfoboxSubject.next({show:true, infoboxType: InfoboxType.network_database_connecting, service: service})
            } else {
                let date = new Date(eventInfo.DatabaseInfo.NextReconnect);
                this.showNetworkInfoboxSubject.next({show:true, infoboxType: InfoboxType.network_database_can_not_connect,
                    next_reconnect_date: date.toTimeString(), number_of_reconnects: eventInfo.DatabaseInfo.NumberOfDbReconnects, service: service})
            }
        } else {
            this.showNetworkInfoboxSubject.next({show:false, infoboxType: InfoboxType.network_database_connecting, service: service})
        }
    }
}
