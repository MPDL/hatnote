import {Selection} from "d3";
import MuteIconSVG from "../../assets/images/volume_off_FILL1_wght400_GRAD0_opsz24.svg";

export class MuteIcon{
    private readonly root: Selection<HTMLDivElement, unknown, null, undefined>;
    private readonly muteIconContainer: Selection<HTMLDivElement, unknown, null, undefined>;
    private readonly image: Selection<HTMLImageElement, unknown, null, undefined>
    private readonly text: Selection<HTMLSpanElement, unknown, null, undefined>;
    private readonly image_width = 100;
    private readonly text_color = '#fff';

    // consists not only of the icon but also spans a transparent clickable container above everything
    constructor(appContainer: Selection<HTMLDivElement, unknown, null, undefined>) {
        this.root = appContainer.append('div')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .style('cursor', 'auto')
            .style('width', '100%')
            .style('height', '100%')
            .attr('id', 'mute_icon')
            .style('pointer-events','none')

        this.muteIconContainer = this.root.append('div')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('pointer-events','none')
            .style('position','absolute')
            .style('left','50%')
            .style('top','50%')
            .style('transform','translate(-50%,-50%)')

        this.image =  this.muteIconContainer.append('img')
            .attr('src', MuteIconSVG)
            .style('width', `${this.image_width}px`)

        this.text = this.muteIconContainer.append('span')
            .text('Click here to unmute')
            .style('font-family', 'HatnoteVisNormal')
            .style('font-size', '12px')
            .style('color', this.text_color)

        document.getElementById('mute_icon')?.addEventListener("click", (_) => {
            this.hide();
        });
    }

    public show(){
        this.root.style('opacity', 0.7).style('cursor', 'pointer').style('pointer-events','visiblePainted')
    }

    public hide(){
        this.root.style('opacity', 0).style('cursor', 'auto').style('pointer-events','none')
    }

}