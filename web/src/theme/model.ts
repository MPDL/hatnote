import {HatnoteVisService, ServiceEvent} from "../service_event/model";

export interface ServiceTheme {
    name: string,
    id_name: HatnoteVisService,
    color1: string,
    color2: string,
    color3: string,
    header_title: string,
    header_logo: any,
    header_y: number,
    carousel_time: number
    transition_logo: any,
    qr_code: ThemeQrCode,
    legend_items: ThemeLegendItem[],
}

interface ThemeQrCode {
    image: any,
    line1: string,
    line2: string
}

export interface ThemeLegendItem {
    position_x?: number,
    position_x_small_title?: number,
    title?: string,
    smallTitle1?: string,
    smallTitle2?: string,
    event: ServiceEvent
}