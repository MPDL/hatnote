import {Selection} from "d3";
import {ServiceTheme} from "../../theme/model";
import {CircleData} from "../../observable/model";
import {HatnoteVisService, ServiceEvent} from "../../service_event/model";
import {Canvas} from "../canvas";
import {ListenToVisualisation} from "./listenToVisualisation";
import {ListenToCircle} from "./listenToCircle";

export class ListenToCirclesLayer{
    private readonly root: Selection<SVGGElement, unknown, null, any>;
    private readonly service_circles: Map<HatnoteVisService, ListenToCircle[]>;
    public readonly listenToVisualisation: ListenToVisualisation
    public readonly canvas: Canvas

    constructor(listenToVisualisation: ListenToVisualisation) {
        this.listenToVisualisation = listenToVisualisation
        this.canvas = this.listenToVisualisation.canvas
            this.root = this.listenToVisualisation.appendSVGElement('g').attr('id', 'listen-to-circle-layer')
        this.service_circles = new Map<HatnoteVisService, ListenToCircle[]>([
            [HatnoteVisService.Minerva, []],
            [HatnoteVisService.Keeper, []],
            [HatnoteVisService.Bloxberg, []],
        ])
        this.canvas.newCircleSubject.subscribe({
            next: (value) => this.addCircle(value)
        })
    }

    public addCircle(circleData: CircleData) {
        let service = this.canvas.visDirector.getHatnoteService(circleData.type)

        if (isNaN(circleData.circle_radius) ||
            this.canvas.visDirector.current_service_theme?.id_name !== service){
            return
        }

        let circle = new ListenToCircle(this,circleData.type,circleData.label_text,circleData.circle_radius,
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
        let service = this.canvas.visDirector.getHatnoteService(serviceEvent)

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

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, null, any> {
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