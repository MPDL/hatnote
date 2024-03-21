import {Selection} from "d3";
import MinervaLogo from "../../assets/images/minervamessenger-banner-kussmund+bulb.png";
import {ServiceTheme, Visualisation} from "../theme/model";
import {environmentVariables} from "../configuration/environment";
import {Canvas} from "./canvas/canvas";
import {Subject} from "rxjs";
import {HatnoteVisService} from "../service_event/model";
import {VisualisationDirector} from "../theme/visualisationDirector";
import {LegendItemHtml} from "./legend_item";
import {Legend} from "./legend";

export class Header{
    private readonly root: Selection<HTMLDivElement, unknown, null, undefined>
    private readonly title: Selection<HTMLDivElement, unknown, null, undefined>
    private readonly title0: Selection<HTMLSpanElement, unknown, null, undefined>
    private readonly title1: Selection<HTMLSpanElement, unknown, null, undefined>
    private readonly legend:  Selection<HTMLDivElement, unknown, null, undefined>
    private readonly logo: Selection<HTMLImageElement, unknown, null, undefined>
    private readonly updateBox: Selection<HTMLDivElement, unknown, null, undefined>
    private readonly updateText: Selection<HTMLSpanElement, unknown, null, undefined>
    private readonly visDirector: VisualisationDirector;

    constructor(appContainer: Selection<HTMLDivElement, unknown, null, undefined>, visDirector: VisualisationDirector,
                onThemeHasChanged: Subject<[HatnoteVisService, Visualisation]>,
                updateVersionSubject: Subject<[string,number]> = new Subject()) {
        this.visDirector = visDirector;
        this.root = appContainer.append("div")
            .attr('id', 'header')
            .style('width', '100%')
            .style('height', `${visDirector.hatnoteTheme.header_height}px`)
            .style('background', visDirector.hatnoteTheme.header_bg_color)
            .style('display', 'flex')
            .style('opacity', 1.0)
            .style('align-items', 'center')

        this.logo = this.root.append("img")
            .attr('src', MinervaLogo)
            .style('width', '44px')
            .style('height', 'fit-content')
            .style('margin-left', '20px')

        this.title = this.root.append('div')
            .style('margin-left', '12px')
        this.title0 = this.root.append('span')
            .text(visDirector.current_visualisation === Visualisation.listenTo ? 'Listen to\u00A0' : 'Locate\u00A0')
            .style('font-family', 'HatnoteVisNormal')
            .style('font-size', visDirector.isMobileScreen ? '22px' : '32px')
            .style('color', visDirector.hatnoteTheme.header_text_color)
        this.title1 = this.root.append('span')
            .text(visDirector.current_service_theme.header_title)
            .style('font-family', 'HatnoteVisBold')
            .style('font-size', visDirector.isMobileScreen ? '22px' : '32px')
            .style('color', visDirector.hatnoteTheme.header_text_color)

        this.updateBox = this.root.append('div')
            .style('opacity', 0)
            .style('width', '190px')
            .style('height', '30px')
            .style('border-radius', '8px')
            .style('background', visDirector.hatnoteTheme.header_version_update_bg)
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('margin', 'auto')

        this.updateText = this.updateBox.append('span')
            .style('opacity', 0)
            .style('text-align', 'middle')
            .text('New update available')
            .style('font-family', 'HatnoteVisBold')
            .style('font-size', '16px')
            .style('color', '#fff')

        this.legend = this.root.append('div')
            .attr('id', 'legend_items')
            .style('display', 'flex')
            .style('margin-left', 'auto')
            .style('gap', '20px')
            .style('margin-right', '20px')

        if(!visDirector.isMobileScreen) {
            new Legend(this.legend, visDirector, onThemeHasChanged, true)
        }

        updateVersionSubject.subscribe({
            next: (versions) => this.updateVersionNumbers(versions)
        })

        onThemeHasChanged.subscribe({
            next: (value) => {
                this.themeUpdate(visDirector.current_service_theme)
            }
        })
    }

    private updateVersionNumbers(versions: [string, number]){
        let expectedFrontendVersion = versions[1]
        let browserFrontendVersion: number = Number(environmentVariables.version);
        if (!isNaN(browserFrontendVersion) && browserFrontendVersion < expectedFrontendVersion) {
            this.updateBox.style('opacity', 1)
            this.updateText.style('opacity', 1)
        } else {
            this.updateBox.style('opacity', 0)
            this.updateText.style('opacity', 0)
        }
    }

    public themeUpdate(currentServiceTheme: ServiceTheme) {
        this.logo.attr('src', currentServiceTheme.header_logo)

        this.title0.text(this.visDirector.current_visualisation === Visualisation.listenTo ? 'Listen to\u00A0' : 'Locate\u00A0')
        this.title1.text(currentServiceTheme.header_title)
    }
}