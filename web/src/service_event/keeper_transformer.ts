import {BannerEvent, DelayedCircleEvent, ServiceEvent, KeeperTransformedData} from "./model";
import {
    KeeperWebsocketActivatedUsers,
    KeeperWebsocketFileCreationsAndEditings,
    KeeperWebsocketLibraryCreations
} from "../websocket/model";
import {fromRangeToAnotherRange} from "./event_bridge";
import {SettingsData} from "../configuration/hatnote_settings";

export class KeeperTransformer{
    private readonly settings_data: SettingsData

    constructor(settings_data: SettingsData) {
        this.settings_data = settings_data
    }
    async transformData(fileCreationsAndEditings: KeeperWebsocketFileCreationsAndEditings[],
                  libraryCreations: KeeperWebsocketLibraryCreations[],
                  activatedUsers: KeeperWebsocketActivatedUsers[], queryTime: number) {
        let keeperTransformedData: KeeperTransformedData = {
            fileCreationAndEditingEvents: [],
            createdLibraryEvents: [],
            activatedUser: null
        }

        let transformFileCreationsAndEditings = this.transformFileCreationsAndEditings(fileCreationsAndEditings, queryTime);
        let transformLibraryCreations =this.transformLibraryCreations(libraryCreations, queryTime);
        let transformLActivatedUsers =this.transformLActivatedUsers(activatedUsers);

        await Promise.all([transformFileCreationsAndEditings, transformLibraryCreations, transformLActivatedUsers]).then((values) => {
            keeperTransformedData.fileCreationAndEditingEvents = values[0]
            keeperTransformedData.createdLibraryEvents = values[1]
            keeperTransformedData.activatedUser = values[2]
        });

        return keeperTransformedData;
    }

    public async transformFileCreationsAndEditings(fileCreationsAndEditings: KeeperWebsocketFileCreationsAndEditings[], queryTime: number) {
        let fileCreationsAndEditingsEvents: DelayedCircleEvent[] = []

        if (fileCreationsAndEditings !== null) {
            for (let index = 0; index < fileCreationsAndEditings.length; index++) {
                let operation = fileCreationsAndEditings[index]
                let eventType: ServiceEvent | undefined;
                let size: number = operation.OperationSize;
                let circleRadius: number = 0;

                switch (operation.OperationType) {
                    case "create":
                        eventType = ServiceEvent.keeper_file_create;
                        let createMinBoundary = 20869; // first quartile of all file create sizes in June 2023
                        let createMaxBoundary = 281820; // third quartile of all file create sizes in June 2023
                        // use log scaling, and also ensure that the value is closer to the defined
                        // min value
                        // 2098 = 20869/Math.log(20869)
                        let scaledSize: number = Math.log(size) * 2098;
                        if (scaledSize < createMinBoundary) {
                            scaledSize = createMinBoundary;
                        }
                        if (scaledSize > createMaxBoundary) {
                            scaledSize = createMaxBoundary;
                        }
                        circleRadius = fromRangeToAnotherRange(scaledSize, createMinBoundary, createMaxBoundary, this.settings_data.circle_radius_min, this.settings_data.circle_radius_max);
                        break;
                    case "edit":
                        eventType = ServiceEvent.keeper_file_edit;
                        let editMinBoundary = 3032; // first quartile of all file edit sizes in June 2023
                        let editMaxBoundary = 679936; // third quartile of all file edit sizes in June 2023
                        // 378 = 3032/Math.log(3032)
                        let scaledEditSize = Math.log(size) * 378;
                        if (scaledEditSize < editMinBoundary) {
                            scaledEditSize = editMinBoundary;
                        }
                        if (scaledEditSize > editMaxBoundary) {
                            scaledEditSize = editMaxBoundary;
                        }
                        circleRadius = fromRangeToAnotherRange(scaledEditSize, editMinBoundary, editMaxBoundary, this.settings_data.circle_radius_min, this.settings_data.circle_radius_max);
                        break;
                }

                let sleepTime: number;
                if (index === 0) {
                    sleepTime = fileCreationsAndEditings[index].Timestamp - queryTime
                } else {
                    sleepTime = fileCreationsAndEditings[index].Timestamp - fileCreationsAndEditings[index - 1].Timestamp
                }

                let title = operation.InstituteName
                // There are multiple entries for the domain tuebingen.mpg.de inside the rena json used in the backend.
                // They all belong to one campus however.
                if(title === 'tuebingen.mpg.de') {
                    title = 'Max Planck Tübingen'
                }

                if (eventType !== undefined) {
                    fileCreationsAndEditingsEvents.push({delay: sleepTime, event: eventType, title: title,
                        radius: circleRadius})
                }
            }
        }

        return fileCreationsAndEditingsEvents
    }

    public async transformLibraryCreations(libraryCreations: KeeperWebsocketLibraryCreations[], queryTime: number){
        let libraryCreationsEvents: DelayedCircleEvent[] = []

        if (libraryCreations !== null) {
            let eventType = ServiceEvent.keeper_new_library;

            for (let index = 0; index < libraryCreations.length; index++) {
                let libraryCreation = libraryCreations[index]

                let sleepTime: number;
                if (index === 0) {
                    sleepTime = libraryCreations[index].Timestamp - queryTime
                } else {
                    sleepTime = libraryCreations[index].Timestamp - libraryCreations[index - 1].Timestamp
                }

                let title = libraryCreation.InstituteName
                // There are multiple entries for the domain tuebingen.mpg.de inside the rena json used in the backend.
                // They all belong to one campus however.
                if(title === 'tuebingen.mpg.de') {
                    title = 'Max Planck Tübingen'
                }

                if (eventType !== undefined) {
                    libraryCreationsEvents.push({delay: sleepTime, event: eventType, title: title,
                        radius: 70})
                }
            }
        }

        return libraryCreationsEvents
    }

    public async transformLActivatedUsers(activatedUsers: KeeperWebsocketActivatedUsers[]){
        let activatedUsersEvents: BannerEvent|null = null

        if (activatedUsers !== null && activatedUsers.length > 0) {
            let eventType: ServiceEvent = ServiceEvent.keeper_new_user;

                let namedUsers = activatedUsers[0].InstituteName;
                // There are multiple entries for the domain tuebingen.mpg.de inside the rena json used in the backend.
                // They all belong to one campus however.
                if(namedUsers === 'tuebingen.mpg.de') {
                    namedUsers = 'Max Planck Tübingen'
                }

                let messages;
                if(activatedUsers.length == 1) {
                    messages = ["Keeper has a new a new user from " + namedUsers + ", Keeper's newest user!",
                        "Keeper has a new user from " + namedUsers + "! Keep on keeping!",
                        "Wow, a new user from " + namedUsers + " has joined Keeper!"];
                } else {
                    let unique_institutes = new Map<string, number>();
                    for (const activatedUser of activatedUsers) {
                        unique_institutes.set(activatedUser.InstituteName, 0)
                    }
                    messages = [activatedUsers.length + " new users from " + namedUsers + " and " + (unique_institutes.size - 1) + " others! Keeper's newest users!",
                        "Keeper has " + activatedUsers.length + " new users from " + namedUsers + " and " + (unique_institutes.size - 1) + " others! Keep on keeping!",
                        "Wow, " + activatedUsers.length + " new users from " + namedUsers + " and " + (unique_institutes.size - 1) + " others have joined Keeper!"];
                }

                let message = messages[Math.floor(Math.random() * messages.length)]

                activatedUsersEvents = {title: message, event: eventType }
        }

        return activatedUsersEvents
    }
}