import {Selection} from "d3";
import {Canvas} from "./canvas";
import {ServiceTheme} from "../theme/model";
import {Circle} from "./circle";
import {CircleData} from "../observable/model";
import {HatnoteVisService, ServiceEvent} from "../service_event/model";

export class CirclesLayer{
    private readonly root: Selection<SVGGElement, unknown, HTMLElement, any>;
    private readonly service_circles: Map<HatnoteVisService, Circle[]>;
    public readonly canvas: Canvas

    constructor(canvas: Canvas) {
        this.canvas = canvas
        this.root = canvas.appendSVGElement('g').attr('id', 'circle_layer')
        this.service_circles = new Map<HatnoteVisService, Circle[]>([
            [HatnoteVisService.Minerva, []],
            [HatnoteVisService.Keeper, []],
            [HatnoteVisService.Bloxberg, []],
        ])
        canvas.newCircleSubject.subscribe({
            next: (value) => this.addCircle(value)
        })
    }

    public addCircle(circleData: CircleData) {
        let service = this.canvas.theme.getHatnoteService(circleData.type)

        if (isNaN(circleData.circle_radius) ||
            this.canvas.theme.current_service_theme?.id_name !== service){
            return
        }

        let circle = new Circle(this,circleData.type,circleData.label_text,circleData.circle_radius,
            (serviceEvent) => this.removeOldestCircle(serviceEvent))

        if(service !== undefined){
            let circles = this.service_circles.get(service)
            circles?.push(circle)

            if(this.canvas.settings.debug_mode){
                console.log('Circle added for ' + service)
                console.log(circles?.length + ' circles exist for service ' + service)
            }
        }
    }

    public removeOldestCircle(serviceEvent: ServiceEvent){
        let service = this.canvas.theme.getHatnoteService(serviceEvent)

        if(service !== undefined){
            // when adding to the end of the list we can delete the first entry if a circle has finished its animation
            let circles = this.service_circles.get(service)
            circles?.shift()

            if(this.canvas.settings.debug_mode){
                console.log('Circle removed for ' + service)
                console.log(circles?.length + ' circles exist for service ' + service)
            }
        }
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.root.append(type)
    }

    public removeOtherServiceCircles(currentServiceTheme: ServiceTheme) {
        for (let entry of this.service_circles.entries()) {
            if(entry[0] !== currentServiceTheme.id_name) {
                for (const entryKey of entry[1]) {
                    entryKey.remove(); // TODO maybe create a circle layer for each service and then select all remove
                }
                entry[1] = [];
            }
        }
    }
}