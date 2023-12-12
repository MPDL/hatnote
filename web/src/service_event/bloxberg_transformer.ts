import {
    BannerEvent, BloxbergTransformedData,
    DelayedCircleEvent, ServiceEvent
} from "./model";
import {
    BloxbergWebsocketBlock,
    BloxbergWebsocketConfirmedTransaction,
    BloxbergWebsocketLicensedContributor
} from "../websocket/model";
import {fromRangeToAnotherRange} from "./event_bridge";
import {SettingsData} from "../configuration/hatnote_settings";

export class BloxbergTransformer {
    private readonly settings_data: SettingsData

    constructor(settings_data: SettingsData) {
        this.settings_data = settings_data
    }
    public async transformData(blocks: BloxbergWebsocketBlock[], confirmedTransactions: BloxbergWebsocketConfirmedTransaction[],
                         licensedContributors: BloxbergWebsocketLicensedContributor[], queryTime: number): Promise<BloxbergTransformedData> {
        let bloxbergTransformedData: BloxbergTransformedData = {
            blocksEvents: [],
            confirmedTransactionEvents: [],
            licensedContributorEvent: null
        }

        let transformBlocks = this.transformBlocks(blocks, queryTime);
        let transformConfirmedTransaction =this.transformConfirmedTransactions(confirmedTransactions, queryTime);
        let transformLicensedContributor =this.transformLicensedContributors(licensedContributors);

        await Promise.all([transformBlocks, transformConfirmedTransaction, transformLicensedContributor]).then((values) => {
            bloxbergTransformedData.blocksEvents = values[0]
            bloxbergTransformedData.confirmedTransactionEvents = values[1]
            bloxbergTransformedData.licensedContributorEvent = values[2]
        });

        return bloxbergTransformedData;
    }

    private async transformBlocks(blocks: BloxbergWebsocketBlock[], queryTimeFrom: number){
        let blockEvents: DelayedCircleEvent[] = []

        if (blocks !== null) {
            for (let index = 0; index < blocks.length; index++) {
                let circleRadius:number = 0;
                let size: number = blocks[index].ByteSize;
                // calculated block sizes of the entire qa db data
                // min = 567
                // AVG = 819
                // max = 130196
                let blockSizeMin = 567;
                // lets choose something closer to the average. It appears that most data is closer to the avg value.
                let blockSizeMax = 1200;
                // use log scaling, and also ensure that the value is closer to the defined
                // min value
                // 89 = 567/Math.log(567)
                let scaledSize: number = Math.log(size) * 89;
                if(scaledSize < blockSizeMin) {
                    scaledSize = blockSizeMin;
                }
                if(scaledSize > blockSizeMax) {
                    scaledSize = blockSizeMax;
                }
                circleRadius = fromRangeToAnotherRange(scaledSize, blockSizeMin, blockSizeMax, this.settings_data.circle_radius_min, this.settings_data.circle_radius_max);
                circleRadius *= 2; // decision based on user feedback

                let sleepTime: number;
                if (index === 0) {
                    sleepTime = blocks[index].InsertedAt - queryTimeFrom
                } else {
                    sleepTime = blocks[index].InsertedAt - blocks[index - 1].InsertedAt
                }

                let label_text = blocks[index].Miner
                if(label_text.length === 0){
                    label_text = '0x' + blocks[index].MinerHash
                }
                blockEvents.push({delay: sleepTime, event: ServiceEvent.bloxberg_block, title: label_text,
                    radius: circleRadius})
            }
        }
        return blockEvents
    }

    private transformConfirmedTransactions(confirmedTransactions: BloxbergWebsocketConfirmedTransaction[], queryTimeFrom: number) {
        let confirmedTransactionEvents: DelayedCircleEvent[] = []

        if (confirmedTransactions !== null) {
            for (let index = 0; index < confirmedTransactions.length; index++) {
                let circleRadius:number = 0;
                // multiplied by arbitrary value to scale transaction fee up
                let transactionFee: number = confirmedTransactions[index].TransactionFee * 1000000000;
                // calculated input in bytes of transactions of the entire qa db data
                // min = 0
                // AVG = 257
                // max = 128804
                let transactionInputMin = 10;
                // lets choose something closer to the average. It appears that most data is closer to the avg value.
                let transactionInputMax = 700; // TODO: look up average gas_used and gas_price to detemine min and max value
                // 4 = 10/Math.log(10)
                let scaledSize: number = Math.log(transactionFee) * 4;
                if(scaledSize < transactionInputMin) {
                    scaledSize = transactionInputMin;
                }
                if(scaledSize > transactionInputMax) {
                    scaledSize = transactionInputMax;
                }
                circleRadius = fromRangeToAnotherRange(scaledSize, transactionInputMin, transactionInputMax, this.settings_data.circle_radius_min, this.settings_data.circle_radius_max);

                let sleepTime: number;
                if (index === 0) {
                    sleepTime = confirmedTransactions[index].UpdatedAt - queryTimeFrom
                } else {
                    sleepTime = confirmedTransactions[index].UpdatedAt - confirmedTransactions[index - 1].UpdatedAt
                }

                let label_text = confirmedTransactions[index].BlockMiner
                if(label_text.length === 0) {
                    label_text = '0x' + confirmedTransactions[index].BlockMinerHash
                }
                confirmedTransactionEvents.push({delay: sleepTime, event: ServiceEvent.bloxberg_confirmed_transaction, title: label_text, radius: circleRadius})
            }
        }

        return confirmedTransactionEvents
    }

    private transformLicensedContributors(licensedContributors: BloxbergWebsocketLicensedContributor[]): BannerEvent | null {
        let licensedContributorEvents: BannerEvent|null = null

        if (licensedContributors !== null && licensedContributors.length > 0) {
            let eventType = ServiceEvent.bloxberg_licensed_contributor;

            let messages;
            if(licensedContributors.length == 1) {
                messages = ["bloxberg has a new licensed contributor: " + licensedContributors[0].Name + ", bloxberg's newest library!",
                    "Wow, " + licensedContributors[0].Name + " has joined bloxberg as a new licensed contributor!"];
            } else {
                messages = [licensedContributors[0].Name + " and " + (licensedContributors.length- 1) + " others have joined bloxberg! bloxberg's newest licensed contributors!",
                    "Wow, " + licensedContributors[0].Name + " and " + (licensedContributors.length- 1) + " other licensed contributors have joined bloxberg!"];
            }

            let message = messages[Math.floor(Math.random() * messages.length)]

            licensedContributorEvents = {title: message, event: eventType }
        }

        return licensedContributorEvents
    }
}