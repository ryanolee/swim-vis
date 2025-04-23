import { SwimNodeAction } from "@/simulation/SwimNetworkActions"
import { SwimNode } from "./SwimNode"

const GOSSIP_PER_ACTION = 4
const GOSSIP_BUFFER_SIZE = 20

// Should be n log(x)
// where x is the number of nodes in the network
// and n is a small constant. Given the known small size of the network just set to a constant
const MAXIMUM_SHARES = 4


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
            numberOfTimesGossiped: 0
        })
        
        if (this.buffer.length > this.maxSize) {
            this.evictMostGossipedRumor()
        } else {
            this.resortBuffer()
        }
    }

    public talkAboutNRumors(n: number) {
        // Increment shared gossip by reference
        for(let i = 0; i < n; i++){
            if (this.buffer[i]) {
                this.buffer[i].numberOfTimesGossiped++
            }
        }
        
        // Take the gossip to share and reorder the rest
        const gossipToShare = this.buffer.slice(0, n).map(r => r.rumor)
        this.evictOldRumors()
        this.resortBuffer()

        return gossipToShare
    }

    public peekAtRumors() {
        return this.buffer.map(r => r.rumor)
    }

    public forgetAboutRumorsRelatingTo(id: number) {
        // Remove all rumors relating to the id
        if(!this.knownRumors.has(id)) {
            this.knownRumors.delete(id)
            this.buffer = this.buffer.filter((r) => r.rumor.subject !== id)
        }
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
    public aliveRumors: SwimRumorBuffer = new SwimRumorBuffer(GOSSIP_BUFFER_SIZE)
    public deadRumors: SwimRumorBuffer = new SwimRumorBuffer(GOSSIP_BUFFER_SIZE)

    public constructor () {}
    
    /**
     * Listens to and takes onboa
     */
    public listenToGossip(action: SwimNodeAction) {

        action.piggybackedGossip?.forEach((rumor) => {
            rumor.type === "alive" ?
                this.aliveRumors.addRumor(rumor):
                this.deadRumors.addRumor(rumor)
        })
    }

    protected forgetAboutRumorsRelatingTo(id: number){
        this.aliveRumors.forgetAboutRumorsRelatingTo(id)
        this.deadRumors.forgetAboutRumorsRelatingTo(id)
    }

    public heedRumors(node: SwimNode) {
        this.getHottestGossip().forEach((rumor) => {
           rumor.type === "alive" ?
                node.acceptAliveRumor(rumor.subject) :
                node.acceptDeathRumor(rumor.subject)
        })
    }

    /**
     * Injects the most relevant rumors into the action to be sent.
     */
    public spreadGossip(action: SwimNodeAction) {
        action.piggybackedGossip = [
            ...this.aliveRumors.talkAboutNRumors(
                Math.floor(GOSSIP_PER_ACTION / 2)
            ),
            ...this.deadRumors.talkAboutNRumors(
                Math.floor(GOSSIP_PER_ACTION / 2)
            )
        ]
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

    /**
     * Fetches most relevant rumors available to the node
     */
    protected getHottestGossip(): Map<number, SwimRumor>{
        const rumors = [...this.aliveRumors.peekAtRumors(), ...this.deadRumors.peekAtRumors()]
        const hottestGossMap = new Map<number, SwimRumor>()
        for(const rumor of rumors) {
           if(!hottestGossMap.has(rumor.subject)){

                // If there is already a rumor for this subject, check if the new rumor is "hotter"
                hottestGossMap.set(rumor.subject, rumor)
                continue;
            }

            const existingRumor = hottestGossMap.get(rumor.subject) as SwimRumor
            if (this.getTheHotterGossip(existingRumor, rumor) === rumor){
                hottestGossMap.set(rumor.subject, rumor)
            }
        }

        return hottestGossMap
    }         
}