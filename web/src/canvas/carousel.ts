import {ListenToCanvas} from "./listen/listenToCanvas";
import {Transition} from "./transition";
import {ProgressIndicator} from "./progress_indicator";
import {DatabaseInfo} from "../observable/model";
import {Subject} from "rxjs";
import {HatnoteVisService} from "../service_event/model";
import {ServiceTheme} from "../theme/model";
import {GeoCanvas} from "./geo/geoCanvas";

export class Carousel {
    public readonly transition: Transition;
    public readonly progess_indicator: ProgressIndicator;
    public readonly updateDatabaseInfoSubject: Subject<DatabaseInfo>
    public databaseInfo: Map<HatnoteVisService, DatabaseInfo>
    public serviceError: Map<HatnoteVisService, boolean>
    public allServicesHaveError: boolean
    private startCarouselService: HatnoteVisService | null
    private readonly canvas: ListenToCanvas | GeoCanvas
    private currentCarouselOrderIndex;
    constructor(canvas: ListenToCanvas | GeoCanvas) {
        this.canvas = canvas
        this.transition = new Transition(this.canvas)
        this.transition.onTransitionMid.subscribe(_ => this.canvas.hatnoteVisServiceChangedSubject.next(this.canvas.theme.current_service_theme.id_name))
        this.transition.onTransitionEnd.subscribe(_ => this.continueCarousel())
        this.progess_indicator = new ProgressIndicator(this.canvas)
        this.updateDatabaseInfoSubject = this.canvas.updateDatabaseInfoSubject
        this.serviceError = new Map<HatnoteVisService, boolean>()
        this.currentCarouselOrderIndex = 0
        this.allServicesHaveError = false
        this.startCarouselService = this.canvas.theme.carousel_service_order[0].id_name
        this.databaseInfo = new Map<HatnoteVisService, DatabaseInfo>()
        this.canvas.theme.service_themes.forEach((serviceTheme => {
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
                for (let i = 0; i < this.canvas.theme.carousel_service_order.length; i++) {
                    let serviceTheme = this.canvas.theme.carousel_service_order[i]
                    if(this.serviceError.get(serviceTheme.id_name)){
                        serviceErrors++
                    } else {
                        if(this.startCarouselService === null){
                            this.startCarouselService = serviceTheme.id_name
                        }
                    }
                }

                if(serviceErrors === this.canvas.theme.service_themes.size){
                    this.allServicesHaveError = true
                }

                // on database error
                if(this.serviceError.get(dbInfo.service)){
                    this.progess_indicator.service_indicators.get(dbInfo.service)?.setError()

                    if(dbInfo.service === this.canvas.theme.current_service_theme.id_name && !this.allServicesHaveError) {
                        this.initNextTheme()
                        this.transition.startTransition(this.canvas.theme.current_service_theme)
                    }
                    return;
                }
            }
        })
    }

    private getNextServiceTheme(): ServiceTheme | undefined {
        let nextTheme: ServiceTheme | undefined;

        let iterationNumber = 0
        let iterationNumberLimit = this.canvas.theme.carousel_service_order.length;
        let iterationIndex = (this.currentCarouselOrderIndex + 1) % iterationNumberLimit
        while(iterationNumber < iterationNumberLimit){
            if(this.serviceError.get(this.canvas.theme.carousel_service_order[iterationIndex].id_name)){
                iterationIndex = (iterationIndex + 1) % iterationNumberLimit
                iterationNumber++;
            } else {
                this.currentCarouselOrderIndex = iterationIndex
                nextTheme = this.canvas.theme.carousel_service_order[iterationIndex]
                break;
            }
        }

        return nextTheme
    }

    private initNextTheme(){
        let nextTheme: ServiceTheme | undefined = this.getNextServiceTheme()
        if(nextTheme){
            this.canvas.theme.set_current_theme(nextTheme);
            this.progess_indicator.setCurrentServiceIndicator(nextTheme)
        }
    }

    public continueCarousel(){
        if (this.allServicesHaveError){
            return
        }

        // start progress indicator
        if(this.canvas.settings.carousel_mode) {
            let indicator = this.progess_indicator.currentServiceIndicator;

            if (this.canvas.theme.current_service_theme.id_name === this.startCarouselService) {
                this.serviceError.forEach((error, service) => {
                    if (!error) {
                        this.progess_indicator.service_indicators.get(service)?.reset()
                    }
                });
            }

            indicator?.start(() => {
                if (!this.allServicesHaveError) {
                    this.initNextTheme()
                    this.transition.startTransition(this.canvas.theme.current_service_theme)
                }
            })
        }
    }

    public windowUpdate(){
        this.progess_indicator.windowUpdate()
    }
}