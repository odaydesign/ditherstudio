'use client';

import { useDitherStore } from '@/store/ditherStore';
import { algorithms } from '@/lib/three/algorithms';
import { useMemo } from 'react';

export default function AlgorithmSelector() {
  const { currentAlgorithm, setAlgorithm, setParam, param1, param2, param3, param4 } = useDitherStore();

  const selectedAlgo = algorithms.find(a => a.shaderValue === currentAlgorithm);

  // Group algorithms by category
  const groupedAlgorithms = useMemo(() => {
    const groups = new Map<string, typeof algorithms>();

    algorithms.forEach(algo => {
      const category = algo.category || 'Other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(algo);
    });

    // Define category order for better UX
    const categoryOrder = [
      'None',
      'Error Diffusion',
      'Error Diffusion (Classic)',
      'Error Diffusion (Sierra Family)',
      'Error Diffusion (Variants)',
      'Advanced Error Diffusion',
      'Ordered Dithering (Bayer Matrix)',
      'Ordered Dithering (Special Patterns)',
      'Halftone Screening (Print)',
      'Print/Professional',
      'Quality Enhancement',
      'Artistic Patterns',
      'Creative/Artistic',
      'Noise-Based',
      'Geometric Effects',
      'Special'
    ];

    // Sort groups by predefined order
    return Array.from(groups.entries()).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a[0]);
      const indexB = categoryOrder.indexOf(b[0]);
      if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, []);

  return (
    <div className="mb-8">
      <div className="text-sm font-medium mb-4 text-[#2a2a2a]">ALGORITHM</div>

      <select
        value={currentAlgorithm}
        onChange={(e) => setAlgorithm(Number(e.target.value))}
        className="w-full bg-transparent border border-[#d0cdc4] p-2 text-[#2a2a2a] font-['JetBrains_Mono',monospace] text-sm outline-none cursor-pointer"
      >
        {groupedAlgorithms.map(([category, algos]) => (
          <optgroup key={category} label={category}>
            {algos.map((algo) => (
              <option key={algo.id} value={algo.shaderValue}>
                {algo.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {selectedAlgo?.params && (
        <div className="mt-6 space-y-4">
          {Object.entries(selectedAlgo.params).map(([key, param]) => {
            // Get current value from store based on uniformIndex
            const storeValues = [param1, param2, param3, param4];
            const currentValue = param.uniformIndex
              ? storeValues[param.uniformIndex - 1]
              : param.value;

            return (
              <div key={key} className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-[#2a2a2a]">{param.label || key}</span>
                  <span className="text-[#666] font-['JetBrains_Mono',monospace]">
                    {param.type === 'slider' || (!param.type && param.min !== undefined)
                      ? currentValue?.toFixed(2)
                      : currentValue}
                  </span>
                </div>

                {/* Default slider for parameters with min/max but no explicit type */}
                {(!param.type && param.min !== undefined && param.max !== undefined) && (
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step || 0.01}
                    value={currentValue || param.min}
                    onChange={(e) => {
                      if (param.uniformIndex) {
                        setParam(param.uniformIndex, Number(e.target.value));
                      }
                    }}
                    className="w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                  />
                )}

                {/* Explicit slider type */}
                {param.type === 'slider' && (
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step || 0.01}
                    value={currentValue || param.min}
                    onChange={(e) => {
                      if (param.uniformIndex) {
                        setParam(param.uniformIndex, Number(e.target.value));
                      }
                    }}
                    className="w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                  />
                )}

                {/* Discrete selectors */}
                {(param.type === 'discrete' || param.type === 'discrete_labeled') && (
                  <select
                    value={currentValue}
                    onChange={(e) => {
                      if (param.uniformIndex) {
                        setParam(param.uniformIndex, Number(e.target.value));
                      }
                    }}
                    className="w-full p-2 bg-[#f5f4f0] border border-[#d0cdc4] text-[#2a2a2a] font-['JetBrains_Mono',monospace] text-xs cursor-pointer outline-none hover:bg-[#e8e7e2] hover:border-[#b8b5ac]"
                  >
                    {param.options?.map((opt, idx) => {
                      const value = typeof opt === 'number' ? opt : opt.value;
                      const label = typeof opt === 'number' ? opt : opt.label;
                      return (
                        <option key={idx} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
