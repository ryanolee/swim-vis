import "@radix-ui/themes/styles.css";
import { SwimNetworkConfigControls } from "./components/controls/SwimNetworkConfigControls";
import SwimNetworkControls from "./components/controls/SwimNetworkControls";
import SwimNetworkPartitionControls from "./components/controls/SwimNetworkPartitionControls";
import { SwimNetworkPlacement } from "./components/controls/SwimNetworkPlacement";
import { SwimNetworkShareControls } from "./components/controls/SwimNetworkShareControls";
import { SwimBakedOverlay } from "./components/SwimBakedOverlay";
import { Sidebar } from "./components/sidebar/Sidebar";
import { GraphProvider } from "./contexts/GraphContext";
import { SwimNetworkProvider } from "./contexts/SwimNetworkContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { NodeControlsProvider } from "@/contexts/NodeControlsContext";
import { getPinnedControls, isLinkBuildMode } from "@/simulation/SwimPreset";

function App() {
  // Controls pinned into the overlay are taken out of the side panel
  const pinned = getPinnedControls();

  return <GraphProvider>
    <SwimNetworkProvider>
      <ConfigProvider>
       <NodeControlsProvider>
        <SwimBakedOverlay />
        <Sidebar>
          {!pinned.nodes && <>
            <SwimNetworkControls />
            <hr/>
          </>}
          {!pinned.partitions && <>
            <SwimNetworkPartitionControls />
            <hr/>
          </>}
          <SwimNetworkConfigControls />
          <hr/>
          <SwimNetworkPlacement />
          <hr/>
          {isLinkBuildMode() && <>
            <SwimNetworkShareControls />
            <hr/>
          </>}
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
       </NodeControlsProvider>
      </ConfigProvider>
    </SwimNetworkProvider>
  </GraphProvider>;
}

export default App;
