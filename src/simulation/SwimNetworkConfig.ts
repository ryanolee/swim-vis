import { SwimNetwork } from "./SwimNetwork";
import { SwimNodeAction } from "./SwimNetworkActions";

export const SWIM_PING_APPROACHES = [
    "all",
    "random",
    "round_robin"
] as const
export const DEFAULT_PING_APPROACH = "random"
export type SwimPingApproachType = typeof SWIM_PING_APPROACHES[number]


export const SWIM_DISSEMINATION_APPROACHES = [
    "multicast",
    "gossip",
    "gossip_with_suspicion",
] as const
export const DEFAULT_DISSEMINATION_APPROACH = "multicast"
export type SwimDisseminationApproachType = typeof SWIM_DISSEMINATION_APPROACHES[number]



export class SwimNetworkConfig {
    public eventTypeFilter: Set<SwimNodeAction["type"]> = new Set<SwimNodeAction["type"]>([])
    public pingApproach: SwimPingApproachType = DEFAULT_PING_APPROACH
    public disseminationApproach: SwimDisseminationApproachType = DEFAULT_DISSEMINATION_APPROACH

    public constructor(
        protected onEventFilterChange: () => void = () => {},
        protected onPingApproachChange: () => void = () => {},
        protected onDisseminationApproachChange: () => void = () => {},
    ) {}

    public bindNetwork(network: SwimNetwork){
        this.onEventFilterChange = network.rerenderActions.bind(network)
        this.onPingApproachChange = () => network.getAllNodeIds().forEach((id) => {
            const node = network.getNode(id)
            node?.clearRoundRobinBuffer()
            node?.clearAllExpectations()
        })

        this.onDisseminationApproachChange = () => network.getAllNodeIds().forEach((id) => {
            const node = network.getNode(id)
            node?.clearAllExpectations()
            node?.rumorMill.resetBuffers()
        })
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

    public setDisseminationApproach(approach: SwimDisseminationApproachType){
        if(approach !== this.disseminationApproach){
            this.disseminationApproach = approach
            this.onDisseminationApproachChange()
        }
    }
    public setPingApproach(approach: SwimPingApproachType){
        if(approach !== this.pingApproach){
            this.pingApproach = approach
            this.onPingApproachChange()
        }
    }
}