/**
 * Slider Component - For mood/stress/sleep ratings
 */

import React from "react";

export interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  emoji?: string[];
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  showValue = true,
  emoji = [],
  disabled = false,
}) => {
  // Map value to emoji index
  const emojiIndex = emoji.length > 0 ? Math.floor((value - min) / ((max - min) / (emoji.length - 1))) : 0;
  const currentEmoji = emoji[emojiIndex] || "";

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {showValue && (
            <span className="text-lg font-semibold text-primary flex items-center gap-2">
              {currentEmoji && <span className="text-2xl">{currentEmoji}</span>}
              {value} / {max}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-3 bg-surface-depressed rounded-lg appearance-none cursor-pointer
                     shadow-neumorphicPressed
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-primary
                     [&::-webkit-slider-thumb]:shadow-neumorphic
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-all
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-primary
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:shadow-neumorphic
                     [&::-moz-range-thumb]:cursor-pointer
                     disabled:opacity-50
                     disabled:cursor-not-allowed"
        />
        
        {/* Value markers */}
        <div className="flex justify-between mt-1 px-1">
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((num) => (
            <span
              key={num}
              className={`text-xs ${
                num === value
                  ? "text-primary font-semibold"
                  : "text-gray-400"
              }`}
            >
              {num}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};





