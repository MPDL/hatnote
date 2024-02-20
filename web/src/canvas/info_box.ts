import {Selection} from "d3";
import {Canvas} from "./canvas";
import InfoboxAudioImg from "../../assets/images/DancingDoodle.svg";
import LoadingSpinner from "../../assets/images/spinner.svg";
import InfoboxWebsocketConnectingImg from "../../assets/images/SprintingDoodle.svg";
import {NetworkInfoboxData} from "../observable/model";
import InfoboxDbConnectingImg from "../../assets/images/MessyDoodle.svg";

export class InfoBox{
    private readonly root:  Selection<SVGGElement, unknown, HTMLElement, any>
    private readonly background_rect:  Selection<SVGRectElement, unknown, HTMLElement, any>
    private readonly image:  Selection<SVGImageElement, unknown, HTMLElement, any> | undefined
    private readonly title:  Selection<SVGTextElement, unknown, HTMLElement, any>
    private readonly text:  Selection<SVGTextElement, unknown, HTMLElement, any>
    private readonly line1:  Selection<SVGTSpanElement, unknown, HTMLElement, any>[]
    private readonly line2:  Selection<SVGTSpanElement, unknown, HTMLElement, any>[]
    private readonly line3:  Selection<SVGTSpanElement, unknown, HTMLElement, any>[]
    private readonly line4:  Selection<SVGTSpanElement, unknown, HTMLElement, any>[]
    private readonly line5:  Selection<SVGTSpanElement, unknown, HTMLElement, any>[]
    private readonly line5link: Selection<HTMLAnchorElement, unknown, HTMLElement, any> | undefined
    private readonly loadingSpinner: Selection<SVGImageElement, unknown, HTMLElement, any> | undefined
    private readonly infobox_width = 600
    public readonly infobox_height = 190
    private readonly infobox_image_width = 200
    private readonly infobox_image_left_padding = 15
    private readonly infobox_image_top_padding = 20
    private readonly canvas: Canvas
    private currentType: InfoboxType


    constructor(canvas: Canvas, type: InfoboxType) {
        this.canvas = canvas
        this.currentType = type
        this.root = canvas.appendSVGElement('g')
            .attr('opacity', 0)
            .attr('id', 'infobox_' + type.toString())
        this.background_rect = this.root.append('rect')
            .attr('width', this.canvas.isMobileScreen ? this.canvas.width - 40 : this.infobox_width)
            .attr('height', this.infobox_height)
            .attr('stroke', 'rgb(41, 128, 185)')
            .attr('stroke-width', '7')
            .attr('rx', 20)
            .attr('ry', 20)
            .attr('fill', '#fff')
        if(!this.canvas.isMobileScreen) {
            this.image = this.root.append('image')
                .attr('href', InfoboxAudioImg)
                .attr('width', this.infobox_image_width)
        }
        this.title = this.root.append('text')
            .text('')
            .attr('font-family', 'HatnoteVisBold')
            .attr('font-size', '26px')
            .attr('fill', canvas.theme.header_text_color)
        this.text = this.root.append('text')
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', '16px')
            .attr('fill', canvas.theme.header_text_color)
        let line1 = this.text.append('tspan')
        let line12 = this.text.append('tspan')
        let line2 = this.text.append('tspan')
        let line22 = this.text.append('tspan')
        let line3 = this.text.append('tspan')
        let line32 = this.text.append('tspan')
        let line4 = this.text.append('tspan')
        let line42 = this.text.append('tspan')

        let line5link;
        let line5 = this.text.append('tspan')
        let line52 = this.text.append('tspan')

        this.line1 = [line1,line12]
        this.line2 = [line2,line22]
        this.line3 = [line3,line32]
        this.line4 = [line4,line42]
        this.line5 = [line5,line52]

        switch (type) {
            case InfoboxType.network_websocket_connecting:
            case InfoboxType.network_database_can_not_connect:
            case InfoboxType.network_database_connecting:
                let loadingSpinner = this.root.append('image')
                    .attr('href', LoadingSpinner)
                    .attr('width', 25)

                this.line5link = undefined
                this.loadingSpinner = loadingSpinner
                canvas.showNetworkInfoboxObservable.subscribe({
                    next: (value) => this.show(value.infoboxType, value.show, value)
                })
                break;
            case InfoboxType.audio_enable:
                line5link = this.text.append('a')
                line5 = line5link.append('tspan')
                line52 = line5link.append('tspan')
                this.line5link = line5link
                this.loadingSpinner = undefined
                canvas.showAudioInfoboxObservable.subscribe({
                    next: (value) => this.show(InfoboxType.audio_enable, value)
                })
                break;
        }

        this.setPosition()
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.root.append(type)
    }

    public show(type: InfoboxType, show: boolean, network_infobox_data?: NetworkInfoboxData) {
        this.currentType = type
        if(type=== InfoboxType.audio_enable) {
            this.root.attr('opacity', show ? 1 : 0)
            this.image?.attr('href', InfoboxAudioImg)
            this.title.text('Enable audio')
            this.line1[0].text('Your browser autoplay policy may prevent')
            this.line2[0].text('audio from being played. Please ')
            this.line2[1].text('click ').attr('font-family', 'HatnoteVisBold')
            this.line3[0].text('somewhere on this page ').attr('font-family', 'HatnoteVisBold')
            this.line3[1].text('to enable audio.')
            this.line4[0].text('For more info see:')
            this.line5link?.attr('href', 'https://jamonserrano.github.io/state-of-autoplay/')
                .attr('target', '_blank')
            this.line5[0].text('jamonserrano.github.io/state-of-autoplay')
        }

        if(type === InfoboxType.network_websocket_connecting){
            this.root.attr('opacity', show ? 1 : 0)
            this.image?.attr('href', InfoboxWebsocketConnectingImg)
            this.title.text('Connecting to server')
            this.line1[0].text('Your browser is connecting to the server.')
            this.line2[0].text(' ')
            this.line3[0].text('Url: ').attr('font-family', 'HatnoteVisBold')
            this.line3[1].text('' + network_infobox_data?.target_url)
            this.line4[0].text('Number of reconnects: ').attr('font-family', 'HatnoteVisBold')
            this.line4[1].text('' + network_infobox_data?.number_of_reconnects)
            this.loadingSpinner?.attr('opacity', 1)
        }

        // current theme service must match with websocket event service, otherwise, when carousel mode is active and e.g. minerva service
        // is shown, the keeper db infobox might appear
        if(type === InfoboxType.network_database_connecting && this.canvas.theme.current_service_theme.id_name === network_infobox_data?.service){
            this.root.attr('opacity', show ? 1 : 0)
            this.image?.attr('href', InfoboxWebsocketConnectingImg)
            this.title.text('Connecting to database')
            this.line1[0].text('Connecting to ' + this.canvas.theme.current_service_theme.name + ' database.')
            this.line2[0].text(' ')
            this.line3[0].text(' ')
            this.line3[1].text(' ')
            this.line4[0].text(' ')
            this.line4[1].text(' ')
            this.loadingSpinner?.attr('opacity', 1)
        }

        if(type === InfoboxType.network_database_can_not_connect && this.canvas.theme.current_service_theme.id_name === network_infobox_data?.service &&
            (!this.canvas.settings.carousel_mode || this.canvas.carousel?.allServicesHaveError)){
            this.root.attr('opacity', show ? 1 : 0)
            this.image?.attr('href', InfoboxDbConnectingImg)
            this.title.text('Cannot connect to database')
            this.line1[0].text('The backend can not connect ' + this.canvas.theme.current_service_theme.name + ' database.')
            this.line2[0].text(' ')
            this.line3[0].text('Next reconnect: ').attr('font-family', 'HatnoteVisBold')
            this.line3[1].text(network_infobox_data?.next_reconnect_date ?? '')
            this.line4[0].text('Number of reconnects: ').attr('font-family', 'HatnoteVisBold')
            this.line4[1].text('' + network_infobox_data?.number_of_reconnects)
            this.loadingSpinner?.attr('opacity', 0)
        }

        if(type=== InfoboxType.legend) {
            this.root.attr('opacity', show ? 1 : 0)
        }

        this.setPosition()
    }

    public windowUpdate(){
        this.setPosition()
    }

    private setPosition(){
        this.background_rect.attr('x', this.canvas.isMobileScreen ? 20 : this.canvas.width/2 - this.infobox_width/2)
            .attr('y', this.canvas.height/2 - this.infobox_height/2)
        this.image?.attr('x', this.canvas.width/2 - this.infobox_width/2 + this.infobox_image_left_padding).attr('y', this.canvas.height/2 - this.infobox_height/2 + this.infobox_image_top_padding)
        let text_x = this.canvas.isMobileScreen ? 40 : this.canvas.width/2 - this.infobox_width/2 + this.infobox_image_width + this.infobox_image_left_padding + 20
        this.title.attr('x', text_x).attr('y', this.canvas.height/2 - this.infobox_height/2 +  this.infobox_image_top_padding + 25)
        this.text.attr('x', text_x).attr('y', this.canvas.height/2 - this.infobox_height/2 + 80)
        this.line2[0].attr('x', text_x).attr('dy', '20px')
        this.line3[0].attr('x', text_x).attr('dy', '20px')
        this.line4[0].attr('x', text_x).attr('dy', '20px')
        this.line5[0].attr('x', text_x).attr('dy', '20px')

        switch (this.currentType) {
            case InfoboxType.network_websocket_connecting:
                this.loadingSpinner?.attr('x', this.canvas.isMobileScreen ? this.canvas.width/2 + 60 : this.canvas.width/2 + 180).attr('y', this.canvas.height/2 + 15)
                break;
            case InfoboxType.network_database_can_not_connect:
                this.loadingSpinner?.attr('x', text_x + 100).attr('y', this.canvas.height/2)
                break;
            case InfoboxType.network_database_connecting:
                this.loadingSpinner?.attr('x', this.canvas.width/2 + 40).attr('y', this.canvas.height/2 + 10)
                break;
            case InfoboxType.audio_enable:
                this.line5[0].attr('x', text_x).attr('dy', '20px')
                break;
        }
    }
}

export enum InfoboxType {
    network_websocket_connecting,
    network_database_connecting,
    network_database_can_not_connect,
    audio_enable, // nowhere used because it was dismissed in favour of the mute icon
    legend
}