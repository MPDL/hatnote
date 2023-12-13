import {Selection} from "d3";
import {Canvas} from "./canvas";

export class Navigation{
    public readonly canvas: Canvas;
    private readonly root: Selection<SVGGElement, unknown, HTMLElement, any>;
    private readonly backButton: IconButton;

    constructor(canvas: Canvas) {
        this.canvas = canvas

        this.root = canvas.appendSVGElement('g').attr('id', 'navigation')
            .attr('transform', 'translate(' + canvas.width/2 + ', ' + (canvas.height - 50) + ')')
            .attr('opacity', canvas.isMobileScreen ? 1 : 1);

        this.backButton = this.root.append('text')
        .text('legend item')
        .attr('font-family', 'HatnoteVisNormal')
        .attr('font-size', '26px')
        .attr('fill', header.canvas.theme.header_text_color)
        .attr('x', header.canvas.theme.legend_item_circle_r + 10)
        .attr('y', header.canvas.theme.header_height/2 + 8.5)
        .attr('opacity', 1)
    }
}