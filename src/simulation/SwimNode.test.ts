import { SwimNetwork } from "./SwimNetwork"
import { SwimNode } from "./SwimNode"

class TestableSwimNode extends SwimNode {
    public isSuspected(id: number): boolean {
        return this.suspectedNodeIds.has(id)
    }
}

const stubNetwork = {
    config: {
        disseminationApproach: "gossip_with_suspicion",
        overlayMode: "none",
        selectedNodeId: null,
    },
    graphData: { nodes: { update: () => {} } },
    dispatchAction: () => {},
    getCurrentTick: () => 0,
} as unknown as SwimNetwork

describe('SwimNode handleRumor precedence', () => {
    let node: TestableSwimNode

    beforeEach(() => {
        node = new TestableSwimNode(1, "Node id 1", stubNetwork)
        node.handleRumor({ subject: 5, type: "alive", originator: 9, incarnationNumber: 2 })
    })

    it('drops suspect rumors with a stale incarnation number', () => {
        node.handleRumor({ subject: 5, type: "suspect", originator: 9, incarnationNumber: 1 })
        expect(node.isSuspected(5)).toBe(false)
    })

    it('accepts suspect rumors at the known incarnation number', () => {
        node.handleRumor({ subject: 5, type: "suspect", originator: 9, incarnationNumber: 2 })
        expect(node.isSuspected(5)).toBe(true)
    })

    it('only clears suspicion on an alive rumor with a higher incarnation number', () => {
        node.handleRumor({ subject: 5, type: "suspect", originator: 9, incarnationNumber: 2 })

        node.handleRumor({ subject: 5, type: "alive", originator: 5, incarnationNumber: 2 })
        expect(node.isSuspected(5)).toBe(true)

        node.handleRumor({ subject: 5, type: "alive", originator: 5, incarnationNumber: 3 })
        expect(node.isSuspected(5)).toBe(false)
    })

    it('always accepts dead rumors', () => {
        node.handleRumor({ subject: 5, type: "dead", originator: 9, incarnationNumber: 0 })
        expect(node.isKnown(5)).toBe(false)
    })
})
