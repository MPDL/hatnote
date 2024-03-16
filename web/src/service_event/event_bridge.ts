import {BloxbergTransformer} from "./bloxberg_transformer";
import {HatnoteAudio} from "../audio/hatnote_audio";
import {BehaviorSubject, Subject} from "rxjs";
import {BannerData, CircleData} from "../observable/model";
import {BloxbergWebsocketData, KeeperWebsocketData, MinervaWebsocketData, WebsocketEventInfo} from "../websocket/model";
import {
    BannerEvent,
    BloxbergTransformedData,
    DelayedCircleEvent,
    HatnoteVisService,
    KeeperTransformedData,
    MinervaTransformedData
} from "./model";
import {EventBuffer} from "./event_buffer";
import {SettingsData} from "../configuration/hatnote_settings";
import {KeeperTransformer} from "./keeper_transformer";
import {MinervaTransformer} from "./minerva_transformer";
import {Visualisation} from "../theme/model";

export class EventBridge{
    private bloxbergTransformer: BloxbergTransformer;
    private keeperTransformer: KeeperTransformer;
    private minervaTransformer: MinervaTransformer;
    private audio: HatnoteAudio | undefined;
    private newCircleSubject: Subject<CircleData>;
    private newBannerSubject: Subject<BannerData>;
    private onCarouselTransitionStart: BehaviorSubject<[HatnoteVisService, Visualisation]>
    private onThemeHasChanged: BehaviorSubject<[HatnoteVisService, Visualisation]>
    private eventBuffer: EventBuffer;
    private updateVersionSubject: Subject<[string,number]>
    private _currentService: HatnoteVisService
    private _currentVisualisation: Visualisation
    private settings_data: SettingsData
    private readonly event_delay_protection: number
    public get currentService(): HatnoteVisService{
        return this._currentService;
    }

    public get currentVisualisation(): Visualisation{
        return this._currentVisualisation;
    }
    constructor(audio: HatnoteAudio | undefined, newCircleSubject: Subject<CircleData>, newBanenrSubject: Subject<BannerData>,
                updateVersionSubject: Subject<[string,number]>,
                onCarouselTransitionStart: BehaviorSubject<[HatnoteVisService, Visualisation]>,
                onCarouselTransitionMid: BehaviorSubject<[HatnoteVisService, Visualisation]>,
                onCarouselTransitionEnd: BehaviorSubject<[HatnoteVisService, Visualisation]>,
                settings_data: SettingsData) {
        this.settings_data = settings_data
        this.event_delay_protection = settings_data.event_delay_protection
        this._currentService = settings_data.initialService
        this._currentVisualisation = settings_data.map ? Visualisation.geo : Visualisation.listenTo
        this.updateVersionSubject = updateVersionSubject
        this.newBannerSubject = newBanenrSubject
        this.onCarouselTransitionStart = onCarouselTransitionStart
        this.onThemeHasChanged = onCarouselTransitionMid
        this.minervaTransformer = new MinervaTransformer()
        this.bloxbergTransformer = new BloxbergTransformer(settings_data)
        this.keeperTransformer = new KeeperTransformer(settings_data)
        this.audio = audio
        this.newCircleSubject = newCircleSubject
        this.eventBuffer = new EventBuffer(this.settings_data.default_event_buffer_timespan,
            (value) => this.publishCircleEvent(value), this)

        this.onCarouselTransitionStart.subscribe({
            next: (value) => {
                this.audio?.play_transition_sound()
            }
        })

        this.onThemeHasChanged.subscribe({
            next: (value) => {
                this._currentService = value[0]
                this._currentVisualisation = value[1]
            }
        })
    }

    // This function assumes the incoming events are ordered descending.
    // First element is the earliest in the list, last element is the most recent event.
    public async addMinervaEvents(minervaData: MinervaWebsocketData, eventInfo: WebsocketEventInfo){
        if(this.currentService !== HatnoteVisService.Minerva){
            return
        }

        if(this.settings_data.debug_mode){
            console.log('Minerva events:')
            console.log(minervaData)
            console.log('Event info:')
            console.log(eventInfo)
        }

        const minervaMessages = minervaData.Messages;

        let transformedData: MinervaTransformedData = await this.minervaTransformer.transformData(minervaMessages, eventInfo.FromTimepoint)

        if(this.settings_data.debug_mode){
            console.log('Transformed minerva events:')
            console.log(transformedData)
        }

        this.updateVersionSubject.next([eventInfo.Version, eventInfo.ExpectedFrontendVersion])
        this.addEventsToBuffer(transformedData.messageEvents)
    }

    // This function assumes the incoming events are ordered descending.
    // First element is the earliest in the list, last element is the most recent event.
    public async addKeeperEvents(keeperData: KeeperWebsocketData, eventInfo: WebsocketEventInfo){
        if(this.currentService !== HatnoteVisService.Keeper){
            return
        }

        if(this.settings_data.debug_mode){
            console.log('Keeper events:')
            console.log(keeperData)
            console.log('Event info:')
            console.log(eventInfo)
        }

        const fileCreationsAndEditings = keeperData.FileCreationsAndEditings;
        const libraryCreations = keeperData.LibraryCreations;
        const activatedUsers = keeperData.ActivatedUsers;

        let transformedData: KeeperTransformedData = await this.keeperTransformer.transformData(fileCreationsAndEditings, libraryCreations, activatedUsers, eventInfo.FromTimepoint)

        if(this.settings_data.debug_mode){
            console.log('Transformed keeper events:')
            console.log(transformedData)
        }

        if(transformedData.activatedUser !== null){
            this.publishBannerEvent(transformedData.activatedUser)
        }
        this.updateVersionSubject.next([eventInfo.Version, eventInfo.ExpectedFrontendVersion])
        this.addEventsToBuffer(transformedData.fileCreationAndEditingEvents)
        this.addEventsToBuffer(transformedData.createdLibraryEvents)
    }

    // This function assumes the incoming events are ordered descending.
    // First element is the earliest in the list, last element is the most recent event.
    public async addBloxbergEvents(bloxbergData: BloxbergWebsocketData, eventInfo: WebsocketEventInfo){
        if(this.currentService !== HatnoteVisService.Bloxberg){
            return
        }

        if(this.settings_data.debug_mode){
            console.log('Bloxberg events:')
            console.log(bloxbergData)
            console.log('Event info:')
            console.log(eventInfo)
        }

        const blocks = bloxbergData.Blocks;
        const confirmedTransactions = bloxbergData.ConfirmedTransactions;
        const licensedContributors = bloxbergData.LicensedContributors;

        let transformedData: BloxbergTransformedData = await this.bloxbergTransformer.transformData(blocks, confirmedTransactions, licensedContributors, eventInfo.FromTimepoint)

        if(this.settings_data.debug_mode){
            console.log('Transformed bloxberg events:')
            console.log(transformedData)
        }

        if(transformedData.licensedContributorEvent !== null){
            this.publishBannerEvent(transformedData.licensedContributorEvent)
        }
        this.updateVersionSubject.next([eventInfo.Version, eventInfo.ExpectedFrontendVersion])
        this.addEventsToBuffer(transformedData.blocksEvents)
        this.addEventsToBuffer(transformedData.confirmedTransactionEvents)
    }

    private async addEventsToBuffer(circleEvents: DelayedCircleEvent[]){
        let skippedDelay = 0
        for (const circle of circleEvents) {
            // circle.delay > 142 is there to avoid massive callbacks from setTimout function which let the performance suffer, especially in firefox
            // skippedDelay > 142 is there to avoid grouping too many events into one circle
            if (circle.delay > this.event_delay_protection || skippedDelay > this.event_delay_protection) {
                if(skippedDelay > this.event_delay_protection){
                    await this.sleep(this.event_delay_protection)
                }else {
                    await this.sleep(circle.delay)
                }
                skippedDelay = 0
            } else {
                skippedDelay += circle.delay
            }

            this.eventBuffer.addCircle(circle)
        }
    }

    public publishCircleEvent(circleEvents: DelayedCircleEvent[]){
        // otherwise circles will be added to the canvas when the tab is inactive but will never fade out because the
        // browser stops animations to save energy and to increase performance when a tab is inactive
        if (!document.hidden){
            for (const delayedCircleEvent of circleEvents) {
                if(this._currentVisualisation === Visualisation.listenTo){
                    this.audio?.play_sound(delayedCircleEvent.radius, delayedCircleEvent.event)
                }
                this.newCircleSubject.next({label_text: delayedCircleEvent.title,
                    circle_radius: delayedCircleEvent.radius, type: delayedCircleEvent.event,
                    location: delayedCircleEvent.location})
            }
        }
    }

    public publishBannerEvent(bannerEvent: BannerEvent){
        if (!document.hidden){
            if(this._currentVisualisation === Visualisation.listenTo) {
                this.audio?.play_sound(0, bannerEvent.event)
            }
            this.newBannerSubject.next({message: bannerEvent.title, serviceEvent: bannerEvent.event})
        }
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


export function fromRangeToAnotherRange(OldValue:number, OldMin:number, OldMax:number, NewMin:number,NewMax:number){
    // https://stackoverflow.com/questions/929103/convert-a-number-range-to-another-range-maintaining-ratio
    let OldRange = OldMax - OldMin;
    let NewRange = NewMax - NewMin;
    return (((OldValue - OldMin) * NewRange) / OldRange) + NewMin;
}