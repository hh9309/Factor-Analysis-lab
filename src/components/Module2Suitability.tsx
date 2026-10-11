import React from 'react';
import { KMOBartlettResult } from '../utils/matrixMath';
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from 'lucide-react';

interface Module2SuitabilityProps {
  kmoRes: KMOBartlettResult;
  variableNames: string[];
  sampleSize: number;
}

export const Module2Suitability: React.FC<Module2SuitabilityProps> = ({
  kmoRes,
  variableNames,
  sampleSize,
}) => {
  const {
    overallKMO,
    individualMSA,
    kmoRating,
    isAdequate,
    bartlettChi2,
    bartlettDf,
    bartlettPValue,
    determinantR,
    antiImageCorr,
  } = kmoRes;

  const getKmoColor = (val: number) => {
    if (val >= 0.8) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (val >= 0.7) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    if (val >= 0.6) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* Title Card Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                核心模块 2
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                数据适合性检验 (KMO & Bartlett 球形度检验)
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              在进入因子提取前，必须严格检验样本容量充分度与相关性结构。偏相关系数越小，潜在公共因子解释力越集中。
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                isAdequate
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isAdequate ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{isAdequate ? '通过适合性检验 · 适宜因子分析' : '未完全达标 · 建议优化量表'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Indicator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: KMO */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kaiser-Meyer-Olkin
            </span>
            <span className="text-xs font-mono text-slate-400">抽样充分度</span>
          </div>
          <div className="flex items-baseline space-x-3 my-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {overallKMO.toFixed(3)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${getKmoColor(overallKMO)}`}>
              {kmoRating}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 my-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                overallKMO >= 0.7 ? 'bg-emerald-500' : overallKMO >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, overallKMO * 100))}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            衡量观测变量间简单相关平方和与偏相关平方和的比值。建议值 ≥ 0.70。
          </p>
        </div>

        {/* Metric 2: Bartlett */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bartlett 球形度检验
            </span>
            <span className="text-xs font-mono text-slate-400">Sphericity Test</span>
          </div>
          <div className="flex items-baseline space-x-3 my-2">
            <span className="text-3xl font-extrabold font-mono text-indigo-700">
              {bartlettChi2.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              df = {bartlettDf}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-700 my-2">
            <span>显著性 p 值：</span>
            <span className="font-mono font-bold text-emerald-600">
              {bartlettPValue < 0.001 ? '< 0.0001 (极显著)' : bartlettPValue.toFixed(4)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            原假设 H₀：相关矩阵为单位阵（变量相互独立）。拒绝原假设表明变量间存在强相关。
          </p>
        </div>

        {/* Metric 3: Matrix Determinant & Sample Ratio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              相关阵行列式与样本量
            </span>
            <span className="text-xs font-mono text-slate-400">Matrix Rank</span>
          </div>
          <div className="flex items-baseline space-x-3 my-2">
            <span className="text-3xl font-extrabold font-mono text-slate-800">
              {determinantR < 0.0001 ? determinantR.toExponential(2) : determinantR.toFixed(4)}
            </span>
            <span className="text-xs text-slate-500 font-mono">det(R)</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-600 my-2">
            <span>当前样本量 N = <strong className="text-slate-800">{sampleSize}</strong></span>
            <span>(样本/变量比: {(sampleSize / variableNames.length).toFixed(1)} : 1)</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            行列式严格大于 0 保证了矩阵非奇异（可求逆）；建议样本与变量比值在 5:1 以上。
          </p>
        </div>
      </div>

      {/* Geometry / Intuition Slice */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>几何本质：为什么偏相关系数越小，因子分析越适合？</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          在多维向量空间中，若变量间的重叠关联（共变）全部是由背后的少数公共因子所支配，那么在<strong>控制了所有其他变量（即偏相关 Partial Correlation）</strong>之后，
          变量之间的残余线性联系应该消失（即接近 0）。
          Anti-Image 偏相关矩阵正是衡量剔除公共影响后的残余净相关。
          KMO 分母中的偏相关平方和 ∑(a_ij²) 越趋于 0，KMO 值越趋近于 1.0，表明公共因子在数据方差中占据绝对主导地位。
        </p>
      </div>

      {/* Anti-Image Heatmap & Individual MSA Slice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Individual MSA List */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              各题项独立抽样充分度 (Individual MSA)
            </h3>
            <span className="text-xs text-slate-400 font-mono">MSA_j</span>
          </div>
          <p className="text-xs text-slate-500">
            Kaiser 准则：若某观测变量的 MSA &lt; 0.50，通常应被视为“坏题”而优先剔除。
          </p>

          <div className="space-y-2">
            {variableNames.map((name, idx) => {
              const msa = individualMSA[idx] || 0;
              const isGood = msa >= 0.7;
              const isOk = msa >= 0.5;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-mono text-slate-500 font-semibold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-800 truncate" title={name}>
                      {name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {msa.toFixed(3)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        isGood
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isOk
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isGood ? '适宜' : isOk ? '中等' : '需排查'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Anti-Image Heatmap */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Anti-Image 偏相关系数矩阵 (Anti-Image Correlation Matrix)
            </h3>
            <span className="text-xs text-indigo-600 font-mono">理想状态：非对角线趋于0</span>
          </div>
          <p className="text-xs text-slate-500">
            对角线为各项变量的独立 MSA；非对角线为负偏相关系数 -a_ij。非对角线数值越微弱越优。
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
            <table className="min-w-full text-xs font-mono text-center">
              <thead>
                <tr>
                  <th className="p-1 text-slate-400 font-normal">#</th>
                  {variableNames.map((_, i) => (
                    <th key={i} className="p-1 text-slate-500 font-semibold">
                      V{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {antiImageCorr.map((row, r) => (
                  <tr key={r}>
                    <td className="p-1 text-slate-400 font-semibold">V{r + 1}</td>
                    {row.map((val, c) => {
                      const isDiag = r === c;
                      const absVal = Math.abs(val);

                      let cellColor = 'bg-slate-50 text-slate-600';
                      if (isDiag) {
                        cellColor = 'bg-indigo-100 font-bold text-indigo-900';
                      } else if (absVal > 0.3) {
                        cellColor = 'bg-rose-100 font-medium text-rose-800';
                      } else if (absVal > 0.15) {
                        cellColor = 'bg-amber-50 text-amber-800';
                      } else {
                        cellColor = 'bg-emerald-50/60 text-emerald-800';
                      }

                      return (
                        <td
                          key={c}
                          className={`p-1.5 rounded transition ${cellColor}`}
                          title={
                            isDiag
                              ? `V${r + 1} 的 MSA 值为: ${val.toFixed(3)}`
                              : `V${r + 1} 与 V${c + 1} 的偏相关系数: ${val.toFixed(3)}`
                          }
                        >
                          {val >= 0 ? ` ${val.toFixed(2)}` : val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200"></span>
              <span>对角线：项 MSA</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></span>
              <span>偏相关 &lt; 0.15 (理想)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></span>
              <span>偏相关 &gt; 0.30 (存在非公共杂讯)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
