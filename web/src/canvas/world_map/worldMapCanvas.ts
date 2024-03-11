import {select, Selection, geoEqualEarth, geoPath, GeoProjection, BaseType} from "d3";
import '../../style/normalize.css';
import '../../style/main.css';
import {CirclesLayer} from "./circles_layer";
import {Header} from "../header";
import {InfoBox, InfoboxType} from "../info_box";
import {Theme} from "../../theme/theme";
import {BehaviorSubject, Subject} from "rxjs";
import {BannerData, CircleData, DatabaseInfo, NetworkInfoboxData} from "../../observable/model";
import {SettingsData} from "../../configuration/hatnote_settings";
import {feature, mesh} from "topojson";
import countriesJson from '../../../assets/countries-50m.json'
import { GeometryObject, Topology } from 'topojson-specification';
import { GeoJsonProperties, FeatureCollection } from 'geojson';
import {Canvas} from "../canvas";

export class WorldMapCanvas extends Canvas{
    public readonly  circles_layer: CirclesLayer
    public readonly  header: Header;
    protected readonly _root: Selection<SVGSVGElement, unknown, null, any>;
    public readonly  info_box_websocket: InfoBox;
    public readonly  info_box_legend: InfoBox;
    public world_map: any;

    constructor(theme: Theme, settings: SettingsData, newCircleSubject: Subject<CircleData>,
                showNetworkInfoboxObservable: Subject<NetworkInfoboxData>,
                updateVersionSubject: Subject<[string, number]>,
                updateDatabaseInfoSubject: Subject<DatabaseInfo>,
                appContainer:  Selection<HTMLDivElement, unknown, null, undefined>) {
        super(theme, settings, newCircleSubject, showNetworkInfoboxObservable, updateVersionSubject,updateDatabaseInfoSubject, appContainer)

        // draw order matters in this function. Do not change without checking the result.
        const width = this.width;
        const marginTop = this.theme.header_height;
        const height = this.height;

        this._root = appContainer.append("svg")
            .attr("id", 'hatnote-canvas')
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("style", "max-width: 100%; height: auto;");

        let projection = geoEqualEarth().fitExtent([[2, marginTop + 2], [width - 2, height - 2 ]], {type: "Sphere"});
        this.initWorldMapSvg(projection)
        this.circles_layer = new CirclesLayer(this, projection)
        this.header = new Header(this, false)
        // needs to be added last to the svg because it should draw over everything else
        this.info_box_websocket = new InfoBox(this, InfoboxType.network_websocket_connecting, false, undefined, undefined)
        this.info_box_legend = new InfoBox(this, InfoboxType.legend, false, undefined, undefined)

        this.renderCurrentTheme();

        window.onresize = (_) => this.windowUpdate();
    }

    private initWorldMapSvg(projection: GeoProjection){
        const width = 928;
        const marginTop = 46;
        const height = width / 2 + marginTop;
        // Fit the projection.
        const path = geoPath(projection);

        // draw order matters here, check before changing something
        // Add a white sphere with a black border.
        this._root.append("path")
            .datum({type: "Sphere"})
            .attr("fill", "white")
            .attr("stroke", "currentColor")
            // @ts-ignore
            .attr("d", path);

        let world: Topology = (countriesJson as unknown) as Topology
        let countriesGeometry: GeometryObject<GeoJsonProperties> = world.objects.countries;
        let countries = feature(world, countriesGeometry)
        // Add a path for each country and color it according te this data.
        this._root.append("g")
            .selectAll("path")
            .data((countries as FeatureCollection).features)
            .join("path")
            .attr("fill", d => '#ccc')
            .attr("d", path)
            .attr("data-country-id", c => `${c.id}`)
            .attr("data-country-name", c => `${c.properties?.name}`)
            .attr("data-service-name", c => `${c.properties?.name}`)

        let countrymesh = mesh(world, countriesGeometry as GeometryObject, (a: GeometryObject, b: GeometryObject) => a !== b)
        // Add a white mesh.
        this._root.append("path")
            .datum(countrymesh)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("d", path);
    }

    public renderCurrentTheme(){
        // remove circles from other services
        this.circles_layer.removeOtherServiceCircles(this.theme.current_service_theme)

        // update header logo
        console.log(this.theme.current_service_theme.name)
        this.header.themeUpdate(this.theme.current_service_theme)
    }

    // This method does not cover all ui elements. There is no requirement for this nor a need for a mobile version. People
    // will use the website as a background animation. If you resize the window it is easier to just reload the page for a moment.
    protected windowUpdate() : void {
        // update canvas root dimensions
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this._root.attr("width", this.width).attr("height", this.height);

        // update canvas header dimensions
        this.header.windowUpdate()

        // update websocket info box
        this.info_box_websocket.windowUpdate()
    }
}