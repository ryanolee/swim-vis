import { useNodeUiControlReducer } from "@/hooks/useNodeUiControlReducer";
import React from "react";

const SwimNetworkControls: React.FC = () => {
    const [state, dispatch] = useNodeUiControlReducer()

    return (
        <>
            {state.nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between p-2 border-b">
                    <span>{node.label}</span>
                    <button className="text-red-600" onClick={() => dispatch({ type: "remove", payload: { id: node.id } })}>
                        Remove
                    </button>
                </div>
            ))}
            <button className="bg-blue-600 text-white rounded p-2" onClick={() => dispatch({ type: "add" })}>
                Add Node
            </button>
        </>
    )
}

export default SwimNetworkControls;