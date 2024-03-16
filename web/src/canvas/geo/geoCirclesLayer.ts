import {GeoProjection, Selection} from "d3";
import {ServiceTheme} from "../../theme/model";
import {CircleData} from "../../observable/model";
import {Canvas} from "../canvas";
import {ServiceEvent} from "../../service_event/model";
import {GeoCircle} from "./geoCircle";
import {GeoVisualisation} from "./geoVisualisation";

export class GeoCirclesLayer{
    private readonly root: Selection<SVGGElement, unknown, null, any>;
    public readonly geoVis: GeoVisualisation
    public readonly germanyProjection: GeoProjection
    public readonly worldProjection: GeoProjection
    private readonly rootId = "geo-vis-circle-layer"

    constructor(geoVis: GeoVisualisation, germanyProjection: GeoProjection, worldProjection: GeoProjection) {
        this.geoVis = geoVis
        this.germanyProjection = germanyProjection;
        this.worldProjection = worldProjection;
        this.root = geoVis.appendSVGElement('g').attr('id', this.rootId)
        geoVis.canvas.newCircleSubject.subscribe({
            next: (value) => this.addCircle(value)
        })
    }

    private addCircle(circle: CircleData){
        if(circle.location === undefined) {
            return;
        }

        let that = this;

        // make sure that circle that already exits a removed so that the animation can start from start
        this.root.selectAll('circle').data<CircleData>([circle], (d: any) => `${d.location.coordinate.lat}${d.location.coordinate.long}`).interrupt().remove()
        this.root.selectAll('circle').data<CircleData>([circle], (d: any) => `${d.location.coordinate.lat}${d.location.coordinate.long}`)
            .enter()
            .append('circle')
            .each(function (circleData, _) {
                let service = that.geoVis.canvas.visDirector.getHatnoteService(circleData.type)
                if (that.geoVis.canvas.visDirector.current_service_theme?.id_name !== service){
                    return
                }

                new GeoCircle(that,circleData,
                    this, service)
            })
    }

    public removeOtherServiceCircles(currentServiceTheme: ServiceTheme) {
        for (let serviceTheme of this.geoVis.canvas.visDirector.service_themes.values()) {
            if(serviceTheme.id_name !== currentServiceTheme.id_name) {
                this.root.select(`circle[data-hatnote-service-name="${serviceTheme.id_name}"]`).interrupt().remove()
            }
        }
        let circleLayer = document.getElementById(this.rootId);
        circleLayer?.replaceChildren()
        this.geoVis.canvas.geoPopUpContainer.selectChildren().remove()
    }
}