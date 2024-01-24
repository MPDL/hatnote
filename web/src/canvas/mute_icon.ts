import {Selection} from "d3";
import {Canvas} from "./canvas";
import QrCodeMinerva from "../../assets/images/volume_off_FILL1_wght400_GRAD0_opsz24.svg";

export class MuteIcon{
    private readonly root: Selection<SVGGElement, unknown, HTMLElement, any>;
    private readonly image: Selection<SVGImageElement, unknown, HTMLElement, any>;
    private readonly text: Selection<SVGTextElement, unknown, HTMLElement, any>;
    private readonly line1: Selection<SVGTSpanElement, unknown, HTMLElement, any>;
    private readonly image_width = 100;
    private readonly text_color = '#fff';
    private readonly canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas
        this.root = canvas.appendSVGElement('g')
            .attr('id', 'qr_code')
            .attr('opacity', 0)
            .attr('cursor', 'auto')
            .attr('id', 'mute_icon')
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
        this.line1.text('Click here to unmute')

        this.setPosition()

        document.getElementById('mute_icon')?.addEventListener("click", (_) => {
            this.hide();
        });
    }

    public windowUpdate(){
        this.setPosition();
    }

    public show(){
        this.root.attr('opacity', 0.7).attr('cursor', 'pointer')
    }

    public hide(){
        this.root.attr('opacity', 0).attr('cursor', 'auto')
    }

    private setPosition(){
        this.image.attr('x', this.canvas.width/2 - this.image_width/2).attr('y', this.canvas.height/2 - this.image_width)
        let text_x: number = this.canvas.width/2;
        this.text.attr('x', text_x).attr('y', (this.canvas.height/2 + 16))
        this.line1.attr('x', text_x)
    }
}