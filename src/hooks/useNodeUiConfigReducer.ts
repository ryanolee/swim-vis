import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext";
import { SwimNodeActionType } from "@/simulation/SwimNetworkActions";
import { DEFAULT_DISSEMINATION_APPROACH, DEFAULT_ENABLED_PHYSICS, DEFAULT_NODE_PLACEMENT, DEFAULT_OVERLAY_MODE, DEFAULT_PACKET_LOSS, DEFAULT_PING_APPROACH, DEFAULT_SPEED, SwimDisseminationApproachType, SwimNodePlacementType, SwimOverlayModeType, SwimPingApproachType } from "@/simulation/SwimNetworkConfig";
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
    type: "set_node_placement",
    nodePlacementType: SwimNodePlacementType
} | {
    type: "set_overlay_mode",
    overlayMode: SwimOverlayModeType
} | {
    type: "set_packet_loss",
    packetLoss: number
} | {
    type: "set_simulation_speed",
    simulationSpeed: number
} | {
    type: "set_enable_physics",
    enablePhysics: boolean
}

export type UIConfigState = {
    actionTypeFilters: SwimNodeActionType[]
    pingApproach: SwimPingApproachType
    disseminationApproach: SwimDisseminationApproachType
    overlayMode: SwimOverlayModeType
    nodePlacementType: SwimNodePlacementType
    simulationSpeed: number
    packetLoss: number
    enablePhysics: boolean
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
      case "set_node_placement":
        swimNetwork.config.setNodePlacementType(action.nodePlacementType)
        return {
          ...state,
          nodePlacementType: action.nodePlacementType
        }
      case "set_overlay_mode":
        swimNetwork.config.setOverlayMode(action.overlayMode)
        return {
          ...state,
          overlayMode: action.overlayMode
        }
      case "set_simulation_speed":
        swimNetwork.config.setSimulationSpeed(action.simulationSpeed)
        return {
          ...state,
          simulationSpeed: action.simulationSpeed
        }
      case "set_packet_loss":
        swimNetwork.config.setPacketLoss(action.packetLoss)
        return {
          ...state,
          packetLoss: action.packetLoss
        }
      case "set_enable_physics":
        swimNetwork.config.setEnablePhysics(action.enablePhysics)
        return {
          ...state,
          enablePhysics: action.enablePhysics
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
    simulationSpeed: DEFAULT_SPEED,
    packetLoss: DEFAULT_PACKET_LOSS,
    nodePlacementType: DEFAULT_NODE_PLACEMENT,
    enablePhysics: DEFAULT_ENABLED_PHYSICS,
  } as UIConfigState);
}
