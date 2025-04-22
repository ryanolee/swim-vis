import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext";
import { useCallback, useReducer } from "react";

export type UiState = {
  idCounter: number,
  nodes: {
    id: number,
    label: string,
    fault: boolean,
  }[]
}

export type UiNodeAction = {
  type: "add",
} | {
  type: "remove",
  payload: { id: number },
} | {
  type: "update_fault",
  payload: { id: number, fault: boolean },
}

export const useNodeUiControlReducer = () => {
  const swimNetwork = useSwimNetworkContext();
  
  const reducer = useCallback((state: UiState, action: UiNodeAction) => {
    console.info("Node reducer action", action, state);
    switch (action.type) {
      case "add":
        const newNode = swimNetwork.addNode(state.idCounter);
        return {
          ...state,
          idCounter: state.idCounter + 1,
          nodes: [
            ...state.nodes,
            {
              id: newNode.id,
              label: newNode.label,
              fault: false,
            }
          ]
        };

      case "update_fault":
        swimNetwork.getNode(action.payload.id)?.setFaulty(action.payload.fault);
        return {
          ...state,
          nodes: state.nodes.map(node => {
            if (node.id === action.payload.id) {
              return {
                ...node,
                fault: action.payload.fault,
              };
            }
            return node;
          })
        };

      case "remove":
        swimNetwork.removeNode(action.payload.id);
        return {
          ...state,
          nodes: state.nodes.filter(node => node.id !== action.payload.id),
        }
     
      default:
        return state;
    }
  }, [swimNetwork]);

  return useReducer(reducer, {
    idCounter: 0,
    nodes: [],
  } );
}
