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

export const SWIM_OVERLAY_MODES = [
    "none",
    "who_knows_who",
    "who_do_i_know"
] as const

export type SwimOverlayModeType = typeof SWIM_OVERLAY_MODES[number]

export const DEFAULT_OVERLAY_MODE: SwimOverlayModeType = "none"


export class SwimNetworkConfig {
    public eventTypeFilter: Set<SwimNodeAction["type"]> = new Set<SwimNodeAction["type"]>([])
    public pingApproach: SwimPingApproachType = DEFAULT_PING_APPROACH
    public disseminationApproach: SwimDisseminationApproachType = DEFAULT_DISSEMINATION_APPROACH
    public overlayMode: SwimOverlayModeType = DEFAULT_OVERLAY_MODE
    public selectedNodeId: number | null = null
    public enablePhysics: boolean = true

    public constructor(
        protected onEventFilterChange: () => void = () => {},
        protected onPingApproachChange: () => void = () => {},
        protected onDisseminationApproachChange: () => void = () => {},
        protected onOverlayModeChange: () => void = () => {},
        protected onEnablePhysicsChange: () => void = () => {},
    ) {}

    public bindNetwork(network: SwimNetwork){
        network.graph.on("selectNode", (params) => {
            this.setSelectedNodeId(params.nodes[0] ?? null)
        })

        network.graph.on("deselectNode", () => {
            this.setSelectedNodeId(null)
        })

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

        this.onOverlayModeChange = () => {
            network.rerenderActions()
            network.getAllNodeIds().forEach((id) => {
                const node = network.getNode(id)
                node?.rerender()
            })
        }
        
        this.onEnablePhysicsChange = () => {
            network.graph.setOptions({
                physics: this.enablePhysics,
            })
        }
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

    public setOverlayMode(mode: SwimOverlayModeType){
        if(mode !== this.overlayMode){
            this.overlayMode = mode
            this.onOverlayModeChange()
        }
    }

    public setSelectedNodeId(id: number | null){
        if(id == this.selectedNodeId){
            return  
        } 

        this.selectedNodeId = id
        
        if(this.overlayMode !== "none"){
            this.onOverlayModeChange()
        }
    }

    public setEnablePhysics(enable: boolean){
        if(enable !== this.enablePhysics){
            this.enablePhysics = enable
            this.onEnablePhysicsChange()
        }
    }
}