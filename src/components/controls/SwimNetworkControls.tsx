import { useNodeUiControlReducer } from "@/hooks/useNodeUiControlReducer";
import React from "react";

const SwimNetworkControls: React.FC = () => {
    const [state, dispatch] = useNodeUiControlReducer()

    return (
        <>
            <h2 className="text-lg font-semibold mb-4">Network Controls</h2>
            <button className="bg-blue-600 text-white rounded p-2" onClick={() => dispatch({ type: "add" })}>
                Add Node
            </button>
            {state.nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between p-2 border-b">
                    <span>{node.label}</span>
                    {/* Toggle fault using button red green */}
                    <button
                        className={`p-2 rounded text-white ${node.fault ? "bg-red-600" : "bg-green-600"}`}
                        onClick={() => dispatch({ type: "update_fault", payload: { id: node.id, fault: !node.fault } })}
                    > 
                        {node.fault ? 
                            "Faulty" : "Healthy"}
                    </button>

                    <button className="text-red-600" onClick={() => dispatch({ type: "remove", payload: { id: node.id } })}>
                        Remove
                    </button>
                </div>
            ))}
        </>
    )
}

export default SwimNetworkControls;