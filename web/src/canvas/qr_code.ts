import {Selection} from "d3";
import QrCodeMinerva from "../../assets/images/qr-code-minerva.png";
import {Canvas} from "./canvas";
import {ServiceTheme} from "../theme/model";

export class QRCode{
    private readonly root: Selection<SVGGElement, unknown, HTMLElement, any>;
    private readonly image: Selection<SVGImageElement, unknown, HTMLElement, any>;
    private readonly text: Selection<SVGTextElement, unknown, HTMLElement, any>;
    private readonly line1: Selection<SVGTSpanElement, unknown, HTMLElement, any>;
    private readonly line2: Selection<SVGTSpanElement, unknown, HTMLElement, any>;
    private readonly image_width = 100;
    private readonly image_right_padding = 50;
    private readonly text_color = '#5d7da1';
    private readonly canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas
        this.root = canvas.appendSVGElement('g').attr('id', 'qr_code')
        this.image = this.root.append('image')
            .attr('href', QrCodeMinerva)
            .attr('width', this.image_width)
        this.text = this.root.append('text')
            .attr('text-anchor', 'middle')
        this.line1 = this.text.append('tspan')
            .text('line1')
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', '12px')
            .attr('fill', this.text_color)
            .attr('text-anchor', 'middle')
        this.line2 = this.text.append('tspan')
            .text('line2')
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', '12px')
            .attr('fill', this.text_color)
            .attr('text-anchor', 'middle')

        this.setPosition()
    }

    public windowUpdate(){
        this.setPosition();
    }

    private setPosition(){
        this.image.attr('x', this.canvas.width - this.image_width - this.image_right_padding).attr('y', this.canvas.height - 165)
        let text_x: number = this.canvas.width - this.image_width/2 - this.image_right_padding;
        this.text.attr('x', text_x).attr('y', (this.canvas.height-50))
        this.line1.attr('x', text_x)
        this.line2.attr('x', text_x).attr('dy', 16)
    }

    public themeUpdate(currentServiceTheme: ServiceTheme) {
        this.image.attr('href', currentServiceTheme.qr_code.image)
        this.line1.text(currentServiceTheme.qr_code.line1)
        this.line2.text(currentServiceTheme.qr_code.line2)
    }
}