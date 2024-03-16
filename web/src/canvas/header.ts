import {Selection} from "d3";
import MinervaLogo from "../../assets/images/minervamessenger-banner-kussmund+bulb.png";
import {LegendItem} from "./legend_item";
import {ServiceTheme, Visualisation} from "../theme/model";
import {environmentVariables} from "../configuration/environment";
import {Canvas} from "./canvas";

export class Header{
    public readonly canvas: Canvas;
    private readonly root: Selection<SVGGElement, unknown, null, any>
    private readonly background_rect: Selection<SVGRectElement, unknown, null, any>
    private readonly title: Selection<SVGTextElement, unknown, null, any>
    private readonly title0: Selection<SVGTextElement, unknown, null, any>
    private readonly logo: Selection<SVGImageElement, unknown, null, any>
    private readonly updateBox: Selection<SVGRectElement, unknown, null, any>
    private readonly updateText: Selection<SVGTextElement, unknown, null, any>
    private readonly legend_items: LegendItem[] = [];

    constructor(canvas: Canvas) {
        this.canvas = canvas;

        this.root = canvas.appendSVGElement('g')
            .attr('id', 'header')
            .attr('transform', 'translate(0, 0)')
            .style('opacity', 1.0)

        this.background_rect = this.root.append('rect')
            .attr('width', canvas.width)
            .attr('height', canvas.visDirector.hatnoteTheme.header_height)
            .attr('fill', canvas.visDirector.hatnoteTheme.header_bg_color)

        this.logo = this.root.append('image')
            .attr('x', 10).attr('y', 4)
            .attr('href', MinervaLogo)
            .attr('width', 44)

        this.title = this.root.append('text')
            .text('Hatnote title')
            .attr('font-family', 'HatnoteVisBold')
            .attr('font-size', this.canvas.isMobileScreen ? '22px' : '32px')
            .attr('fill', canvas.visDirector.hatnoteTheme.header_text_color)
            .attr('x', this.canvas.isMobileScreen ? 174 : 224).attr('y', canvas.visDirector.hatnoteTheme.header_height/2 + 8.5)

        this.title0 = this.root.append('text')
            .text(this.canvas.visDirector.current_visualisation === Visualisation.listenTo ? 'Listen to' : 'Locate')
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', this.canvas.isMobileScreen ? '22px' : '32px')
            .attr('fill', canvas.visDirector.hatnoteTheme.header_text_color)
            .attr('x', 70).attr('y', canvas.visDirector.hatnoteTheme.header_height/2 + 8.5)

        this.updateBox = this.root.append('rect')
            .attr('opacity', 0)
            .attr('transform', `translate(${canvas.width/2 - 95}, 8)`)
            .attr('width', '190')
            .attr('height', '30')
            .attr('rx', 7)
            .attr('ry', 7)
            .attr('fill', this.canvas.visDirector.hatnoteTheme.header_version_update_bg)

        this.updateText = this.root.append('text')
            .attr('opacity', 0)
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${canvas.width/2}, 28)`)
            .text('New update available')
            .attr('font-family', 'HatnoteVisBold')
            .attr('font-size', '16px')
            .attr('fill', '#fff')

        if(!this.canvas.isMobileScreen){
            for (let i = 0; i < 3; i++) {
                this.legend_items.push(new LegendItem(this, undefined, this.canvas))
            }
        }

        canvas.updateVersionSubject.subscribe({
            next: (versions) => this.updateVersionNumbers(versions)
        })
    }

    private updateVersionNumbers(versions: [string, number]){
        let expectedFrontendVersion = versions[1]
        let browserFrontendVersion: number = Number(environmentVariables.version);
        if (!isNaN(browserFrontendVersion) && browserFrontendVersion < expectedFrontendVersion) {
            this.updateBox.attr('opacity', 1)
            this.updateText.attr('opacity', 1)
        } else {
            this.updateBox.attr('opacity', 0)
            this.updateText.attr('opacity', 0)
        }
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, null, any> {
        return this.root.append(type)
    }

    private clearLegendItems(){
        this.legend_items.forEach((theme_legend_item, i) => {
            this.legend_items[i].hide()
        });
    }

    public themeUpdate(currentServiceTheme: ServiceTheme) {
        this.logo.attr('href', currentServiceTheme.header_logo)
        this.logo.attr('y', currentServiceTheme.header_y)

        this.title.text(currentServiceTheme.header_title)
        this.title0.text(this.canvas.visDirector.current_visualisation === Visualisation.listenTo ? 'Listen to' : 'Locate')

        // update legend items
        this.clearLegendItems()
        currentServiceTheme.legend_items.forEach((theme_legend_item, i) => {
            if(i < this.legend_items.length) {
                this.legend_items[i].themeUpdate(theme_legend_item)
            }
        });
    }

    public windowUpdate() {
        this.background_rect.attr("width", this.canvas.width);

        this.updateBox.attr('transform', `translate(${this.canvas.width/2 - 95}, 8)`)
        this.updateText.attr('transform', `translate(${this.canvas.width/2}, 28)`)

        this.canvas.visDirector.current_service_theme.legend_items.forEach((theme_legend_item, i) => {
            if(i < this.legend_items.length) {
                this.legend_items[i].windowUpdate(theme_legend_item)
            }
        });
    }
}