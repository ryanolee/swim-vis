import { SwimNodeAction } from "@/simulation/SwimNetworkActions"
import { SwimNode } from "../SwimNode"
import { SwimRumorBuffer } from "./SwimGossipBuffer"

const MAX_GOSSIP_PER_ACTION = 6
const GOSSIP_BUFFER_SIZE = 30

export const RUMOR_TYPES = [
    "alive",
    "suspect",
    "dead"
] as const

export type SwimRumorType = typeof RUMOR_TYPES[number]



export type SwimRumor = {
    subject: number
    incarnationNumber: number
    originator: number
    type: SwimRumorType
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
        return rumors.filter((newRumor) => {
            if (!gossipMap.has(newRumor.subject)) {
                return true
            }

            const existingRumor = gossipMap.get(newRumor.subject) as SwimRumor
            return this.getTheHotterGossip(
                newRumor,
                existingRumor
            )
        })
    }

    private forgetAboutRumorsRelatingTo(id: number){
        this.rumors.forgetAboutRumorsRelatingTo(id)
    }

    // Return if the rumor passed first is hotter than the second
    // True if the first rumor is hotter than the second
    // False if the second rumor is hotter than the first
    protected getTheHotterGossip(rumor1: SwimRumor, rumor2: SwimRumor): boolean {

        // If the rumors are the same keep the original one
        if (
            rumor1.incarnationNumber === rumor2.incarnationNumber &&
            rumor1.type === rumor2.type
        ) {
            return false
        }
        
        // Dead (confirm) ALWAY wins all else
        if (rumor1.type === "dead"){
            return true
        }

        if (rumor2.type === "dead"){
            return false
        }

        // Accept the rumor if has a higher incarnation number 
        if (rumor1.incarnationNumber > rumor2.incarnationNumber) {
            return true
        } 

        if (rumor2.incarnationNumber > rumor1.incarnationNumber) {
            return false
        }

        // When the incarnation numbers are the same
        // prefer suspect over alive
        // if the node want's to refute the rumor it can do so
        if(rumor1.type === "suspect" && rumor2.type === "alive"){
            return true
        }

        if(rumor2.type === "suspect" && rumor1.type === "alive"){
            return false
        }



        return true
        
    }
}