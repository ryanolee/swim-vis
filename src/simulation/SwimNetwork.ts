import { DataSet, Network } from "vis-network/standalone/esm/vis-network";
import { SwimNode } from "./SwimNode";

export type SwimNodeAction = {
    type: "ping"
    from: number;
    to: number;
} | {
    type: "ack"
    from: number;
    to: number;
} | {}

export class SwimNetwork {
    private nodes: Record<number, SwimNode> = {};
    private ongoingActions: SwimNodeAction[] = [];
    private tickerInterval: NodeJS.Timer | null = null;

    constructor(
        protected graph: Network,
        protected graphData: {
            nodes: DataSet<any>;
            edges: DataSet<any>;
        },
        protected idCounter: number = 0,
    ) {
        this.tickerInterval = setInterval(() => this.tick(), 1000); // 60 FPS
    }


    public addNode(id: number): SwimNode {
        if (this.nodes[id]) {
           return this.nodes[id];
        }

        // Register with simulation
        const node = new SwimNode(id, `Node id ${id}`);
        this.nodes[node.id] = node;
        
        // Register with visualization library
        this.graphData.nodes.add({ id: node.id, label: node.label });
        return node;
    }

    public removeNode(node: SwimNode): void {
        delete this.nodes[node.id];
    }

    public getNode(id: number): SwimNode | null {
        return this.nodes[id] || null;
    }
    
    protected tick() {
        for (const node of Object.values(this.nodes)) {
            node.tick();
        }
    }

    protected handleAction(action: SwimNodeAction) {

    protected stop() {
        if (this.tickerInterval) {
            clearInterval(this.tickerInterval);
            this.tickerInterval = null;
        }
    }

    public start() {
        if (!this.tickerInterval) {
            this.tickerInterval = setInterval(() => this.tick(), 1000); // 60 FPS
        }
    }
}