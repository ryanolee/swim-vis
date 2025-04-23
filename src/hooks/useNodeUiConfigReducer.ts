import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext";
import { SwimNodeActionType } from "@/simulation/SwimNetworkActions";
import { DEFAULT_DISSEMINATION_APPROACH, DEFAULT_OVERLAY_MODE, DEFAULT_PING_APPROACH, SwimDisseminationApproachType, SwimOverlayModeType, SwimPingApproachType } from "@/simulation/SwimNetworkConfig";
import { useCallback, useReducer } from "react";

export type UiConfigAction = {
    type: "add_action_filter" | "remove_action_filter",
    actionType: SwimNodeActionType
} | {
    type: "set_ping_approach",
    pingApproach: SwimPingApproachType
} | {
    type: "set_dissemination_approach",
    disseminationApproach: SwimDisseminationApproachType
} | {
    type: "set_overlay_mode",
    overlayMode: SwimOverlayModeType
}

export type UIConfigState = {
    actionTypeFilters: SwimNodeActionType[]
    pingApproach: SwimPingApproachType
    disseminationApproach: SwimDisseminationApproachType
    overlayMode: SwimOverlayModeType
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
      case "set_ping_approach":
        swimNetwork.config.setPingApproach(action.pingApproach) 
        return {
          ...state,
          pingApproach: action.pingApproach
        }
      case "set_dissemination_approach":
        swimNetwork.config.setDisseminationApproach(action.disseminationApproach)
        return {
          ...state,
          disseminationApproach: action.disseminationApproach
        }
      case "set_overlay_mode":
        swimNetwork.config.setOverlayMode(action.overlayMode)
        return {
          ...state,
          overlayMode: action.overlayMode
        }
      
      default:
        return state
    }   
  }, [swimNetwork]);

  return useReducer(reducer, {
    actionTypeFilters: [],
    pingApproach: DEFAULT_PING_APPROACH, 
    disseminationApproach: DEFAULT_DISSEMINATION_APPROACH,
    overlayMode: DEFAULT_OVERLAY_MODE,
  } as UIConfigState);
}
