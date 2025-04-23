import { SwimRumor } from "@/simulation/SwimRumorMill";
import { DataSet, Edge } from "vis-network/declarations/entry-standalone";
import { SwimNetworkConfig } from "./SwimNetworkConfig";

export const SWIM_NODE_ACTION_TYPES =  ["ping" , "timeout" , "ack" ,  "ping_req",  "join" , "multicast_join" , "multicast_leave" , "multicast_death"] as const
export type SwimNodeActionType = typeof SWIM_NODE_ACTION_TYPES[number]

/**
 * Class that represents a action that is sent between nodes in the network.
 */
export type SwimNodeAction = {
    type: SwimNodeActionType,
    from: number;
    to: number;
    payload?: Record<string, string|number>;

    /**
     * Rumors piggybacked on the action.
     */
    piggybackedGossip?: SwimRumor[];
}

interface ActionOptions {
    // If the action should be rendered in the graph or not
    render?: boolean;

    // If the action is in a "dropped" state meaning it should be rendered but never
    // delivered to the receiving node
    actionLost?: boolean;
}

export class SwimNetworkAction {
    constructor(
        public id: number,
        public type: SwimNodeAction["type"],
        public from: number,
        public to: number,
        public toToCompleteOn: number = 0,
        public payload: Record<string, string|number> = {},
        public options: ActionOptions = {},
        public piggybackedGossip: SwimRumor[] = [],
    ){}

    public isDone(numberOfTicks: number): boolean {
        return this.toToCompleteOn <= numberOfTicks;
    }

    public isDeliverable(): boolean {
        return this.options?.actionLost !== true;
    }

    public shouldRender(config: SwimNetworkConfig): boolean {
        
        if (this.options.render === false) {
            return false;
        }

        if (config.eventTypeFilter.size === 0) {
            return true;
        }

        return config.eventTypeFilter.has(this.type) 
            // Handle cases where certain actions are included in other's filters (e.g. ping_req)
            ||  config.eventTypeFilter.has(this?.payload?.includeInFilters as SwimNodeActionType);
    }

    public rerender(config: SwimNetworkConfig, edges: DataSet<Edge>){
        // Render if there are no filters or the event type is in the allowed filters
        this.shouldRender(config)  ?
            this.addToGraph(edges) :
            this.removeFromGraph(edges)
    }

    public clearGossip() {
        this.piggybackedGossip = []
    }

    public addToGraph(edges: DataSet<Edge>){
        if (this.options.render === false) {
            return;
        }

        const isMulticast = this.type.startsWith("multicast")

        edges.update({
            id: this.id,
            from: this.from,
            to: this.to,
            label: this.getLabel(),
            color: this.getColor(),
            arrows: isMulticast ? undefined : "to",
            dashes: isMulticast ? true : false,
            length: 100,
        });

    }

    protected getLabel(): string {
        let label = `${this.type}`;
        switch (this.type) {
            case "ping_req":
                label = `${label} (target ${this.payload.target})`;
                break;
            case "ack":
                if (typeof this.payload.for === "number") {
                    label = `${label} (for ${this.payload.for})`;
                }

                if (typeof this.payload.originalFrom === "number") {
                    label = `${label} (from ${this.payload.originalFrom})`;
                }
                break;
            case "ping":
                if (typeof this.payload.originalFrom === "number") {
                    label = `${label} (from ${this.payload.originalFrom})`;
                }
                break;
            case "multicast_death":
                label = `multicast_death (${this.payload.subject})`;
                break;
        }


        if (this.options.actionLost) {
            return `${label} (lost)`;
        }

        if (this.piggybackedGossip.length > 0) {
            label = `${label} (${this.serializeGossip()})`;
        }
        
        return label ;
    }

    protected serializeGossip(): string {
        return this.piggybackedGossip.map((gossip) => {
            return `${gossip.type.substring(0, 1)}${gossip.subject}`;
        }).join("");
    }

    protected getColor(): string {
        if (this.options.actionLost) {
            return "#808080";
        }

        if(this.type.startsWith("multicast")){
            return "#808080";
        }

        return "#000000";
    }

    public removeFromGraph(edges: DataSet<Edge>){
        if (this.options.render === false) {
            return;
        }

        edges.remove(this.id);
    }
}