'use client';

import { useDitherStore } from '@/store/ditherStore';
import { algorithms } from '@/lib/three/algorithms';

export default function AlgorithmSelector() {
  const { currentAlgorithm, setAlgorithm, setParam } = useDitherStore();

  const selectedAlgo = algorithms.find(a => a.id === currentAlgorithm);

  return (
    <div className="mb-8">
      <div className="text-sm font-medium mb-4 text-[#2a2a2a]">ALGORITHM</div>

      <select
        value={currentAlgorithm}
        onChange={(e) => setAlgorithm(Number(e.target.value))}
        className="w-full bg-transparent border border-[#d0cdc4] p-2 text-[#2a2a2a] font-['JetBrains_Mono',monospace] text-sm outline-none cursor-pointer"
      >
        {algorithms.map((algo) => (
          <option key={algo.id} value={algo.id}>
            {algo.name}
          </option>
        ))}
      </select>

      {selectedAlgo?.params && (
        <div className="mt-6 space-y-4">
          {Object.entries(selectedAlgo.params).map(([key, param]) => (
            <div key={key} className="mb-5">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-[#2a2a2a]">{param.label || key}</span>
                <span className="text-[#666] font-['JetBrains_Mono',monospace]">
                  {param.type === 'range' ? param.value?.toFixed(2) : param.value}
                </span>
              </div>

              {param.type === 'range' && (
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step || 0.01}
                  value={param.value || param.min}
                  onChange={(e) => {
                    const paramNum = key.replace('param', '') as '1' | '2' | '3' | '4';
                    setParam(Number(paramNum) as 1 | 2 | 3 | 4, Number(e.target.value));
                  }}
                  className="w-full h-[2px] bg-[#d0cdc4] outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2a2a2a] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#2a2a2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                />
              )}

              {param.type === 'select' && (
                <select
                  value={param.value}
                  onChange={(e) => {
                    const paramNum = key.replace('param', '') as '1' | '2' | '3' | '4';
                    setParam(Number(paramNum) as 1 | 2 | 3 | 4, Number(e.target.value));
                  }}
                  className="w-full p-2 bg-[#f5f4f0] border border-[#d0cdc4] text-[#2a2a2a] font-['JetBrains_Mono',monospace] text-xs cursor-pointer outline-none hover:bg-[#e8e7e2] hover:border-[#b8b5ac]"
                >
                  {param.options?.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {param.labels?.[idx] || opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
