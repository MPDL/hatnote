import {Selection} from "d3";
import {Canvas} from "./canvas";
import QrCodeMinerva from "../../assets/images/volume_off_FILL1_wght400_GRAD0_opsz24.svg";

export class MuteIcon{
    private readonly root: Selection<SVGGElement, unknown, HTMLElement, any>;
    private readonly image: Selection<SVGImageElement, unknown, HTMLElement, any>;
    private readonly text: Selection<SVGTextElement, unknown, HTMLElement, any>;
    private readonly line1: Selection<SVGTSpanElement, unknown, HTMLElement, any>;
    private readonly background: Selection<SVGRectElement, unknown, HTMLElement, any>;
    private readonly image_width = 100;
    private readonly text_color = '#fff';
    private readonly canvas: Canvas;

    // consists not only of the icon but also spans a transparent clickable container above everything
    constructor(canvas: Canvas) {
        this.canvas = canvas
        this.root = canvas.appendSVGElement('g')
            .attr('id', 'qr_code')
            .attr('opacity', 0)
            .attr('cursor', 'auto')
            .attr('pointer-events','none')
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

        // needs to be added last so the click on this layer is not blocked by other elements
        this.background = this.root.append('rect')
            .attr('opacity', 0)
            .attr('width', this.canvas.width)
            .attr('height', this.canvas.height)
            .attr('id', 'mute_icon_background')

        this.setPosition()

        document.getElementById('mute_icon_background')?.addEventListener("click", (_) => {
            this.hide();
        });
    }

    public windowUpdate(){
        this.setPosition();
        this.background.attr('width', this.canvas.width)
        this.background.attr('height', this.canvas.height)
    }

    public show(){
        this.root.attr('opacity', 0.7).attr('cursor', 'pointer').attr('pointer-events','visiblePainted')
    }

    public hide(){
        this.root.attr('opacity', 0).attr('cursor', 'auto').attr('pointer-events','none')
    }

    private setPosition(){
        this.image.attr('x', this.canvas.width/2 - this.image_width/2).attr('y', this.canvas.height/2 - this.image_width)
        let text_x: number = this.canvas.width/2;
        this.text.attr('x', text_x).attr('y', (this.canvas.height/2 + 16))
        this.line1.attr('x', text_x)
    }
}