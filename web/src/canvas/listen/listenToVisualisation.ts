import {Selection} from "d3";
import '../../style/normalize.css';
import '../../style/main.css';
import {Canvas} from "../canvas";
import {ListenToCirclesLayer} from "./listenToCirclesLayer";
import {Visualisation} from "../../theme/model";

export class ListenToVisualisation {
    public readonly circles_layer: ListenToCirclesLayer;
    protected readonly root: Selection<SVGGElement, unknown, null, any>;
    public readonly canvas: Canvas;

    constructor(canvas: Canvas){
        this.canvas = canvas;

        this.root = canvas.appendSVGElement('g').attr("id", "liston-to-visualisation")

        // draw order matters in this function. Do not change without checking the result.
        this.root
            .attr('fill', this.canvas.visDirector.hatnoteTheme.svg_background_color)
            .style('background-color', '#1c2733');

        this.circles_layer = new ListenToCirclesLayer(this)

    }

    public renderCurrentTheme(){
        if(this.canvas.visDirector.current_visualisation === Visualisation.geo){
            this.root.attr("opacity", "0")
        } else {
            this.root.attr("opacity", "1")
        }

        this.circles_layer.removeOtherServiceCircles(this.canvas.visDirector.current_service_theme)
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, null, any> {
        return this.root.append(type)
    }
}