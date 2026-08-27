import { SwimNetwork } from "@/simulation/SwimNetwork";
import { SwimNetworkConfig } from "@/simulation/SwimNetworkConfig";
import { applyPresetToNetwork, getPresetFromUrl } from "@/simulation/SwimPreset";
import { createContext, useContext, useMemo } from "react";
import { useGraphContext } from "./GraphContext";

const SwimNetworkContext = createContext<SwimNetwork|null>(null);

export const SwimNetworkProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const graphContext = useGraphContext();
  const swimNetwork = useMemo(() => {
    const network = new SwimNetwork(graphContext.graph, graphContext.data, new SwimNetworkConfig());

    // Preconfigure the simulation when the page was opened with a preset URL
    const preset = getPresetFromUrl();
    if (preset) {
      applyPresetToNetwork(network, preset);
    }

    return network;
  }, [graphContext]);
  
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
