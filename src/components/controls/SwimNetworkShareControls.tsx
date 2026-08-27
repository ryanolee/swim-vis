import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext";
import {
    BAKEABLE_OPTION_LABELS,
    BAKEABLE_OPTIONS,
    BakeableOption,
    buildPresetUrl,
    getPresetFromUrl,
    LINK_BUILD_URL_PARAM,
    snapshotPreset,
    SwimShareOptions,
} from "@/simulation/SwimPreset";
import React, { useState } from "react";

type ShareToggleKey = Exclude<keyof SwimShareOptions, "baked">

const SHARE_TOGGLES: { key: ShareToggleKey, label: string }[] = [
    { key: "sequencedJoin", label: "Join nodes one per second" },
    { key: "fullMesh", label: "All nodes start knowing all nodes" },
    { key: "pinNodeControls", label: "Pin node controls on screen" },
    { key: "pinPartitionControls", label: "Pin partition controls on screen" },
    { key: "allowAddNodes", label: "Pinned: allow adding nodes" },
    { key: "allowDeleteNodes", label: "Pinned: allow deleting nodes" },
    { key: "allowRefresh", label: "Pinned: show refresh page button" },
    { key: "pinAddNodeButton", label: "Pin add node button top right" },
];

export const SwimNetworkShareControls: React.FC = () => {
    const network = useSwimNetworkContext();
    const urlPreset = getPresetFromUrl();
    const [copied, setCopied] = useState(false);
    const [options, setOptions] = useState<SwimShareOptions>({
        sequencedJoin: urlPreset?.sequencedJoin ?? false,
        fullMesh: urlPreset?.fullMesh ?? false,
        pinNodeControls: urlPreset?.pinNodeControls ?? false,
        pinPartitionControls: urlPreset?.pinPartitionControls ?? false,
        allowAddNodes: urlPreset?.allowAddNodes ?? false,
        allowDeleteNodes: urlPreset?.allowDeleteNodes ?? false,
        allowRefresh: urlPreset?.allowRefresh ?? false,
        pinAddNodeButton: urlPreset?.pinAddNodeButton ?? false,
    });
    const [baked, setBaked] = useState<BakeableOption[]>(urlPreset?.baked ?? []);

    const toggleOption = (key: ShareToggleKey) => setOptions(current => ({
        ...current,
        [key]: !current[key],
    }));

    const toggleBaked = (option: BakeableOption) => setBaked(current =>
        current.includes(option)
            ? current.filter(o => o !== option)
            : [...current, option]
    );

    const record = async () => {
        const url = buildPresetUrl(snapshotPreset(network, { ...options, baked }));

        // Sync the current state back into the address bar so a reload,
        // bookmark or shared link resumes from this exact setup. The address
        // bar keeps link_build so the recorder stays in build mode, while the
        // copied share link is clean of it.
        window.history.replaceState(null, "", `${url}&${LINK_BUILD_URL_PARAM}`);

        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // Clipboard unavailable, the address bar still holds the link
        }

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <h2 className="text-lg font-semibold mb-4">Share</h2>
            {SHARE_TOGGLES.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={options[key] ?? false}
                        onChange={() => toggleOption(key)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-800">{label}</span>
                </label>
            ))}

            <h3 className="text-md font-semibold mt-3 mb-2">Baked (locked) options</h3>
            <p className="text-sm text-gray-600 mb-2">
                Baked options are locked in the shared link: hidden from the settings
                panel and pinned in an overlay in the top left instead.
            </p>
            {BAKEABLE_OPTIONS.map(option => (
                <label key={option} className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={baked.includes(option)}
                        onChange={() => toggleBaked(option)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-800">{BAKEABLE_OPTION_LABELS[option]}</span>
                </label>
            ))}

            <button className="bg-blue-600 text-white rounded p-2 mt-2" onClick={record}>
                {copied ? "Link copied!" : "Save state to link"}
            </button>
            <p className="text-sm text-gray-600 mt-2">
                Records the nodes, their states and positions, partitions, camera and
                settings into the page URL (also copied to your clipboard) so the
                setup can be resumed later.
            </p>
        </>
    );
};
