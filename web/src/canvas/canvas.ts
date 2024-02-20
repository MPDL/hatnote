import {select, Selection} from "d3";
import '../style/normalize.css';
import '../style/main.css';
import {CirclesLayer} from "./circles_layer";
import {BannerLayer} from "./banner_layer";
import {QRCode} from "./qr_code";
import {Header} from "./header";
import {InfoBox, InfoboxType} from "./info_box";
import {Theme} from "../theme/theme";
import {BehaviorSubject, Subject} from "rxjs";
import {BannerData, CircleData, DatabaseInfo, NetworkInfoboxData} from "../observable/model";
import {SettingsData} from "../configuration/hatnote_settings";
import {HatnoteVisService} from "../service_event/model";
import {Carousel} from "./carousel";
import {Navigation} from "./navigation";
import {MuteIcon} from "./mute_icon";

export class Canvas {
    public readonly circles_layer: CirclesLayer;
    public readonly banner_layer:  BannerLayer;
    public readonly qr_code: QRCode | undefined;
    public readonly header: Header;
    public readonly navigation: Navigation | undefined;
    public readonly isMobileScreen: boolean = false;
    public readonly info_box_websocket: InfoBox;
    public readonly info_box_audio: InfoBox;
    public readonly info_box_legend: InfoBox;
    public readonly mute_icon: MuteIcon;
    public readonly theme: Theme;
    public readonly settings: SettingsData;
    public readonly newCircleSubject: Subject<CircleData>
    public readonly newBannerSubject: Subject<BannerData>
    public readonly hatnoteVisServiceChangedSubject: BehaviorSubject<HatnoteVisService>
    public readonly showAudioInfoboxObservable: Subject<boolean>
    public readonly showNetworkInfoboxObservable: Subject<NetworkInfoboxData>
    public readonly updateDatabaseInfoSubject: Subject<DatabaseInfo>
    public readonly updateVersionSubject: Subject<[string, number]>
    public readonly carousel: Carousel | undefined
    private readonly root: Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private _width: number;
    private _height: number;
    public get width(): number {
        return this._width;
    }
    public get height(): number {
        return this._height;
    }
    private set width(value: number) {
        this._width = value;
    }
    private set height(value: number) {
        this._height = value;
    }

    constructor(theme: Theme, settings: SettingsData, newCircleSubject: Subject<CircleData>,
                newBannerSubject: Subject<BannerData>,
                showAudioInfoboxObservable: Subject<boolean>,
                showNetworkInfoboxObservable: Subject<NetworkInfoboxData>,
                updateVersionSubject: Subject<[string, number]>,
                hatnoteVisServiceChangedSubject: BehaviorSubject<HatnoteVisService>,
                updateDatabaseInfoSubject: Subject<DatabaseInfo>) {
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this.theme = theme;
        this.settings = settings
        this.newCircleSubject = newCircleSubject
        this.newBannerSubject = newBannerSubject
        this.showAudioInfoboxObservable = showAudioInfoboxObservable
        this.showNetworkInfoboxObservable = showNetworkInfoboxObservable
        this.updateDatabaseInfoSubject = updateDatabaseInfoSubject
        this.updateVersionSubject = updateVersionSubject
        this.hatnoteVisServiceChangedSubject = hatnoteVisServiceChangedSubject

        if (this._width <= 430 || this._height <= 430) { // iPhone 12 Pro Max 430px viewport width
            this.isMobileScreen = true;
        }

        // draw order matters in this function. Do not change without checking the result.
        this.root = select("#app").append("svg")
            .attr("width", this._width)
            .attr("height", this._height)
            .attr('fill', theme.svg_background_color)
            .style('background-color', '#1c2733');

        this.circles_layer = new CirclesLayer(this)
        this.banner_layer = new BannerLayer(this)
        if (!this.isMobileScreen) {
            this.qr_code = new QRCode(this)
        }
        this.header = new Header(this)
        // needs to be added last to the svg because it should draw over everything else
        this.info_box_websocket = new InfoBox(this, InfoboxType.network_websocket_connecting)
        this.info_box_audio = new InfoBox(this, InfoboxType.audio_enable)
        this.info_box_legend = new InfoBox(this, InfoboxType.legend)

        if(settings.carousel_mode && !this.isMobileScreen){
            this.carousel = new Carousel(this)
        }

        // needs to be here because otherwise the transition animation layer of the carousel would lay above the mute icon
        // and block the cursor event of the mute icon
        this.mute_icon = new MuteIcon(this)

        // needs to be added after the carousel transition because the transition layer spans over the entire screen
        // which captures mouse clicks that otherwise would not arrive at the navigation buttons
        if (this.isMobileScreen && !this.settings.embedded_mode) {
            this.navigation = new Navigation(this)
        }

        this.renderCurrentTheme();

        if(!settings.kiosk_mode && !settings.audio_mute){
            this.mute_icon.show()
        }

        window.onresize = (_) => this.windowUpdate();
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.root.append(type)
    }

    public renderCurrentTheme(){
        // remove circles from other services
        this.circles_layer.removeOtherServiceCircles(this.theme.current_service_theme)

        // remove banner
        this.banner_layer.removeBanner();

        // update qr code
        this.qr_code?.themeUpdate(this.theme.current_service_theme)

        // update header logo
        this.header.themeUpdate(this.theme.current_service_theme)

        this.navigation?.themeUpdate(this.theme.current_service_theme)
    }

    // This method does not cover all ui elements. There is no requirement for this nor a need for a mobile version. People
    // will use the website as a background animation. If you resize the window it is easier to just reload the page for a moment.
    public windowUpdate() {
        // update canvas root dimensions
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.root.attr("width", this._width).attr("height", this._height);

        // update canvas header dimensions
        this.header.windowUpdate()

        // update banner
        this.banner_layer.windowUpdate()

        // update progress indicator
        this.carousel?.windowUpdate()

        // update qr_code
        this.qr_code?.windowUpdate()

        // update navigation
        this.navigation?.windowUpdate()

        // update websocket info box
        this.info_box_websocket.windowUpdate()

        // update audio info box
        this.info_box_audio.windowUpdate()

        // update mute icon
        this.mute_icon.windowUpdate()
    }
}