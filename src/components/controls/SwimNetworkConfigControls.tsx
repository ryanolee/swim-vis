import { useNodeUiConfigReducer } from "@/hooks/useNodeUiConfigReducer"
import { SWIM_NODE_ACTION_TYPES } from "@/simulation/SwimNetworkActions"
import { SWIM_DISSEMINATION_APPROACHES, SWIM_PING_APPROACHES } from "@/simulation/SwimNetworkConfig"

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
        <h3 className="text-md font-semibold mb-2">Ping Approach</h3>
        <p className="text-sm text-gray-600 mb-2">Select the ping approach:</p>
        <select
            value={config.pingApproach}
            onChange={(e) =>
                dispatch({
                    type: "set_ping_approach",
                    pingApproach: e.target.value as any,
                })
            }
            className="form-select block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        >
            {SWIM_PING_APPROACHES.map((approach) => (
                <option key={approach} value={approach}>
                    {approach}
                </option>
            ))}
        </select>
        <h3 className="text-md font-semibold mb-2">Dissemination Approach</h3>
        <p className="text-sm text-gray-600 mb-2">Select the dissemination approach:</p>
        <select
            value={config.disseminationApproach}
            onChange={(e) =>
                dispatch({
                    type: "set_dissemination_approach",
                    disseminationApproach: e.target.value as any,
                })
            }
            className="form-select block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        >
            {SWIM_DISSEMINATION_APPROACHES.map((approach) => (
                <option key={approach} value={approach}>
                    {approach}
                </option>
            ))}
        </select>
    </>
}