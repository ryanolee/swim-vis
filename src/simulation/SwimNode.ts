import { SwimNetwork } from "./SwimNetwork";
import { SwimNetworkAction, SwimNodeAction } from "./SwimNetworkActions";
import { SwimNetworkExpectation } from "./SwimNetworkExpectation";

const PING_INTERVAL_TICKS = 100;
const TIMEOUT_TICKS = 100;
const EXPECTATION_CHECK_INTERVAL = 5;
const RANDOM_PEERS_PING_REQ = 3;

export class SwimNode {
    protected knownNodeIds: Set<number> = new Set<number>();
    protected deadNodeIds: Set<number> = new Set<number>();
    
    // Internal round robin state variables
    protected roundRobinIndex: number = 0;
    protected roundRobinBuffer: number[] = [];


    protected expectations: Array<SwimNetworkExpectation> = [];
    protected incarnationNumber: number = 0;
    protected randomCycleOffset: number = Math.floor(Math.random() * PING_INTERVAL_TICKS);
    protected faulty: boolean = false;


    /**
     * Marks a node as having permanently left the network voluntarily.
     */
    protected left: boolean = false;
    
    constructor (
        public readonly id: number,
        public readonly label: string,
        public readonly sn: SwimNetwork,
    ){}
    
    // Setters 
    public setFaulty(faulty: boolean): void {
        this.faulty = faulty;
        this.rerender();
    }
    public clearRoundRobinBuffer(): void {
        this.roundRobinBuffer = [];
        this.roundRobinIndex = 0;
    }

    protected addKnownNodeId(nodeId: number): void {
        if (nodeId === this.id) {
            return;
        }
        this.knownNodeIds.add(nodeId);
    }

    // top level actions
    public leaveNetwork(): void {
        if (this.left) {
            return;
        }

        this.left = true;
        this.expectations = []
        this.rerender()

        this.multicastDispatch({
            type: "multicast_leave",
            from: this.id,
        })
    }

    public joinNetwork(nodeId: number): void {
        this.addKnownNodeId(nodeId);
        this.sn.dispatchAction({
            type: "join",
            from: this.id,
            to: nodeId,
            payload: {
                subject: this.id,
            },
        });
    }

    // Top level API
    public tick(currentTick: number): void {
        if (this.faulty || this.left) {
            return;
        }

        if ((currentTick + this.randomCycleOffset) % PING_INTERVAL_TICKS === 0) {
            this.sendPing(currentTick);
        }

        if (currentTick % EXPECTATION_CHECK_INTERVAL === 0) {
            for(const expectation of this.expectations) {
                if (expectation.isBroken(currentTick)) {
                    this.receiveBrokenExpectation(expectation);
                    this.expectations = this.expectations.filter(e => e !== expectation);
                }
            }
        }
    }

    public rerender(): void {
        this.sn.graphData.nodes.update({
            id: this.id,
            label: this.getLabel(),
            color: this.getColor(),
            fixed: {
                x: true,
                y: true
            }
        });
    }

    // Action receivers
    public receiveAction(action: SwimNetworkAction): void {
        if (this.faulty) {
            return;
        }

        switch (action.type) {
            case "ping":
                this.handlePing(action);
                break;
            case "ack":
                this.handleAck(action);
                break;
            case "ping_req":
                this.handlePingReq(action)
                break;
            case "join":
                this.handleInitialJoin(action);
                break;
            case "multicast_join":
                this.addKnownNodeId(action.payload.subject as number);
                break;
            case "multicast_death":
                this.markNodeAsDead(action.payload.subject as number);
                break;
            case "multicast_leave":
                this.markNodeAsLeft(action.from);
                break;
            default:
                console.warn("Unknown action type", action.type);
        }
    }
    
    public receiveBrokenExpectation(expectation: SwimNetworkExpectation): void {
        if (this.faulty) {
            return;
        }

        switch (expectation.expectationType) {
            case "receive_ack":
                this.sendPingReq(expectation.from)
                break;
            case "receive_ack_or_death":
                this.handleBrokenReceiveAckOrDeath(expectation);
                break
            default:
                console.warn("Unknown expectation type", expectation.expectationType);
        }
    }
    
    // Action Receivers
    protected handlePing(action: SwimNetworkAction): void {
        // If we get a ping from a node we don't know about, add it to our known nodes
        this.addKnownNodeId(action.from);
        

        // Handle replying ack ping_req back to original node
        if(typeof action.payload.originalFrom === "number" ) {
            this.sn.dispatchAction({
                type: "ack",
                from: this.id,
                to: action.from,
                payload: {
                    for: action.payload.originalFrom,
                    includeInFilters: "ping_req"
                }
            })
            return
        }

        this.sn.dispatchAction({
            type: "ack",
            from: this.id,
            to: action.from,
        });
    }

    protected handleAck(action: SwimNetworkAction): void {
        
        // Handle replying ack back to original node on a ping_req
        if(typeof action.payload.for === "number"){
            // Clear expectation that node might need to die
            this.sn.dispatchAction({
                type: "ack",
                from: this.id,
                to: action.payload.for,
                payload: {
                    originalFrom: action.from,
                    includeInFilters: "ping_req"
                }
            })   
        }

        // Handle accepting ack from any given ping_req 
        if(typeof action.payload.originalFrom === "number"){
            // Clear expectation that node might need to die
            this.removeExpectation("receive_ack", action.payload.originalFrom);
            this.removeExpectation("receive_ack_or_death", action.payload.originalFrom)
        }

        // Clear expectations that we need to receive an ack from the node that sent us the ack
        this.removeExpectation("receive_ack", action.from);
        this.removeExpectation("receive_ack_or_death", action.from);
    }
    
    protected handlePingReq(action: SwimNetworkAction){
        if(typeof action.payload.target !== "number"){
            console.warn("Malformed ping request: missing 'target' in payload", action);
            return
        }

        this.sn.dispatchAction({
            type: "ping",
            to: action.payload.target,
            from: this.id,
            payload: {
                originalFrom: action.from,
                includeInFilters: "ping_req"
            }
        })
    }

    protected handleMulticastDeath(action: SwimNetworkAction): void {
        if (typeof action.payload.subject !== "number") {
            console.warn("Malformed multicast death: missing 'subject' in payload", action);
            return;
        }

        this.markNodeAsDead(action.payload.subject);
    }

    protected handleInitialJoin(action: SwimNetworkAction): void {
        this.addKnownNodeId(action.from);
        this.multicastDispatch({
            type: "multicast_join",
            payload: {
                subject: action.payload.subject,
            },
            from: this.id,
        });
    }

    protected handleMulticastLeave(action: SwimNetworkAction): void {
        this.markNodeAsLeft(action.from);
    }

    // Expectation Handlers
     /**
     * Called in the event both an  ping and a ping_req yield no ack
     */
     protected handleBrokenReceiveAckOrDeath(expectation: SwimNetworkExpectation): void {
        this.markNodeAsDead(expectation.from);
        this.multicastDispatch({
            type: "multicast_death",
            from: this.id,
            payload: {
                subject: expectation.from,
            }
        })
    }
    
    // Senders
    protected sendPing(currentTick: number): void {
        // Don't send ping to self
        const peerIds = this.getPingablePeersBasedOnStrategy()
        
        for (const peerId of peerIds) {
            if (peerId === this.id) {
                continue;
            }

            // Dispatch ping actions to selected peer
            this.sn.dispatchAction({
                type: "ping",
                from: this.id,
                to: peerId,
            });

            // Setup an expectation that an ack will be received from the peer
            this.addExpectation(new SwimNetworkExpectation("receive_ack", peerId, currentTick + TIMEOUT_TICKS));
        }
        
    }

    protected sendPingReq( target: number){
        const peers = this.getNRandomPeers(RANDOM_PEERS_PING_REQ)
        for(const peer of peers){
            // Don' send a ping to dead nodes
            if(peer === target) {
                continue
            }
            this.sn.dispatchAction({
                type: "ping_req",
                from: this.id,
                to: peer,
                payload: {
                    target
                }
            })
        }

        this.addExpectation(new SwimNetworkExpectation("receive_ack_or_death", target, this.sn.getCurrentTick() + (TIMEOUT_TICKS * 3)))
    }

    // Expectation Handlers
    /**
     * Mark a node as dead and remove all expectations related to it
     */
    protected markNodeAsDead(target: number): void {
        this.clearExpectationsFrom(target);
        this.knownNodeIds.delete(target);
        // Scrub round robin buffer so it can be regenerated next ping
        this.clearRoundRobinBuffer()
    }

    protected markNodeAsLeft(target: number): void {
        this.clearExpectationsFrom(target);
        this.knownNodeIds.delete(target);
        this,this.clearRoundRobinBuffer()
        this.rerender()
    }

    protected addExpectation(expectation: SwimNetworkExpectation): void {
        this.expectations.push(expectation);
    }

    protected removeExpectation(type: SwimNetworkExpectation["expectationType"], target: number): void {
        this.expectations = this.expectations.filter(e => e.expectationType !== type || e.from !== target);
    }
    
    protected clearExpectationsFrom(from: number): void {
        this.expectations = this.expectations.filter(e => e.from !== from);
    }

    public clearAllExpectations(): void {
        this.expectations = [];
    }
    

    /**
     * Dispatch an action to all peers in the network, except for the sender.
     * This simulates a UDP multicast where everyone on the network should receive the action.
     */
    protected multicastDispatch(action: Omit<SwimNodeAction, "to">): void {
        for (const peer of this.sn.getAllNodeIds()) {
            if (peer !== this.id) {
                this.sn.dispatchAction({
                    ...action,
                    to: peer,
                });
            }
        }
    }

    // Internal peer getters
    protected getNRandomPeers(n: number): number[] {
        const knownPeers = SwimNode.arrayShuffle(Array.from(this.knownNodeIds));
        return knownPeers.slice(0, Math.min(this.knownNodeIds.size, n))
    }

    /**
     * Returns a list of pingable peers based on the current ping strategy.
     */
    protected getPingablePeersBasedOnStrategy(): number[] {
        switch (this.sn.config.pingApproach) {
            case "random":
                const randomPeer = this.getRandomKnownPeer();
                return randomPeer !== null ? [randomPeer] : [];
            case "all":
                return Array.from(this.knownNodeIds);
            case "round_robin":
                const roundRobinPeer = this.getRoundRobinPeer();
                return roundRobinPeer !== null ? [roundRobinPeer] : [];  
            default:
                return []
        }
    }

    protected getRandomKnownPeer(): number | null {
        const knownPeers = Array.from(this.knownNodeIds);
        if (knownPeers.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * knownPeers.length);
        return knownPeers[randomIndex];
    }

    protected getRoundRobinPeer(): number | null {
        // If we have no known peers, return null
        if (this.knownNodeIds.size === 0) {
            return null;
        }

        // Cycle the buffer if the buffer is empty or the index is out of bounds
        if (this.roundRobinBuffer.length === 0 || this.roundRobinIndex >= this.roundRobinBuffer.length) {
            // During round robin keep a buffer of known node ids and shuffle them to cycle through
            this.roundRobinBuffer = SwimNode.arrayShuffle(Array.from(this.knownNodeIds));   
            this.roundRobinIndex = 0;
        }

        // Get the next peer in the round robin buffer
        const peerId = this.roundRobinBuffer[this.roundRobinIndex];
        this.roundRobinIndex++;
        return peerId;        
    }

    // Internal render helpers
    protected getColor(): string {
        if (this.left) {
            return "#e5e5e5";
        } 

        if (this.faulty) {
            return "#ffcccb";
        }

        return "#90EE90";
    }

    protected getLabel(): string {
        if (this.left) {
            return `${this.label} (left)`;
        }

        if (this.faulty) {
            return `${this.label} (faulty)`;
        }

        return this.label;
    }

    static arrayShuffle<T>(array: T[]): T[]{
        return array.map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
    }
    
}