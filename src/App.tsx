import "@radix-ui/themes/styles.css";
import SwimNetworkControls from "./components/controls/SwimNetworkControls";
import { Sidebar } from "./components/sidebar/Sidebar";
import { GraphProvider } from "./contexts/GraphContext";
import { SwimNetworkProvider } from "./contexts/SwimNetworkContext";

function App() {

  return <GraphProvider>
    <SwimNetworkProvider>
      <Sidebar> 
        <SwimNetworkControls />
      </Sidebar>
    </SwimNetworkProvider>
  </GraphProvider>;
}

export default App;
