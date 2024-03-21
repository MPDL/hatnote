import {Transition} from "./transition";
import {ProgressIndicator} from "./progress_indicator";
import {DatabaseInfo} from "../observable/model";
import {BehaviorSubject, Subject} from "rxjs";
import {HatnoteVisService} from "../service_event/model";
import {ServiceTheme, Visualisation} from "../theme/model";
import {Canvas} from "./canvas";

export class Carousel {
    public transition: Transition;
    public readonly progess_indicator: ProgressIndicator;
    public readonly updateDatabaseInfoSubject: Subject<DatabaseInfo>
    public databaseInfo: Map<HatnoteVisService, DatabaseInfo>
    public serviceError: Map<HatnoteVisService, boolean>
    public allServicesHaveError: boolean
    private startCarouselService: HatnoteVisService | null
    private readonly canvas: Canvas;
    private nextTheme: ServiceTheme | undefined;
    private currentCarouselOrderIndex;
    constructor(canvas: Canvas, transition: Transition) {
        this.canvas = canvas
        this.transition = transition
        this.transition.onTransitionStart.subscribe(_ => this.canvas.onCarouselTransitionStart.next(
            [this.canvas.visDirector.current_service_theme.id_name,this.canvas.visDirector.current_visualisation]))
        this.transition.onTransitionMid.subscribe(_ => {
            this.initNextTheme();
            this.canvas.onThemeHasChanged.next(
                [this.canvas.visDirector.current_service_theme.id_name,this.canvas.visDirector.current_visualisation]);
        })
        this.transition.onTransitionEnd.subscribe(_ => {
            this.canvas.onCarouselTransitionEnd.next(
                [this.canvas.visDirector.current_service_theme.id_name,this.canvas.visDirector.current_visualisation])
            this.continueCarousel();
        })
        this.progess_indicator = new ProgressIndicator(this.canvas)
        this.updateDatabaseInfoSubject = this.canvas.updateDatabaseInfoSubject
        this.serviceError = new Map<HatnoteVisService, boolean>()
        this.currentCarouselOrderIndex = 0
        this.allServicesHaveError = false
        this.startCarouselService = this.canvas.visDirector.carousel_service_order[0].id_name
        this.databaseInfo = new Map<HatnoteVisService, DatabaseInfo>()
        this.canvas.visDirector.service_themes.forEach((serviceTheme => {
            this.serviceError.set(serviceTheme.id_name, false)
            this.databaseInfo.set(serviceTheme.id_name, {
                service: serviceTheme.id_name,
                NumberOfDbReconnects: 0,
                NextReconnect: 0,
                IsConnecting: true,
                IsConnectionEstablished: false
            })
        }))

        this.continueCarousel()

        this.updateDatabaseInfoSubject.subscribe({
            next: (dbInfo: DatabaseInfo) => {
                this.databaseInfo.delete(dbInfo.service)
                this.databaseInfo.set(dbInfo.service, dbInfo)

                if(!dbInfo.IsConnectionEstablished && !dbInfo.IsConnecting){
                    this.serviceError.delete(dbInfo.service)
                    this.serviceError.set(dbInfo.service, true)
                } else {
                    this.serviceError.delete(dbInfo.service)
                    this.serviceError.set(dbInfo.service, false)
                }

                let serviceErrors = 0
                this.startCarouselService = null
                for (let i = 0; i < this.canvas.visDirector.carousel_service_order.length; i++) {
                    let serviceTheme = this.canvas.visDirector.carousel_service_order[i]
                    if(this.serviceError.get(serviceTheme.id_name)){
                        serviceErrors++
                    } else {
                        if(this.startCarouselService === null){
                            this.startCarouselService = serviceTheme.id_name
                        }
                    }
                }

                if(serviceErrors === this.canvas.visDirector.service_themes.size){
                    this.allServicesHaveError = true
                }

                // on database error
                if(this.serviceError.get(dbInfo.service)){
                    this.progess_indicator.service_indicators.get(dbInfo.service)?.setError()

                    if(dbInfo.service === this.canvas.visDirector.current_service_theme.id_name && !this.allServicesHaveError) {
                        this.initNextTheme()
                        this.transition.startTransition(this.canvas.visDirector.current_service_theme)
                    }
                    return;
                }
            }
        })
    }

    private getNextServiceTheme(): ServiceTheme | undefined {
        let nextTheme: ServiceTheme | undefined;

        let iterationNumber = 0
        let iterationNumberLimit = this.canvas.visDirector.carousel_service_order.length;
        let iterationIndex = (this.currentCarouselOrderIndex + 1) % iterationNumberLimit
        while(iterationNumber < iterationNumberLimit){
            if(this.serviceError.get(this.canvas.visDirector.carousel_service_order[iterationIndex].id_name)){
                iterationIndex = (iterationIndex + 1) % iterationNumberLimit
                iterationNumber++;
            } else {
                this.currentCarouselOrderIndex = iterationIndex
                nextTheme = this.canvas.visDirector.carousel_service_order[iterationIndex]
                break;
            }
        }

        return nextTheme
    }

    private initNextTheme(){
        let nextVisualisation = this.canvas.visDirector.getNextVisualisation()
        if(this.nextTheme){
            this.canvas.visDirector.set_current_theme(this.nextTheme);
            this.canvas.visDirector.setCurrentVisualisation(nextVisualisation);
            this.progess_indicator.setCurrentServiceIndicator(this.nextTheme)
        }
    }

    public continueCarousel(){
        if (this.allServicesHaveError){
            return
        }

        // start progress indicator
        if(this.canvas.settings.carousel_mode) {
            let indicator = this.progess_indicator.currentServiceIndicator;

            if (this.canvas.visDirector.current_service_theme.id_name === this.startCarouselService) {
                this.serviceError.forEach((error, service) => {
                    if (!error) {
                        this.progess_indicator.service_indicators.get(service)?.reset()
                    }
                });
            }

            indicator?.start(() => {
                if (!this.allServicesHaveError) {
                    this.nextTheme = this.getNextServiceTheme()
                    if(this.nextTheme !== undefined) {
                        this.transition.startTransition(this.nextTheme)
                    }
                }
            })
        }
    }

    public windowUpdate(){
        this.progess_indicator.windowUpdate()
    }
}