
interface SwimConfigSelectorProps {
    onChange: (selected: string) => void
    options: ReadonlyArray<string>
    defaultValue: string
    label: string
    description: string
}

export const SwimConfigSelector: React.FC<SwimConfigSelectorProps> = ({  options, onChange, defaultValue, label, description }) => {
    return (
        <div className="flex flex-col mb-4">
            <label className="text-sm font-semibold mb-1">{label}</label>
            <select
                defaultValue={defaultValue}
                onChange={(e) => {
                    const selectedValue = e.target.value;
                    onChange(selectedValue);
                }}
                className="p-2 border rounded"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            <span className="text-xs text-gray-500 mt-1">{description}</span>
        </div>
    );
}