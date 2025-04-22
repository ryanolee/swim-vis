import { SwimNetwork } from "./SwimNetwork";
import { SwimNodeAction } from "./SwimNetworkActions";

export const SWIM_PING_APPROACHES = [
    "all",
    "random",
    "round_robin"
]
export const DEFAULT_PING_APPROACH = "random"

export type SwimPingApproachType = typeof SWIM_PING_APPROACHES[number]



export class SwimNetworkConfig {
    public eventTypeFilter: Set<SwimNodeAction["type"]> = new Set<SwimNodeAction["type"]>([])
    public pingApproach: SwimPingApproachType = "random"

    public constructor(
        protected onEventFilterChange: () => void = () => {}
    ) {}

    public bindNetwork(network: SwimNetwork){
        this.onEventFilterChange = network.rerenderActions.bind(network)
    }

    public addEventFilterType(filterType: SwimNodeAction["type"]){
        this.eventTypeFilter.add(filterType)
        this.onEventFilterChange()
    }

    public removeEventFilterType(filterType: SwimNodeAction["type"]){
        this.eventTypeFilter.delete(filterType)
        this.onEventFilterChange()
    }

    public clearEventFilterType(){
        this.eventTypeFilter.clear()
        this.onEventFilterChange()
    }
}