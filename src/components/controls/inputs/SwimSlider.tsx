import { Slider } from "@material-tailwind/react"
import { useState } from "react"
import { useDebouncedCallback } from 'use-debounce'


export const SwimSlider: React.FC<{
        description: string,
        min: number,
        max: number,
        step: number,
        initialValue?: number
        onChange: (value: number) => void,
}> = ({
        description,
        min,
        max,
        step,
        initialValue,
        onChange,
}) => {
        const [sliderVal, setSliderVal] = useState(initialValue ?? 1)
        const onChangeDebounced = useDebouncedCallback(onChange, 200)

        return <>
                <p className="text-sm text-gray-600 mb-2">{description}</p>
                <p className="text-sm text-gray-600 mb-2">Current value: {sliderVal}</p>
                <Slider
                        placeholder="bottom" 
                        onPointerEnterCapture={() => {{}}}
                        onPointerLeaveCapture={() => {{}}}
                        value={sliderVal}
                        onChange={(evt) => {
                                const value = parseFloat(evt.target.value)
                                setSliderVal(value)
                                onChangeDebounced(value);
                        }}
                        min={min}
                        max={max}
                        step={step}
                />
        </>
}
