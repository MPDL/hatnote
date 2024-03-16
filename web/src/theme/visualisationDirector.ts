import {HatnoteTheme, ServiceTheme, Visualisation} from "./model";
import {minerva_service_theme} from "./minerva";
import {SettingsData} from "../configuration/hatnote_settings";
import {HatnoteVisService, ServiceEvent} from "../service_event/model";
import {keeper_service_theme} from "./keeper";
import {bloxberg_service_theme} from "./bloxberg";
import {hatnote_theme} from "./hatnote";
import {getRandomIntInclusive} from "../util/random";

export class VisualisationDirector {
    service_themes: Map<HatnoteVisService, ServiceTheme> = new Map<HatnoteVisService, ServiceTheme>()
    carousel_service_order: ServiceTheme[]
    current_service_theme: ServiceTheme;
    readonly minervaTheme: ServiceTheme;
    readonly keeperTheme: ServiceTheme;
    readonly bloxbergTheme: ServiceTheme;
    readonly hatnoteTheme: HatnoteTheme;
    current_visualisation: Visualisation;
    private settings_data: SettingsData;

    constructor(settings_data: SettingsData) {
        this.settings_data = settings_data
        this.minervaTheme = minerva_service_theme
        this.keeperTheme = keeper_service_theme
        this.bloxbergTheme = bloxberg_service_theme
        this.hatnoteTheme = hatnote_theme

        this.minervaTheme.carousel_time = settings_data.carousel_time[0]
        this.keeperTheme.carousel_time = settings_data.carousel_time[1]
        this.bloxbergTheme.carousel_time = settings_data.carousel_time[2]

        if(settings_data.map) {
            this.current_visualisation = Visualisation.geo
        } else {
            this.current_visualisation = Visualisation.listenTo
        }

        this.service_themes.set(HatnoteVisService.Minerva, this.minervaTheme)
        this.service_themes.set(HatnoteVisService.Keeper, this.keeperTheme)
        this.service_themes.set(HatnoteVisService.Bloxberg, this.bloxbergTheme)

        this.carousel_service_order = [this.minervaTheme, this.keeperTheme, this.bloxbergTheme]

        this.current_service_theme = this.service_themes.get(settings_data.initialService) ?? this.minervaTheme
    }

    getNextVisualisation(): Visualisation{
        let vis: Visualisation = this.current_visualisation
        if(this.settings_data.mixed) {
            if(vis === Visualisation.listenTo){
                vis = Visualisation.geo
            } else {
                vis = Visualisation.listenTo
            }
        }
        return vis
    }

    setCurrentVisualisation(vis: Visualisation){
        this.current_visualisation = vis;
    }

    set_current_theme(serviceTheme: ServiceTheme){
        this.current_service_theme = serviceTheme;
    }

    progress_indicator_width(canvasWidth: number) {
        return canvasWidth * 0.3;
    }
    progress_indicator_pos_x (service: HatnoteVisService, canvasWidth: number, indicator_width: number, indicator_gap_width: number ) {
        switch (service) {
            case HatnoteVisService.Minerva:
            return canvasWidth/2 - indicator_width/2 - indicator_gap_width - indicator_width;
            case HatnoteVisService.Keeper:
            return canvasWidth/2 - indicator_width/2;
            case HatnoteVisService.Bloxberg:
            return canvasWidth/2 + indicator_width/2 + indicator_gap_width;
            default:
            return 0;
        }
    }
    getThemeColor(service_event: ServiceEvent) {
        switch (service_event) {
            // minerva
            case ServiceEvent.minerva_public_message:
                return this.minervaTheme.color1;
            case ServiceEvent.minerva_private_message:
                return this.minervaTheme.color2;
            case ServiceEvent.minerva_group_message:
            case ServiceEvent.minerva_direct_message:
                return this.minervaTheme.color3;
            // keeper
            case ServiceEvent.keeper_file_edit:
                return this.keeperTheme.color1;
            case ServiceEvent.keeper_file_create:
                return this.keeperTheme.color2;
            case ServiceEvent.keeper_new_library:
                return this.keeperTheme.color3;
            case ServiceEvent.keeper_new_user:
                return 'rgb(41, 128, 185)';
            // bloxberg
            case ServiceEvent.bloxberg_block:
                return this.bloxbergTheme.color1;
            case ServiceEvent.bloxberg_confirmed_transaction:
                return this.bloxbergTheme.color2;
            case ServiceEvent.bloxberg_licensed_contributor:
                return 'rgb(41, 128, 185)';
            default:
                return '#000';
        }
    }

    getHatnoteService(service_event: ServiceEvent): HatnoteVisService | undefined{
        switch (service_event) {
            // minerva
            case ServiceEvent.minerva_public_message:
            case ServiceEvent.minerva_group_message:
            case ServiceEvent.minerva_private_message:
            case ServiceEvent.minerva_direct_message:
                return HatnoteVisService.Minerva;
            // keeper
            case ServiceEvent.keeper_file_edit:
            case ServiceEvent.keeper_file_create:
            case ServiceEvent.keeper_new_library:
            case ServiceEvent.keeper_new_user:
                return HatnoteVisService.Keeper;
            // bloxberg
            case ServiceEvent.bloxberg_block:
            case ServiceEvent.bloxberg_confirmed_transaction:
            case ServiceEvent.bloxberg_licensed_contributor:
                return HatnoteVisService.Bloxberg;
            default:
                return undefined;
        }
    }
}