import { SwimNetwork } from "./SwimNetwork";

export class SwimNodePlacement {
    constructor (
        public sn: SwimNetwork,
    ) {}

    public updateNodesIntoCircle(){
        const nodes = this.sn.getAllNodeIds()
        
        const activeNodes = nodes.filter((id) => !this.sn.getNode(id)?.hasLeft())
        const inactiveNodes = nodes.filter((id) => this.sn.getNode(id)?.hasLeft())

        this.placeNodesInCircle(activeNodes, 0, 0)
        this.placeNodesInCircle(inactiveNodes, (inactiveNodes.length + activeNodes.length) * 10 + 300, 0)

        this.sn.graph.moveTo({
            animation: false,
            position: {
                x: 0,
                y: 0,
            },
            scale: 1 - (activeNodes.length / 150),
        })
    }

    protected placeNodesInCircle(nodesIds: number[], centerX: number = 0, centerY: number = 0) {
        const radius = nodesIds.length * 10 + 50

        nodesIds.forEach((id, index) => {
            const angle = (index / nodesIds.length) * 2 * Math.PI
            const x =  centerX + radius * Math.cos(angle)
            const y =  centerY + radius * Math.sin(angle)

            this.sn.graphData.nodes.update({
                id: id,
                x: x,
                y: y,
            })
        })
    }

}