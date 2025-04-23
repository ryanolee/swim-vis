import { useSwimNetworkContext } from "@/contexts/SwimNetworkContext"

export const SwimNetworkPlacement: React.FC<{}> = () => {
    const network = useSwimNetworkContext()
    return <>
        <button className="bg-blue-600 text-white rounded p-2" onClick={() => network.placement?.updateNodesIntoCircle()}>
            Reset Node Placements
        </button>
    </>
}