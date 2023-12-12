import {Selection} from "d3";
import {CirclesLayer} from "./circles_layer";
import {ServiceEvent} from "../service_event/model";
import {getRandomIntInclusive} from "../util/random";

export class Circle{
    private readonly circlesLayer: CirclesLayer
    private readonly root: Selection<SVGGElement, unknown, HTMLElement, any>;
    private readonly ring: Selection<SVGCircleElement, unknown, HTMLElement, any>
    private readonly circle_container: Selection<SVGGElement, unknown, HTMLElement, any>
    private readonly circle: Selection<SVGCircleElement, unknown, HTMLElement, any>
    private text: Selection<SVGTextElement, unknown, HTMLElement, any>
    private no_label = false;
    private titleColor = '#fff'

    constructor(circlesLayer: CirclesLayer, type: ServiceEvent, label_text: string, circle_radius: number, removeCircle: (serviceEvent: ServiceEvent) => void) {
        this.circlesLayer = circlesLayer

        // Otherwise the same label text will reset the seed to the same value which results in Math.random() returning the same number over and over
        //Math.seedrandom(label_text + Date.now())
        // give circle spawn a padding of 20
        let x = getRandomIntInclusive(20, circlesLayer.canvas.width - 20);
        let y = getRandomIntInclusive(20 + circlesLayer.canvas.theme.header_height, circlesLayer.canvas.height - 20) ;

        this.root = circlesLayer.appendSVGElement('g')
            .attr('transform', 'translate(' + x + ', ' + y + ')')
            .attr('fill', circlesLayer.canvas.theme.circle_wave_color)
            .style('opacity', 1.0)

        this.ring = this.root.append('circle')
            .attr('r', circle_radius + 20)
            .attr('stroke', 'none')
            .style('opacity', this.circlesLayer.canvas.settings.circle_start_opacity)
        this.ring.transition()
            .attr('r', circle_radius + 40)
            .style('opacity', 0)
            .ease(Math.sqrt)
            .duration(2500)
            .remove();

        this.circle_container = this.root.append('g')

        this.circle = this.circle_container.append('circle')
            .attr('fill', this.circlesLayer.canvas.theme.getThemeColor(type))
            .attr('r', circle_radius)
            .style('opacity', this.circlesLayer.canvas.settings.circle_start_opacity)
        this.circle.transition()
            .duration(this.circlesLayer.canvas.settings.max_life)
            .style('opacity', 0)
            .on('end', () => {
                this.root.remove();
                removeCircle(type)
            })

        // set text color to black for better readability
        if(type === ServiceEvent.minerva_private_message) {
            this.titleColor = '#000'
        }
        let thisCircle = this;
        this.circle_container.on('mouseover', function () {
            if (thisCircle.no_label) {
                thisCircle.no_label = false;
                thisCircle.text = thisCircle.circle_container.append('text')
                    .text(label_text)
                    .attr('font-family', 'HatnoteVisNormal')
                    .attr('font-size', '16px')
                    .attr('fill', thisCircle.titleColor)
                    // .attr('stroke', 'rgb(28, 39, 51)')
                    // .attr('stroke-align', 'outer')
                    // .attr('stroke-width', '1')
                    // .style('text-shadow', '-2px 0 rgb(28, 39, 51), 0 2px rgb(28, 39, 51), 2px 0 rgb(28, 39, 51), 0 -2px rgb(28, 39, 51);')
                    .attr('text-anchor', 'middle');
                thisCircle.text .transition()
                    .delay(1000)
                    .style('opacity', 0)
                    .duration(2000)
                    .on('end', ()=> {
                        thisCircle.no_label = true;
                    })
                    .remove();
            }

        });

        this.text = this.circle_container.append('text')
            .text(label_text)
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', '16px')
            .attr('fill', this.titleColor)
            // .attr('stroke', 'rgb(28, 39, 51)')
            // .attr('stroke-align', 'outer')
            // .attr('stroke-width', '1')
            // .style('text-shadow', '-2px 0 rgb(28, 39, 51), 0 2px rgb(28, 39, 51), 2px 0 rgb(28, 39, 51), 0 -2px rgb(28, 39, 51);')
            .attr('text-anchor', 'middle')
        this.text.transition()
            .delay(1000)
            .style('opacity', 0)
            .duration(2000)
            .on('end', ()=> {
                this.no_label = true;
            })
            .remove();
    }

    public remove(){
        this.root.remove()
    }
}