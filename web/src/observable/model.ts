import {InfoboxType} from "../canvas/info_box";
import {HatnoteVisService, ServiceEvent} from "../service_event/model";

export interface CircleData{
    type: ServiceEvent,
    label_text: string,
    circle_radius: number,
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