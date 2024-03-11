import {Selection} from "d3";
import {ListenToCanvas} from "./listen/listenToCanvas";
import {IconButton} from "./icon_button";
import {ServiceTheme} from "../theme/model";
import {LegendItem} from "./legend_item";
import {InfoboxType} from "./info_box";

export class Navigation{
    public readonly canvas: ListenToCanvas;
    public readonly root: Selection<SVGGElement, unknown, null, any>;
    private readonly backButton: IconButton;
    private readonly nextButton: IconButton;
    private readonly infoButton: IconButton;
    private isInfoBoxOpen: boolean;
    private readonly navigationWidth = 270;
    private currentServiceIndex = 0;
    private readonly legend_items: LegendItem[] = [];

    constructor(canvas: ListenToCanvas) {
        this.canvas = canvas

        this.root = canvas.appendSVGElement('g').attr('id', 'navigation')
            .attr('opacity', canvas.isMobileScreen ? 1 : 0);
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

        if(this.canvas.isMobileScreen){
            for (let i = 0; i < 3; i++) {
                this.legend_items.push(new LegendItem(undefined, this.canvas.info_box_legend, this.canvas))
            }
        }
    }

    private setPosition(){
        this.root.attr('transform', 'translate(' + (this.canvas.width/2 - this.navigationWidth/2) + ', ' + (this.canvas.height - 50) + ')')
    }

    private nextService(nav: Navigation){
        nav.currentServiceIndex = (nav.currentServiceIndex + 1) % nav.canvas.theme.carousel_service_order.length
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
            this.canvas.info_box_legend.show(InfoboxType.legend, false)
            nav.infoButton.setIcon('info')
            nav.isInfoBoxOpen = false
        } else {
            this.canvas.info_box_legend.show(InfoboxType.legend, true)
            nav.infoButton.setIcon('close')
            nav.isInfoBoxOpen = true
        }
    }

    private changeTheme(){
        let nextService = this.canvas.theme.carousel_service_order[this.currentServiceIndex]
        this.canvas.theme.set_current_theme(nextService);
        this.canvas.renderCurrentTheme()
        this.canvas.hatnoteVisServiceChangedSubject.next(this.canvas.theme.current_service_theme.id_name)
    }

    private clearLegendItems(){
        this.legend_items.forEach((theme_legend_item, i) => {
            this.legend_items[i].hide()
        });
    }

    public themeUpdate(currentServiceTheme: ServiceTheme) {
        this.clearLegendItems()
        currentServiceTheme.legend_items.forEach((theme_legend_item, i) => {
            if(i < this.legend_items.length) {
                this.legend_items[i].themeUpdate(theme_legend_item)
            }
        });
    }

    public windowUpdate() {
        this.setPosition()

        this.canvas.theme.current_service_theme.legend_items.forEach((theme_legend_item, i) => {
            if(i < this.legend_items.length) {
                this.legend_items[i].windowUpdate(theme_legend_item)
            }
        });
    }
}