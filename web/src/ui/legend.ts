import {Selection} from "d3";
import {VisualisationDirector} from "../theme/visualisationDirector";
import {Subject} from "rxjs";
import {HatnoteVisService} from "../service_event/model";
import {ServiceTheme, Visualisation} from "../theme/model";
import {LegendItemHtml} from "./legend_item";

export class Legend {
    private readonly root:  Selection<HTMLDivElement, unknown, null, undefined>
    private readonly visDirector: VisualisationDirector
    constructor(container: Selection<HTMLDivElement, unknown, null, undefined>, visDirector: VisualisationDirector,
                onThemeHasChanged: Subject<[HatnoteVisService, Visualisation]>,
                isHeader: boolean) {
        this.visDirector = visDirector
        this.root = container.append('div')
            .attr('id', 'legend_items')
            .style('display', 'flex')
            .style('margin-left', 'auto')
            .style('gap', '20px')

        if(!isHeader){
            this.root.style('flex-direction', 'column')
        } else {
            this.root.style('margin-right', '20px')
        }

        for (let i = 0; i < visDirector.current_service_theme.legend_items.length; i++) {
            new LegendItemHtml(this.root, visDirector, visDirector.current_service_theme.legend_items[i])
        }

        onThemeHasChanged.subscribe({
            next: (value) => {
                this.themeUpdate()
            }
        })
    }

    private clearLegendItems(){
        this.root.selectChildren().remove()
    }

    public themeUpdate() {
        // update legend items
        this.clearLegendItems()
        if(!this.visDirector.isMobileScreen){
            for (let i = 0; i < this.visDirector.current_service_theme.legend_items.length; i++) {
                new LegendItemHtml(this.root, this.visDirector, this.visDirector.current_service_theme.legend_items[i])
            }
        }
    }
}