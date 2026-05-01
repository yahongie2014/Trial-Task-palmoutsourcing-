import React from "react";
import { compactPrice } from "../utils/price";

interface PriceSliderProps {
  min: number;
  max: number;
  currentMin: number;
  currentMax: number;
  onChange: (min: number, max: number) => void;
}

export const PriceSlider: React.FC<PriceSliderProps> = ({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
}) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), currentMax - 1);
    onChange(value, currentMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), currentMin + 1);
    onChange(currentMin, value);
  };

  // Calculate percentages for the background track
  const minPercent = ((currentMin - min) / (max - min)) * 100;
  const maxPercent = ((currentMax - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2 px-2">
      <div className="flex justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
        <span>{compactPrice(currentMin)}</span>
        <span>{compactPrice(currentMax)}</span>
      </div>
      
      <div className="relative h-6 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-1 bg-surface-800 rounded-full"></div>
        
        {/* Active Track Highlight */}
        <div 
          className="absolute h-1 bg-indigo-500 rounded-full"
          style={{ 
            left: `${minPercent}%`, 
            right: `${100 - maxPercent}%` 
          }}
        ></div>

        <input
          type="range"
          min={min}
          max={max}
          value={currentMin}
          onChange={handleMinChange}
          className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={currentMax}
          onChange={handleMaxChange}
          className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>
    </div>
  );
};
