import {Selection} from "d3";
import InfoboxAudioImg from "../../assets/images/DancingDoodle.svg";
import LoadingSpinner from "../../assets/images/spinner.svg";
import InfoboxWebsocketConnectingImg from "../../assets/images/SprintingDoodle.svg";
import {NetworkInfoboxData} from "../observable/model";
import InfoboxDbConnectingImg from "../../assets/images/MessyDoodle.svg";
import {Subject} from "rxjs";
import {VisualisationDirector} from "../theme/visualisationDirector";
import {SettingsData} from "../configuration/hatnote_settings";
import {Legend} from "./legend";
import {HatnoteVisService} from "../service_event/model";
import {Visualisation} from "../theme/model";
import {Carousel} from "./canvas/carousel";

export class InfoBox{
    private readonly root: Selection<HTMLDivElement, unknown, null, undefined>
    private readonly image: Selection<HTMLImageElement, unknown, null, undefined> | undefined
    private readonly title: Selection<HTMLHeadingElement, unknown, null, undefined>
    private readonly text: Selection<HTMLParagraphElement, unknown, null, undefined>
    private readonly textContent: Selection<HTMLDivElement, unknown, null, undefined>
    private readonly titleContainer: Selection<HTMLDivElement, unknown, null, undefined>
    private readonly loadingSpinner: Selection<HTMLImageElement, unknown, null, undefined> | undefined
    private readonly infobox_width = 600
    public readonly infobox_height = 190
    private readonly infobox_image_width = 200
    private readonly visDirector: VisualisationDirector
    private readonly isMobileScreen : boolean
    private readonly settings: SettingsData
    private readonly onThemeHasChanged: Subject<[HatnoteVisService, Visualisation]>
    private readonly carousel: Carousel | undefined;
    private currentType: InfoboxType


    constructor(appContainer: Selection<HTMLDivElement, unknown, null, undefined>, visDirector: VisualisationDirector,
                showNetworkInfoboxObservable: Subject<NetworkInfoboxData>, type: InfoboxType, settings: SettingsData,
                onThemeHasChanged: Subject<[HatnoteVisService, Visualisation]>,
                showLegendInfoboxSubject: Subject<boolean>, carousel: Carousel | undefined) {
        this.visDirector = visDirector
        this.onThemeHasChanged = onThemeHasChanged
        this.isMobileScreen = visDirector.isMobileScreen
        this.currentType = type
        this.settings = settings
        this.carousel = carousel

        this.root = appContainer.append("div")
            .attr('id', 'infobox_' + type.toString())
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('width', `100%`)
            .style('max-width', `${this.infobox_width}px`)
            .style('min-height', `${this.infobox_height}px`)
            .style('left', '50%')
            .style('top', '50%')
            .style('transform', 'translate(-50%,-50%)')
            .style('border', '7px solid rgb(41, 128, 185)')
            .style('border-radius', '8px')
            .style('background', '#fff')
            .style('display', 'flex')

        if(!this.isMobileScreen) {
            this.image = this.root.append('img')
                .attr('src', InfoboxAudioImg)
                .style('width', `${this.infobox_image_width}px`)
                .style('padding', `15px`)
        }

        this.textContent = this.root.append('div')
            .style('padding', '0 10px')
        this.titleContainer = this.textContent.append('div')
            .style('display', 'flex')
        this.loadingSpinner = this.titleContainer.append('img')
            .attr('src', LoadingSpinner)
            .style('width', 25)
            .style('padding-right', '10px')
        this.title = this.titleContainer.append('h2')
            .text('undefined title')
            .style('font-family', 'HatnoteVisBold')
            .style('font-size', '26px')
            .style('color', visDirector.hatnoteTheme.header_text_color)
        this.text = this.textContent.append('p')
            .style('font-family', 'HatnoteVisNormal')
            .style('font-size', '16px')
            .style('fill', visDirector.hatnoteTheme.header_text_color)

        switch (type) {
            case InfoboxType.network_websocket_connecting:
            case InfoboxType.network_database_can_not_connect:
            case InfoboxType.network_database_connecting:
                showNetworkInfoboxObservable.subscribe({
                    next: (value) => this.show(value.infoboxType, value.show, value)
                })
                break;
            case InfoboxType.legend:
                showLegendInfoboxSubject.subscribe({
                    next: (value) => this.show(InfoboxType.legend, value )
                })
                break;
        }
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, null, any> {
        return this.root.append(type)
    }

    public show(type: InfoboxType, show: boolean, network_infobox_data?: NetworkInfoboxData) {
        this.currentType = type

        if(type === InfoboxType.network_websocket_connecting){
            this.root.style('opacity', show ? 1 : 0)
            this.image?.attr('src', InfoboxWebsocketConnectingImg)
            this.title.text('Connecting to server')
            this.text.html(`Your browser is connecting to the server.</br></br>` +
                `<b>Url: </b>${network_infobox_data?.target_url}</br></br>` +
                `<b>Number of reconnects: </b>${network_infobox_data?.number_of_reconnects}</br></br>`)
            this.loadingSpinner?.style('display', 'block')
        }

        // current theme service must match with websocket event service, otherwise, when carousel mode is active and e.g. minerva service
        // is shown, the keeper db infobox might appear
        if(type === InfoboxType.network_database_connecting && this.visDirector.current_service_theme.id_name === network_infobox_data?.service){
            this.root.style('opacity', show ? 1 : 0)
            this.image?.attr('src', InfoboxWebsocketConnectingImg)
            this.title.text('Connecting to database')
            this.text.html(`Connecting to ${this.visDirector.current_service_theme.name} database.`)
            this.loadingSpinner?.style('display', 'block')
        }

        if(type === InfoboxType.network_database_can_not_connect && this.visDirector.current_service_theme.id_name === network_infobox_data?.service &&
            (!this.settings.carousel_mode || this.carousel?.allServicesHaveError)){
            this.root.style('opacity', show ? 1 : 0)
            this.image?.attr('src', InfoboxDbConnectingImg)
            this.title.text('Cannot connect to database')
            this.text.html(`The backend can not connect ${this.visDirector.current_service_theme.name} database.</br></br>` +
                `<b>Next reconnect: </b>${network_infobox_data?.next_reconnect_date ?? ''}</br></br>` +
                `<b>Number of reconnects: </b>${network_infobox_data?.number_of_reconnects}</br></br>`)
            this.loadingSpinner?.style('display', 'none')
        }

        if(type=== InfoboxType.legend) {
            this.root.style('opacity', show ? 1 : 0)
            this.textContent.selectChildren().remove()
            this.textContent.style('padding', '20px')
            new Legend(this.textContent, this.visDirector, this.onThemeHasChanged, false)
        }
    }
}

export enum InfoboxType {
    network_websocket_connecting,
    network_database_connecting,
    network_database_can_not_connect,
    legend
}