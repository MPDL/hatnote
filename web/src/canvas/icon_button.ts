import {Selection} from "d3";
import {Navigation} from "./navigation";
import leftIcon from "../../assets/images/navigate_before_FILL0_wght400_GRAD0_opsz24.svg";
import rightIcon from "../../assets/images/navigate_next_FILL0_wght400_GRAD0_opsz24.svg";
import infoIcon from "../../assets/images/question_mark_FILL0_wght400_GRAD0_opsz24.svg";
import closeIcon from "../../assets/images/close_FILL0_wght400_GRAD0_opsz24.svg";

export class IconButton {
    private readonly navigation: Navigation
    private readonly root: Selection<SVGGElement, unknown, HTMLElement, any>
    private readonly bg: Selection<SVGCircleElement, unknown, HTMLElement, any>
    private readonly image:  Selection<SVGImageElement, unknown, HTMLElement, any>
    private readonly circleRadius = 22

    constructor(navigation: Navigation, xPos: number, yPos: number, icon: string, functionString: string) {
        this.navigation = navigation;

        this.root = this.navigation.root.append('g')

        this.bg = this.root.append('circle')
            .attr('transform', 'translate(' + xPos + ', ' + yPos+ ')')
            .attr('r', this.circleRadius)
            .attr('stroke', this.navigation.canvas.theme.progress_indicator_fg_color)
            .attr('stroke-width', 4 )
            .attr('fill', '#fff')

        this.image = this.root.append('image')
            .attr('transform', 'translate(' + ((-this.circleRadius)+xPos) + ', ' + ((-this.circleRadius)+yPos) + ')')
            .attr('width', this.circleRadius * 2)
        this.setIcon(icon)

        // clickable area
        this.root.append('circle')
            .attr('transform', 'translate(' + xPos + ', ' + yPos+ ')')
            .attr('r', this.circleRadius)
            .attr('cursor', 'pointer')
            .attr('pointer-events', 'visible')
            .attr('fill', 'none')
            .attr('onclick', functionString)
    }

    private stringIconToSvg(icon: string){
        let iconSvg: any;
        switch (icon) {
            case 'left':
                iconSvg = leftIcon;
                break;
            case 'right':
                iconSvg = rightIcon;
                break;
            case 'info':
                iconSvg = infoIcon;
                break;
            case 'close':
                iconSvg = closeIcon;
                break;
        }

        return iconSvg;
    }

    public setIcon(icon: string){
        let iconSvg = this.stringIconToSvg(icon)
        this.image.attr('href', iconSvg)
    }
}