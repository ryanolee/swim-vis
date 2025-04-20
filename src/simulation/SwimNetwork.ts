import { DataSet, Edge, Network, Node } from "vis-network/standalone/esm/vis-network";
import { SwimNetworkAction, SwimNodeAction } from "./SwimNetworkActions";
import { SwimNode } from "./SwimNode";

const NETWORK_TICK_LATENCY = 30;

export class SwimNetwork {
    private nodes: Record<number, SwimNode> = {};
    private ongoingActions: SwimNetworkAction[] = [];
    private ongoingExpectations: SwimNetworkAction[] = [];
    private tickerInterval: NodeJS.Timer | null = null;

    private currentTick: number = 0;
    private actionIdCounter: number = 0;

    constructor(
        protected graph: Network,
        protected graphData: {
            nodes: DataSet<Node>;
            edges: DataSet<Edge>;
        },
        protected idCounter: number = 0,
    ) {
        this.tickerInterval = setInterval(() => this.tick(), 1000/15); // 60 FPS
    }

    public addNode(id: number): SwimNode {
        if (this.nodes[id]) {
           return this.nodes[id];
        }

        // Get a random peer to register with before adding another node
        const randomPeer = this.getRandomNode();

        // Register with simulation
        const node = new SwimNode(id, `Node id ${id}`, this.dispatchAction.bind(this));
        this.nodes[node.id] = node;

        if (!!randomPeer) {
            node.addKnownNodeIdAndReportJoin(randomPeer.id);
        }
        
        // Register with visualization library
        this.graphData.nodes.add({ id: node.id, label: node.label });
        return node;
    }

    public getNode(id: number): SwimNode | null {
        return this.nodes[id] || null;
    }

    public getRandomNode(): SwimNode | null {
        const nodeIds = Object.keys(this.nodes);
        if (nodeIds.length === 0) {
            return null;
        }
        const randomId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        return this.nodes[parseInt(randomId)];
    }

    public dispatchAction(action: SwimNodeAction): void {
        this.actionIdCounter++;
        const networkAction = new SwimNetworkAction(
            this.actionIdCounter,
            action.type,
            action.from,
            action.to,
            this.currentTick + NETWORK_TICK_LATENCY,
            action.payload,
        );

        // Push into simulation and onto graph
        this.ongoingActions.push(networkAction);
        networkAction.addToGraph(this.graphData.edges);
    }
    
    protected tick() {
        this.currentTick++;
        for (const node of Object.values(this.nodes)) {
            node.tick(this.currentTick);
        }

        for (const action of this.ongoingActions) {
            // Look for and prune actions that are done
            if (action.isDone(this.currentTick)) {
                action.removeFromGraph(this.graphData.edges);

                this.ongoingActions = this.ongoingActions.filter(a => a !== action);
                this.getNode(action.to)?.receiveAction(action);

            }
        }
    }

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