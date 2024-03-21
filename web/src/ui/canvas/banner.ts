import {Selection} from "d3";
import {BannerLayer} from "./banner_layer";
import {BannerData} from "../../observable/model";

export class Banner{
    private readonly bannerLayer: BannerLayer
    private readonly root: Selection<SVGGElement, unknown, null, any>;
    private readonly user_container: Selection<SVGGElement, unknown, null, any>
    private readonly text: Selection<SVGTextElement, unknown, null, any>
    constructor(bannerLayer: BannerLayer, bannerData: BannerData) {
        this.bannerLayer = bannerLayer

        this.root = bannerLayer.appendSVGElement('g')
            .attr('transform', 'translate(0, 0');

        this.user_container = this.root.append('g')

        this.root.transition()
            .delay(7000)
            .on('end', () => {
                bannerLayer.removeBanner()
            })

        this.user_container .transition()
            .delay(4000)
            .style('opacity', 0)
            .duration(3000);

        this.user_container.append('rect')
            .attr('opacity', 0)
            .attr('fill', bannerLayer.canvas.visDirector.getThemeColor(bannerData.serviceEvent))
            .attr('width', bannerLayer.canvas.width)
            .attr('height', 35)
            .transition()
            .delay(100)
            .duration(3000)
            .attr('opacity', 1);


        let x = bannerLayer.canvas.width / 2;

        this.text = this.user_container.append('text')
            .attr('font-family', 'HatnoteVisNormal')
            .attr('font-size', '16px')
            .attr('fill', '#fff')
            .attr('transform', 'translate(' + x +', 25)')
            .attr('text-anchor', 'middle')
            .attr('opacity', 0)
            .text(bannerData.message);
        this.text.transition()
            .delay(1500)
            .duration(1000)
            .attr('opacity', 1)
    }

    public remove(){
        this.root.remove()
    }

    public windowUpdate(){
        this.root.attr('width', this.bannerLayer.canvas.width)
        this.text.attr('transform', 'translate(' + this.bannerLayer.canvas.width/2 +', 25)')
    }
}