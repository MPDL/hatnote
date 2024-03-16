import {select,Selection} from "d3";
import {SettingsData} from "../configuration/hatnote_settings";

export class HelpPage {
    private list: Selection<HTMLUListElement, unknown, HTMLElement, any>;
    private baseUrl: string = 'hatnote.mpdl.mpg.de'
    constructor(settings: SettingsData) {
        let root = select("#app").append("div")
            .style('font-family', 'HatnoteVisNormal')
            .style('padding', '20px')

        root.append("h1").html('Hatnoteapp help page')
        root.append("p").html('Following url parameters are supported:')
        this.list = root.append("ul")
        this.createHelpListItem('mute', 'mutes sounds.', this.baseUrl+'?<b>mute</b>', `${settings.audio_mute}`)
        this.createHelpListItem('map', 'shows the geographic visualisation.', this.baseUrl+'?<b>map</b>', `${settings.map}`)
        this.createHelpListItem('mixed', 'if the carousel mode is activated and map mode deactivated this flag will cause the carousel mix visualisation types.', this.baseUrl+'?<b>mixed</b>', `${settings.mixed}`)
        this.createHelpListItem('service=${option}', 'displays given service. Disables carousel. Options: keeper, minerva, bloxberg.', this.baseUrl+'?<b>service=bloxberg</b>', `carousel mode enabled`)
        this.createHelpListItem('carousel-time=${minerva},${keeper},${bloxberg}', 'modifies the carousel display time for individual services. All values must be given and are read in milliseconds.', this.baseUrl+'?<b>carousel-time=20000,10000,14000</b>', `${settings.carousel_time[0]},${settings.carousel_time[1]},${settings.carousel_time[2]}`)
        this.createHelpListItem('audio-protection=${time}', 'timeframe in which successive events will be muted. Time is read in milliseconds.', this.baseUrl+'?<b>audio-protection=200</b>', `${settings.audioProtection}`)
        this.createHelpListItem('circle-life=${time}', 'time an event circle is displayed. Time is read in milliseconds.', this.baseUrl+'?<b>circle-life=20000</b>', `${settings.max_life}`)
        this.createHelpListItem('circle-opacity=${opacity}', 'start opacity of an event circle [0.0,1.0].', this.baseUrl+'?<b>circle-opacity=0.2</b>', `${settings.circle_start_opacity}`)
        this.createHelpListItem('audio-overlap=${number}', 'number of audio that can be played at the same time.', this.baseUrl+'?<b>audio-overlap=7</b>', `${settings.sound_overlap}`)
        this.createHelpListItem('kiosk', 'enables kiosk mode. The followings applies: UI prompt suggesting to enable the audio will not be displayed. This mode is intended for installations.', this.baseUrl+'?<b>kiosk</b>', `${settings.kiosk_mode}`)
        this.createHelpListItem('embedded', 'enables embedded mode. The followings applies: UI prompt suggesting to enable the audio is replaced by a speaker icon. This mode is intended for integrations with iframe.', this.baseUrl+'?<b>embedded</b>', `${settings.embedded_mode}`)
        this.createHelpListItem('debug', 'enables debug mode that will generate output in the javascript console.', this.baseUrl+'?<b>debug</b>', `${settings.debug_mode}`)
        this.createHelpListItem('help', 'shows help page.', ` Example: ${this.baseUrl}?<b>help</b>`, `${settings.help}`)
        root.append("p").html(`Url parameters can be combined with "<b>&</b>". Order does not matter. <u>Example</u>: ${this.baseUrl}?mute<b>&</b>service=bloxberg`)
        root.append("h2").html('GIS (Geographic Information System) for hatnote')
        root.append("p").html(`Geographic information for hatnote can be modified at <a href="http://gis.hatnote.mpdl.mpg.de" target="_blank">http://gis.hatnote.mpdl.mpg.de</a>`)

        document.body.setAttribute("style", "overflow: auto")
    }

    private createHelpListItem(parameter: string, description: string, example: string, defaultValue: string){
        this.list.append("li").html(`<b>${parameter}</b>: ${description}</br><u>Example</u>: ${example}</br><i>Default: ${defaultValue}</i></br></br>`)
    }
}