import {HatnoteVisService} from "../../service_event/model";
import {BaseType, select, Selection} from "d3";
import {CircleData} from "../../observable/model";
import {GeoCirclesLayer} from "./geoCirclesLayer";
import {Canvas} from "../canvas";

export class GeoCircle {
    private readonly circlesLayer: GeoCirclesLayer
    private readonly root:  Selection<SVGCircleElement, unknown, null, undefined>;
    private readonly canvas: Canvas;
    private readonly areaColor = '#ccc';

    constructor(circlesLayer: GeoCirclesLayer, circleData: CircleData,
                svgCircle:  SVGCircleElement, service: HatnoteVisService) {
        this.circlesLayer = circlesLayer
        this.canvas = this.circlesLayer.geoVis.canvas
        // init circle values
        this.root = select(svgCircle)
        let point;
        if(this.canvas.visDirector.current_service_theme.id_name === HatnoteVisService.Bloxberg){
            point = this.circlesLayer.worldProjection([circleData.location?.coordinate.long ?? 0, circleData.location?.coordinate.lat?? 0])
        } else {
            point = this.circlesLayer.germanyProjection([circleData.location?.coordinate.long ?? 0, circleData.location?.coordinate.lat?? 0])
        }
        if(point === null || circleData.location === undefined){
            return
        }
        const x = point[0]
        const y = point[1]

        // define circle
        this.root
            .attr('cx', x)
            .attr('cy', y)
            .attr("data-hatnote-event-type", circleData.type)
            .attr("data-hatnote-service-name", service)
            .style('fill', this.canvas.visDirector.getThemeColor(circleData.type))
            .attr('fill-opacity', 0.75)
            .attr('r', 0)
            .transition()
            .duration(400)
            .attr('r', circleData.circle_radius)
            .transition()
            .attr('fill-opacity', 0)
            .attr('r', 10)
            .duration(40000)
            .on('interrupt', _ => {
                highlightedArea.interrupt();
                popUp.remove();
                if(this.canvas.settings.debug_mode){
                    console.log('Circle removed for ' + circleData.type)
                }
            })
            .remove()
            .each( _ => {
                if(this.canvas.settings.debug_mode){
                    console.log('Circle removed for ' + circleData.type)
                }
            })

        let highlightedArea: Selection<BaseType, unknown, null, any>;
        // highlight region
        if(this.canvas.visDirector.current_service_theme.id_name === HatnoteVisService.Bloxberg){
            highlightedArea = this.highlightCountry(circleData.location.countryId)
        } else {
            highlightedArea = this.highlightState(circleData.location.stateId)
        }

        // add pop up
        const popUp = this.canvas.geoPopUpContainer.append("div");
        popUp
            .style('position', 'absolute')
            .style('top', `${y + 10}px`)
            .style('left', `${x + 10}px`)
            .style('padding', '4px')
            .style('border-radius', '1px')
            .style('background-color', '#FFF')
            .style('box-shadow', '1px 1px 5px #CCC')
            .style('font-size', '.7em')
            .style('border', '1px solid #CCC')
        popUp.append('span').text(circleData.label_text)

        popUp.transition()
            .style('opacity', 0)
            .duration(4000)
            .remove()
    }

    private highlightCountry(countryId: string): Selection<BaseType, unknown, null, any> {
        let country = this.canvas.root.select(`path[data-country-id="${countryId}"]`)
            .style('fill', this.canvas.visDirector.current_service_theme.geo_area_highlight_color)
        country.transition()
            .duration(5000)
            .style('fill', this.canvas.visDirector.current_service_theme.geo_area_color)
        return country
    };

    private highlightState(stateId: string): Selection<BaseType, unknown, null, any> {
        let country = this.canvas.root.select(`path[data-state-id="${stateId}"]`)
            .style('fill', this.canvas.visDirector.current_service_theme.geo_area_highlight_color)
        country.transition()
            .duration(5000)
            .style('fill', this.canvas.visDirector.current_service_theme.geo_area_color)
        return country
    };
}