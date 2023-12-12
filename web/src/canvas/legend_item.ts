import {Selection} from "d3";
import {Header} from "./header";
import {ThemeLegendItem} from "../theme/model";

export class LegendItem{
    private readonly root: Selection<SVGGElement, unknown, HTMLElement, any>;
    private readonly title: Selection<SVGTextElement, unknown, HTMLElement, any>;
    private readonly smallTitle1: Selection<SVGTextElement, unknown, HTMLElement, any>;
    private readonly smallTitle2: Selection<SVGTextElement, unknown, HTMLElement, any>;
    private readonly circle: Selection<SVGCircleElement, unknown, HTMLElement, any>;
    private readonly header: Header;

    constructor(header: Header) {
        this.header = header;

        this.root = this.header.appendSVGElement('g')
            .attr('id', 'legend_items')
            .attr('opacity', 0)

        this.title = this.root.append('text')
            .text('legend item')
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', '26px')
            .attr('fill', header.canvas.theme.header_text_color)
            .attr('x', header.canvas.theme.legend_item_circle_r + 10)
            .attr('y', header.canvas.theme.header_height/2 + 8.5)
            .attr('opacity', 1)

        this.smallTitle1 = this.root.append('text')
            .text('legend item small1')
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', '16px')
            .attr('fill', header.canvas.theme.header_text_color)
            .attr('x', header.canvas.theme.legend_item_circle_r + 10)
            .attr('y', header.canvas.theme.header_height/2 - 4)
            .attr('opacity', 0)

        this.smallTitle2 = this.root.append('text')
            .text('legend item small2')
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', '16px')
            .attr('fill', header.canvas.theme.header_text_color)
            .attr('x', header.canvas.theme.legend_item_circle_r + 10)
            .attr('y', header.canvas.theme.header_height/2 + 13)
            .attr('opacity', 0)

        this.circle = this.root.append('circle')
            .attr('r', header.canvas.theme.legend_item_circle_r)
            .attr('cx', 0)
            .attr('cy', header.canvas.theme.header_height/2)
            .attr('fill', '#000') // default value
    }

    public hide(){
        this.root.attr('opacity', 0)
    }

    public themeUpdate(theme_legend_item: ThemeLegendItem) {
        this.root.attr('opacity', 1)
        let pos_x = theme_legend_item.position_x ?? theme_legend_item.position_x_small_title ?? 100
        this.root.attr('transform',
            'translate(' + (this.header.canvas.width - pos_x) + ', ' + 0 + ')')
        if(theme_legend_item.title === undefined){
            this.smallTitle1.text(theme_legend_item.smallTitle1 ?? 'not defined')
            this.smallTitle2.text(theme_legend_item.smallTitle2 ?? 'not defined')
            this.title.attr('opacity', 0)
            this.smallTitle1.attr('opacity', 1)
            this.smallTitle2.attr('opacity', 1)
        } else {
            this.title.text(theme_legend_item.title)
            this.title.attr('opacity', 1)
            this.smallTitle1.attr('opacity', 0)
            this.smallTitle2.attr('opacity', 0)
        }
        this.circle.attr('fill', this.header.canvas.theme.getThemeColor(theme_legend_item.event))
    }

    public windowUpdate(theme_legend_item: ThemeLegendItem) {
        let pos_x = theme_legend_item.position_x ?? theme_legend_item.position_x_small_title ?? 100
        this.root.attr('transform', 'translate(' + (this.header.canvas.width - pos_x) + ', ' + 0 + ')')
    }
}