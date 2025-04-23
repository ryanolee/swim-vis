import { DataSet, Edge, Network, Node } from "vis-network/standalone/esm/vis-network";
import { SwimNetworkAction, SwimNodeAction } from "./SwimNetworkActions";
import { SwimNetworkConfig } from "./SwimNetworkConfig";
import { SwimNetworkPartition } from "./SwimNetworkPartition";
import { SwimNode } from "./SwimNode";
import { SwimNodePlacement } from "./SwimNodePlacement";

const NETWORK_TICK_LATENCY = 30;

const MAXIMUM_NUMBER_OF_RENDERED_ACTIONS_WITH_PHYSICS = 100;
const MAXIMUM_NUMBER_OF_RENDERED_ACTIONS = 300;
const FAILSAFE_RENDER_INTERVAL = NETWORK_TICK_LATENCY
/**
 * Top level simulation class that manages the network and all nodes in it
 */
export class SwimNetwork {
    private nodes: Record<number, SwimNode> = {};
    private partitions: Record<number, SwimNetworkPartition> = {};
    private ongoingActions: SwimNetworkAction[] = [];
    private tickerInterval: NodeJS.Timer | null = null;
    private physicsDisabledDueToTooManyActions: boolean = false;

    private currentTick: number = 0;
    private actionIdCounter: number = 0;
    public placement: SwimNodePlacement | null = null;
    

    constructor(
        public graph: Network,
        public graphData: {
            nodes: DataSet<Node>;
            edges: DataSet<Edge>;
        },
        public config: SwimNetworkConfig
    ) {
        this.placement = new SwimNodePlacement(this);
        this.tickerInterval = setInterval(() => this.tick(), 1000/16); // 60 FPS
        // Bind network to ongoing config changes
        this.config.bindNetwork(this)
    }

    public addNode(id: number): SwimNode {
        if (this.nodes[id]) {
           return this.nodes[id];
        }

        // Get a random peer to register with before adding another node
        const randomPeer = this.getRandomNoneDeadNode();

        // Register with simulation
        const node = new SwimNode(id, `Node id ${id}`, this);
        this.nodes[node.id] = node;

        if (!!randomPeer) {
            node.joinNetwork(randomPeer.id);
        }
        
        // Register with visualization library
        node.rerender();
        this.placement?.updateNodesIntoCircle()
        return node;
    }

    public removeNode(id: number): void {
        this.getNode(id)?.leaveNetwork();
        this.placement?.updateNodesIntoCircle()
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

        // Inject gossip into the node that is sending the action
        this.getNode(action.from)?.injectGossip(networkAction);

        // Mark the action as lost if it intersects with any partition
        if(this.actionIntersectsWithAnyPartition(networkAction)) {
            networkAction.options.actionLost = true;
        }

        // Push into simulation and onto graph
        this.ongoingActions.push(networkAction);
        this.enforcePhysicsLimitations()


        if(this.ongoingActions.length > MAXIMUM_NUMBER_OF_RENDERED_ACTIONS) {
            return
        }

        networkAction.rerender(this.config, this.graphData.edges);
    }

    /**
     * Rerenders ongoing actions. Normally used when event filters have been updated
     */
    public rerenderActions(){
        for(const action of this.ongoingActions.slice(0, MAXIMUM_NUMBER_OF_RENDERED_ACTIONS)){
            action.rerender(this.config, this.graphData.edges)
        }
    }

    public rerenderNodes(){
        for(const node of Object.values(this.nodes)){
            node.rerender()
        }
    }
    
    protected tick() {
        this.currentTick++;
        this.failsafeRender()

        for (const node of Object.values(this.nodes)) {
            // If the node is disabled there is no need to tick it
            if (node.isDisabled()) {
                continue;
            }

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

    protected getRandomNoneDeadNode(): SwimNode | null {
        const candidateNodes = Object.values(this.nodes).filter(node => !node.isDisabled());

        if (candidateNodes.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * candidateNodes.length);
        return candidateNodes[randomIndex];
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

    protected enforcePhysicsLimitations() {
        if(this.config.enablePhysics && !this.physicsDisabledDueToTooManyActions && this.ongoingActions.length > MAXIMUM_NUMBER_OF_RENDERED_ACTIONS_WITH_PHYSICS) {
            console.warn(`Disabling physics due to too many actions (currentCount: ${this.ongoingActions.length} > ${MAXIMUM_NUMBER_OF_RENDERED_ACTIONS_WITH_PHYSICS})`)
            this.graph.setOptions({
                physics: false,
            })
            this.physicsDisabledDueToTooManyActions = true;
        } else if(this.config.enablePhysics && this.physicsDisabledDueToTooManyActions && this.ongoingActions.length < MAXIMUM_NUMBER_OF_RENDERED_ACTIONS_WITH_PHYSICS) {
            console.warn(`Re-enabling physics`)
            this.graph.setOptions({
                physics: true,
            })
            this.physicsDisabledDueToTooManyActions = false;
        }
    }

    protected failsafeRender() {
        if (
            (this.currentTick % FAILSAFE_RENDER_INTERVAL === 0) && 
            this.ongoingActions.length > MAXIMUM_NUMBER_OF_RENDERED_ACTIONS
        ) {
            console.warn(`Failsafe render triggered due to too many actions (currentCount: ${this.ongoingActions.length} > ${MAXIMUM_NUMBER_OF_RENDERED_ACTIONS})`)
            this.rerenderNodes()
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