import { useNodeUiPartitionReducer } from "@/hooks/useNodeUiPartitionReducer";
import React from "react";

const SwimNetworkPartitionControls: React.FC = () => {
   const [state, dispatch] =  useNodeUiPartitionReducer()
    return (
         <>
              {state.partitions.map((partition) => (
                <div key={partition.id} className="flex items-center justify-between p-2 border-b">
                     <span>Partition {partition.id}</span>
                     <button
                          className={`p-2 rounded text-white ${partition.active ? "bg-green-600" : "bg-gray-600"}`}
                          onClick={() => dispatch({ type: "set_active", payload: { id: partition.id, active: !partition.active } })}
                     > 
                          {partition.active ? 
                            "Active" : "Inactive"}
                     </button>
    
                     <button className="text-red-600" onClick={() => dispatch({ type: "remove", payload: { id: partition.id } })}>
                          Remove
                     </button>
                </div>
              ))}
              <button className="bg-blue-600 text-white rounded p-2" onClick={() => dispatch({ type: "add" })}>
                Add Partition
              </button>
         </>
    )
}

export default SwimNetworkPartitionControls;