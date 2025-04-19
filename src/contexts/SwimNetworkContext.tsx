import { SwimNetwork } from "@/simulation/SwimNetwork";
import { createContext, useContext, useMemo } from "react";
import { useGraphContext } from "./GraphContext";

const SwimNetworkContext = createContext<SwimNetwork|null>(null);

export const SwimNetworkProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const graphContext = useGraphContext();
  const swimNetwork = useMemo(() => new SwimNetwork(graphContext.graph, graphContext.data), [graphContext]);
  return (
    <SwimNetworkContext.Provider value={swimNetwork}>
      {children}
    </SwimNetworkContext.Provider>
  );
}

export const useSwimNetworkContext = () => {
  const context = useContext(SwimNetworkContext);
  if (!context) {
    throw new Error("useSwimNetworkContext must be used within a SwimNetworkProvider");
  }
  return context;
};
