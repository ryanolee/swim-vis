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
  type: "activate",
  payload: { id: number },
} | {
  type: "update_label",
  payload: { id: number, label: string },
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
     
      default:
        return state;
    }
  }, [swimNetwork]);

  return useReducer(reducer, {
    idCounter: 0,
    nodes: [],
  } );
}
