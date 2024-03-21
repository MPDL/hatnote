import {InfoboxType} from "../ui/info_box";
import {HatnoteVisService, ServiceEvent} from "../service_event/model";
import {Location} from "../websocket/model";

export interface CircleData{
    type: ServiceEvent,
    label_text: string,
    circle_radius: number,
    location?: Location
}

export interface BannerData{
    message: string,
    serviceEvent: ServiceEvent,
}

export interface NetworkInfoboxData{
    show: boolean,
    infoboxType: InfoboxType,
    target_url?: string,
    next_reconnect_date?: string,
    service?: HatnoteVisService,
    number_of_reconnects?: number
}

export interface DatabaseInfo{
    service: HatnoteVisService,
    IsConnectionEstablished: boolean,
    IsConnecting: boolean,
    NextReconnect: number,
    NumberOfDbReconnects: number
}