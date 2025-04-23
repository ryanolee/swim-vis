import { SwimNodeAction } from "@/simulation/SwimNetworkActions"

export type SwimRumor = {
    subject: number
    incarnationNumber: number
    relevantNode: number
    type: "alive" | "dead"
}

type KnownSwimRumor = {
    rumor: SwimRumor
    numberOfTimesGossiped: number
}

/**
 * Buffer for a single type of rumor
 */
class SwimRumorBuffer {
    private knownRumors: Set<string> = new Set()
    private buffer: KnownSwimRumor[] = []
    constructor (
        public maxSize: number,
     ) {}

    public addRumor(rumor: SwimRumor) {
        // Do not accept rumors we already know
        if (this.alreadyKnowsRumor(rumor)){
            return
        }

        // Add the rumor to the known rumors set
        this.knownRumors.add(this.getLogicalIdOfRumor(rumor))
        this.buffer.push({
            rumor,
            numberOfTimesGossiped: 0
        })
        
        if (this.buffer.length > this.maxSize) {
            this.evictMostGossipedRumor()
        } else {
            this.resortBuffer()
        }
    }

    protected talkAboutNRumors(n: number) {
        this.buffer = this.buffer.slice(0, n).forEach(r => {
            r.numberOfTimesGossiped += 1
        })
        this.resortBuffer()
    }

    protected alreadyKnowsRumor(rumor: SwimRumor): boolean {
        return this.knownRumors.has(this.getLogicalIdOfRumor(rumor))
    }

    protected evictMostGossipedRumor() {
        this.resortBuffer()

        // Remove the most gossiped rumor
        this.buffer.pop()
    }

    protected getLogicalIdOfRumor(rumor: SwimRumor): string {
        return `${rumor.subject}-${rumor.incarnationNumber}`
    }



     protected resortBuffer() {
        // Sort the buffer by number of times gossiped
        this.buffer.sort((a, b) => b.numberOfTimesGossiped - a.numberOfTimesGossiped)
     }



}

/**
 * The Swim rumor mill contains 
 */
export class SwimRumorMill {
    public aliveRumors: SwimRumorBuffer = new SwimRumorBuffer(10)
    public deadRumors: SwimRumorBuffer = new SwimRumorBuffer(10)

    public constructor () {}
    
    public listenToGossip(action: SwimNodeAction) {
        action.piggybackedGossip
            ?.filter(r => r.type === "alive")
            .forEach(r => this.aliveRumors.addRumor(r))
        action.piggybackedGossip
            ?.filter(r => r.type === "dead")
            .forEach(r => this.deadRumors.addRumor(r))
    }

    public injectRumors(action: SwimNodeAction) {
        const aliveRumors = this.aliveRumors.buffer.map(r => r.rumor)
        const deadRumors = this.deadRumors.buffer.map(r => r.rumor)

        action.piggybackedGossip = [...aliveRumors, ...deadRumors]
    }
}