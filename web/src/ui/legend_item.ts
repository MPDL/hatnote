import {Selection} from "d3";
import {ThemeLegendItem} from "../theme/model";
import {VisualisationDirector} from "../theme/visualisationDirector";
import {HatnoteVisService} from "../service_event/model";

export class LegendItemHtml{
    private readonly root: Selection<HTMLDivElement, unknown, null, undefined>;
    private readonly title:  Selection<HTMLSpanElement, unknown, null, undefined>;
    private readonly circle: Selection<HTMLDivElement, unknown, null, undefined>;
    private readonly visDirector: VisualisationDirector;

    constructor(legendContainer: Selection<HTMLDivElement, unknown, null, undefined>, visDirector: VisualisationDirector,
                themeLegendItem: ThemeLegendItem) {
        this.visDirector = visDirector
        this.root = legendContainer.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '12px')

        this.circle = this.root.append('div')
            .style('border-radius', '50%')
            .style('height', `${this.visDirector.hatnoteTheme.legend_item_circle_r*2}px`)
            .style('width', `${this.visDirector.hatnoteTheme.legend_item_circle_r*2}px`)
            .style('background', this.visDirector.getThemeColor(themeLegendItem.event)) // default value

        let smallTitle = (themeLegendItem.smallTitle1 ?? '') + ' ' + (themeLegendItem.smallTitle2 ?? '')
        this.title = this.root.append('span')
            .text(themeLegendItem.title ?? smallTitle)
            .style('font-family', 'HatnoteVisNormal')
            .style('font-size', this.visDirector.current_service_theme.id_name === HatnoteVisService.Minerva ? '16px' : '26px')
            .style('color', this.visDirector.hatnoteTheme.header_text_color)
            .style('max-width', this.visDirector.current_service_theme.id_name === HatnoteVisService.Minerva ? '70px' : '100%')
    }
}