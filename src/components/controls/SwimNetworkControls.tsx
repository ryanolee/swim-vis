import { useNodeUiControlReducer } from "@/hooks/useNodeUiControlReducer";
import React from "react";

const SwimNetworkControls: React.FC = () => {
    const [state, dispatch] = useNodeUiControlReducer()

    return (
        <>
            {JSON.stringify(state)}
            <button className="bg-blue-600 text-white rounded p-2" onClick={() => dispatch({ type: "add" })}>
                Add Node
            </button>
        </>
    )
}

export default SwimNetworkControls;