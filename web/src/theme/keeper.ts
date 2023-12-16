import KeeperLogo from "../../assets/images/icon_keeper_positiv_screen.png";
import TransitionKeeperLogo from "../../assets/images/lg_keeper_positiv_screen.png";
import QrCodeKeeper from "../../assets/images/qr-code-keeper.png";
import {ServiceTheme} from "./model";
import {HatnoteVisService, ServiceEvent} from "../service_event/model";

export const keeper_service_theme: ServiceTheme = {
    name: 'Keeper',
    id_name: HatnoteVisService.Keeper,
    color1: 'rgb(112, 111, 111)',
    color2: 'rgb(184, 20, 76)',
    color3: 'rgb(29, 48, 84)',
    header_title: 'Keeper',
    header_logo: KeeperLogo,
    carousel_time: 300000,
    header_y: 2,
    transition_logo: TransitionKeeperLogo,
    qr_code: {
        image: QrCodeKeeper,
        line1: 'You want to know more',
        line2: 'about Keeper?'
    },
    legend_items: [
        {
            position_y_info_box: -20,
            position_x: 390,
            title: 'file create',
            event: ServiceEvent.keeper_file_create
        },
        {
            position_y_info_box: 35,
            position_x: 550,
            title: 'file edit',
            event: ServiceEvent.keeper_file_edit
        },
        {
            position_y_info_box: 90,
            position_x: 190,
            title: 'new library',
            event: ServiceEvent.keeper_new_library
        }
    ],
}