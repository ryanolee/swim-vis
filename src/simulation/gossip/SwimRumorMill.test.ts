import { SwimNodeAction } from "../SwimNetworkActions";
import { SwimRumor, SwimRumorMill } from "./SwimRumorMill";

describe('SwimRumorMill', () => {
    let rumorMill: SwimRumorMill;
    
    beforeEach(() => {
        rumorMill = new SwimRumorMill();
    });
    
    // Helper functions
    const createRumor = (subject: number, incarnationNumber: number, originator: number, type: 'alive' | 'dead'): SwimRumor => ({
        subject, incarnationNumber, originator, type
    } as unknown as SwimRumor);
    
    const createAction = (source: number, target: number): SwimNodeAction => ({
        type: 'ping', source, target
    } as unknown as SwimNodeAction);
    
    test('should prioritize dead over alive rumors with same incarnation', () => {
        const aliveRumor = createRumor(1, 1, 2, 'alive');
        const deadRumor = createRumor(1, 1, 3, 'dead');
        
        rumorMill.addRumor(aliveRumor);
        rumorMill.addRumor(deadRumor);
        
        const action = createAction(3, 4);
        rumorMill.spreadGossip(action);
        
        expect(action.piggybackedGossip).toContainEqual(deadRumor);
    });
});