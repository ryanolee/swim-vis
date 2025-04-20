import { SwimNetworkAction, SwimNodeAction } from "./SwimNetworkActions";

const PING_INTERVAL_TICKS = 100;
const MULTICAST_REBROADCAST_CHANCE = 0.2; 

export class SwimNode {
    protected knownNodeIds: Set<number> = new Set<number>();
    protected incarnationNumber: number = 0;
    protected randomCycleOffset: number = Math.floor(Math.random() * PING_INTERVAL_TICKS);

    constructor (
        public readonly id: number,
        public readonly label: string,
        public readonly dispatchAction: (action: SwimNodeAction) => void,
    ){}

    public tick(currentTick: number): void {
        if ((currentTick + this.randomCycleOffset) % PING_INTERVAL_TICKS === 0) {
            this.sendPing();
        }
    }

    public receiveAction(action: SwimNetworkAction): void {
        console.info("Received action", action, this.id);
        switch (action.type) {
            case "ping":
                this.handlePing(action);
                break;
            case "ack":
                this.handleAck(action);
                break;
            case "join":
                this.handleInitialJoin(action);
                break;
            case "multicast_join":
                this.addKnownNodeId(action.payload.subject as number);
                //this.handleMulticastRebroadcast(action);
                break;

            default:
                console.warn("Unknown action type", action.type);
        }
    }

    public addKnownNodeId(nodeId: number): void {
        if (nodeId === this.id) {
            return;
        }
        this.knownNodeIds.add(nodeId);
    }

    public addKnownNodeIdAndReportJoin(nodeId: number): void {
        this.addKnownNodeId(nodeId);
        this.dispatchAction({
            type: "join",
            from: this.id,
            to: nodeId,
            payload: {
                subject: this.id,
            },
        });
    }

    protected handlePing(action: SwimNetworkAction): void {
        this.dispatchAction({
            type: "ack",
            from: this.id,
            to: action.from,
        });
    }

    protected handleAck(action: SwimNetworkAction): void {
       
    }

    protected sendPing(): void {
        const peer = this.getRandomKnownPeer()
        if (peer === null) {
            return;
        }

        this.dispatchAction({
            type: "ping",
            from: this.id,
            to: peer,
        });
    }

    protected handleMulticastRebroadcast(action: SwimNetworkAction): void {
        if(Math.random() < MULTICAST_REBROADCAST_CHANCE) {
            this.multicastDispatch({
                ...action,
                from: this.id,
            });
        }
    }

    protected handleInitialJoin(action: SwimNetworkAction): void {
        this.addKnownNodeId(action.from);
        this.multicastDispatch({
            type: "multicast_join",
            payload: {
                subject: action.payload.subject,
            },
            from: this.id,
            to: action.from,
        });
    }

    protected multicastDispatch(action: SwimNodeAction): void {
        for (const peer of this.knownNodeIds) {
            if (peer !== this.id) {
                this.dispatchAction({
                    ...action,
                    to: peer,
                });
            }
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
    
}