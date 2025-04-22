import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext";
import { SwimNodeActionType } from "@/simulation/SwimNetworkActions";
import { SwimPingApproachType } from "@/simulation/SwimNetworkConfig";
import { useCallback, useReducer } from "react";

export type UiConfigAction = {
    type: "add_action_filter" | "remove_action_filter",
    actionType: SwimNodeActionType
}

export type UIConfigState = {
    actionTypeFilters: SwimNodeActionType[]
    pingApproach: SwimPingApproachType
}

export const useNodeUiConfigReducer = () => {
  const swimNetwork = useSwimNetworkContext();
  
  const reducer = useCallback((state: UIConfigState, action: UiConfigAction) => {
    console.info("Config reducer action", action, state);
    switch (action.type) {
      case "add_action_filter":
        swimNetwork.config.addEventFilterType(action.actionType)
        return {
          ...state,
          actionTypeFilters: [...state.actionTypeFilters, action.actionType]
        };
      case "remove_action_filter":
        swimNetwork.config.removeEventFilterType(action.actionType)
        return {
          ...state,
          actionTypeFilters: state.actionTypeFilters.filter(type => type !== action.actionType)
        }   
      default:
        return state
    }   
  }, [swimNetwork]);

  return useReducer(reducer, {actionTypeFilters: [], pingApproach: "random"});
}
