import {EventBufferData} from "./event_buffer_data";
import {DelayedCircleEvent, ServiceEvent} from "./model";
import {getRandomIntInclusive} from "../util/random";

export class EventBuffer {
    private readonly eventBuffer: Map<ServiceEvent, EventBufferData>;

    constructor(default_event_buffer_timespan: number, publishCircleEvent: (circleEvent: DelayedCircleEvent) => void) {
        this.eventBuffer = new Map([
            [ServiceEvent.bloxberg_block, new EventBufferData(publishCircleEvent, default_event_buffer_timespan)],
            [ServiceEvent.bloxberg_confirmed_transaction, new EventBufferData(publishCircleEvent, default_event_buffer_timespan, 1200)],
            [ServiceEvent.keeper_file_create, new EventBufferData(publishCircleEvent, 1000,1000)], // Keeper only returns time precision of seconds
            [ServiceEvent.keeper_file_edit, new EventBufferData(publishCircleEvent, 1000,1000)], // Keeper only returns time precision of seconds
            [ServiceEvent.keeper_new_library, new EventBufferData(publishCircleEvent, 1000,1000)], // Keeper only returns time precision of seconds
            [ServiceEvent.minerva_direct_message, new EventBufferData(publishCircleEvent, default_event_buffer_timespan)],
            [ServiceEvent.minerva_private_message, new EventBufferData(publishCircleEvent, default_event_buffer_timespan)],
            [ServiceEvent.minerva_public_message, new EventBufferData(publishCircleEvent, default_event_buffer_timespan)],
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

        if(eventBufferData.isEventCirclesEmpty()){
            setTimeout(function(){
                switch (circleEvent) {
                    case ServiceEvent.keeper_file_create:
                    case ServiceEvent.keeper_file_edit:
                        let splitRandom = getRandomIntInclusive(1,4)
                        eventBufferData?.splitBufferAndRelease(splitRandom)
                        break;
                    case ServiceEvent.bloxberg_confirmed_transaction:
                        let splitRandomBloxberg = 3
                        eventBufferData?.splitBufferAndRelease(splitRandomBloxberg)
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