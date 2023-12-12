import {BehaviorSubject, Subject} from "rxjs";
import {BannerData, CircleData, DatabaseInfo, NetworkInfoboxData} from "./observable/model";
import {Canvas} from "./canvas/canvas";
import {HatnoteAudio} from "./audio/hatnote_audio";
import {HatnoteSettings} from "./configuration/hatnote_settings";
import {Theme} from "./theme/theme";
import {EventBridge} from "./service_event/event_bridge";
import {WebsocketManager} from "./websocket/websocket";
import {HatnoteVisService} from "./service_event/model";
import {HelpPage} from "./help/help_page";

main();

function main(){
    document.body.appendChild(component());

    // load settings
    let settings = new HatnoteSettings();
    let settings_data = settings.settings_data

    // load help page
    if (settings_data.help) {
        new HelpPage(settings_data)
        return;
    }

    // load theme
    let theme = new Theme(settings_data);

    // create observables
    let newCircleSubject: Subject<CircleData> = new Subject()
    let newBannerSubject: Subject<BannerData> = new Subject()
    let hatnoteVisServiceChangedSubject: BehaviorSubject<HatnoteVisService> = new BehaviorSubject(theme.current_service_theme.id_name)
    let showAudioInfoboxSubject: Subject<boolean> = new Subject()
    let showWebsocketInfoboxSubject: Subject<NetworkInfoboxData> = new Subject()
    let updateDatabaseInfoSubject: Subject<DatabaseInfo> = new Subject()
    let updateVersionSubject: Subject<[string,number]> = new Subject()

    // build canvas
    new Canvas(theme, settings_data, newCircleSubject, newBannerSubject,
        showAudioInfoboxSubject, showWebsocketInfoboxSubject, updateVersionSubject, hatnoteVisServiceChangedSubject, updateDatabaseInfoSubject)

    // load audio
    let audio = new HatnoteAudio(settings_data, showAudioInfoboxSubject);

    // init event bridge
    let event_bridge = new EventBridge(audio, newCircleSubject, newBannerSubject, updateVersionSubject,
        hatnoteVisServiceChangedSubject, settings_data)

    // start websocket
    new WebsocketManager(settings_data, showWebsocketInfoboxSubject, updateDatabaseInfoSubject, event_bridge);
}

function component() {
    const element = document.createElement('div');
    element.setAttribute("id", "app");

    return element;
}