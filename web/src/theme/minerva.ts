import {ServiceTheme} from "./model";
import MinervaLogo from "../../assets/images/minervamessenger-banner-kussmund+bulb.png";
import TransitionMinervaLogo from "../../assets/images/Banner_Minerva_Messenger_ohne Kussmund_new.png";
import QrCodeMinerva from "../../assets/images/qr-code-minerva.png";
import {HatnoteVisService, ServiceEvent} from "../service_event/model";

export const minerva_service_theme: ServiceTheme = {
    name: 'Minerva',
    id_name: HatnoteVisService.Minerva,
    color1: 'rgb(2, 110, 153)',
    color2: 'rgb(224, 236, 241)',
    color3: 'rgb(231, 41, 111)',
    header_title: 'Minerva Messenger',
    header_logo: MinervaLogo,
    carousel_time: 300000,
    header_y: 4,
    transition_logo: TransitionMinervaLogo,
    qr_code: {
        image: QrCodeMinerva,
        line1: 'You want to know more',
        line2: 'about Minerva Messenger?'
    },
    legend_items: [
        {
            position_y_info_box: -20,
            position_x_small_title: 140,
            smallTitle1: 'direct',
            smallTitle2: 'message',
            event: ServiceEvent.minerva_direct_message
        },
        {
            position_y_info_box: 35,
            position_x_small_title: 300,
            smallTitle1: 'private',
            smallTitle2: 'channel',
            event: ServiceEvent.minerva_private_message
        },
        {
            position_y_info_box: 90,
            position_x_small_title: 450,
            smallTitle1: 'public',
            smallTitle2: 'channel',
            event: ServiceEvent.minerva_public_message
        }
    ],
}