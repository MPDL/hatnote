import {CirclesLayer} from "./circles_layer";
import {HatnoteVisService} from "../../service_event/model";
import {BaseType, GeoProjection, select, Selection} from "d3";
import {CircleData} from "../../observable/model";

export class Circle{
    private readonly circlesLayer: CirclesLayer
    private readonly root:  Selection<SVGCircleElement, unknown, null, undefined>;

    constructor(circlesLayer: CirclesLayer, circleData: CircleData,
                svgCircle:  SVGCircleElement, projection: GeoProjection, service: HatnoteVisService) {
        this.circlesLayer = circlesLayer
        // init circle values
        this.root = select(svgCircle)
        const point = projection([circleData.location?.coordinate.long ?? 0, circleData.location?.coordinate.lat?? 0])
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
            .style('fill', this.circlesLayer.canvas.theme.getThemeColor(circleData.type))
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
                highlightedArea.interrupt()
                popUpContainer.remove();
                if(this.circlesLayer.canvas.settings.debug_mode){
                    console.log('Circle removed for ' + circleData.type)
                }
            })
            .remove()
            .each( _ => {
                if(this.circlesLayer.canvas.settings.debug_mode){
                    console.log('Circle removed for ' + circleData.type)
                }
            })

        let highlightedArea: Selection<BaseType, unknown, null, any>;
        // highlight region
        if(this.circlesLayer.canvas.theme.current_service_theme.id_name === HatnoteVisService.Bloxberg){
            highlightedArea = this.highlightCountry(circleData.location.countryId)
        } else {
            highlightedArea = this.highlightState(circleData.location.stateId)
        }

        // add pop up
        const popUpContainer = this.circlesLayer.canvas.appContainer.append("div");
        popUpContainer
            .style('position', 'absolute')
            .style('top', `${y - this.circlesLayer.canvas.theme.header_height + 10}px`)
            .style('left', `${x + 10}px`)
            .style('padding', '4px')
            .style('border-radius', '1px')
            .style('background-color', '#FFF')
            .style('box-shadow', '1px 1px 5px #CCC')
            .style('font-size', '.7em')
            .style('border', '1px solid #CCC')
        popUpContainer.append('span').text(circleData.label_text)

        popUpContainer.transition()
            .style('opacity', 0)
            .duration(4000)
            .remove()
    }

    private highlightCountry(countryId: string): Selection<BaseType, unknown, null, any> {
        let country = this.circlesLayer.canvas.root.select(`path[data-country-id="${countryId}"]`)
            .style('fill', '#eddc4e')
        country.transition()
            .duration(5000)
            .style('fill', '#ccc');
        return country
    };

    private highlightState(stateId: string): Selection<BaseType, unknown, null, any> {
        let country = this.circlesLayer.canvas.root.select(`path[data-state-id="${stateId}"]`)
            .style('fill', '#eddc4e')
        country.transition()
            .duration(5000)
            .style('fill', '#ccc');
        return country
    };
}