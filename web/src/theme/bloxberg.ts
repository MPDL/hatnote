import {ServiceTheme} from "./model";
import BloxbergLogo from "../../assets/images/Bloxberg-X-sq.png";
import TransitionBloxbergLogo from "../../assets/images/bloxberg.png";
import QrCodeBloxberg from "../../assets/images/qr-code-bloxberg.png";
import {HatnoteVisService, ServiceEvent} from "../service_event/model";

export const bloxberg_service_theme: ServiceTheme = {
    name: 'bloxberg',
    id_name: HatnoteVisService.Bloxberg,
    color1: 'rgb(124, 169, 175)',
    color2: 'rgb(224, 29, 108)',
    color3: 'rgb(235, 233, 233)',
    header_title: 'Listen to bloxberg',
    header_logo: BloxbergLogo,
    carousel_time: 300000,
    header_y: 0,
    transition_logo: TransitionBloxbergLogo,
    qr_code: {
        image: QrCodeBloxberg,
        line1: 'You want to know more',
        line2: 'about bloxberg?'
    },
    legend_items: [
        {
            position_x: 370,
            title: 'block',
            event: ServiceEvent.bloxberg_block
        },
        {
            position_x: 220,
            title: 'transaction',
            event: ServiceEvent.bloxberg_confirmed_transaction
        }
    ],
}