import { DataSet, Edge, Network, Node } from "vis-network/standalone/esm/vis-network";
import { SwimNetworkAction, SwimNodeAction } from "./SwimNetworkActions";
import { SwimNetworkConfig } from "./SwimNetworkConfig";
import { SwimNetworkPartition } from "./SwimNetworkPartition";
import { SwimNode } from "./SwimNode";

const NETWORK_TICK_LATENCY = 30;

/**
 * Top level simulation class that manages the network and all nodes in it
 */
export class SwimNetwork {
    private nodes: Record<number, SwimNode> = {};
    private partitions: Record<number, SwimNetworkPartition> = {};
    private ongoingActions: SwimNetworkAction[] = [];
    private tickerInterval: NodeJS.Timer | null = null;

    private currentTick: number = 0;
    private actionIdCounter: number = 0;

    constructor(
        public graph: Network,
        public graphData: {
            nodes: DataSet<Node>;
            edges: DataSet<Edge>;
        },
        public config: SwimNetworkConfig
    ) {
        this.tickerInterval = setInterval(() => this.tick(), 1); // 60 FPS
        // Bind network to ongoing config changes
        this.config.bindNetwork(this)
    }

    public addNode(id: number): SwimNode {
        if (this.nodes[id]) {
           return this.nodes[id];
        }

        // Get a random peer to register with before adding another node
        const randomPeer = this.getRandomNode();

        // Register with simulation
        const node = new SwimNode(id, `Node id ${id}`, this);
        this.nodes[node.id] = node;

        if (!!randomPeer) {
            node.joinNetwork(randomPeer.id);
        }
        
        // Register with visualization library
        node.rerender();
        return node;
    }

    public removeNode(id: number): void {
        if (this.nodes[id]) {
            this.nodes[id].leaveNetwork();
            delete this.nodes[id];
        }
    }

    public addPartition(id: number){
        if (this.partitions[id]) {
            return this.partitions[id];
        }

        const partition = new SwimNetworkPartition(id, false, this);
        this.partitions[id] = partition;
        partition.rerender(this);
        return partition;
    }

    public getPartition(id: number): SwimNetworkPartition | null {
        return this.partitions[id] || null;
    }

    public removePartition(id: number): void {
        if (this.partitions[id]) {
            this.partitions[id].remove(this);
            delete this.partitions[id];
        }
    }

    public getNode(id: number): SwimNode | null {
        return this.nodes[id] || null;
    }

    public getAllNodeIds(): number[] {
        return Object.keys(this.nodes).map(id => parseInt(id));
    }

    public getCurrentTick(): number {
        return this.currentTick
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

        // Mark the action as lost if it intersects with any partition
        if(this.actionIntersectsWithAnyPartition(networkAction)) {
            networkAction.options.actionLost = true;
        }

        // Push into simulation and onto graph
        this.ongoingActions.push(networkAction);
        networkAction.rerender(this.config, this.graphData.edges);
    }

    /**
     * Rerenders ongoing actions. Normally used when event filters have been updated
     */
    public rerenderActions(){
        for(const action of this.ongoingActions){
            action.rerender(this.config, this.graphData.edges)
        }
    }
    
    protected tick() {
        this.currentTick++;
        for (const node of Object.values(this.nodes)) {
            node.tick(this.currentTick);
        }

        for (const action of this.ongoingActions) {
            // Look for and prune actions that are done
            if (!action.isDone(this.currentTick)) {
                continue;
            }

            // Remove from ongoing actions and simulation graph
            action.removeFromGraph(this.graphData.edges);
            this.ongoingActions = this.ongoingActions.filter(a => a !== action);
            
            // Check if the action is deliverable and deliver it to the node
            if (action.isDeliverable()) {
                this.getNode(action.to)?.receiveAction(action);
            } 
        }
    }

    protected getRandomNode(): SwimNode | null {
        const nodeIds = Object.keys(this.nodes);
        if (nodeIds.length === 0) {
            return null;
        }
        const randomId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        return this.nodes[parseInt(randomId)];
    }

    /**
     * Checks if the action intersects with any partition in the network
     */
     protected actionIntersectsWithAnyPartition(action: SwimNetworkAction): boolean {
        for (const partition of Object.values(this.partitions)) {
            if (partition.actionIntersectsWithPartition(action)) {
                return true;
            }
        }
        return false;
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