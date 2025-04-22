import "@radix-ui/themes/styles.css";
import { SwimNetworkConfigControls } from "./components/controls/SwimNetworkConfigControls";
import SwimNetworkControls from "./components/controls/SwimNetworkControls";
import SwimNetworkPartitionControls from "./components/controls/SwimNetworkPartitionControls";
import { Sidebar } from "./components/sidebar/Sidebar";
import { GraphProvider } from "./contexts/GraphContext";
import { SwimNetworkProvider } from "./contexts/SwimNetworkContext";

function App() {

  return <GraphProvider>
    <SwimNetworkProvider>
      <Sidebar> 
        <SwimNetworkControls />
        <hr/>
        <SwimNetworkPartitionControls />
        <hr/>
        <SwimNetworkConfigControls />
      </Sidebar>
    </SwimNetworkProvider>
  </GraphProvider>;
}

export default App;
