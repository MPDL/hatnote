import {DelayedCircleEvent, ServiceEvent} from "./model";
import {getRandomIntInclusive} from "../util/random";

export class EventBufferData {
    private eventCircles: DelayedCircleEvent[]
    private uniqueTitles: Map<string, 0>
    private radii: number[]
    public circleGroupCatchTimespan; // in ms
    public bufferSplitDelayTimespan; // in ms
    private readonly publishCircleEvent : (circleEvent: DelayedCircleEvent) => void

    constructor(publishCircleEvent: (circleEvent: DelayedCircleEvent) => void, circleGroupCatchTimespan: number, bufferSplitDelayTimespan: number = 1000) {
        this.circleGroupCatchTimespan = circleGroupCatchTimespan;
        this.bufferSplitDelayTimespan = bufferSplitDelayTimespan
        this.eventCircles = [];
        this.uniqueTitles = new Map<string, 0>();
        this.radii = [];
        this.publishCircleEvent = publishCircleEvent
    }

    public addCircleEvent(circle: DelayedCircleEvent){
        this.eventCircles.push(circle)
        this.uniqueTitles.set(circle.title,0)
        this.radii.push(circle.radius)
    }

    public addCircleEvents(circles: DelayedCircleEvent[]){
        for (const circle of circles) {
            this.eventCircles.push(circle)
            this.uniqueTitles.set(circle.title,0)
            this.radii.push(circle.radius)
        }
    }

    public isEventCirclesEmpty(){
        return this.eventCircles.length === 0
    }

    public releaseBuffer(delay: number = 0){
        if(this.isEventCirclesEmpty())
            return

        let firstCircle = this.eventCircles[0];
        let thisBufferData = this
        setTimeout(function(){
            let title = thisBufferData.getRandomUniqueTitle()
            let uniqueTitlesNumber = thisBufferData.getUniqueTitlesNumber()
            if(uniqueTitlesNumber > 1) {
                title = title + ' and ' + (uniqueTitlesNumber-1) + ' others'

                if(firstCircle.event === ServiceEvent.keeper_file_edit || firstCircle.event === ServiceEvent.keeper_file_create) {
                    title = title + ' [' + thisBufferData.eventCircles.length + ' files]'
                }
                if(firstCircle.event === ServiceEvent.keeper_new_library) {
                    title = title + ' [' + thisBufferData.eventCircles.length + ' libraries]'
                }
                if(firstCircle.event === ServiceEvent.minerva_public_message || firstCircle.event === ServiceEvent.minerva_direct_message
                    || firstCircle.event === ServiceEvent.minerva_private_message || firstCircle.event === ServiceEvent.minerva_group_message) {
                    title = title + ' [' + thisBufferData.eventCircles.length + ' messages]'
                }
                if(firstCircle.event === ServiceEvent.bloxberg_confirmed_transaction) {
                    title = title + ' [' + thisBufferData.eventCircles.length + ' transactions]'
                }
                if(firstCircle.event === ServiceEvent.bloxberg_block) {
                    title = title + ' [' + thisBufferData.eventCircles.length + ' blocks]'
                }
            }

            thisBufferData.publishCircleEvent({event: firstCircle.event, title: title, radius: thisBufferData.getRadiiAvg(), delay: 0})
            thisBufferData.reset()
        }, delay);
    }

    public splitBufferAndRelease(split: number){
        // how many items are in one chunk
        let chunkSize = this.eventCircles.length / (split+1);
        if(chunkSize < 1){
            chunkSize = 1
        }
        // the actual chunkNumber may be different than we can suggest from the split value, so we have to calculate it
        // the number of chunks that contain 'chunkSize' number of elements
        let chunkNumber = this.eventCircles.length / chunkSize
        let delayBase = this.bufferSplitDelayTimespan / chunkNumber
        // Array.slice function applies Math.floor to the arguments, so we need to make sure that chunkSize is large enough
        let chunkSizeInt = Math.ceil(chunkSize)
        for (let i = 0; i < this.eventCircles.length; i += chunkSizeInt) {
            const chunk = this.eventCircles.slice(i, i + chunkSizeInt);
            let chunkBufferData = new EventBufferData(
                (circleEvent) => this.publishCircleEvent(circleEvent),
                this.circleGroupCatchTimespan, this.bufferSplitDelayTimespan
            )
            chunkBufferData.addCircleEvents(chunk)
            // +1 to also delay the first event which is wanted by user feedback for bloxberg
            chunkBufferData.releaseBuffer((i+1) *delayBase)
        }
        this.reset()
    }

    private getRandomUniqueTitle(){
        let uniqueTitlesArray = Array.from(this.uniqueTitles.keys());
        return uniqueTitlesArray.at(getRandomIntInclusive(0, uniqueTitlesArray.length-1)) ?? ''
    }

    private getUniqueTitlesNumber(){
        let uniqueTitlesArray = Array.from(this.uniqueTitles.keys());
        return uniqueTitlesArray.length;
    }

    private getRadiiAvg(){
        if(this.radii.length === 0){
            return 0
        }
        return this.radii.reduce((x,y) => x+y, 0)/this.radii.length;
    }

    private reset(){
        this.eventCircles = [];
        this.uniqueTitles.clear();
        this.radii = [];
    }
}