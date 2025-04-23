import { SwimNodeAction } from "@/simulation/SwimNetworkActions"
import { SwimNode } from "./SwimNode"

const MAX_GOSSIP_PER_ACTION = 4
const GOSSIP_BUFFER_SIZE = 30

// Should be n log(x)
// where x is the number of nodes in the network
// and n is a small constant. Given the known small size of the network just set to a constant
const MAXIMUM_SHARES = 4


const RUMOR_TYPES = [
    "alive",
    "dead"
] as const

export type SwimRumorType = typeof RUMOR_TYPES[number]

export type SwimRumor = {
    subject: number
    incarnationNumber: number
    originator: number
    type: SwimRumorType
}

type KnownSwimRumor = {
    rumor: SwimRumor
    // If the rumor has been acted on by the node
    heeded: boolean
    numberOfTimesGossiped: number
}

/**
 * Buffer for a single type of rumor
 */
class SwimRumorBuffer {
    private knownRumors: Set<number> = new Set()
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
        this.knownRumors.add(rumor.subject)
        this.buffer.push({
            rumor,
            heeded: false,
            numberOfTimesGossiped: 0
        })
        
        if (this.buffer.length > this.maxSize) {
            this.evictMostGossipedRumor()
        } else {
            this.resortBuffer()
        }
    }

    /**
     * Two pass process to get the most even distribution of gossip types
     * 1. Attempt to get an even distribution of gossip types with the least number of shares
     * 2. If we don't have enough gossip take the least shared rumors
     */
    public talkAboutNRumors(n: number) {
        const targetThreshold = Math.floor(n / RUMOR_TYPES.length)
        const numberOfTypesObtained = RUMOR_TYPES.reduce((acc, type) => {
            acc[type] = 0
            return acc
        }, {} as Record<SwimRumorType, number>)
        const gossipToShare: SwimRumor[] = []

        // Pass 1: Attempt to get even distribution of gossip types to share
        for(let i = 0; i < this.buffer.length; i++) {
            const item = this.buffer[i]
            if (numberOfTypesObtained[item.rumor.type] <= targetThreshold) {
                numberOfTypesObtained[item.rumor.type]++
                gossipToShare.push(item.rumor)

                // Increment original reference to the rumor
                this.buffer[i].numberOfTimesGossiped++
            }

            if (gossipToShare.length >= n) {
                break
            }
        }

        // Pass 2: If we don't have enough gossip, just take the rest of the buffer
        if(gossipToShare.length < n) {
            for(let i = 0; i < this.buffer.length; i++) {
                const item = this.buffer[i]
                if (!gossipToShare.includes(item.rumor)) {
                    gossipToShare.push(item.rumor)
                    this.buffer[i].numberOfTimesGossiped++
                }

                if (gossipToShare.length >= n) {
                    break
                }
            }
        }
        
        // Take the gossip to share and reorder the rest
        this.evictOldRumors()
        this.resortBuffer()

        return gossipToShare
    }

    public peekAtRumors() {
        return this.buffer.map(r => r.rumor)
    }

    public peekAtUnheededRumors() {
        return this.buffer.filter(r => !r.heeded).map(r => r.rumor)
    }

    public heedAllRumors() {
        this.buffer.forEach((r) => {
            r.heeded = true
        })
    }
    

    public forgetAboutRumorsRelatingTo(id: number) {
        // Remove all rumors relating to the id
        if(!this.knownRumors.has(id)) {
            this.knownRumors.delete(id)
            this.buffer = this.buffer.filter((r) => r.rumor.subject !== id)
        }
    }

    public asMap() {
        return this.buffer.reduce((acc, rumor) => {
            acc.set(rumor.rumor.subject, rumor.rumor)
            return acc
        }, new Map<number, SwimRumor>())
    }

    protected evictOldRumors() {
        this.buffer = this.buffer.map((r) => {
            if(r.numberOfTimesGossiped > MAXIMUM_SHARES) {
                this.knownRumors.delete(r.rumor.subject)
                return null
            }

            return r
        }).filter((r) => r !== null) as KnownSwimRumor[]
    }

    protected alreadyKnowsRumor(rumor: SwimRumor): boolean {
        return this.knownRumors.has(rumor.subject)
    }

    protected evictMostGossipedRumor() {
        this.resortBuffer()

        // Remove the most gossiped rumor
        this.buffer.pop()
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
    public rumors: SwimRumorBuffer = new SwimRumorBuffer(GOSSIP_BUFFER_SIZE)

    public constructor () {}
    
    /**
     * Listens to and takes onboa
     */
    public listenToGossip(action: SwimNodeAction) {
        if (!action.piggybackedGossip) {
            return
        }

        this.consumeRumors(action.piggybackedGossip)
    }

    /**
     * Accepts a rumor and adds it to the rumor mill
     */
    public addRumor(rumor: SwimRumor) {
        this.consumeRumors([
            rumor
        ])
    }

    /**
     * Consume all unheeded rumors and pass them back to the node to handle
     */
    public heedRumors(node: SwimNode) {
        const unheededRumors = this.rumors.peekAtUnheededRumors()

        if (unheededRumors.length === 0) {
            return
        }

        this.rumors.heedAllRumors()
        unheededRumors.forEach((rumor) => {
            node.handleRumor(rumor)
        })
    }

    /**
     * Clears out all rumors from the rumor mill.
     */
    public resetBuffers() {
        this.rumors = new SwimRumorBuffer(GOSSIP_BUFFER_SIZE)
    }

    /**
     * Injects the most relevant rumors into the action to be sent.
     */
    public spreadGossip(action: SwimNodeAction) {
        action.piggybackedGossip = 
            this.rumors.talkAboutNRumors(MAX_GOSSIP_PER_ACTION)
        
    }

    protected consumeRumors(rumors: SwimRumor[]) {
        this.filterIrrelevantRumors(rumors).forEach((rumor) => {
            this.forgetAboutRumorsRelatingTo(rumor.subject)
            this.rumors.addRumor(rumor)
        })
    }

    protected filterIrrelevantRumors(rumors: SwimRumor[]): SwimRumor[] {
        const gossipMap = this.rumors.asMap()
        return rumors.filter((rumor) => 
            !gossipMap.has(rumor.subject) || 
            this.getTheHotterGossip(gossipMap.get(rumor.subject) as SwimRumor, rumor) === rumor
        )
    }

    private forgetAboutRumorsRelatingTo(id: number){
        this.rumors.forgetAboutRumorsRelatingTo(id)
    }

    protected getTheHotterGossip(rumor1: SwimRumor, rumor2: SwimRumor): SwimRumor {
        if (rumor1.incarnationNumber > rumor2.incarnationNumber) {
            return rumor1
        } 

        if (rumor1.incarnationNumber < rumor2.incarnationNumber) {
            return rumor2
        }

        // Dead wins over alive
        if (rumor1.type === "dead"){
            return rumor1
        }

        if (rumor2.type === "dead"){
            return rumor2
        }

        return rumor1
        
    }
}