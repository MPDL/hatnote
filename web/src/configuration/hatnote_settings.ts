import {environmentVariables} from "./environment";
import {HatnoteVisService} from "../service_event/model";

export class HatnoteSettings {

    private readonly _settings_data: SettingsData
    public get settings_data() : SettingsData{
        return this._settings_data
    }
    constructor() {
        this._settings_data = {
            serviceWebsocketUrl: new Map([["default", environmentVariables.server_url]]),
            carousel_time: [180000,180000,180000],
            event_delay_protection: 142,
            default_event_buffer_timespan: 142,
            sound_overlap: 15,
            max_life: 60000,
            circle_start_opacity: 0.75,
            kiosk_mode: false,
            embedded_mode: false,
            debug_mode: false,
            carousel_mode: true,
            initialService: HatnoteVisService.Minerva,
            audioProtection: 142,
            audio_mute: false,
            circle_radius_max: window.innerHeight/2,
            circle_radius_min: 3,
            help: false,
            map: false
        }

        this.loadUrlParameters()
    }

    private loadUrlParameters() {
        // get URL search parameters
        let browser_url = new URL(window.location.href);
        let url_search_parameters = browser_url.searchParams

        if(url_search_parameters.has("help")){
            this._settings_data.help = true;
            // needs to be returned, otherwise the default values of the help page will be overwritten.
            return;
        }

        if(url_search_parameters.has("map")){
            this._settings_data.map = true;
        }

        if(url_search_parameters.has("mute")){
            this._settings_data.audio_mute = true;
        }

        // time in ms
        if(url_search_parameters.has("audio-protection")){
            let audioProtection: number = Number(url_search_parameters.get("audio-protection"));
            if (isNaN(audioProtection))
                return
            if(audioProtection > 10000) {
                audioProtection = 10000;
            }
            if(audioProtection < 0) {
                audioProtection = 0;
            }
            this._settings_data.audioProtection = audioProtection;
        }

        if(url_search_parameters.has("circle-life")){
            let circleLife: number = Number(url_search_parameters.get("circle-life"));
            if (isNaN(circleLife))
                return
            if(circleLife > 600000) {
                circleLife = 600000;
            }
            if(circleLife < 0) {
                circleLife = 0;
            }
            this._settings_data.max_life = circleLife;
        }

        if(url_search_parameters.has("circle-opacity")){
            let circleOpacity: number = Number(url_search_parameters.get("circle-opacity"));
            if (isNaN(circleOpacity))
                return
            if(circleOpacity > 1.0) {
                circleOpacity = 1.0;
            }
            if(circleOpacity < 0.0) {
                circleOpacity = 0.0;
            }
            this._settings_data.circle_start_opacity = circleOpacity;
        }

        if(url_search_parameters.has("audio-overlap")){
            let audioOverlap: number = Number(url_search_parameters.get("audio-overlap"));
            if (isNaN(audioOverlap))
                return
            if(audioOverlap > 40) {
                audioOverlap = 40;
            }
            if(audioOverlap < 0) {
                audioOverlap = 0;
            }
            this._settings_data.sound_overlap = audioOverlap;
        }

        // time in ms
        if(url_search_parameters.has("carousel-time")){
            let carouselTime: string|null = url_search_parameters.get("carousel-time");
            if (carouselTime === null)
                return
            let carouselTimeSplit: string[] = carouselTime.split(',');
            if (carouselTimeSplit.length !== 3)
                return

            let minervaTime: number = Number(carouselTimeSplit[0])
            let keeperTime: number = Number(carouselTimeSplit[1])
            let bloxbergTime: number = Number(carouselTimeSplit[2])

            if (isNaN(minervaTime) || isNaN(keeperTime) || isNaN(bloxbergTime))
                return

            if(minervaTime > 720000) {
                minervaTime = 720000;
            }
            if(minervaTime < 10000) {
                minervaTime = 10000;
            }
            if(keeperTime > 720000) {
                keeperTime = 720000;
            }
            if(keeperTime < 10000) {
                keeperTime = 10000;
            }
            if(bloxbergTime > 720000) {
                bloxbergTime = 720000;
            }
            if(bloxbergTime < 10000) {
                bloxbergTime = 10000;
            }
            this._settings_data.carousel_time = [minervaTime, keeperTime, bloxbergTime];
        }

        if(url_search_parameters.has("debug")){
            this._settings_data.debug_mode = true;
        }

        if(url_search_parameters.has("kiosk")){
            this._settings_data.kiosk_mode = true;
        }

        if(url_search_parameters.has("embedded")){
            this._settings_data.embedded_mode = true;
        }

        let service_parameter = url_search_parameters.get("service")
        this._settings_data.carousel_mode = false;
        switch (service_parameter ) {
            case 'keeper':
                this._settings_data.initialService = HatnoteVisService.Keeper
                break
            case 'minerva':
                this._settings_data.initialService = HatnoteVisService.Minerva
                break
            case 'bloxberg':
                this._settings_data.initialService = HatnoteVisService.Bloxberg
                break
            default:
                // default: start carousel
                this._settings_data.initialService = HatnoteVisService.Minerva
                this._settings_data.carousel_mode = true;
        }
    }
}

export interface SettingsData{
    serviceWebsocketUrl: Map<string, string>,
    carousel_time: number[], // in ms
    event_delay_protection: number, // in ms
    default_event_buffer_timespan: number, // in ms
    sound_overlap: number,
    circle_start_opacity: number,
    max_life: number, // in ms
    kiosk_mode: boolean, // used for long running showcases of the website e.g. on a monitor in a hall
    embedded_mode: boolean, // used for iframe integration
    debug_mode: boolean,
    carousel_mode: boolean,
    initialService: HatnoteVisService,
    audioProtection: number,  // in ms
    audio_mute: boolean,
    circle_radius_max: number,
    circle_radius_min: number,
    help: boolean,
    map: boolean
}