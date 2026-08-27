import { decodePreset, encodePreset, MAX_PRESET_NODES, SwimPreset } from "./SwimPreset"

describe('SwimPreset codec', () => {
    it('round trips a full preset', () => {
        const preset: SwimPreset = {
            nodes: 3,
            faulty: [2],
            positions: [[0, 0], [100, -50], [200, 300]],
            partitions: [
                { start: { x: -10, y: 20 }, end: { x: 30, y: 40 }, active: true },
                { start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, active: false },
            ],
            camera: { x: 12, y: -34, scale: 1.5 },
            sequencedJoin: true,
            fullMesh: true,
            baked: ["disseminationApproach", "packetLoss"],
            pinNodeControls: true,
            pinPartitionControls: true,
            allowAddNodes: true,
            allowDeleteNodes: true,
            allowRefresh: true,
            pinAddNodeButton: true,
            pingApproach: "random",
            disseminationApproach: "gossip",
            overlayMode: "none",
            nodePlacementType: "grid",
            simulationSpeed: 2,
            packetLoss: 0.1,
            enablePhysics: false,
        }

        expect(decodePreset(encodePreset(preset))).toEqual(preset)
    })

    it('produces url safe output', () => {
        const encoded = encodePreset({ nodes: 3, simulationSpeed: 9.9, packetLoss: 0.77 })
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('rejects garbage and presets without a node count', () => {
        expect(decodePreset("not base64 json!!")).toBeNull()
        expect(decodePreset(encodePreset({} as SwimPreset))).toBeNull()
    })

    it('drops invalid options and clamps out of range numbers', () => {
        const decoded = decodePreset(encodePreset({
            nodes: 9999,
            pingApproach: "carrier_pigeon",
            simulationSpeed: 1000,
            packetLoss: -5,
        } as unknown as SwimPreset))

        expect(decoded).toEqual({
            nodes: MAX_PRESET_NODES,
            faulty: undefined,
            left: undefined,
            pingApproach: undefined,
            disseminationApproach: undefined,
            overlayMode: undefined,
            nodePlacementType: undefined,
            simulationSpeed: 10,
            packetLoss: 0,
            enablePhysics: undefined,
        })
    })

    it('sanitizes positions, partitions, camera and baked options', () => {
        const decoded = decodePreset(encodePreset({
            nodes: 2,
            // Longer than the roster, extra entries are cut
            positions: [[1, 2], [3, 4], [5, 6]],
            partitions: [
                { start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, active: "yes" },
                { start: { x: "bad" }, end: { x: 1, y: 1 }, active: true },
            ],
            camera: { x: 0, y: 0, scale: 9999 },
            sequencedJoin: "yes",
            pinNodeControls: "yes",
            baked: ["packetLoss", "not_a_real_option", "packetLoss"],
        } as unknown as SwimPreset))

        expect(decoded?.positions).toEqual([[1, 2], [3, 4]])
        expect(decoded?.partitions).toEqual([{ start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, active: false }])
        expect(decoded?.camera).toEqual({ x: 0, y: 0, scale: 10 })
        expect(decoded?.sequencedJoin).toBeUndefined()
        expect(decoded?.pinNodeControls).toBeUndefined()
        expect(decoded?.baked).toEqual(["packetLoss"])
    })

    it('drops position lists containing invalid entries entirely', () => {
        const decoded = decodePreset(encodePreset({
            nodes: 2,
            positions: [[1, 2], ["bad", 4]],
        } as unknown as SwimPreset))

        expect(decoded?.positions).toBeUndefined()
    })

    it('sanitizes node state id lists', () => {
        const decoded = decodePreset(encodePreset({
            nodes: 3,
            // Out of range, duplicate and non numeric ids should be dropped
            faulty: [0, 0, 1, 99, -1, "evil"],
        } as unknown as SwimPreset))

        expect(decoded?.faulty).toEqual([0, 1])
    })
})
