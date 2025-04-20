import { DataSet, Edge } from "vis-network/declarations/entry-standalone";

export type SwimNodeAction = {
    type: "ping" | "ack" | "join" | "multicast_join" | "multicast_leave" | "multicast_data"
    from: number;
    to: number;
    payload?: Record<string, string|number>;
}

interface ActionOptions {
    render?: boolean;
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
    ){}

    public isDone(numberOfTicks: number): boolean {
        return this.toToCompleteOn <= numberOfTicks;
    }

    public addToGraph(edges: DataSet<Edge>){
        if (this.options.render === false) {
            return;
        }
        
        edges.add({
            id: this.id,
            from: this.from,
            to: this.to,
            label: this.type,
            arrows: "to",
            length: 100,
        });
    }

    public removeFromGraph(edges: DataSet<Edge>){
        if (this.options.render === false) {
            return;
        }

        edges.remove(this.id);
    }
}