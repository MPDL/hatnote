import {GeoProjection, Selection} from "d3";
import {ServiceTheme} from "../../theme/model";
import {Circle} from "./circle";
import {CircleData} from "../../observable/model";
import {Canvas} from "../canvas";
import {ServiceEvent} from "../../service_event/model";

export class CirclesLayer{
    private readonly root: Selection<SVGGElement, unknown, null, any>;
    public readonly canvas: Canvas
    public readonly projection: GeoProjection

    constructor(canvas: Canvas, projection: GeoProjection) {
        this.canvas = canvas
        this.projection = projection
        this.root = canvas.appendSVGElement('g').attr('id', 'circle_layer')
        canvas.newCircleSubject.subscribe({
            next: (value) => this.addCircle(value, this.projection)
        })
    }

    private addCircle(circle: CircleData, projection: GeoProjection){
        let that = this;

        // make sure that circle that already exits a removed so that the animation can start from start
        this.root.selectAll('circle').data<CircleData>([circle], (d: any) => `${d.location.coordinate.lat}${d.location.coordinate.long}`).interrupt().remove()
        this.root.selectAll('circle').data<CircleData>([circle], (d: any) => `${d.location.coordinate.lat}${d.location.coordinate.long}`)
            .enter()
            .append('circle')
            .each(function (circleData, _) {
                let service = that.canvas.theme.getHatnoteService(circleData.type)
                if (that.canvas.theme.current_service_theme?.id_name !== service){
                    return
                }

                new Circle(that,circleData,
                    this, that.projection, service)
            })
    }

    public removeOtherServiceCircles(currentServiceTheme: ServiceTheme) {
        for (let serviceTheme of this.canvas.theme.service_themes.values()) {
            if(serviceTheme.id_name !== currentServiceTheme.id_name) {
                this.root.select(`circle[data-hatnote-service-name="${serviceTheme.id_name}"]`).interrupt().remove()
            }
        }
    }
}