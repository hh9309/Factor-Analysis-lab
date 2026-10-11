import React from 'react';
import { ExtractionMethod, ExtractionResult } from '../utils/matrixMath';
import { Layers, Sliders, HelpCircle, Check, AlertCircle } from 'lucide-react';

interface Module3ExtractionProps {
  extraction: ExtractionResult;
  numFactors: number;
  setNumFactors: (n: number) => void;
  method: ExtractionMethod;
  setMethod: (m: ExtractionMethod) => void;
  variableNames: string[];
}

export const Module3Extraction: React.FC<Module3ExtractionProps> = ({
  extraction,
  numFactors,
  setNumFactors,
  method,
  setMethod,
  variableNames,
}) => {
  const {
    eigenvalues,
    varianceExplained,
    cumulativeVariance,
    unrotatedLoadings,
    communalities,
    uniquenesses,
    hasHeywood,
    heywoodVariables,
  } = extraction;

  const p = eigenvalues.length;

  // Find Kaiser count (eigenvalues >= 1.0)
  const kaiserCount = Math.max(1, eigenvalues.filter(ev => ev >= 1.0).length);

  // Scree Plot SVG coordinates computation
  const svgWidth = 640;
  const svgHeight = 280;
  const padding = { top: 30, right: 50, bottom: 45, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const maxEigen = Math.max(2.5, Math.ceil(eigenvalues[0] * 1.15));
  const minEigen = 0;

  const getX = (index: number) =>
    padding.left + (index / Math.max(1, p - 1)) * plotWidth;
  const getY = (val: number) =>
    padding.top + plotHeight - ((val - minEigen) / (maxEigen - minEigen)) * plotHeight;
  const getYVariance = (pct: number) =>
    padding.top + plotHeight - (pct / 100) * plotHeight;

  // Path for eigenvalues
  const eigenPoints = eigenvalues.map((ev, i) => `${getX(i)},${getY(Math.max(0, ev))}`).join(' ');

  // Path for cumulative variance
  // Pre-calculate full cumulative variance for all components
  const fullEigenSum = eigenvalues.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  let fullCum = 0;
  const fullCumVariance = eigenvalues.map(ev => {
    fullCum += (Math.max(0, ev) / fullEigenSum) * 100;
    return Math.min(100, fullCum);
  });
  const cumVariancePoints = fullCumVariance.map((pct, i) => `${getX(i)},${getYVariance(pct)}`).join(' ');

  // Kaiser y position
  const kaiserY = getY(1.0);

  return (
    <div className="space-y-6">
      {/* Title Card Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                核心模块 3
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                因子提取与碎石图 (Factor Extraction & Scree Plot)
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              结合凯撒准则 (Kaiser Rule: $\lambda \ge 1$)、卡特尔碎石拐点 (Cattell Scree Elbow) 及累积方差贡献率，科学决策应保留的公共因子个数。
            </p>
          </div>

          {/* Extraction Method Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setMethod('PAF')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                method === 'PAF'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="主轴因子法：剥离特殊方差迭代估计共同度，最适合探索性分析"
            >
              主轴因子法 (PAF)
            </button>
            <button
              onClick={() => setMethod('PC')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                method === 'PC'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="主成分法：对角线置1，最大化总体方差保留"
            >
              主成分法 (PC)
            </button>
            <button
              onClick={() => setMethod('ML')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                method === 'ML'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="最大似然法：假设多元正态性，具备拟合度检验"
            >
              最大似然法 (ML)
            </button>
          </div>
        </div>
      </div>

      {/* Main 2D Scree Plot & Extraction Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2D Interactive Scree Plot Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2D 碎石图 (Scree Plot) 与累积方差贡献双轴演播
              </h3>
              <p className="text-xs text-slate-500">
                蓝色折线为特征值降序曲线；灰色虚线为 Kaiser 阈值 ($\lambda = 1.0$)；绿色虚线为累积方差贡献率(%)。
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="text-slate-600">特征值 (左轴)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-slate-600">累积方差% (右轴)</span>
              </span>
            </div>
          </div>

          {/* SVG Plot Container */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[500px] select-none"
            >
              {/* Grid Lines */}
              <g className="text-slate-100" stroke="currentColor" strokeDasharray="3 3">
                {[0, 1, 2, 3, 4, 5].map(v => {
                  if (v > maxEigen) return null;
                  const y = getY(v);
                  return (
                    <line
                      key={v}
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      strokeWidth="1"
                    />
                  );
                })}
              </g>

              {/* Kaiser Criterion Line (lambda = 1) */}
              <line
                x1={padding.left}
                y1={kaiserY}
                x2={svgWidth - padding.right}
                y2={kaiserY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={svgWidth - padding.right - 5}
                y={kaiserY - 6}
                textAnchor="end"
                className="text-[10px] font-mono fill-amber-700 font-semibold"
              >
                Kaiser 准则界线 (λ = 1.0)
              </text>

              {/* Left Y Axis (Eigenvalues) */}
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + plotHeight}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              {[0, 1, 2, 3, 4].map(v => {
                if (v > maxEigen) return null;
                const y = getY(v);
                return (
                  <g key={v}>
                    <line x1={padding.left - 4} y1={y} x2={padding.left} y2={y} stroke="#94a3b8" />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400"
                    >
                      {v}.0
                    </text>
                  </g>
                );
              })}

              {/* Right Y Axis (Cumulative Variance %) */}
              <line
                x1={svgWidth - padding.right}
                y1={padding.top}
                x2={svgWidth - padding.right}
                y2={padding.top + plotHeight}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              {[20, 40, 60, 80, 100].map(pct => {
                const y = getYVariance(pct);
                return (
                  <g key={pct}>
                    <line
                      x1={svgWidth - padding.right}
                      y1={y}
                      x2={svgWidth - padding.right + 4}
                      y2={y}
                      stroke="#94a3b8"
                    />
                    <text
                      x={svgWidth - padding.right + 8}
                      y={y + 3}
                      textAnchor="start"
                      className="text-[10px] font-mono fill-emerald-600 font-medium"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Cumulative Variance Curve (Green dashed) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 3"
                points={cumVariancePoints}
              />

              {/* Scree Eigenvalue Line (Indigo) */}
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                points={eigenPoints}
              />

              {/* Retained Factors Highlight Zone */}
              {numFactors > 0 && (
                <rect
                  x={padding.left}
                  y={padding.top}
                  width={
                    p > 1
                      ? getX(numFactors - 1) - padding.left + (plotWidth / (p - 1)) / 2
                      : plotWidth
                  }
                  height={plotHeight}
                  fill="#4f46e5"
                  fillOpacity="0.04"
                />
              )}

              {/* Plot Data Points for Eigenvalues */}
              {eigenvalues.map((ev, i) => {
                const cx = getX(i);
                const cy = getY(Math.max(0, ev));
                const isRetained = i < numFactors;
                const isKaiserValid = ev >= 1.0;

                return (
                  <g key={i} className="cursor-pointer">
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isRetained ? 6 : 4}
                      fill={isRetained ? '#4f46e5' : '#94a3b8'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all hover:r-7"
                    />
                    {/* Value Label */}
                    <text
                      x={cx}
                      y={cy - 10}
                      textAnchor="middle"
                      className={`text-[10px] font-mono font-bold ${
                        isRetained ? 'fill-indigo-700' : 'fill-slate-400'
                      }`}
                    >
                      {ev.toFixed(2)}
                    </text>

                    {/* X-axis Label */}
                    <text
                      x={cx}
                      y={padding.top + plotHeight + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-mono ${
                        isRetained ? 'font-bold fill-indigo-900' : 'fill-slate-500'
                      }`}
                    >
                      F{i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
            <span>
              Kaiser 准则推荐提取：<strong className="text-slate-800 font-mono">{kaiserCount}</strong> 个因子
            </span>
            <span>
              当前已提取 <strong className="text-indigo-600 font-mono">{numFactors}</strong> 个因子，
              累计方差贡献率：
              <strong className="text-emerald-700 font-mono">
                {cumulativeVariance[numFactors - 1] || 0}%
              </strong>
            </span>
          </div>
        </div>

        {/* Right: Factor Extraction Control Center */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                提取因子数量决策控制器
              </h3>
            </div>

            {/* Slider to adjust numFactors */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>当前保留因子数 (m)</span>
                <span className="font-mono text-lg text-indigo-600 font-bold">
                  {numFactors} / {p}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max={Math.min(p - 1, 6)}
                value={numFactors}
                onChange={e => setNumFactors(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>1 因子</span>
                <span>2 因子</span>
                <span>3 因子</span>
                <span>4 因子</span>
                <span>5 因子</span>
              </div>
            </div>

            {/* Decision Guidelines Quick Check */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>累计方差解释度：</strong>
                  达到 {(cumulativeVariance[numFactors - 1] || 0).toFixed(1)}%
                  {(cumulativeVariance[numFactors - 1] || 0) >= 60
                    ? '（满足人文社科/工程分析常见的 60% 门槛）'
                    : '（建议增加因子以捕获至少 60% 信息）'}
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <strong>卡特尔碎石检验 (Elbow Rule)：</strong>
                  观察曲线由陡峭下降转为平缓水平的“拐点（Elbow）”，通常选取拐点之前的因子。
                </div>
              </div>

              {hasHeywood && (
                <div className="flex items-start space-x-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>触发 Heywood 警报：</strong>
                    变量 [{heywoodVariables.map(i => variableNames[i]).join(', ')}] 公共度异常，因子数可能偏多！
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            提取方法：{method === 'PAF' ? '主轴因子法 (PAF)' : method === 'PC' ? '主成分法 (PC)' : '最大似然法 (ML)'}
          </div>
        </div>
      </div>

      {/* Unrotated Factor Loadings Table Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              未旋转初始因子载荷矩阵与方差分解表 (Unrotated Factor Loadings)
            </h3>
            <p className="text-xs text-slate-500">
              展示初始解中各变量的公共方差 (h²) 与特殊方差 (ψ)。注意初始因子往往第一因子负荷过大，需要后续旋转。
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">观测变量</th>
                {Array.from({ length: numFactors }).map((_, f) => (
                  <th key={f} className="py-2.5 px-3 font-mono text-center">
                    Factor {f + 1}
                  </th>
                ))}
                <th className="py-2.5 px-3 font-mono text-center text-indigo-700 bg-indigo-50/50">
                  公共方差 (h²)
                </th>
                <th className="py-2.5 px-3 font-mono text-center text-slate-600">
                  特殊方差 (ψ)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {variableNames.map((name, i) => {
                const h2 = communalities[i] || 0;
                const psi = uniquenesses[i] || 0;
                const isHeywoodVar = heywoodVariables.includes(i);

                return (
                  <tr key={i} className={`hover:bg-slate-50/70 transition ${isHeywoodVar ? 'bg-rose-50/40' : ''}`}>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">
                      {name}
                      {isHeywoodVar && (
                        <span className="ml-1 text-[10px] px-1 py-0.2 rounded bg-rose-100 text-rose-700">
                          Heywood
                        </span>
                      )}
                    </td>
                    {unrotatedLoadings[i]?.slice(0, numFactors).map((load, f) => (
                      <td
                        key={f}
                        className={`py-2 px-3 text-center ${
                          Math.abs(load) >= 0.5 ? 'font-bold text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {load >= 0 ? ` ${load.toFixed(3)}` : load.toFixed(3)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-center font-bold text-indigo-700 bg-indigo-50/20">
                      {h2.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-500">
                      {psi.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Variance contribution row */}
            <tfoot className="bg-slate-50/80 font-mono font-semibold text-slate-700 border-t border-slate-200">
              <tr>
                <td className="py-2 px-3 font-sans">解释方差比率 (%)</td>
                {varianceExplained.slice(0, numFactors).map((pct, f) => (
                  <td key={f} className="py-2 px-3 text-center text-indigo-600">
                    {pct.toFixed(2)}%
                  </td>
                ))}
                <td colSpan={2} className="py-2 px-3 text-center text-emerald-700">
                  累积: {cumulativeVariance[numFactors - 1] || 0}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
