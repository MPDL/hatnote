import {Selection} from "d3";
import {IconButton} from "./icon_button";
import {Canvas} from "./canvas";

export class Navigation{
    public readonly canvas: Canvas;
    public readonly root: Selection<SVGGElement, unknown, null, any>;
    private readonly backButton: IconButton;
    private readonly nextButton: IconButton;
    private readonly infoButton: IconButton;
    private isInfoBoxOpen: boolean;
    private readonly navigationWidth = 270;
    private currentServiceIndex = 0;

    constructor(canvas: Canvas) {
        this.canvas = canvas

        this.root = canvas.appendSVGElement('g').attr('id', 'navigation')
            .attr('opacity', canvas.visDirector.isMobileScreen ? 1 : 0);
        this.setPosition()
        this.isInfoBoxOpen = false

        this.backButton = new IconButton(this, 0, 0, 'left', 'hatnoteLastService()');
        this.nextButton = new IconButton(this, this.navigationWidth, 0, 'right', 'hatnoteNextService()');
        this.infoButton = new IconButton(this, this.navigationWidth/2, 0, 'info', 'hatnoteInfoButton()');

        // @ts-ignore
        window.hatnoteNextService = () => this.nextService(this);
        // @ts-ignore
        window.hatnoteLastService = () => this.lastService(this);
        // @ts-ignore
        window.hatnoteInfoButton = () => this.clickInfoButton(this);
    }

    private setPosition(){
        this.root.attr('transform', 'translate(' + (this.canvas.width/2 - this.navigationWidth/2) + ', ' + (this.canvas.height - 50) + ')')
    }

    private nextService(nav: Navigation){
        nav.currentServiceIndex = (nav.currentServiceIndex + 1) % nav.canvas.visDirector.carousel_service_order.length
        nav.changeTheme()
    }

    private lastService(nav: Navigation){
        nav.currentServiceIndex = (nav.currentServiceIndex - 1)
        if (nav.currentServiceIndex < 0 ){
            nav.currentServiceIndex = 2
        }
        nav.changeTheme()
    }

    private clickInfoButton(nav: Navigation){
        if(nav.isInfoBoxOpen){
            this.canvas.showLegendInfoboxSubject.next(false)
            nav.infoButton.setIcon('info')
            nav.isInfoBoxOpen = false
        } else {
            this.canvas.showLegendInfoboxSubject.next(true)
            nav.infoButton.setIcon('close')
            nav.isInfoBoxOpen = true
        }
    }

    private changeTheme(){
        let nextService = this.canvas.visDirector.carousel_service_order[this.currentServiceIndex]
        this.canvas.visDirector.set_current_theme(nextService);
        this.canvas.renderCurrentTheme()
        this.canvas.onThemeHasChanged.next(
            [this.canvas.visDirector.current_service_theme.id_name, this.canvas.visDirector.current_visualisation])
    }

    public windowUpdate() {
        this.setPosition()
    }
}