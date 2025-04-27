import { UiConfigAction, UIConfigState, useNodeUiConfigReducer } from "@/hooks/useNodeUiConfigReducer";
import { createContext, useContext } from "react";

interface ContextType {
  dispatch: React.ActionDispatch<[action: UiConfigAction]>;
  state: UIConfigState;
}

const ConfigContext = createContext<ContextType | null>(null);

type Props = {
  children?: React.ReactNode;
};

export const ConfigProvider: React.FC<Props> = ({ children }) => {
  const [state, dispatch] = useNodeUiConfigReducer();

  return (
    <ConfigContext.Provider value={{
        state, dispatch
    }}>{children}</ConfigContext.Provider>
  );
};

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfigContext must be used within a ConfigProvider");
  }
  return [
    context.state,
    context.dispatch
  ] as const;
};
