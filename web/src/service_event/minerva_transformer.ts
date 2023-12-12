import {DelayedCircleEvent, MinervaTransformedData, ServiceEvent} from "./model";
import {MinervaWebsocketMessage} from "../websocket/model";

export class MinervaTransformer{
    public async transformData(minervaMessages: MinervaWebsocketMessage[], queryTime: number){
        let minervaTransformedData: MinervaTransformedData = {
            messageEvents: []
        }

        let transformFileCreationsAndEditings = this.transformMessages(minervaMessages, queryTime);

        await Promise.all([transformFileCreationsAndEditings]).then((values) => {
            minervaTransformedData.messageEvents = values[0]
        });

        return minervaTransformedData;
    }

    public transformMessages(minervaMessages: MinervaWebsocketMessage[], queryTime: number){
        let messagesEvents: DelayedCircleEvent[] = []

        if (minervaMessages !== null) {
            let convertedType: ServiceEvent | undefined;
            for (let index = 0; index < minervaMessages.length; index++) {
                switch (minervaMessages[index].ChannelType) {
                    case "P":
                        convertedType = ServiceEvent.minerva_private_message;
                        break;
                    case "O":
                        convertedType = ServiceEvent.minerva_public_message;
                        break;
                    case "G":
                        convertedType = ServiceEvent.minerva_group_message;
                        break;
                    case "D":
                        convertedType = ServiceEvent.minerva_direct_message;
                        break;
                }

                let sleepTime: number;
                if (index === 0) {
                    sleepTime = minervaMessages[index].CreatedAt - queryTime
                } else {
                    sleepTime = minervaMessages[index].CreatedAt - minervaMessages[index - 1].CreatedAt
                }

                if(convertedType !== undefined){
                    messagesEvents.push({delay: sleepTime, event: convertedType, title: minervaMessages[index].InstituteName,
                        radius: minervaMessages[index].MessageLength})
                }
            }
        }

        return messagesEvents
    }
}