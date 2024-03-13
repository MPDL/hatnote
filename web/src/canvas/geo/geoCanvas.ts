import {geoAlbers, geoBounds, geoEqualEarth, geoPath, GeoProjection, Selection} from "d3";
import '../../style/normalize.css';
import '../../style/main.css';
import {CirclesLayer} from "./circles_layer";
import {Header} from "../header";
import {InfoBox, InfoboxType} from "../info_box";
import {Theme} from "../../theme/theme";
import {Subject} from "rxjs";
import {CircleData, DatabaseInfo, NetworkInfoboxData} from "../../observable/model";
import {SettingsData} from "../../configuration/hatnote_settings";
import {feature, mesh} from "topojson";
import countriesJson from '../../../assets/countries-50m.json'
import germanyJson from '../../../assets/germany.json'
import {GeometryObject, Topology} from 'topojson-specification';
import {FeatureCollection, GeoJsonProperties} from 'geojson';
import {Canvas} from "../canvas";
import {HatnoteVisService} from "../../service_event/model";

export class GeoCanvas extends Canvas{
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

        this._root = appContainer.append("svg")
            .attr("id", 'hatnote-canvas')
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("style", "max-width: 100%; height: auto;");

        let projection;
        if(this.theme.current_service_theme.id_name === HatnoteVisService.Bloxberg){
            projection = this.initWorldMapSvg()
        } else {
            projection = this.initGermanyMapSvg()
        }
        this.circles_layer = new CirclesLayer(this, projection)
        this.header = new Header(this, false)
        // needs to be added last to the svg because it should draw over everything else
        this.info_box_websocket = new InfoBox(this, InfoboxType.network_websocket_connecting, false, undefined, undefined)
        this.info_box_legend = new InfoBox(this, InfoboxType.legend, false, undefined, undefined)

        this.renderCurrentTheme();

        window.onresize = (_) => this.windowUpdate();
    }

    private germanyProjection(states: any): GeoProjection{
        const width = this.width;
        const marginTop = this.theme.header_height;
        const height = this.height;

        // from https://observablehq.com/@sto3psl/map-of-germany-in-d3-js
        const [bottomLeft, topRight] = geoBounds(states);
        /* https://bl.ocks.org/mbostock/4282586 */
        const lambda = -(topRight[0] + bottomLeft[0]) / 2;
        /* Coordinates for the center of the map*/
        const center: [number, number] = [
            (topRight[0] + bottomLeft[0]) / 2 + lambda,
            (topRight[1] + bottomLeft[1]) / 2
        ];
        const scale = Math.min(
            width / (topRight[0] + bottomLeft[0]),
            height / (topRight[1] - bottomLeft[1])
        );
        return geoAlbers()
            .parallels([bottomLeft[1], topRight[1]])
            .translate([width / 2, height / 2])
            .rotate([lambda, 0, 0])
            .center(center)
            .scale(scale * 200).fitExtent([[2, marginTop + 2], [width - 2, height - 2 ]], states);
    }

    private initGermanyMapSvg(){
        // draw order matters here, check before changing something
        let germany: Topology = (germanyJson as unknown) as Topology
        let statesGeometry: GeometryObject<GeoJsonProperties> = germany.objects.states;
        let states: any = feature(germany, statesGeometry)

        // create projection
        let projection = this.germanyProjection(states)

        // Fit the projection.
        const path = geoPath(projection);

        // Add a path for each country and color it according te this data.
        this._root.append("g")
            .selectAll("path")
            .data((states as FeatureCollection).features)
            .join("path")
            .attr("fill", d => '#ccc')
            .attr("d", path)
            .attr("data-state-id", c => `${c.id}`)
            .attr("data-state-name", c => `${c.properties?.name}`)

        let countrymesh = mesh(germany, statesGeometry as GeometryObject, (a: GeometryObject, b: GeometryObject) => a !== b)
        // Add a white mesh.
        this._root.append("path")
            .datum(countrymesh)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("d", path);

        return projection
    }

    private initWorldMapSvg(){
        const width = this.width;
        const marginTop = this.theme.header_height;
        const height = this.height;

        // create projection
        let projection = geoEqualEarth().fitExtent([[2, marginTop + 2], [width - 2, height - 2 ]], {type: "Sphere"})

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

        let countrymesh = mesh(world, countriesGeometry as GeometryObject, (a: GeometryObject, b: GeometryObject) => a !== b)
        // Add a white mesh.
        this._root.append("path")
            .datum(countrymesh)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("d", path);

        return projection
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