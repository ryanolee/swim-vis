import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext";
import { useCallback, useReducer } from "react";

export type UiPartitionState = {
  idCounter: number,
  partitions: {
    id: number,
    active: boolean,
  } []
}

export type UiPartitionAction = {
  type: "add",
} | {
  type: "remove",
  payload: { id: number },
} | {
  type: "set_active",
  payload: { id: number, active: boolean },
}

export const useNodeUiPartitionReducer = () => {
  const swimNetwork = useSwimNetworkContext();
  
  const reducer = useCallback((state: UiPartitionState, action: UiPartitionAction) => {
    console.info("Node reducer action", action, state);
    switch (action.type) {
      case "add":
        swimNetwork.addPartition(state.idCounter);
        return {
          ...state,
          idCounter: state.idCounter + 1,
          partitions: [
            ...state.partitions,
            {
              id: state.idCounter,
              active: false,
            }
          ]
        };
      
      case "set_active":
        swimNetwork.getPartition(action.payload.id)?.setActive(action.payload.active);
        return {
          ...state,
          partitions: state.partitions.map(partition => {
            if (partition.id === action.payload.id) {
              return {
                ...partition,
                active: action.payload.active,
              };
            }
            return partition;
          })
        };
      
      case "remove":
        swimNetwork.removePartition(action.payload.id);
        const newPartitions = state.partitions.filter(partition => partition.id !== action.payload.id);
        return {
          ...state,
          partitions: newPartitions,
        };

      default:
        return state;
    }
  }, [swimNetwork]);

  return useReducer(reducer, {
    idCounter: 0,
    partitions: [],
  } );
}
