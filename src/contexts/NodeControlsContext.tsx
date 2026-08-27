import { UiNodeAction, UiState, useNodeUiControlReducer } from "@/hooks/useNodeUiControlReducer";
import { createContext, useContext } from "react";

interface ContextType {
  dispatch: React.ActionDispatch<[action: UiNodeAction]>;
  state: UiState;
}

const NodeControlsContext = createContext<ContextType | null>(null);

type Props = {
  children?: React.ReactNode;
};

/**
 * Shares a single node control reducer between every place that can add or
 * modify nodes (the side panel, the pinned overlay and the pinned add node
 * button), so their node lists and id counters stay in sync.
 */
export const NodeControlsProvider: React.FC<Props> = ({ children }) => {
  const [state, dispatch] = useNodeUiControlReducer();

  return (
    <NodeControlsContext.Provider value={{
        state, dispatch
    }}>{children}</NodeControlsContext.Provider>
  );
};

export const useNodeControlsContext = () => {
  const context = useContext(NodeControlsContext);
  if (!context) {
    throw new Error("useNodeControlsContext must be used within a NodeControlsProvider");
  }
  return [
    context.state,
    context.dispatch
  ] as const;
};
