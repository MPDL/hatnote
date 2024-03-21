import {Selection} from "d3";
import {BannerData} from "../../observable/model";
import {Banner} from "./banner";
import {Canvas} from "./canvas";

export class BannerLayer{
    public readonly canvas: Canvas
    private readonly root: Selection<SVGGElement, unknown, null, any>;
    private banner:  Banner | null
    constructor(canvas: Canvas) {
        this.canvas = canvas
        this.root = canvas.appendSVGElement('g').attr('id', 'banner_layer')
        this.banner = null;

        canvas.newBannerSubject.subscribe({
            next: (value) => this.addBanner(value)
        })
    }

    public addBanner(bannerData: BannerData){
        if(this.banner !== null || this.canvas.visDirector.current_service_theme?.id_name !== this.canvas.visDirector.getHatnoteService(bannerData.serviceEvent)) {
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