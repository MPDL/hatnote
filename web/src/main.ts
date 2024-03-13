import {BehaviorSubject, Subject} from "rxjs";
import {BannerData, CircleData, DatabaseInfo, NetworkInfoboxData} from "./observable/model";
import {ListenToCanvas} from "./canvas/listen/listenToCanvas";
import {HatnoteAudio} from "./audio/hatnote_audio";
import {HatnoteSettings} from "./configuration/hatnote_settings";
import {Theme} from "./theme/theme";
import {EventBridge} from "./service_event/event_bridge";
import {WebsocketManager} from "./websocket/websocket";
import {HatnoteVisService} from "./service_event/model";
import {HelpPage} from "./help/help_page";
import {GeoCanvas} from "./canvas/geo/geoCanvas";
import {select} from "d3";

main();

function main(){
    let appContainer = document.body.appendChild(component());

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
    if (settings_data.map) {
        new GeoCanvas(theme, settings_data, newCircleSubject,
            showWebsocketInfoboxSubject, updateVersionSubject, updateDatabaseInfoSubject, select(appContainer))
    } else {
        new ListenToCanvas(theme, settings_data, newCircleSubject, newBannerSubject,
            showAudioInfoboxSubject, showWebsocketInfoboxSubject, updateVersionSubject, hatnoteVisServiceChangedSubject, updateDatabaseInfoSubject,select(appContainer))
    }

    // load audio
    let audio;
    if (!settings_data.map) {
        audio = new HatnoteAudio(settings_data, showAudioInfoboxSubject);
    }

    // init event bridge
    let event_bridge = new EventBridge(audio, newCircleSubject, newBannerSubject, updateVersionSubject,
        hatnoteVisServiceChangedSubject, settings_data)

    // start websocket
    new WebsocketManager(settings_data, showWebsocketInfoboxSubject, updateDatabaseInfoSubject, event_bridge);
}

function component() {
    const element = document.createElement('div');
    element.setAttribute("id", "app");
    element.setAttribute('style', 'height: 100vh')

    return element;
}