import "@radix-ui/themes/styles.css";
import { SwimNetworkConfigControls } from "./components/controls/SwimNetworkConfigControls";
import SwimNetworkControls from "./components/controls/SwimNetworkControls";
import SwimNetworkPartitionControls from "./components/controls/SwimNetworkPartitionControls";
import { SwimNetworkPlacement } from "./components/controls/SwimNetworkPlacement";
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
        <hr/>
        <SwimNetworkPlacement />
        <hr/>
        <div className="mt-5 text-center text-sm">
          <div className="flex justify-center gap-4">
            <a 
              href="https://github.com/ryanolee/swim-vis/blob/main/docs/instructions.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 no-underline"
            >
              Help
            </a>
            <a 
              href="https://github.com/ryanolee/swim-vis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 no-underline"
            >
              Github
            </a>
          </div>
        </div>
      </Sidebar>
    </SwimNetworkProvider>
  </GraphProvider>;
}

export default App;
