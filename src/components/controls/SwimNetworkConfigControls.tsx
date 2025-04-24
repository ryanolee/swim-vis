import { useNodeUiConfigReducer } from "@/hooks/useNodeUiConfigReducer"
import { SWIM_NODE_ACTION_TYPES } from "@/simulation/SwimNetworkActions"
import { DEFAULT_PACKET_LOSS, DEFAULT_SPEED, SWIM_DISSEMINATION_APPROACHES, SWIM_OVERLAY_MODES, SWIM_PING_APPROACHES } from "@/simulation/SwimNetworkConfig"
import { SwimConfigSelector } from "./inputs/SwimConfigSelector"
import { SwimSlider } from "@/components/controls/inputs/SwimSlider";

export const SwimNetworkConfigControls: React.FC = () => {
    const [config, dispatch] = useNodeUiConfigReducer()
    return <>
        <h2 className="text-lg font-semibold mb-4">Network Configuration</h2>
        <h3 className="text-md font-semibold mb-2">Action Type Filters</h3>
        <p className="text-sm text-gray-600 mb-2">Select the action types to filter:</p>
        {SWIM_NODE_ACTION_TYPES.map(filterType => (
            <label
                key={filterType}
                className="flex items-center gap-2 mb-2 cursor-pointer select-none"
            >
                <input
                    type="checkbox"
                    checked={config.actionTypeFilters.includes(filterType)}
                    onChange={() =>
                        dispatch({
                            type: config.actionTypeFilters.includes(filterType) ? "remove_action_filter" : "add_action_filter",
                            actionType: filterType,
                        })
                    }
                    className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="text-gray-800">{filterType}</span>
            </label>
        ))}
        <SwimConfigSelector
            options={SWIM_PING_APPROACHES}
            onChange={(selected) => {
                dispatch({
                    type: "set_ping_approach",
                    pingApproach: selected as any,
                })
            }}
            defaultValue={config.pingApproach}
            label="Ping Approach"
            description="Select the ping approach to use in the network."
        />
        <SwimConfigSelector
            options={SWIM_DISSEMINATION_APPROACHES}
            onChange={(selected) => {
                dispatch({
                    type: "set_dissemination_approach",
                    disseminationApproach: selected as any,
                })
            }}
            defaultValue={config.disseminationApproach}
            label="Dissemination Approach"
            description="Select the dissemination approach to use in the network."
        />
        <SwimConfigSelector
            options={SWIM_OVERLAY_MODES}
            onChange={(selected) => {
                dispatch({
                    type: "set_overlay_mode",
                    overlayMode: selected as any,
                })
            }}
            defaultValue={config.overlayMode}
            label="Overlay Mode"
            description="Set what information should be shown when a node is selected."
        />
        <h3 className="text-md font-semibold mb-2">Network speed</h3>
        <SwimSlider
            min={0.1}
            max={10}
            step={0.1}
            initialValue={DEFAULT_SPEED}
            onChange={(value: number) => {dispatch({
                type: "set_simulation_speed",
                simulationSpeed: value
            })}}
            description="Set the network simulation speed."
        />
        <SwimSlider
            min={0}
            max={1}
            step={0.01}
            initialValue={DEFAULT_PACKET_LOSS}
            onChange={(value: number) => {dispatch({
                type: "set_packet_loss",
                packetLoss: value
            })}}
            description="Set the number of packets randomly lost on the network"
        />
    </>
}