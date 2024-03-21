import {geoAlbers, geoBounds, geoEqualEarth, geoPath, GeoProjection, Selection} from "d3";
import {feature, mesh} from "topojson";
import countriesJson from '../../../../assets/countries-50m.json'
import germanyJson from '../../../../assets/germany.json'
import {GeometryObject, Topology} from 'topojson-specification';
import {FeatureCollection, GeoJsonProperties} from 'geojson';
import {Canvas} from "../canvas";
import {HatnoteVisService} from "../../../service_event/model";
import {GeoCirclesLayer} from "./geoCirclesLayer";
import {Visualisation} from "../../../theme/model";

export class GeoVisualisation {
    public readonly  circles_layer: GeoCirclesLayer
    public readonly canvas: Canvas;
    protected readonly root: Selection<SVGGElement, unknown, null, any>;
    public readonly worldMap: Selection<SVGGElement, unknown, null, any>;
    public readonly worldMapProjection: GeoProjection;
    public readonly germanyMap: Selection<SVGGElement, unknown, null, any>;
    public readonly germanyMapProjection: GeoProjection;

    constructor(canvas: Canvas) {
        this.canvas = canvas;

        this.root = canvas.appendSVGElement('g').attr("id", "geo-visualisation")

        // draw order matters in this function. Do not change without checking the result.
        this.root
            .attr("style", "max-width: 100%; height: auto;");

        this.worldMap = this.root.append("g").attr("id", "world-map")
        this.germanyMap = this.root.append("g").attr("id", "germany-map")
        this.worldMapProjection = this.initWorldMapSvg()
        this.germanyMapProjection = this.initGermanyMapSvg()
        this.circles_layer = new GeoCirclesLayer(this, this.germanyMapProjection, this.worldMapProjection)

        this.renderCurrentTheme();

        this.canvas.onCarouselTransitionStart.subscribe({
            next: (_) => this.canvas.geoPopUpContainer.attr("style", "opacity: 0;")
        })

        this.canvas.onThemeHasChanged.subscribe({
            next: (_) => {
                if (this.canvas.visDirector.current_service_theme.id_name === HatnoteVisService.Bloxberg){
                    this.worldMap.selectAll("#countries-mesh path").interrupt()
                        .style('fill',this.canvas.visDirector.current_service_theme.geo_area_color)
                } else {
                    this.germanyMap.selectAll("#state-mesh path").interrupt()
                        .style('fill',this.canvas.visDirector.current_service_theme.geo_area_color)
                }
            }
        })

        this.canvas.onCarouselTransitionEnd.subscribe({
            next: (_) => this.canvas.geoPopUpContainer.attr("style", "opacity: 1;")
        })
    }

    private germanyProjection(states: any): GeoProjection{
        const width = this.canvas.width;
        const marginTop = this.canvas.visDirector.hatnoteTheme.header_height + 10;
        const height = this.canvas.height;
        const carouselProgressIndicatorSafeZone = this.canvas.visDirector.hatnoteTheme.progress_indicator_y_padding + 10;

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
            .scale(scale * 200).fitExtent([[2, marginTop + 2], [width - 2, height - 2 - carouselProgressIndicatorSafeZone ]], states);
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
        this.germanyMap.append("g")
            .attr("id", "state-mesh")
            .selectAll("path")
            .data((states as FeatureCollection).features)
            .join("path")
            .attr("fill", this.canvas.visDirector.current_service_theme.geo_area_color)
            .attr("d", path)
            .attr("data-state-id", c => `${c.id}`)
            .attr("data-state-name", c => `${c.properties?.name}`)

        let countrymesh = mesh(germany, statesGeometry as GeometryObject, (a: GeometryObject, b: GeometryObject) => a !== b)
        // Add a white mesh.
        this.germanyMap.append("path")
            .attr("id", "state-border-mesh")
            .datum(countrymesh)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("d", path);

        return projection
    }

    private initWorldMapSvg(){
        const width = this.canvas.width;
        const marginTop = this.canvas.visDirector.hatnoteTheme.header_height + 10;
        const height = this.canvas.height;
        const carouselProgressIndicatorSafeZone = this.canvas.visDirector.hatnoteTheme.progress_indicator_y_padding + 10;

        // create projection
        let projection = geoEqualEarth().fitExtent([[2, marginTop + 2], [width - 2, height - 2 - carouselProgressIndicatorSafeZone ]], {type: "Sphere"})

        // Fit the projection.
        const path = geoPath(projection);

        let world: Topology = (countriesJson as unknown) as Topology
        let countriesGeometry: GeometryObject<GeoJsonProperties> = world.objects.countries;
        let countries = feature(world, countriesGeometry)
        // Add a path for each country and color it according te this data.
        this.worldMap.append("g")
            .attr("id", "countries-mesh")
            .selectAll("path")
            .data((countries as FeatureCollection).features)
            .join("path")
            .attr("fill", this.canvas.visDirector.current_service_theme.geo_area_color)
            .attr("d", path)
            .attr("data-country-id", c => `${c.id}`)
            .attr("data-country-name", c => `${c.properties?.name}`)

        let countrymesh = mesh(world, countriesGeometry as GeometryObject, (a: GeometryObject, b: GeometryObject) => a !== b)
        // Add a white mesh.
        this.worldMap.append("path")
            .attr("id", "countries-border-mesh")
            .datum(countrymesh)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("d", path);

        return projection
    }

    public renderCurrentTheme(){
        if(this.canvas.visDirector.current_visualisation === Visualisation.listenTo){
            this.root.attr("opacity", "0")
        } else {
            this.root.attr("opacity", "1")
        }

        if (this.canvas.visDirector.current_service_theme.id_name == HatnoteVisService.Bloxberg) {
            this.worldMap.attr("opacity", 1)
            this.germanyMap.attr("opacity", 0)
        } else {
            this.worldMap.attr("opacity", 0)
            this.germanyMap.attr("opacity", 1)
        }

        // remove circles from other services
        this.circles_layer.removeOtherServiceCircles(this.canvas.visDirector.current_service_theme)
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, null, any> {
        return this.root.append(type)
    }
}