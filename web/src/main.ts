import {BehaviorSubject, Subject} from "rxjs";
import {BannerData, CircleData, DatabaseInfo, NetworkInfoboxData} from "./observable/model";
import {HatnoteAudio} from "./audio/hatnote_audio";
import {HatnoteSettings} from "./configuration/hatnote_settings";
import {VisualisationDirector} from "./theme/visualisationDirector";
import {EventBridge} from "./service_event/event_bridge";
import {WebsocketManager} from "./websocket/websocket";
import {HatnoteVisService} from "./service_event/model";
import {HelpPage} from "./help/help_page";
import {select} from "d3";
import {Canvas} from "./canvas/canvas";
import {Visualisation} from "./theme/model";
import {Transition} from "./canvas/transition";
import {Header} from "./canvas/header";

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
    let visDirector = new VisualisationDirector(settings_data);

    // create observables
    let newCircleSubject: Subject<CircleData> = new Subject()
    let newBannerSubject: Subject<BannerData> = new Subject()
    let onCarouselTransitionStart: Subject<[HatnoteVisService, Visualisation]> = new Subject()
    let onThemeHasChanged: Subject<[HatnoteVisService, Visualisation]> = new Subject()
    let onCarouselTransitionEnd: Subject<[HatnoteVisService, Visualisation]> = new Subject()
    let showWebsocketInfoboxSubject: Subject<NetworkInfoboxData> = new Subject()
    let updateDatabaseInfoSubject: Subject<DatabaseInfo> = new Subject()
    let updateVersionSubject: Subject<[string,number]> = new Subject()

    new Header(select(appContainer), visDirector, onThemeHasChanged, updateVersionSubject)

    const transition = new Transition(select(appContainer), visDirector)

    // build canvas
    new Canvas(visDirector, settings_data, newCircleSubject,
        showWebsocketInfoboxSubject, updateVersionSubject, onCarouselTransitionStart, onThemeHasChanged,
        onCarouselTransitionEnd, updateDatabaseInfoSubject, newBannerSubject, select(appContainer), transition)

    // load audio
    let audio = new HatnoteAudio(settings_data);

    // init event bridge
    let event_bridge = new EventBridge(audio, newCircleSubject, newBannerSubject, updateVersionSubject,
        onCarouselTransitionStart, onThemeHasChanged,onCarouselTransitionEnd, settings_data)

    // start websocket
    new WebsocketManager(settings_data, showWebsocketInfoboxSubject, updateDatabaseInfoSubject, event_bridge);
}

function component() {
    const element = document.createElement('div');
    element.setAttribute("id", "app");
    element.setAttribute('style', 'height: 100vh')

    return element;
}