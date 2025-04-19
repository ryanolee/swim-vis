import { createContext, useContext } from "react";
import { DataSet, Network } from "vis-network/standalone/esm/vis-network";

interface ContextType {
  graph: Network;
  data: {
    nodes: DataSet<any>
    edges: DataSet<any>;
  }
}

const GraphContext = createContext<ContextType | null>(null);

type Props = {
  children?: React.ReactNode;
};

export const GraphProvider: React.FC<Props> = ({ children }) => {
  const nodes = new DataSet([]);
  const edges = new DataSet([]);


  const graph = new Network(
      document.getElementById("network") as HTMLDivElement,
      { nodes, edges },
      {
        autoResize: true,
        height: '100%',
        width: '100%',
      }
    );

  

  return (
    <GraphContext.Provider value={{
      data: {nodes, edges},
      graph: graph,
    }}>{children}</GraphContext.Provider>
  );
};

export const useGraphContext = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraphContext must be used within a GraphProvider");
  }
  return context;
};
