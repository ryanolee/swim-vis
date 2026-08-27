import { SwimNetwork } from "./SwimNetwork";
import {
    SWIM_DISSEMINATION_APPROACHES,
    SWIM_NODE_PLACEMENT_TYPES,
    SWIM_OVERLAY_MODES,
    SWIM_PING_APPROACHES,
    SwimDisseminationApproachType,
    SwimNodePlacementType,
    SwimOverlayModeType,
    SwimPingApproachType,
} from "./SwimNetworkConfig";

export const MAX_PRESET_NODES = 50;
export const MAX_PRESET_PARTITIONS = 20;
export const PRESET_URL_PARAM = "preset";
export const LINK_BUILD_URL_PARAM = "link_build";
const COORDINATE_LIMIT = 50000;
const SEQUENCED_JOIN_INTERVAL_MS = 1000;

/**
 * Config options that can be "baked" into a share link: locked, hidden from
 * the settings panel and pinned in an overlay instead.
 */
export const BAKEABLE_OPTIONS = [
    "pingApproach",
    "disseminationApproach",
    "overlayMode",
    "nodePlacementType",
    "simulationSpeed",
    "packetLoss",
    "enablePhysics",
] as const;
export type BakeableOption = typeof BAKEABLE_OPTIONS[number];

export const BAKEABLE_OPTION_LABELS: Record<BakeableOption, string> = {
    pingApproach: "Ping Approach",
    disseminationApproach: "Dissemination",
    overlayMode: "Overlay Mode",
    nodePlacementType: "Node Placement",
    simulationSpeed: "Simulation Speed",
    packetLoss: "Packet Loss",
    enablePhysics: "Physics",
};

export type SwimPresetPoint = { x: number, y: number }

export type SwimPresetPartition = {
    start: SwimPresetPoint
    end: SwimPresetPoint
    active: boolean
}

/**
 * Behavioural options chosen when recording a share link.
 */
export type SwimShareOptions = {
    sequencedJoin?: boolean
    fullMesh?: boolean
    baked?: BakeableOption[]
    pinNodeControls?: boolean
    pinPartitionControls?: boolean
    allowAddNodes?: boolean
    allowDeleteNodes?: boolean
    allowRefresh?: boolean
    pinAddNodeButton?: boolean
}

/**
 * A serializable snapshot of a simulation setup that can be shared as a URL.
 * Nodes are restored alive unless listed in faulty. Left nodes are not
 * persisted, the roster only contains members still in the network.
 */
export type SwimPreset = {
    nodes: number
    faulty?: number[]
    /** Node coordinates indexed by node id */
    positions?: [number, number][]
    partitions?: SwimPresetPartition[]
    camera?: SwimPresetPoint & { scale: number }
    /** Add nodes one per second instead of all at once */
    sequencedJoin?: boolean
    /** Seed every node's membership list with every other node */
    fullMesh?: boolean
    baked?: BakeableOption[]
    /** Pin the node controls into the on screen overlay instead of the panel */
    pinNodeControls?: boolean
    /** Pin the partition controls into the on screen overlay instead of the panel */
    pinPartitionControls?: boolean
    /** Show the add node button in the pinned node controls */
    allowAddNodes?: boolean
    /** Show the remove buttons in the pinned node controls */
    allowDeleteNodes?: boolean
    /** Show a refresh page button in the overlay */
    allowRefresh?: boolean
    /** Pin an add node button to the top right of the screen */
    pinAddNodeButton?: boolean
    pingApproach?: SwimPingApproachType
    disseminationApproach?: SwimDisseminationApproachType
    overlayMode?: SwimOverlayModeType
    nodePlacementType?: SwimNodePlacementType
    simulationSpeed?: number
    packetLoss?: number
    enablePhysics?: boolean
}

// Base64url so the encoded preset is safe to place in a query string as-is
const base64UrlEncode = (value: string): string =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const base64UrlDecode = (value: string): string => {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    return atob(base64 + padding);
};

const clampNumber = (value: unknown, min: number, max: number): number | undefined =>
    typeof value === "number" && Number.isFinite(value)
        ? Math.min(max, Math.max(min, value))
        : undefined;

const pickOption = <T extends string>(value: unknown, options: ReadonlyArray<T>): T | undefined =>
    options.includes(value as T) ? value as T : undefined;

const sanitizeIdList = (value: unknown, nodeCount: number): number[] | undefined => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const ids = [...new Set(value.filter((id): id is number =>
        Number.isInteger(id) && id >= 0 && id < nodeCount
    ))];
    return ids.length > 0 ? ids : undefined;
};

const sanitizePoint = (value: unknown): SwimPresetPoint | undefined => {
    const point = value as { x?: unknown, y?: unknown } | null | undefined;
    const x = clampNumber(point?.x, -COORDINATE_LIMIT, COORDINATE_LIMIT);
    const y = clampNumber(point?.y, -COORDINATE_LIMIT, COORDINATE_LIMIT);
    return x !== undefined && y !== undefined ? { x, y } : undefined;
};

const sanitizePositions = (value: unknown, nodeCount: number): [number, number][] | undefined => {
    if (!Array.isArray(value) || value.length === 0) {
        return undefined;
    }

    const positions = value.slice(0, nodeCount).map((entry) => {
        const pair = Array.isArray(entry) ? entry : [];
        const x = clampNumber(pair[0], -COORDINATE_LIMIT, COORDINATE_LIMIT);
        const y = clampNumber(pair[1], -COORDINATE_LIMIT, COORDINATE_LIMIT);
        return x !== undefined && y !== undefined ? [x, y] as [number, number] : null;
    });

    // All or nothing, a partially valid list would misplace nodes
    return positions.every((entry): entry is [number, number] => entry !== null)
        ? positions as [number, number][]
        : undefined;
};

const sanitizePartitions = (value: unknown): SwimPresetPartition[] | undefined => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const partitions = value.slice(0, MAX_PRESET_PARTITIONS).flatMap((entry): SwimPresetPartition[] => {
        const start = sanitizePoint(entry?.start);
        const end = sanitizePoint(entry?.end);
        return start && end ? [{ start, end, active: entry?.active === true }] : [];
    });
    return partitions.length > 0 ? partitions : undefined;
};

const sanitizeCamera = (value: unknown): SwimPreset["camera"] => {
    const camera = value as { scale?: unknown } | null | undefined;
    const point = sanitizePoint(value);
    const scale = clampNumber(camera?.scale, 0.05, 10);
    return point && scale !== undefined ? { ...point, scale } : undefined;
};

const sanitizeBaked = (value: unknown): BakeableOption[] | undefined => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const baked = [...new Set(value.filter((option): option is BakeableOption =>
        BAKEABLE_OPTIONS.includes(option)
    ))];
    return baked.length > 0 ? baked : undefined;
};

export const encodePreset = (preset: SwimPreset): string =>
    base64UrlEncode(JSON.stringify(preset));

/**
 * Decodes and validates a preset from an untrusted URL parameter.
 * Unknown or out-of-range values are dropped rather than failing the whole preset;
 * only a missing/invalid node count rejects it entirely.
 */
export const decodePreset = (encoded: string): SwimPreset | null => {
    let raw: Record<string, unknown>;
    try {
        raw = JSON.parse(base64UrlDecode(encoded));
    } catch {
        return null;
    }

    if (typeof raw !== "object" || raw === null) {
        return null;
    }

    const nodes = clampNumber(raw.nodes, 0, MAX_PRESET_NODES);
    if (nodes === undefined) {
        return null;
    }

    const nodeCount = Math.floor(nodes);

    return {
        nodes: nodeCount,
        faulty: sanitizeIdList(raw.faulty, nodeCount),
        positions: sanitizePositions(raw.positions, nodeCount),
        partitions: sanitizePartitions(raw.partitions),
        camera: sanitizeCamera(raw.camera),
        sequencedJoin: raw.sequencedJoin === true || undefined,
        fullMesh: raw.fullMesh === true || undefined,
        baked: sanitizeBaked(raw.baked),
        pinNodeControls: raw.pinNodeControls === true || undefined,
        pinPartitionControls: raw.pinPartitionControls === true || undefined,
        allowAddNodes: raw.allowAddNodes === true || undefined,
        allowDeleteNodes: raw.allowDeleteNodes === true || undefined,
        allowRefresh: raw.allowRefresh === true || undefined,
        pinAddNodeButton: raw.pinAddNodeButton === true || undefined,
        pingApproach: pickOption(raw.pingApproach, SWIM_PING_APPROACHES),
        disseminationApproach: pickOption(raw.disseminationApproach, SWIM_DISSEMINATION_APPROACHES),
        overlayMode: pickOption(raw.overlayMode, SWIM_OVERLAY_MODES),
        nodePlacementType: pickOption(raw.nodePlacementType, SWIM_NODE_PLACEMENT_TYPES),
        simulationSpeed: clampNumber(raw.simulationSpeed, 0.1, 10),
        packetLoss: clampNumber(raw.packetLoss, 0, 1),
        enablePhysics: typeof raw.enablePhysics === "boolean" ? raw.enablePhysics : undefined,
    };
};

export const getPresetFromUrl = (): SwimPreset | null => {
    const encoded = new URLSearchParams(window.location.search).get(PRESET_URL_PARAM);
    return encoded ? decodePreset(encoded) : null;
};

export const buildPresetUrl = (preset: SwimPreset): string =>
    `${window.location.origin}${window.location.pathname}?${PRESET_URL_PARAM}=${encodePreset(preset)}`;

/**
 * The link builder ui is only shown when the page is opened with ?link_build
 */
export const isLinkBuildMode = (): boolean =>
    new URLSearchParams(window.location.search).has(LINK_BUILD_URL_PARAM);

export const getBakedOptions = (): BakeableOption[] =>
    getPresetFromUrl()?.baked ?? [];

export type SwimPinnedControls = {
    nodes: boolean
    partitions: boolean
    addNodes: boolean
    deleteNodes: boolean
    refresh: boolean
    addNodeButton: boolean
}

/**
 * Which controls the preset pins into the always-on overlay, and what the
 * pinned node controls are allowed to do.
 */
export const getPinnedControls = (): SwimPinnedControls => {
    const preset = getPresetFromUrl();
    return {
        nodes: preset?.pinNodeControls === true,
        partitions: preset?.pinPartitionControls === true,
        addNodes: preset?.allowAddNodes === true,
        deleteNodes: preset?.allowDeleteNodes === true,
        refresh: preset?.allowRefresh === true,
        addNodeButton: preset?.pinAddNodeButton === true,
    };
};

export const isOptionBaked = (option: BakeableOption): boolean =>
    getBakedOptions().includes(option);

/**
 * Applies a preset to a freshly constructed network: config first (so callbacks
 * and node placement see the final values), then partitions, then the nodes.
 * Nodes start alive unless the preset declares otherwise.
 */
export const applyPresetToNetwork = (network: SwimNetwork, preset: SwimPreset): void => {
    const config = network.config;

    if (preset.nodePlacementType !== undefined) config.setNodePlacementType(preset.nodePlacementType);
    if (preset.pingApproach !== undefined) config.setPingApproach(preset.pingApproach);
    if (preset.disseminationApproach !== undefined) config.setDisseminationApproach(preset.disseminationApproach);
    if (preset.overlayMode !== undefined) config.setOverlayMode(preset.overlayMode);
    if (preset.simulationSpeed !== undefined) config.setSimulationSpeed(preset.simulationSpeed);
    if (preset.packetLoss !== undefined) config.setPacketLoss(preset.packetLoss);
    if (preset.enablePhysics !== undefined) config.setEnablePhysics(preset.enablePhysics);

    preset.partitions?.forEach((partition, id) => {
        const created = network.addPartition(id);
        created.setPositions(partition.start, partition.end);
        created.setActive(partition.active);
    });

    // Every node added so far that participates in the full mesh
    const meshIds: number[] = [];
    const spawnNode = (id: number) => {
        const node = network.addNode(id);
        if (preset.fullMesh) {
            node.makeAwareOf(meshIds);
            meshIds.forEach(peer => network.getNode(peer)?.makeAwareOf([id]));
            meshIds.push(id);
        }
        if (preset.faulty?.includes(id)) {
            node.setFaulty(true);
        }
    };

    // Adding a node re-runs auto placement and the camera reset over the whole
    // graph, so recorded positions and camera are reapplied after every spawn
    const applyVisuals = () => {
        preset.positions?.forEach(([x, y], id) => {
            network.graphData.nodes.update({ id, x, y });
        });
        if (preset.camera) {
            network.graph.moveTo({
                position: { x: preset.camera.x, y: preset.camera.y },
                scale: preset.camera.scale,
                animation: false,
            });
        }
    };

    if (preset.sequencedJoin && preset.nodes > 0) {
        // Show the whole roster upfront as inert "unjoined" placeholders,
        // excluded from physics so they hold their positions until they join
        for (let id = 0; id < preset.nodes; id++) {
            network.graphData.nodes.update({
                id,
                label: `Node id ${id} (unjoined)`,
                color: "#e5e5e5",
                physics: false,
                fixed: { x: true, y: true },
            });
        }
        applyVisuals();

        let nextId = 0;
        const spawnNext = () => {
            spawnNode(nextId);
            // The joined node takes part in the physics simulation again
            network.graphData.nodes.update({ id: nextId, physics: true });
            applyVisuals();
            nextId++;
            if (nextId >= preset.nodes) {
                clearInterval(timer);
            }
        };
        const timer = setInterval(spawnNext, SEQUENCED_JOIN_INTERVAL_MS);
        spawnNext();
    } else {
        for (let i = 0; i < preset.nodes; i++) {
            spawnNode(i);
        }
        applyVisuals();
    }
};

/**
 * Captures the current state of a running network as a preset, so it can be
 * resumed from a URL. Membership knowledge and in flight messages are not
 * captured, only the roster, node states, positions, partitions, camera
 * and configuration. Left nodes are dropped and the surviving roster is
 * re-indexed from zero.
 */
export const snapshotPreset = (network: SwimNetwork, options: SwimShareOptions = {}): SwimPreset => {
    const config = network.config;
    const nodeIds = network.getAllNodeIds().filter(id => !network.getNode(id)?.hasLeft());
    const faulty = nodeIds.flatMap((id, index) => network.getNode(id)?.isFaulty() ? [index] : []);

    const graphPositions = network.graph.getPositions(nodeIds);
    const positions = nodeIds.map((id): [number, number] => [
        Math.round(graphPositions[id]?.x ?? 0),
        Math.round(graphPositions[id]?.y ?? 0),
    ]);

    const partitions = network.getAllPartitionIds().flatMap((id): SwimPresetPartition[] => {
        const partition = network.getPartition(id);
        const start = partition?.getStartPosition();
        const end = partition?.getEndPosition();
        if (!partition || !start || !end) {
            return [];
        }
        return [{
            start: { x: Math.round(start.x), y: Math.round(start.y) },
            end: { x: Math.round(end.x), y: Math.round(end.y) },
            active: partition.isActive(),
        }];
    });

    const viewPosition = network.graph.getViewPosition();

    return {
        nodes: nodeIds.length,
        faulty: faulty.length > 0 ? faulty : undefined,
        positions: positions.length > 0 ? positions : undefined,
        partitions: partitions.length > 0 ? partitions : undefined,
        camera: {
            x: Math.round(viewPosition.x),
            y: Math.round(viewPosition.y),
            scale: Math.round(network.graph.getScale() * 1000) / 1000,
        },
        sequencedJoin: options.sequencedJoin || undefined,
        fullMesh: options.fullMesh || undefined,
        baked: options.baked?.length ? options.baked : undefined,
        pinNodeControls: options.pinNodeControls || undefined,
        pinPartitionControls: options.pinPartitionControls || undefined,
        allowAddNodes: options.allowAddNodes || undefined,
        allowDeleteNodes: options.allowDeleteNodes || undefined,
        allowRefresh: options.allowRefresh || undefined,
        pinAddNodeButton: options.pinAddNodeButton || undefined,
        pingApproach: config.pingApproach,
        disseminationApproach: config.disseminationApproach,
        overlayMode: config.overlayMode,
        nodePlacementType: config.nodePlacementType,
        simulationSpeed: config.simulationSpeed,
        packetLoss: config.packetLoss,
        enablePhysics: config.enablePhysics,
    };
};
