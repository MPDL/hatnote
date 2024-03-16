import {HatnoteVisService, ServiceEvent} from "../service_event/model";

export interface HatnoteTheme {
    svg_background_color: string,
    header_bg_color: string,
    header_height: number,
    header_version_update_bg: string,
    header_text_color: string,
    legend_item_circle_r: number,
    progress_indicator_bg_color: string,
    progress_indicator_fg_color: string,
    progress_indicator_error_color: string,
    progress_indicator_height: number,
    progress_indicator_gap_width: number,
    progress_indicator_y_padding: number,
    circle_wave_color: string
}

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
    position_y_info_box?: number,
    position_x_small_title?: number,
    title?: string,
    smallTitle1?: string,
    smallTitle2?: string,
    event: ServiceEvent
}

export enum Visualisation {
    listenTo,
    geo
}