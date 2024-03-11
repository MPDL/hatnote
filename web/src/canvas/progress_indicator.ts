import { easeLinear, Selection, transition} from "d3";
import {ListenToCanvas} from "./listen/listenToCanvas";
import {ServiceTheme} from "../theme/model";
import {HatnoteVisService} from "../service_event/model";

export class ProgressIndicator{
    public readonly service_indicators: Map<HatnoteVisService, ServiceProgressIndicator>;
    private _currentServiceIndicator: ServiceProgressIndicator | undefined;

    public get currentServiceIndicator() {
        return this._currentServiceIndicator;
    }

    private readonly canvas: ListenToCanvas

    constructor(canvas: ListenToCanvas) {
        this.canvas = canvas
        this.service_indicators = new Map<HatnoteVisService, ServiceProgressIndicator>()
        canvas.theme.service_themes.forEach(service => {
            this.service_indicators.set(service.id_name, new ServiceProgressIndicator(canvas, service))
        });
        this._currentServiceIndicator = this.service_indicators.get(HatnoteVisService.Minerva);
    }

    public setCurrentServiceIndicator(serviceTheme: ServiceTheme){
        this._currentServiceIndicator = this.service_indicators.get(serviceTheme.id_name)
    }

    windowUpdate() {
        let progress_indicator_width = this.canvas.theme.progress_indicator_width(this.canvas.width);
        this.service_indicators.forEach(indicator => {
            indicator.windowUpdate(progress_indicator_width)
        })
    }
}

class ServiceProgressIndicator{
    private readonly root: Selection<SVGGElement, unknown, null, any>
    private readonly bg: Selection<SVGRectElement, unknown, null, any>
    private readonly fg: Selection<SVGRectElement, unknown, null, any>
    private readonly textBox: Selection<SVGRectElement, unknown, null, any>
    private readonly text: Selection<SVGTextElement, unknown, null, any>
    public readonly service_id: HatnoteVisService
    private readonly canvas: ListenToCanvas

    constructor(canvas: ListenToCanvas, service_theme: ServiceTheme) {
        this.canvas = canvas;
        let progress_indicator_width = canvas.theme.progress_indicator_width(canvas.width);
        let pos_x = canvas.theme.progress_indicator_pos_x(service_theme.id_name, canvas.width, progress_indicator_width, canvas.theme.progress_indicator_gap_width);
        let showIndicator = canvas.settings.carousel_mode

        this.root = canvas.appendSVGElement('g').attr('id', 'progress_' + service_theme.name)
            .attr('transform', 'translate(' + pos_x + ', ' + (canvas.height - canvas.theme.progress_indicator_y_padding) + ')')
            .attr('opacity', showIndicator ? 1 : 0);

        this.bg = this.root.append('rect')
            .attr('width', progress_indicator_width)
            .attr('height', canvas.theme.progress_indicator_height)
            .attr('fill', canvas.theme.progress_indicator_bg_color)

        this.fg = this.root.append('rect')
            .attr('width', 0)
            .attr('height', canvas.theme.progress_indicator_height)
            .attr('fill', canvas.theme.progress_indicator_fg_color)

        this.textBox = this.root.append('rect')
            .attr('opacity', 0)
            .attr('transform', 'translate(0, -24)')
            .attr('width', '134')
            .attr('height', '30')
            .attr('rx', 7)
            .attr('ry', 7)
            .attr('fill', this.canvas.theme.progress_indicator_error_color)

        this.text = this.root.append('text')
            .attr('opacity', 0)
            .attr('transform', 'translate(8,-8)')
            .text('Service unavailable')
            .attr('font-family', 'HatnoteVisBold')
            .attr('font-size', '12px')
            .attr('fill', '#fff')

        this.service_id = service_theme.id_name
    }

    private showTextBox(show: boolean){
        if(show){
            this.textBox.attr('opacity', 1)
            this.text.attr('opacity', 1)
        } else {
            this.textBox.attr('opacity', 0)
            this.text.attr('opacity', 0)
        }
    }

    public start(onEnd: () => void){
        const t = transition()
            .duration(this.canvas.theme.current_service_theme.carousel_time)
            .ease(easeLinear);
        this.showTextBox(false);
        this.bg.attr('fill', this.canvas.theme.progress_indicator_bg_color)
        let progress_indicator_width = this.canvas.theme.progress_indicator_width(this.canvas.width);
        this.fg.transition(t).attr('width', progress_indicator_width).on('end', onEnd)
    }

    public reset() {
        this.bg.attr('fill', this.canvas.theme.progress_indicator_bg_color)
        this.fg.attr('width', 0);
    }

    public setError(){
        this.fg.interrupt();
        this.bg.attr('fill', this.canvas.theme.progress_indicator_error_color);
        this.fg.attr('width', 0);
        this.showTextBox(true);
    }

    public windowUpdate(progress_indicator_width: number, ) {
        let pos_x = this.canvas.theme.progress_indicator_pos_x(this.service_id, this.canvas.width, progress_indicator_width, this.canvas.theme.progress_indicator_gap_width);
        this.root.attr('transform', 'translate(' + pos_x + ', ' + (this.canvas.height - this.canvas.theme.progress_indicator_y_padding) + ')');
        this.bg.attr('width', progress_indicator_width)
    }
}