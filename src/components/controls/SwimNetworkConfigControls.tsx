import { useNodeUiConfigReducer } from "@/hooks/useNodeUiConfigReducer"
import { SWIM_NODE_ACTION_TYPES } from "@/simulation/SwimNetworkActions"

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
        
    </>
}