import SwimNetworkControls from "@/components/controls/SwimNetworkControls";
import SwimNetworkPartitionControls from "@/components/controls/SwimNetworkPartitionControls";
import { useNodeControlsContext } from "@/contexts/NodeControlsContext";
import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext";
import { SwimNetworkConfig } from "@/simulation/SwimNetworkConfig";
import { BAKEABLE_OPTION_LABELS, BakeableOption, getBakedOptions, getPinnedControls, getPresetFromUrl } from "@/simulation/SwimPreset";
import React from "react";

const formatValue = (option: BakeableOption, config: SwimNetworkConfig): string => {
    const value = config[option];
    if (option === "packetLoss") {
        return `${Math.round((value as number) * 100)}%`;
    }
    if (option === "simulationSpeed") {
        return `${value}x`;
    }
    if (typeof value === "boolean") {
        return value ? "on" : "off";
    }
    return String(value);
};

/**
 * Frosted glass overlay that is always on screen when the preset bakes
 * settings or pins controls. Baked values cannot change, so reading them
 * once per render is fine.
 */
export const SwimBakedOverlay: React.FC = () => {
    const network = useSwimNetworkContext();
    const [, dispatchNodeAction] = useNodeControlsContext();
    // Options stay locked either way, hideBakedOverlay only hides the display
    const baked = getPresetFromUrl()?.hideBakedOverlay ? [] : getBakedOptions();
    const pinned = getPinnedControls();

    const showPanel = baked.length > 0 || pinned.nodes || pinned.partitions || pinned.refresh;
    if (!showPanel && !pinned.addNodeButton) {
        return null;
    }

    return (
        <>
        {pinned.addNodeButton && (
            <div className="fixed top-6 right-6 z-40 rounded-lg bg-white/60 backdrop-blur-md p-2">
                <button
                    className="bg-blue-600 text-white rounded p-2"
                    onClick={() => dispatchNodeAction({ type: "add" })}
                >
                    Add Node
                </button>
            </div>
        )}
        {showPanel && <div className="fixed top-20 left-6 z-40 rounded-lg bg-white/60 backdrop-blur-md p-4 text-sm w-72 max-h-[calc(100vh-7rem)] overflow-y-auto">
            {baked.length > 0 && (
                <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-gray-800">Locked settings</h3>
                    {baked.map(option => (
                        <div key={option} className="flex justify-between gap-6">
                            <span className="text-gray-600">{BAKEABLE_OPTION_LABELS[option]}</span>
                            <span className="font-medium text-gray-800">{formatValue(option, network.config)}</span>
                        </div>
                    ))}
                </div>
            )}
            {pinned.nodes && (
                <div className="mb-4">
                    <SwimNetworkControls showAdd={pinned.addNodes} showRemove={pinned.deleteNodes} />
                </div>
            )}
            {pinned.partitions && (
                <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-4">Partition Controls</h2>
                    <SwimNetworkPartitionControls />
                </div>
            )}
            {pinned.refresh && (
                <button
                    className="bg-blue-600 text-white rounded p-2 w-full"
                    onClick={() => window.location.reload()}
                >
                    Refresh page
                </button>
            )}
        </div>}
        </>
    );
};
