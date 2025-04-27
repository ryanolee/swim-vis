import { SwimNetwork } from "./SwimNetwork";

export class SwimNodePlacement {
    constructor (
        public sn: SwimNetwork,
    ) {}

    public setNodePlacementBasedOnConfig(){
        console.log("Setting node placement based on config", this.sn.config.nodePlacementType)
        switch (this.sn.config.nodePlacementType) {
            case "grid":
                this.updateNodeIntoGrid()
                break
            case "circle":
                this.updateNodesIntoCircle()
                break
            case "none":
                // Noop
                break
            default:
                console.warn("Unknown node placement type", this.sn.config.nodePlacementType)
                break
        }
    }

    public updateNodeIntoGrid(){
        const nodes = this.sn.getAllNodeIds()
        const gridWidth = Math.ceil(Math.sqrt(nodes.length))

        nodes.forEach((id, index) => {
            const x = (index % gridWidth) * 100
            const y = Math.floor(index / gridWidth) * 100

            this.sn.graphData.nodes.update({
                id: id,
                x: x,
                y: y,
            })
        })

        this.resetCamera()
    }

    public updateNodesIntoCircle(){
        const nodes = this.sn.getAllNodeIds()
        
        const activeNodes = nodes.filter((id) => !this.sn.getNode(id)?.hasLeft())
        const inactiveNodes = nodes.filter((id) => this.sn.getNode(id)?.hasLeft())

        this.placeNodesInCircle(activeNodes, 0, 0)
        this.placeNodesInCircle(inactiveNodes, (inactiveNodes.length + activeNodes.length) * 10 + 300, 0)
        this.resetCamera()
    }

    protected resetCamera(){
        const nodes = this.sn.getAllNodeIds()
        this.sn.graph.moveTo({
            animation: false,
            position: {
                x: 0,
                y: 0,
            },
            scale: 1 - (nodes.length / 150),
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