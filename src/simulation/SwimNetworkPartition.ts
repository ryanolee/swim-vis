import { Position } from "vis-network/declarations/entry-esnext";
import { SwimNetwork } from "./SwimNetwork";
import { SwimNetworkAction } from "./SwimNetworkActions";

const NODE_OFFSET = 100000
const PARTITION_EDGE_OFFSET = 10000000000

export class SwimNetworkPartition {
    constructor (
        protected id: number,
        protected active: boolean,
        protected sn: SwimNetwork,
    ){}

    public setActive(active: boolean){
        this.active = active
        this.rerender(this.sn)
    }

    public rerender(sn: SwimNetwork){
        sn.graphData.nodes.update({
            id: this.id + NODE_OFFSET,
            label: `Partition ${this.id} Start`,
            color: '#808080',
            fixed: {
                x: true,
                y: true
            }
        })

        sn.graphData.nodes.update({
            id: this.id + (NODE_OFFSET * 2),
            label: `Partition ${this.id} End`,
            color: `#808080`,
            fixed: {
                x: true,
                y: true
            }
        })

        if(this.active) {
            sn.graphData.edges.update({
                id: this.id + PARTITION_EDGE_OFFSET,
                from: this.id + NODE_OFFSET,
                color: '#808080',
                to: this.id + (NODE_OFFSET * 2),
                dashes: true
            })
        } else {
            sn.graphData.edges.remove(this.id + PARTITION_EDGE_OFFSET)
        }
    }

    public remove(sn: SwimNetwork){
        sn.graphData.nodes.remove(this.id + NODE_OFFSET );
        sn.graphData.nodes.remove(this.id + NODE_OFFSET * 2 );
        sn.graphData.edges.remove(this.id + PARTITION_EDGE_OFFSET);
    }

    public actionIntersectsWithPartition(action: SwimNetworkAction): boolean {
        if(!this.active) {
            return false
        }

        const startPartitionNode = this.getXYFromId(this.id + NODE_OFFSET)
        const endPartitionNode = this.getXYFromId(this.id + (NODE_OFFSET * 2))

        const startNode = this.getXYFromId(action.from)
        const endNode = this.getXYFromId(action.to)

        if(!startPartitionNode || !endPartitionNode || !startNode || !endNode) {
            console.warn("Unable to find nodes required for intersection calculation", action, startPartitionNode, endPartitionNode, startNode, endNode)
            return false
        }

        return SwimNetworkPartition.lineIntersectsWithLine(
            startPartitionNode.x, startPartitionNode.y,
            endPartitionNode.x, endPartitionNode.y,
            startNode.x, startNode.y,
            endNode.x, endNode.y,
        )
    }

    protected getXYFromId(id: number): Position | null {
        try {
          return this.sn.graph.getPosition(id)
        } catch (e) {
          console.warn("Unable to get position for node", id, e)
          return null
        }
    }


    /**
     *  {@see https://gmlscripts.com/script/lines_intersect} 
     */
    static lineIntersectsWithLine(
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number,
        x4: number, y4: number,
    ): boolean {

    var ua, ub, ud, ux, uy, vx, vy, wx, wy;
    ua = 0;
    ux = x2 - x1;
    uy = y2 - y1;
    vx = x4 - x3;
    vy = y4 - y3;
    wx = x1 - x3;
    wy = y1 - y3;
    ud = vy * ux - vx * uy;
    if (ud != 0) 
    {
      ua = (vx * wy - vy * wx) / ud;
      ub = (ux * wy - uy * wx) / ud;
      if (ua < 0 || ua > 1 || ub < 0 || ub > 1) ua = 0;
    }
    return ua !== 0;
  }
}
