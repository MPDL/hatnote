import {select, Selection} from "d3";
import {BehaviorSubject, Subject} from "rxjs";
import {CircleData, DatabaseInfo, NetworkInfoboxData} from "../observable/model";
import {SettingsData} from "../configuration/hatnote_settings";
import {InfoBox, InfoboxType} from "./info_box";
import {CirclesLayer} from "./listen/circles_layer";
import {Header} from "./header";
import {Theme} from "../theme/theme";
import {HatnoteVisService} from "../service_event/model";

export abstract class Canvas {
    abstract header: Header;
    public readonly theme: Theme;
    abstract info_box_websocket: InfoBox;
    abstract info_box_legend: InfoBox;
    public readonly isMobileScreen: boolean = false;
    public readonly settings: SettingsData;
    public readonly showNetworkInfoboxObservable: Subject<NetworkInfoboxData>
    public readonly updateDatabaseInfoSubject: Subject<DatabaseInfo>
    public readonly hatnoteVisServiceChangedSubject: BehaviorSubject<HatnoteVisService>
    public readonly updateVersionSubject: Subject<[string, number]>
    public readonly newCircleSubject: Subject<CircleData>
    public readonly appContainer:  Selection<HTMLDivElement, unknown, null, undefined>;
    protected abstract _root: Selection<SVGSVGElement, unknown, null, any>;
    public get root(): Selection<SVGSVGElement, unknown, null, any> {
        return this._root;
    }
    private _width: number;
    private _height: number;
    public get width(): number {
        return this._width;
    }
    public get height(): number {
        return this._height;
    }
    protected set width(value: number) {
        this._width = value;
    }
    protected set height(value: number) {
        this._height = value;
    }

    protected constructor(theme: Theme, settings: SettingsData, newCircleSubject: Subject<CircleData>,
                          showNetworkInfoboxObservable: Subject<NetworkInfoboxData>,
                          updateVersionSubject: Subject<[string, number]>,
                          hatnoteVisServiceChangedSubject: BehaviorSubject<HatnoteVisService>,
                          updateDatabaseInfoSubject: Subject<DatabaseInfo>,
                          appContainer:  Selection<HTMLDivElement, unknown, null, undefined>) {
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this.theme = theme;
        this.settings = settings
        this.hatnoteVisServiceChangedSubject = hatnoteVisServiceChangedSubject
        this.newCircleSubject = newCircleSubject
        this.showNetworkInfoboxObservable = showNetworkInfoboxObservable
        this.updateDatabaseInfoSubject = updateDatabaseInfoSubject
        this.updateVersionSubject = updateVersionSubject
        this.appContainer = appContainer;
        if (this.width <= 430 || this.height <= 430) { // iPhone 12 Pro Max 430px viewport width
            this.isMobileScreen = true;
        }
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, null, any> {
        return this._root.append(type)
    }

    protected abstract windowUpdate() : void
}