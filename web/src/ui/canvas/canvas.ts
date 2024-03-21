import {select, Selection} from "d3";
import {BehaviorSubject, Subject} from "rxjs";
import {BannerData, CircleData, DatabaseInfo, NetworkInfoboxData} from "../../observable/model";
import {SettingsData} from "../../configuration/hatnote_settings";
import {VisualisationDirector} from "../../theme/visualisationDirector";
import {HatnoteVisService} from "../../service_event/model";
import {Navigation} from "./navigation";
import {BannerLayer} from "./banner_layer";
import {QRCode} from "./qr_code";
import {Carousel} from "./carousel";
import {ListenToVisualisation} from "./listen/listenToVisualisation";
import {GeoVisualisation} from "./geo/geoVisualisation";
import {Visualisation} from "../../theme/model";
import {Transition} from "../transition";

export class Canvas {
    public readonly banner_layer:  BannerLayer;
    public readonly qr_code: QRCode;
    public readonly visDirector: VisualisationDirector;
    public readonly carousel: Carousel | undefined
    public readonly navigation: Navigation | undefined;
    public readonly settings: SettingsData;
    public readonly updateDatabaseInfoSubject: Subject<DatabaseInfo>
    public readonly onCarouselTransitionStart: Subject<[HatnoteVisService, Visualisation]>
    public readonly onThemeHasChanged: Subject<[HatnoteVisService, Visualisation]>
    public readonly onCarouselTransitionEnd: Subject<[HatnoteVisService, Visualisation]>
    public readonly showLegendInfoboxSubject: Subject<boolean>
    public readonly updateVersionSubject: Subject<[string, number]>
    public readonly newCircleSubject: Subject<CircleData>
    public readonly newBannerSubject: Subject<BannerData>
    private readonly listenToVis: ListenToVisualisation;
    public readonly geoPopUpContainer:  Selection<HTMLDivElement, unknown, null, undefined>
    private readonly geoVis: GeoVisualisation;
    public readonly appContainer:  Selection<HTMLDivElement, unknown, null, undefined>;
    private readonly _root: Selection<SVGSVGElement, unknown, null, any>;
    public get root(): Selection<SVGSVGElement, unknown, null, any> {
        return this._root;
    }
    private _width: number;
    private _height: number;
    public get width(): number {
        return this._width;
    }
    public get height(): number {
        return this._height;
    }
    protected set width(value: number) {
        this._width = value;
    }
    protected set height(value: number) {
        this._height = value;
    }

    constructor(theme: VisualisationDirector, settings: SettingsData, newCircleSubject: Subject<CircleData>,
                          updateVersionSubject: Subject<[string, number]>,
                          onCarouselTransitionStart: Subject<[HatnoteVisService, Visualisation]>,
                          onCarouselTransitionMid: Subject<[HatnoteVisService, Visualisation]>,
                          onCarouselTransitionEnd: Subject<[HatnoteVisService, Visualisation]>,
                          updateDatabaseInfoSubject: Subject<DatabaseInfo>,
                          newBannerSubject: Subject<BannerData>,
                          appContainer:  Selection<HTMLDivElement, unknown, null, undefined>,
                          transition: Transition,
                          showLegendInfoboxSubject: Subject<boolean>) {
        this._width = window.innerWidth;
        this._height = window.innerHeight - theme.hatnoteTheme.header_height;
        this.visDirector = theme;
        this.settings = settings
        this.showLegendInfoboxSubject = showLegendInfoboxSubject
        this.onCarouselTransitionStart = onCarouselTransitionStart
        this.onThemeHasChanged = onCarouselTransitionMid
        this.onCarouselTransitionEnd = onCarouselTransitionEnd
        this.newCircleSubject = newCircleSubject
        this.updateDatabaseInfoSubject = updateDatabaseInfoSubject
        this.updateVersionSubject = updateVersionSubject
        this.appContainer = appContainer;
        this.newBannerSubject = newBannerSubject

        // draw order matters in this function. Do not change without checking the result.
        this._root = this.appContainer.append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("id", "canvas")
            .attr('fill', this.visDirector.hatnoteTheme.svg_background_color)
            .style('background-color', '#1c2733');
        this.geoPopUpContainer = this.appContainer.append('div')
            .attr("id","geo-visualisation-popup-container").attr("style", "opacity: 1;")

        this.qr_code = new QRCode(this)

        this.listenToVis = new ListenToVisualisation(this)
        this.geoVis = new GeoVisualisation(this)

        this.banner_layer = new BannerLayer(this)

        if(settings.carousel_mode && !this.visDirector.isMobileScreen){
            this.carousel = new Carousel(this, transition)
        }

        // needs to be added after the carousel transition because the transition layer spans over the entire screen
        // which captures mouse clicks that otherwise would not arrive at the navigation buttons
        if (this.visDirector.isMobileScreen && !this.settings.embedded_mode) {
            this.navigation = new Navigation(this)
        }

        this.onThemeHasChanged.subscribe({
            next: (value) => {
                this.renderCurrentTheme()
            }
        })

        this.renderCurrentTheme();

        window.onresize = (_) => this.windowUpdate();
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, null, any> {
        return this._root.append(type)
    }

    public renderCurrentTheme(){
        // remove circles and visualisation from other services
        this.listenToVis.renderCurrentTheme()
        this.geoVis.renderCurrentTheme()

        // remove banner
        this.banner_layer.removeBanner();

        // update qr code
        this.qr_code.themeUpdate(this.visDirector.current_service_theme)
    }

    // This method does not cover all ui elements. There is no requirement for this nor a need for a mobile version. People
    // will use the website as a background animation. If you resize the window it is easier to just reload the page for a moment.
    public windowUpdate() {
        // update canvas root dimensions
        this.width = window.innerWidth;
        this.height = window.innerHeight - this.visDirector.hatnoteTheme.header_height;
        this._root.attr("width", this.width).attr("height", this.height);

        // update banner
        this.banner_layer.windowUpdate()

        // update progress indicator
        this.carousel?.windowUpdate()

        // update qr_code
        this.qr_code?.windowUpdate()

        // update navigation
        this.navigation?.windowUpdate()
    }
}