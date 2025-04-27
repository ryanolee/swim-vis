import { SwimConfigSelector } from "@/components/controls/inputs/SwimConfigSelector"
import { useConfigContext } from "@/contexts/ConfigContext"
import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext"
import { SWIM_NODE_PLACEMENT_TYPES } from "@/simulation/SwimNetworkConfig"

export const SwimNetworkPlacement: React.FC<{}> = () => {
    const network = useSwimNetworkContext()
    const [config, dispatch] = useConfigContext()
    return <>
        <SwimConfigSelector 
             options={SWIM_NODE_PLACEMENT_TYPES}
                        onChange={(selected) => {
                            dispatch({
                                type: "set_node_placement",
                                nodePlacementType: selected,
                            })
                        }}
                        defaultValue={config.nodePlacementType}
                        label="Node Placement Type"
                        description="How nodes should be placed when they are created."
        />
        {config.nodePlacementType !== 'none' && <button className="bg-blue-600 text-white rounded p-2" onClick={() => network.placement?.setNodePlacementBasedOnConfig()}>
            Reset Node Placements
        </button>}
    </>
}