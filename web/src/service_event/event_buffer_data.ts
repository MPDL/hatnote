import {DelayedCircleEvent, ServiceEvent} from "./model";
import {getRandomIntInclusive} from "../util/random";
import c from "config";

export class EventBufferData {
    private eventCirclesMap: Map<string, DelayedCircleEvent[]>
    private eventCirclesArray: DelayedCircleEvent[]
    private readonly hatnote_map: boolean;
    private radii: number[]
    public circleGroupCatchTimespan; // in ms
    public bufferSplitDelayTimespan; // in ms
    private readonly publishCircleEvent : (circleEvent: DelayedCircleEvent[]) => void

    constructor(publishCircleEvent: (circleEvent: DelayedCircleEvent[]) => void, hatnote_map: boolean, circleGroupCatchTimespan: number, bufferSplitDelayTimespan: number = 1000) {
        this.circleGroupCatchTimespan = circleGroupCatchTimespan;
        this.bufferSplitDelayTimespan = bufferSplitDelayTimespan
        this.hatnote_map = hatnote_map;
        this.eventCirclesMap = new Map<string, DelayedCircleEvent[]>;
        this.eventCirclesArray = [];
        this.radii = [];
        this.publishCircleEvent = publishCircleEvent
    }

    public addCircleEvent(circle: DelayedCircleEvent){
        let keyCircles = this.eventCirclesMap.get(circle.title)
        if(keyCircles){
            keyCircles.push(circle)
        } else {
            this.eventCirclesMap.set(circle.title, [circle])
        }
        this.eventCirclesArray.push(circle)

        this.radii.push(circle.radius)
    }

    public addCircleEvents(circles: DelayedCircleEvent[]){
        for (const circle of circles) {
            let keyCircles = this.eventCirclesMap.get(circle.title)
            if(keyCircles){
                keyCircles.push(circle)
            } else {
                this.eventCirclesMap.set(circle.title, [circle])
            }
            this.eventCirclesArray.push(circle)
            this.radii.push(circle.radius)
        }
    }

    public isEventCirclesArrayEmpty(){
        return this.eventCirclesArray.length === 0
    }

    public getEventCirclesMapNumber() : number {
        let number = 0;
        for (const keyCircles of this.eventCirclesMap.values()) {
            number += keyCircles.length;
        }
        return number
    }

    private generateSingleCircleSubTitle(titleInput: string, serviceEvent: ServiceEvent) : string{
        let title = titleInput;
        let eventCirclesNumber = this.eventCirclesArray.length;
        if(serviceEvent === ServiceEvent.keeper_file_edit || serviceEvent === ServiceEvent.keeper_file_create) {
            title = title + ' [' + eventCirclesNumber + ' files]'
        }
        if(serviceEvent === ServiceEvent.keeper_new_library) {
            title = title + ' [' + eventCirclesNumber + ' libraries]'
        }
        if(serviceEvent === ServiceEvent.minerva_public_message || serviceEvent === ServiceEvent.minerva_direct_message
            || serviceEvent === ServiceEvent.minerva_private_message || serviceEvent === ServiceEvent.minerva_group_message) {
            title = title + ' [' + eventCirclesNumber + ' messages]'
        }
        if(serviceEvent === ServiceEvent.bloxberg_confirmed_transaction) {
            title = title + ' [' + eventCirclesNumber + ' transactions]'
        }
        if(serviceEvent === ServiceEvent.bloxberg_block) {
            title = title + ' [' + eventCirclesNumber + ' blocks]'
        }

        return title;
    }

    public generateSingleCircleTitle(serviceEvent: ServiceEvent, circle?: DelayedCircleEvent) : string {
        if(circle){
            return this.generateSingleCircleSubTitle(circle.title,serviceEvent);
        } else {
            let title = this.getRandomUniqueTitle()
            let uniqueTitlesNumber = this.getUniqueTitlesNumber()
            if(uniqueTitlesNumber > 1) {
                title = title + ' and ' + (uniqueTitlesNumber-1) + ' others';
                title = this.generateSingleCircleSubTitle(title,serviceEvent);
            } else {
                title = this.generateSingleCircleSubTitle(title,serviceEvent);
            }

            return title;
        }
    }

    public releaseBuffer(delay: number = 0){
        if(this.isEventCirclesArrayEmpty())
            return

        let thisBufferData = this
        setTimeout(function(){
            if(thisBufferData.hatnote_map){
                for (let [key, circles] of thisBufferData.eventCirclesMap) {
                    thisBufferData.publishCircleEvent([{
                        event: circles[0].event, title: thisBufferData.generateSingleCircleTitle(circles[0].event, circles[0]),
                        radius: 4,
                        delay: 0,
                        location: circles[0].location
                    }])
                }
            } else {
                let firstCircle = thisBufferData.eventCirclesArray[0];
                thisBufferData.publishCircleEvent([{event: firstCircle.event,
                    title: thisBufferData.generateSingleCircleTitle(firstCircle.event),
                    radius: thisBufferData.getRadiiAvg(), delay: 0}])
            }
            thisBufferData.reset()
        }, delay);
    }

    public splitBufferAndRelease(split: number){
        // how many items are in one chunk
        let chunkSize = this.eventCirclesArray.length / (split+1);
        if(chunkSize < 1){
            chunkSize = 1
        }
        // the actual chunkNumber may be different than we can suggest from the split value, so we have to calculate it
        // the number of chunks that contain 'chunkSize' number of elements
        let chunkNumber = this.eventCirclesArray.length / chunkSize
        let delayBase = this.bufferSplitDelayTimespan / chunkNumber
        // Array.slice function applies Math.floor to the arguments, so we need to make sure that chunkSize is large enough
        let chunkSizeInt = Math.ceil(chunkSize)
        for (let i = 0; i < this.eventCirclesArray.length; i += chunkSizeInt) {
            const chunk = this.eventCirclesArray.slice(i, i + chunkSizeInt);
            let chunkBufferData = new EventBufferData(
                (circleEvent) => this.publishCircleEvent(circleEvent),this.hatnote_map,
                this.circleGroupCatchTimespan, this.bufferSplitDelayTimespan
            )
            chunkBufferData.addCircleEvents(chunk)
            // +1 to also delay the first event which is wanted by user feedback for bloxberg
            chunkBufferData.releaseBuffer((i+1) *delayBase)
        }
        this.reset()
    }

    private getRandomUniqueTitle(){
        let uniqueTitlesArray = Array.from(this.eventCirclesMap.keys());
        return uniqueTitlesArray.at(getRandomIntInclusive(0, uniqueTitlesArray.length-1)) ?? ''
    }

    private getUniqueTitlesNumber(){
        let uniqueTitlesArray = Array.from(this.eventCirclesMap.keys());
        return uniqueTitlesArray.length;
    }

    private getRadiiAvg(){
        if(this.radii.length === 0){
            return 0
        }
        return this.radii.reduce((x,y) => x+y, 0)/this.radii.length;
    }

    private reset(){
        this.eventCirclesArray = [];
        this.eventCirclesMap = new Map<string, DelayedCircleEvent[]>;
        this.radii = [];
    }
}