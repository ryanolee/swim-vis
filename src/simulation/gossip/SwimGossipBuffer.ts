import { RUMOR_TYPES, SwimRumor, SwimRumorType } from "./SwimRumorMill"


/**
 * Bias for the different types of rumors
 * The lower the number the more time is is shared
 */
const GOSSIP_BIAS: Record<SwimRumorType, number> = {
    "alive": 1,
    "dead": 0.25,
    "suspect": 0.5,
}

type KnownSwimRumor = {
    rumor: SwimRumor
    // If the rumor has been acted on by the node
    heeded: boolean
    numberOfTimesGossiped: number
}

// Should be n log(x)
// where x is the number of nodes in the network
// and n is a small constant. Given the known small size of the network just set to a constant
const MAXIMUM_SHARES = 8

/**
 * Buffer for a single type of rumor
 */
export class SwimRumorBuffer {
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
            if (item.numberOfTimesGossiped >= MAXIMUM_SHARES) {
                continue
            }

            if (numberOfTypesObtained[item.rumor.type] < targetThreshold) {
                numberOfTypesObtained[item.rumor.type]++
                gossipToShare.push(item.rumor)

                // Increment original reference to the rumor
                this.buffer[i].numberOfTimesGossiped += GOSSIP_BIAS[item.rumor.type]
            }

            if (gossipToShare.length >= n) {
                break
            }
        }

        // Pass 2: If we don't have enough gossip, just take the rest of the buffer
        if(gossipToShare.length < n) {
            
            for(let i = 0; i < this.buffer.length; i++) {
                const item = this.buffer[i]

                // Assume Array is in sorted order
                if (item.numberOfTimesGossiped >= MAXIMUM_SHARES) {
                    break
                }

                if (!gossipToShare.includes(item.rumor)) {
                    gossipToShare.push(item.rumor)
                    this.buffer[i].numberOfTimesGossiped += GOSSIP_BIAS[item.rumor.type]
                }

                if (gossipToShare.length >= n) {
                    break
                }
            }
        }
        
        // Take the gossip to share and reorder the rest
        this.resortBuffer()

        return gossipToShare
    }

    public doesDeadNodeRumorExistForNode(id: number) {
        // Check if there is a dead rumor for the node
        return this.buffer.some((r) => r.rumor.type === "dead" && r.rumor.subject === id)
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
        if(this.knownRumors.has(id)) {
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
        this.buffer.sort((a, b) =>  a.numberOfTimesGossiped - b.numberOfTimesGossiped )
    }
}