import {Selection} from "d3";
import {ListenToCanvas} from "./listen/listenToCanvas";
import {BannerData} from "../observable/model";
import {Banner} from "./banner";

export class BannerLayer{
    public readonly canvas: ListenToCanvas
    private readonly root: Selection<SVGGElement, unknown, null, any>;
    private banner:  Banner | null
    constructor(canvas: ListenToCanvas) {
        this.canvas = canvas
        this.root = canvas.appendSVGElement('g').attr('id', 'banner_layer')
        this.banner = null;

        canvas.newBannerSubject.subscribe({
            next: (value) => this.addBanner(value)
        })
    }

    public addBanner(bannerData: BannerData){
        if(this.banner !== null || this.canvas.theme.current_service_theme?.id_name !== this.canvas.theme.getHatnoteService(bannerData.serviceEvent)) {
            return;
        }

        this.banner = new Banner(this, bannerData)
    }

    public appendSVGElement(type: string): Selection<SVGGElement, unknown, null, any> {
        return this.root.append(type)
    }

    public removeBanner(){
        this.banner?.remove();
        this.banner = null;
    }

    public windowUpdate() {
        this.banner?.windowUpdate()
    }
}