import {easeBackOut, easeCircleOut, easeCubicOut, easeExpOut, easeQuadOut, select, Selection} from "d3";
import MpdlLogo from "../../assets/images/logo-mpdl-twocolor-dark-var1.png";
import {ServiceTheme} from "../theme/model";
import {HatnoteVisService} from "../service_event/model";
import {Subject} from "rxjs";
import {VisualisationDirector} from "../theme/visualisationDirector";

export class Transition{
    private readonly root: Selection<SVGSVGElement, unknown, null, undefined>;
    private readonly circle3: Selection<SVGCircleElement, unknown, null, any>;
    private readonly circle2: Selection<SVGCircleElement, unknown, null, any>;
    private readonly circle1: Selection<SVGCircleElement, unknown, null, any>;
    private readonly circles_path: Selection<SVGPathElement, unknown, null, any>;
    private readonly mask:  Selection<SVGMaskElement, unknown, null, any>;
    private readonly mask_circle:  Selection<SVGCircleElement, unknown, null, any>;
    private readonly transition_screen: Selection<SVGGElement, unknown, null, any>;
    private readonly background:  Selection<SVGRectElement, unknown, null, any>;
    private readonly mpdl_logo:  Selection<SVGImageElement, unknown, null, any>;
    private readonly text: Selection<SVGTextElement, unknown, null, any>;
    private readonly service_logo: Selection<SVGImageElement, unknown, null, any>;
    public readonly onTransitionStart: Subject<void>
    public readonly onTransitionMid: Subject<void>
    public readonly onTransitionEnd: Subject<void>
    private visDirector: VisualisationDirector

    constructor(appContainer: Selection<HTMLDivElement, unknown, null, undefined>, visDirector: VisualisationDirector) {
        this.visDirector = visDirector;
        this.root = appContainer.append("svg")
            .attr("width", this.visDirector.windowWidth)
            .attr("height", this.visDirector.windowHeight)
            .attr('id', 'transition_layer')
            .attr('opacity', 0)
            .style('pointer-events','none')
            .style('position', 'absolute')
            .style('top', 0)

        // you could do it also with data points https://gist.github.com/mbostock/1705868
        this.circles_path  = this.root.append('path').attr('opacity', 0)

        this.circle3 = this.root.append('circle').attr('stroke', 'none')
        this.circle2 = this.root.append('circle').attr('stroke', 'none')
        this.circle1 = this.root.append('circle').attr('stroke', 'none')

        this.mask = this.root.append('mask').attr('id', 'myMask')
        this.mask.append('rect').attr('fill', 'black')

        this.mask_circle = this.mask.append('circle')
            .attr('fill', 'white')
            .attr('stroke', 'none')

        this.transition_screen = this.root.append('g')
            .attr('mask', 'url(#myMask)')

        this.background = this.transition_screen.append('rect')
            .attr('fill', 'white')

        this.mpdl_logo = this.transition_screen.append('image')
            .attr('href', MpdlLogo)

        this.text = this.transition_screen.append('text')
            .attr('font-family', 'HatnoteVisBold')
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text('Next service:')

        this.service_logo = this.transition_screen.append('image')

        this.onTransitionStart = new Subject()
        this.onTransitionMid = new Subject()
        this.onTransitionEnd= new Subject()
    }

    startTransition(service: ServiceTheme, delay:number = 0,
                    in_duration: number = 2500, active_duration: number = 4000, out_duration: number = 1500){
        this.onTransitionStart.next()
        this.root.attr('opacity', 1)

        this.circles_path.attr('d', 'M' + this.visDirector.windowWidth/2  + ' ' + this.visDirector.windowHeight/2  + '  Q40 ' + ((this.visDirector.windowHeight/2)+100) +' ,-10 -40')

        let circle_radius = Math.sqrt(Math.pow(this.visDirector.windowWidth/2, 2) + Math.pow(this.visDirector.windowHeight/2, 2))

        let circle3_color: string = service.color3
        switch (service.id_name) {
            case HatnoteVisService.Minerva:
                circle3_color = service.color2
                break
            case HatnoteVisService.Keeper:
                circle3_color = service.color3
        }

        this.circle3.attr('fill', circle3_color)
            .attr('transform', 'translate(' + this.visDirector.windowWidth/2 + ', ' + this.visDirector.windowHeight/2 + ')')
            .attr('r', 40)
            .attr('opacity', 0)
            .transition()
            .delay(delay)
            .attr('opacity', 1)
            .duration(0)
            .transition()
            .attr('r', circle_radius + 60)
            .ease(easeCircleOut)
            .duration(in_duration+250)
            .transition()
            .delay(active_duration)
            .attrTween("transform", this.translateAlong(this.circles_path.node()))
            .attr('r', 0)
            .ease(easeExpOut)
            .duration(out_duration+120)

        let circle2_color: string = service.color2
        switch (service.id_name) {
            case HatnoteVisService.Minerva:
                circle2_color = service.color3
                break
            case HatnoteVisService.Keeper:
                circle2_color = service.color2
        }
        this.circle2.attr('transform', 'translate(' + this.visDirector.windowWidth/2 + ', ' + this.visDirector.windowHeight/2 + ')')
            .attr('fill', circle2_color)
            .attr('r', 35)
            .attr('opacity', 0)
            .transition()
            .delay(delay + 30)
            .attr('opacity', 1)
            .duration(0)
            .transition()
            .attr('r', circle_radius + 40)
            .ease(easeBackOut)
            .duration(in_duration+200)
            .transition()
            .delay(active_duration)
            .attrTween("transform", this.translateAlong(this.circles_path.node()))
            .attr('r', 0)
            .ease(easeExpOut)
            .duration(out_duration)

        this.circle1.attr('transform', 'translate(' + this.visDirector.windowWidth/2 + ', ' + this.visDirector.windowHeight/2 + ')')
            .attr('fill', service.color1)
            .attr('r', 30)
            .attr('opacity', 0)
            .transition()
            .delay(delay + 70)
            .attr('opacity', 1)
            .duration(0)
            .transition()
            .attr('r', circle_radius + 30)
            .ease(easeCubicOut)
            .duration(in_duration+100)
            .transition()
            .delay(active_duration)
            .attrTween("transform", this.translateAlong(this.circles_path.node()))
            .attr('r', 0)
            .ease(easeExpOut)
            .duration(out_duration)

        this.mask.attr('height', this.visDirector.windowHeight)
            .attr('width', this.visDirector.windowWidth)

        this.mask_circle.attr('transform', 'translate(' + this.visDirector.windowWidth/2 + ', ' + this.visDirector.windowHeight/2 + ')')
            .attr('r', 0)
            .transition()
            .delay(delay + 70)
            .attr('r', 20)
            .duration(0)
            .transition()
            .attr('r', circle_radius)
            .ease(easeQuadOut)
            .duration(in_duration)
            .transition()
            .delay(active_duration)
            .attrTween("transform", this.translateAlong(this.circles_path.node()))
            .attr('r', 0)
            .ease(easeExpOut)
            .duration(out_duration)

        this.background.attr('height', this.visDirector.windowHeight)
            .attr('width', this.visDirector.windowWidth)

        this.mpdl_logo.attr('x', this.visDirector.windowWidth*(3/4)).attr('y', 0)
            .attr('width', 200)

        let logo_delay = 1000
        this.text.attr('transform', 'translate(' + this.visDirector.windowWidth/4 +', ' + this.visDirector.windowHeight/4 + ')')
            .attr('font-size', '60px')
            .attr('opacity', 0)
            .attr('width', 200)
            .transition()
            .delay(delay + logo_delay)
            .attr('opacity', 1)
            .ease(Math.sqrt)
            .duration(in_duration - logo_delay)
            .transition()
            .delay(active_duration)
            .attrTween("transform", this.translateAlong(this.circles_path.node()))
            .attr('font-size', '14px')
            .attr('opacity', 0)
            .ease(easeExpOut)
            .duration(out_duration)

        let logo_width = 600
        this.service_logo.attr('href', service.transition_logo)
            .attr('transform', 'translate(' + (this.visDirector.windowWidth/2-logo_width/2) +', '+ this.visDirector.windowHeight/2+')')
            .attr('width', logo_width)
            .attr('opacity', 0)
            .transition()
            .delay(delay + logo_delay)
            .attr('opacity', 1)
            .ease(Math.sqrt)
            .duration(in_duration - logo_delay)
            .on('end', () => {
                this.onTransitionMid.next()
            })
            .transition()
            .delay(active_duration)
            .attrTween("transform", this.translateAlong(this.circles_path.node()))
            .attr('opacity', 0)
            .attr('width', 40)
            .ease(easeExpOut)
            .duration(out_duration)
            .on('start', () => {
                this.onTransitionEnd.next()
            })
    }

    // Returns an attrTween for translating along the specified path element.
    private translateAlong(path: any) {
        let l = path.getTotalLength();
        return function(_d: any, _i: any, _a: any) {
            return function(t: any) {
                let p = path.getPointAtLength(t * l);
                return "translate(" + p.x + "," + p.y + ")";
            };
        };
    }

}