export interface BannerEvent{
    event: ServiceEvent;
    title: string;
}

export interface DelayedCircleEvent {
    event: ServiceEvent;
    title: string;
    radius: number;
    delay: number
}

export interface BloxbergTransformedData{
    blocksEvents: DelayedCircleEvent[]
    confirmedTransactionEvents: DelayedCircleEvent[]
    licensedContributorEvent: BannerEvent | null
}

export interface KeeperTransformedData{
    fileCreationAndEditingEvents: DelayedCircleEvent[]
    createdLibraryEvents: DelayedCircleEvent[]
    activatedUser: BannerEvent | null
}

export interface MinervaTransformedData{
    messageEvents: DelayedCircleEvent[]
}

export enum ServiceEvent {
    minerva_public_message,
    minerva_group_message,
    minerva_private_message,
    minerva_direct_message,
    keeper_file_edit,
    keeper_file_create,
    keeper_new_user,
    keeper_new_library,
    bloxberg_block,
    bloxberg_confirmed_transaction,
    bloxberg_licensed_contributor
}

export enum HatnoteVisService {
    Minerva,
    Keeper,
    Bloxberg
}