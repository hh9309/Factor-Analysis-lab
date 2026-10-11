import React, { useState, useMemo } from 'react';
import { Matrix } from '../utils/matrixMath';
import { Sparkles, SlidersHorizontal, ArrowUpDown, Filter, HelpCircle, Layers } from 'lucide-react';

interface FactorLoadingsHeatmapProps {
  loadings: Matrix;
  unrotatedLoadings?: Matrix;
  variableNames: string[];
  factorNames: string[];
  rotationType: string;
}

export const FactorLoadingsHeatmap: React.FC<FactorLoadingsHeatmapProps> = ({
  loadings,
  unrotatedLoadings,
  variableNames,
  factorNames,
  rotationType,
}) => {
  // Color palette modes: 'diverging' (Rose - White - Indigo) or 'magnitude' (Slate - Teal/Emerald)
  const [colorMode, setColorMode] = useState<'diverging' | 'magnitude'>('diverging');
  // Compare view: 'rotated' or 'compare' (side-by-side or unrotated vs rotated)
  const [viewMode, setViewMode] = useState<'rotated' | 'unrotated'>('rotated');
  // Cutoff threshold slider: 0.0 to 0.7 (default 0.3)
  const [cutoff, setCutoff] = useState<number>(0.3);
  // Sort by dominant factor clustering
  const [sortByDominance, setSortByDominance] = useState<boolean>(true);
  // Selected cell for inspector
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number; val: number } | null>(null);

  const activeLoadings = viewMode === 'unrotated' && unrotatedLoadings ? unrotatedLoadings : loadings;
  const p = variableNames.length;
  const m = activeLoadings[0]?.length || 1;

  // Ordering of variables: either original or grouped by dominant factor
  const variableOrder = useMemo(() => {
    if (!sortByDominance) {
      return variableNames.map((_, idx) => idx);
    }
    // Find dominant factor for each variable
    const items = variableNames.map((_, idx) => {
      let maxAbs = -1;
      let dominantFactor = 0;
      activeLoadings[idx]?.forEach((val, f) => {
        if (Math.abs(val) > maxAbs) {
          maxAbs = Math.abs(val);
          dominantFactor = f;
        }
      });
      return { idx, dominantFactor, maxAbs };
    });

    // Sort by dominant factor ascending, then by maxAbs descending
    items.sort((a, b) => {
      if (a.dominantFactor !== b.dominantFactor) return a.dominantFactor - b.dominantFactor;
      return b.maxAbs - a.maxAbs;
    });

    return items.map(item => item.idx);
  }, [variableNames, activeLoadings, sortByDominance]);

  // Compute color background and text for cell
  const getCellVisual = (val: number) => {
    const absVal = Math.abs(val);
    const isBelowCutoff = absVal < cutoff;

    if (colorMode === 'diverging') {
      // Diverging: negative is warm rose/red, positive is deep indigo/blue
      if (isBelowCutoff) {
        return {
          bg: 'bg-slate-50/80',
          textColor: 'text-slate-300',
          style: { backgroundColor: 'rgba(248, 250, 252, 0.8)' },
        };
      }

      if (val >= 0) {
        // Positive: from light indigo to deep indigo
        // Intensity 0.3 to 1.0 mapped to alpha 0.2 to 0.95
        const intensity = Math.min(1, Math.max(0, (val - 0.2) / 0.8));
        const alpha = (0.15 + intensity * 0.8).toFixed(2);
        return {
          bg: '',
          textColor: intensity > 0.6 ? 'text-white font-bold' : 'text-indigo-950 font-semibold',
          style: { backgroundColor: `rgba(79, 70, 229, ${alpha})` },
        };
      } else {
        // Negative: from light rose to deep rose/red
        const intensity = Math.min(1, Math.max(0, (-val - 0.2) / 0.8));
        const alpha = (0.15 + intensity * 0.8).toFixed(2);
        return {
          bg: '',
          textColor: intensity > 0.6 ? 'text-white font-bold' : 'text-rose-950 font-semibold',
          style: { backgroundColor: `rgba(225, 29, 72, ${alpha})` },
        };
      }
    } else {
      // Magnitude mode: Emerald green based on |val|
      if (isBelowCutoff) {
        return {
          bg: 'bg-slate-50',
          textColor: 'text-slate-300',
          style: { backgroundColor: 'rgba(248, 250, 252, 0.8)' },
        };
      }
      const intensity = Math.min(1, Math.max(0, absVal));
      const alpha = (0.12 + intensity * 0.85).toFixed(2);
      return {
        bg: '',
        textColor: intensity > 0.55 ? 'text-white font-bold' : 'text-emerald-950 font-semibold',
        style: { backgroundColor: `rgba(13, 148, 136, ${alpha})` },
      };
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              因子载荷热力图 (Factor Loadings Heatmap)
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {rotationType === 'none' ? '未旋转' : rotationType === 'varimax' ? 'Varimax 正交' : 'Promax 斜交'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            色块颜色深浅直观代表变量与潜在因子间的相关强度与符号，助力秒级识别简单结构与交叉载荷。
          </p>
        </div>

        {/* Heatmap Toolbars */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Rotated vs Unrotated View Switcher */}
          {unrotatedLoadings && (
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('rotated')}
                className={`px-2.5 py-1 rounded-md transition ${
                  viewMode === 'rotated'
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                旋转后载荷
              </button>
              <button
                onClick={() => setViewMode('unrotated')}
                className={`px-2.5 py-1 rounded-md transition ${
                  viewMode === 'unrotated'
                    ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                未旋转初始解
              </button>
            </div>
          )}

          {/* Color Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setColorMode('diverging')}
              className={`px-2.5 py-1 rounded-md transition ${
                colorMode === 'diverging'
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="红-白-蓝正负对称发散色谱：红色代表负相关，蓝色代表正相关"
            >
              正负发散色谱
            </button>
            <button
              onClick={() => setColorMode('magnitude')}
              className={`px-2.5 py-1 rounded-md transition ${
                colorMode === 'magnitude'
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="单向绝对强度色谱：仅依据载荷绝对值深浅渲染"
            >
              绝对强度色谱
            </button>
          </div>

          {/* Cluster sort toggle */}
          <button
            onClick={() => setSortByDominance(!sortByDominance)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition ${
              sortByDominance
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="按主导因子归类聚类排序，让简单结构一目了然"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortByDominance ? '按主导因子聚类' : '按原始次序'}</span>
          </button>
        </div>
      </div>

      {/* Threshold filter bar & legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>弱载荷淡化门槛 (|λ| &lt; {cutoff.toFixed(2)})：</span>
          </span>
          <input
            type="range"
            min="0.0"
            max="0.6"
            step="0.05"
            value={cutoff}
            onChange={e => setCutoff(parseFloat(e.target.value))}
            className="w-32 accent-indigo-600 cursor-pointer"
          />
          <span className="font-mono text-indigo-600 font-semibold">
            {cutoff === 0 ? '不过滤' : `≥ ${cutoff.toFixed(2)}`}
          </span>
        </div>

        {/* Color Legend Bar */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <span>色阶图例：</span>
          {colorMode === 'diverging' ? (
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="text-rose-700 font-semibold">-1.0</span>
              <div className="w-24 h-3.5 rounded-md bg-gradient-to-r from-rose-600 via-slate-100 to-indigo-600 border border-slate-200"></div>
              <span className="text-indigo-700 font-semibold">+1.0</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="text-slate-400">0.0</span>
              <div className="w-24 h-3.5 rounded-md bg-gradient-to-r from-slate-100 via-teal-300 to-teal-700 border border-slate-200"></div>
              <span className="text-teal-700 font-semibold">1.0</span>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Grid Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="min-w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <th className="py-2.5 px-4 font-semibold w-48 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                观测指标 / 变量
              </th>
              {Array.from({ length: m }).map((_, f) => (
                <th key={f} className="py-2.5 px-3 text-center font-bold text-slate-800">
                  <div className="truncate max-w-[140px] mx-auto" title={factorNames[f] || `Factor ${f + 1}`}>
                    {factorNames[f] || `Factor ${f + 1}`}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 font-normal">
                    F{f + 1}
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3 text-center font-semibold text-slate-600 border-l border-slate-200">
                主导归属
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {variableOrder.map(varIdx => {
              const varName = variableNames[varIdx];
              const rowValues = activeLoadings[varIdx] || [];

              // Find max loading on this row
              let maxAbs = -1;
              let dominantF = 0;
              rowValues.forEach((v, f) => {
                if (Math.abs(v) > maxAbs) {
                  maxAbs = Math.abs(v);
                  dominantF = f;
                }
              });

              return (
                <tr key={varIdx} className="hover:ring-1 hover:ring-indigo-300/60 transition">
                  {/* Variable Name Column */}
                  <td className="py-2 px-4 font-sans font-medium text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200 truncate max-w-[200px]">
                    <span className="flex items-center space-x-1.5" title={varName}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="truncate">{varName}</span>
                    </span>
                  </td>

                  {/* Heatmap Matrix Cells */}
                  {rowValues.map((val, f) => {
                    const visual = getCellVisual(val);
                    const isHovered = hoveredCell?.r === varIdx && hoveredCell?.c === f;
                    const isDominant = f === dominantF && Math.abs(val) >= 0.4;

                    return (
                      <td
                        key={f}
                        style={visual.style}
                        onMouseEnter={() => setHoveredCell({ r: varIdx, c: f, val })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`py-2.5 px-3 text-center transition-all cursor-pointer relative select-none ${
                          visual.textColor
                        } ${isHovered ? 'ring-2 ring-slate-900 z-20 scale-105 shadow-md' : ''}`}
                        title={`${varName} 对 ${factorNames[f] || `Factor ${f + 1}`}: 载荷 = ${val.toFixed(3)}`}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>{val >= 0 ? ` ${val.toFixed(3)}` : val.toFixed(3)}</span>
                          {isDominant && (
                            <span className="w-1 h-1 rounded-full bg-white/80" title="该因子的主导支配项"></span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Dominant factor badge */}
                  <td className="py-2 px-3 text-center font-sans border-l border-slate-200 bg-slate-50/50">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                        maxAbs >= 0.5
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : maxAbs >= 0.35
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {factorNames[dominantF] ? factorNames[dominantF].slice(0, 6) : `F${dominantF + 1}`}
                      <span className="font-mono ml-1 text-[10px]">({maxAbs.toFixed(2)})</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Interactive Hover Deep Dive Inspector Box */}
      {hoveredCell && (
        <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">
              λ
            </div>
            <div>
              <div className="font-semibold text-slate-100">
                {variableNames[hoveredCell.r]} ⟷ {factorNames[hoveredCell.c] || `Factor ${hoveredCell.c + 1}`}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                载荷系数值：<strong className="text-indigo-300 font-mono text-xs">{hoveredCell.val.toFixed(4)}</strong>
                {' · 独立解释方差贡献 λ² = '}
                <strong className="text-emerald-300 font-mono text-xs">{(hoveredCell.val * hoveredCell.val * 100).toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                Math.abs(hoveredCell.val) >= 0.6
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : Math.abs(hoveredCell.val) >= 0.4
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {Math.abs(hoveredCell.val) >= 0.6
                ? '强显著关联 (主导指标)'
                : Math.abs(hoveredCell.val) >= 0.4
                ? '中等关联 (有效指标)'
                : '弱关联 (无实质支配)'}
            </span>
          </div>
        </div>
      )}

      {/* Interpretive note */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>热力图读法指南：</span>
        </div>
        <p className="leading-relaxed">
          高质量的因子旋转在热力图上呈现鲜明的<strong>“阶梯对角块状分布（Block Diagonal Pattern）”</strong>：即每一行变量仅在一个因子列上呈现浓郁的深色，其余因子列均呈现接近白色的极浅淡色。
          若某一行变量在多列同时出现深色（颜色接近），则意味着存在<strong>交叉载荷 (Cross-Loading)</strong>，需审慎考虑变量归属或更换旋转策略。
        </p>
      </div>
    </div>
  );
};
