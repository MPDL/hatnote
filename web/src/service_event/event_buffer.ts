import {EventBufferData} from "./event_buffer_data";
import {DelayedCircleEvent, ServiceEvent} from "./model";
import {getRandomIntInclusive} from "../util/random";
import {EventBridge} from "./event_bridge";
import {Visualisation} from "../theme/model";

export class EventBuffer {
    private readonly eventBuffer: Map<ServiceEvent, EventBufferData>;
    public readonly eventBridge: EventBridge;

    constructor(default_event_buffer_timespan: number, publishCircleEvent: (circleEvent: DelayedCircleEvent[]) => void, eventBridge: EventBridge) {
        this.eventBridge = eventBridge;
        this.eventBuffer = new Map([
            [ServiceEvent.bloxberg_block, new EventBufferData(publishCircleEvent, this, default_event_buffer_timespan)],
            [ServiceEvent.bloxberg_confirmed_transaction, new EventBufferData(publishCircleEvent, this, default_event_buffer_timespan,1200)],
            [ServiceEvent.keeper_file_create, new EventBufferData(publishCircleEvent, this, 1000,1000)], // Keeper only returns time precision of seconds
            [ServiceEvent.keeper_file_edit, new EventBufferData(publishCircleEvent, this, 1000,1000)], // Keeper only returns time precision of seconds
            [ServiceEvent.keeper_new_library, new EventBufferData(publishCircleEvent, this, 1000,1000)], // Keeper only returns time precision of seconds
            [ServiceEvent.minerva_direct_message, new EventBufferData(publishCircleEvent, this, default_event_buffer_timespan)],
            [ServiceEvent.minerva_private_message, new EventBufferData(publishCircleEvent, this, default_event_buffer_timespan)],
            [ServiceEvent.minerva_public_message, new EventBufferData(publishCircleEvent, this, default_event_buffer_timespan)],
        ]);
    }

    public addCircle(circle: DelayedCircleEvent){
        let circleEvent = circle.event

        // this step is needed to group direct messages and group messages together inside the event buffer map
        if(circleEvent === ServiceEvent.minerva_group_message){
            circleEvent = ServiceEvent.minerva_direct_message
        }
        let eventBufferData = this.eventBuffer.get(circleEvent);
        if(eventBufferData === undefined)
            return

        if(eventBufferData.isEventCirclesArrayEmpty()){
            let that = this;
            setTimeout(function(){
                switch (circleEvent) {
                    case ServiceEvent.keeper_file_create:
                    case ServiceEvent.keeper_file_edit:
                        if (that.eventBridge.currentVisualisation !== Visualisation.geo) {
                            let splitRandom = getRandomIntInclusive(1,4)
                            eventBufferData?.splitBufferAndRelease(splitRandom)
                        } else {
                            eventBufferData?.releaseBuffer()
                        }
                        break;
                    case ServiceEvent.bloxberg_confirmed_transaction:
                        if (that.eventBridge.currentVisualisation !== Visualisation.geo) {
                            let splitRandomBloxberg = 3
                            eventBufferData?.splitBufferAndRelease(splitRandomBloxberg)
                        } else {
                            eventBufferData?.releaseBuffer()
                        }
                        break;
                    default:
                        eventBufferData?.releaseBuffer()
                        break;
                }
            }, eventBufferData.circleGroupCatchTimespan);
        }
        this.eventBuffer.get(circleEvent)?.addCircleEvent(circle);
    }
}