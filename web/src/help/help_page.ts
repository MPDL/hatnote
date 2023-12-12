import {select,Selection} from "d3";
import {SettingsData} from "../configuration/hatnote_settings";

export class HelpPage {
    private list: Selection<HTMLUListElement, unknown, HTMLElement, any>;
    constructor(settings: SettingsData) {
        let root = select("#app").append("div")
            .style('font-family', 'HatnoteVisNormal')
            .style('padding', '20px')

        let heading = root.append("h1").html('Hatnoteapp help page')
        let paragraph = root.append("p").html('Following url parameters are supported:')
        this.list = root.append("ul")
        this.createHelpListItem('mute', 'mutes sounds.', '.../hatnoteapp?<b>mute</b>', `${settings.audio_mute}`)
        this.createHelpListItem('service=${option}', 'displays given service. Disables carousel. Options: keeper, minerva, bloxberg.', '.../hatnoteapp?<b>service=bloxberg</b>', `carousel mode enabled`)
        this.createHelpListItem('carousel-time=${minerva},${keeper},${bloxberg}', 'modifies the carousel display time for individual services. All values must be given and are read in milliseconds.', '.../hatnoteapp?<b>carousel-time=20000,10000,14000</b>', `${settings.carousel_time[0]},${settings.carousel_time[1]},${settings.carousel_time[2]}`)
        this.createHelpListItem('audio-protection=${time}', 'timeframe in which successive events will be muted. Time is read in milliseconds.', '.../hatnoteapp?<b>audio-protection=200</b>', `${settings.audioProtection}`)
        this.createHelpListItem('circle-life=${time}', 'time an event circle is displayed. Time is read in milliseconds.', '.../hatnoteapp?<b>circle-life=20000</b>', `${settings.max_life}`)
        this.createHelpListItem('circle-opacity=${opacity}', 'start opacity of an event circle [0.0,1.0].', '.../hatnoteapp?<b>circle-opacity=0.2</b>', `${settings.circle_start_opacity}`)
        this.createHelpListItem('audio-overlap=${number}', 'number of audio that can be played at the same time.', '.../hatnoteapp?<b>audio-overlap=7</b>', `${settings.sound_overlap}`)
        this.createHelpListItem('kiosk', 'enables kiosk mode. UI prompt suggesting to enable the audio will not be displayed. This mode is intended for installations.', '.../hatnoteapp?<b>kiosk</b>', `${settings.kiosk_mode}`)
        this.createHelpListItem('debug', 'enables debug mode that will generate output in the javascript console.', '.../hatnoteapp?<b>debug</b>', `${settings.debug_mode}`)
        this.createHelpListItem('help', 'shows help page.', ' Example: .../hatnoteapp?<b>help</b>', `${settings.help}`)
        let paragraph2 = root.append("p").html('Url parameters can be combined with "<b>&</b>". Order does not matter. <u>Example</u>: ../hatnoteapp?mute<b>&</b>service=bloxberg')

        document.body.setAttribute("style", "overflow: auto")
    }

    private createHelpListItem(parameter: string, description: string, example: string, defaultValue: string){
        this.list.append("li").html(`<b>${parameter}</b>: ${description}</br><u>Example</u>: ${example}</br><i>Default: ${defaultValue}</i></br></br>`)
    }
}