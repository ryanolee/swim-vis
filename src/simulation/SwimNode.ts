import { SwimNetwork } from "./SwimNetwork";
import { SwimNetworkAction, SwimNodeAction } from "./SwimNetworkActions";
import { SwimNetworkExpectation } from "./SwimNetworkExpectation";
import { SwimRumor, SwimRumorMill } from "./gossip/SwimRumorMill";

const PING_INTERVAL_TICKS = 100;


const TIMEOUT_TICKS = 100;
const TIMEOUT_SUSPECT_TICKS = 500;
const EXPECTATION_CHECK_INTERVAL = 5;
const RANDOM_PEERS_PING_REQ = 3;

const GOSSIP_RELEVANT_ACTION_TYPES = [
    "ping",
    "ack",
    "ping_req",
]


export class SwimNode {
    protected knownNodeIds: Set<number> = new Set<number>();
    protected suspectedNodeIds: Set<number> = new Set<number>();
    protected knownIncarnationNumbers: Map<number, number> = new Map<number, number>();
    
    // Internal round robin state variables
    protected roundRobinIndex: number = 0;
    protected roundRobinBuffer: number[] = [];


    protected expectations: Array<SwimNetworkExpectation> = [];
    protected incarnationNumber: number = 0;
    protected randomCycleOffset: number = Math.floor(Math.random() * PING_INTERVAL_TICKS);
    protected faulty: boolean = false;
    protected hasHeardOfOwnDeath: boolean = false;


    /**
     * Flag to indicate if the node is disabled. This is used to prevent the node from sending or receiving actions.
     */
    protected disabled: boolean = false;


    /**
     * Marks a node as having permanently left the network voluntarily.
     */
    protected left: boolean = false;

    public rumorMill: SwimRumorMill = new SwimRumorMill();
    
    constructor (
        public readonly id: number,
        public readonly label: string,
        public readonly sn: SwimNetwork,
    ){}
    
    // Setters 
    public setFaulty(faulty: boolean): void {
        if (this.left || this.hasHeardOfOwnDeath) {
            console.warn("Cannot set faulty state on a node that has left the network or has heard of its own death.");
            return;
        }

        this.disabled = faulty;
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

        const wasPreviouslyKnown = this.knownNodeIds.has(nodeId);
        this.knownNodeIds.add(nodeId);
        if (!wasPreviouslyKnown) {
            this.rerender();
        }
    }

    // top level actions
    public leaveNetwork(): void {
        if (this.left) {
            return;
        }

        this.left = true;
        this.disabled = true;
        this.expectations = []
        this.rerender()

        if (this.sn.config.disseminationApproach === "multicast") {
            this.multicastDispatch({
                type: "multicast_leave",
                from: this.id,
            })
        }
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
        if (this.disabled) {
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

        this.rumorMill.listenToGossip(action);
        this.rumorMill.heedRumors(this);

        switch (action.type) {
            case "ping":
                this.disseminateAlive(action.from);
                this.handlePing(action);
                break;
            case "ack":
                this.disseminateAlive(action.from);
                this.handleAck(action);
                break;
            case "ping_req":
                this.disseminateAlive(action.from);
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
            case "clear_suspicion":
                this.handleBrokenClearSuspicion(expectation);
                break;
            default:
                console.warn("Unknown expectation type", expectation.expectationType);
        }
    }
    
    // Action Receivers
    protected handlePing(action: SwimNetworkAction): void {
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
        this.disseminateJoin(action.from);
    }

    protected handleMulticastLeave(action: SwimNetworkAction): void {
        this.markNodeAsLeft(action.from);
    }

    // Expectation Handlers
     /**
     * Called in the event both an  ping and a ping_req yield no ack
     */
    protected handleBrokenReceiveAckOrDeath(expectation: SwimNetworkExpectation): void {
        console.info(`Node ${this.id} thinks node ${expectation.from} is possibly dead.`);
        
        this.sn.config.disseminationApproach === "gossip_with_suspicion" ?
             this.disseminateSuspicion(expectation.from) :
             this.disseminateDeath(expectation.from);    
    }

    protected handleBrokenClearSuspicion(expectation: SwimNetworkExpectation): void {
        console.info(`Node ${this.id} thinks node ${expectation.from} Fully dead rolling out death.`);
        this.clearExpectationsFrom(expectation.from);
        this.suspectedNodeIds.delete(expectation.from);
        this.knownIncarnationNumbers.delete(expectation.from);
        this.disseminateDeath(expectation.from);
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
        this.rerender()
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

    protected disseminateAlive(target: number, incarnationNumber: null|number = null): void {
        switch (this.sn.config.disseminationApproach) {
            case "multicast":
                this.addKnownNodeId(target);
                // Noop
                break;
            case "gossip":
            case "gossip_with_suspicion":
                this.rumorMill.addRumor({
                    subject: target,
                    type: "alive",
                    originator: this.id,
                    incarnationNumber: incarnationNumber !== null ?
                        incarnationNumber :
                        this.getIncarnationNumberForNode(target),
                });

                // Listen to rumors
                this.rumorMill.heedRumors(this);
                break;
            default:
                console.warn("Unknown dissemination approach", this.sn.config.disseminationApproach);
        }
    }

    protected disseminateJoin(target: number): void {
        this.addKnownNodeId(target);
        switch (this.sn.config.disseminationApproach) {
            case "multicast":
                this.multicastDispatch({
                    type: "multicast_join",
                    from: this.id,
                    payload: {
                        subject: target,
                    }
                })
                break;
            case "gossip":
            case "gossip_with_suspicion":
                this.rumorMill.addRumor({
                    subject: target,
                    type: "alive",
                    originator: this.id,
                    incarnationNumber: this.getIncarnationNumberForNode(target),
                });
                this.rumorMill.heedRumors(this);
                break;
            default:
                console.warn("Unknown dissemination approach", this.sn.config.disseminationApproach);
        }
    }

    protected disseminateDeath(target: number): void {
        this.markNodeAsDead(target);
        switch (this.sn.config.disseminationApproach) {
            case "multicast":
                this.multicastDispatch({
                    type: "multicast_death",
                    from: this.id,
                    payload: {
                        subject: target,
                    }
                })
                break;
            case "gossip":
            case "gossip_with_suspicion":
                this.rumorMill.addRumor({
                    subject: target,
                    type: "dead",
                    originator: this.id,
                    incarnationNumber: this.getIncarnationNumberForNode(target),
                });
                this.rumorMill.heedRumors(this);
                break;
            default:
                console.warn("Unknown dissemination approach", this.sn.config.disseminationApproach);
            }
    }

    protected disseminateSuspicion(target: number): void {
        this.suspectedNodeIds.add(target);
        this.rumorMill.addRumor({
            subject: target,
            type: "suspect",
            originator: this.id,
            incarnationNumber: this.getIncarnationNumberForNode(target),
        });

        this.addExpectation(new SwimNetworkExpectation("clear_suspicion", target, this.sn.getCurrentTick() + TIMEOUT_SUSPECT_TICKS));
    }

    // Rumor handlers
    protected trackIncarnationNumber(rumor: SwimRumor): void {
        const incarnationNumber = this.knownIncarnationNumbers.get(rumor.subject) ?? 0;
       
        // Begin tracking the incarnation numbers of nodes when they are higher than 1
        if (rumor.incarnationNumber > incarnationNumber) {
            this.knownIncarnationNumbers.set(rumor.subject, rumor.incarnationNumber);
        } 
    }

    protected getIncarnationNumberForNode(nodeId: number): number {
        return this.knownIncarnationNumbers.get(nodeId) ?? 0;
    }

    public handleRumor(rumor: SwimRumor): void {
        if (this.faulty) {
            return;
        }

        // Track the incarnation number of the node
        this.trackIncarnationNumber(rumor);

        switch (rumor.type) {
            case "alive":
                this.acceptAliveRumor(rumor.subject);
                break;
            case "dead":
                this.acceptDeathRumor(rumor.subject);
                break;
            case "suspect":
                this.acceptSuspicionRumor(rumor.subject);
                break;
            default:
                console.warn("Unknown rumor type", rumor.type);
        }

        // Rerender the node if the overlay mode is set to "who_knows_who"
        if (this.sn.config.overlayMode !== "none" && this.sn.config.selectedNodeId !== null) {
            this.rerender();
        }
    }

    public injectGossip(action: SwimNetworkAction): void {
        if (this.sn.config.disseminationApproach === "multicast" || !GOSSIP_RELEVANT_ACTION_TYPES.includes(action.type)) {
            return;
        }

        this.rumorMill.spreadGossip(action)
    }

    protected acceptSuspicionRumor(nodeId: number): void {
        if (nodeId === this.id) {
            // Refute the rumor if it is about itself
            console.log(`Node ${this.id} received a suspicion rumor about itself. Refuting it.`);
            this.incarnationNumber++;
            this.disseminateAlive(this.id, this.incarnationNumber);
            return;
        }

        this.suspectedNodeIds.add(nodeId);
    }

    protected acceptDeathRumor(nodeId: number): void {
        if (nodeId === this.id) {
            this.disabled = true;
            this.hasHeardOfOwnDeath = true;
            this.rerender();
            return;
        }

        this.knownNodeIds.delete(nodeId);
        this.suspectedNodeIds.delete(nodeId);
        this.knownIncarnationNumbers.delete(nodeId);
        this.clearExpectationsFrom(nodeId);
    }

    protected acceptAliveRumor(nodeId: number): void {
        // If we are accepting that a node is alive clear any suspicion of us having it
        this.removeExpectation("clear_suspicion", nodeId);
        this.suspectedNodeIds.delete(nodeId);

        this.addKnownNodeId(nodeId);
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

    // Public getters
    public isDisabled(): boolean {
        return this.disabled;
    }

    public isFaulty(): boolean {
        return this.faulty;
    }

    public hasLeft(): boolean {
        return this.left;
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
        // Handle overlay mode
        if (
            this.sn.config.overlayMode === "who_knows_who" &&
            this.sn.config.selectedNodeId !== null
        ) {
           return this.getColorForWhoKnowsWho()
        }

        // Default rendering approach
        if (this.left || this.hasHeardOfOwnDeath) {
            return "#e5e5e5";
        } 

        if (this.faulty) {
            return "#ffcccb";
        }

        return "#90EE90";
    }

    protected getColorForWhoKnowsWho(): string {
        const selectedNode = this.sn.getNode(this.sn.config.selectedNodeId ?? -1);
        if (selectedNode?.id === this.id ) {
            return "#add8e6";
        }

        if (this.suspectedNodeIds.has(selectedNode?.id ?? -1)) {
            return "#FFA500";
        }

        if (this.knownNodeIds.has(selectedNode?.id ?? -1)) {
            return "#90EE90";
        }

        return "#e5e5e5"
    }

    

    protected getLabel(): string {
        // Default rendering approach
        if (this.hasHeardOfOwnDeath) {
            return `${this.label} (confirmed dead)`;
        }

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