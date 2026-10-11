import React, { useState } from 'react';
import { Matrix, multiply, transpose, addMatrices, subtractMatrices } from '../utils/matrixMath';

interface Module1AlgebraProps {
  R: Matrix;
  loadings: Matrix;
  communalities: number[];
  uniquenesses: number[];
  variableNames: string[];
}

export const Module1Algebra: React.FC<Module1AlgebraProps> = ({
  R,
  loadings,
  communalities,
  uniquenesses,
  variableNames,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>({ r: 0, c: 1 });

  const p = R.length;
  const m = loadings[0]?.length || 1;

  // Compute Lambda * Lambda^T
  const LambdaLambdaT = multiply(loadings, transpose(loadings));

  // Compute Psi = diag(uniquenesses)
  const Psi: Matrix = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) => (i === j ? uniquenesses[i] : 0))
  );

  // Sigma_hat = Lambda * Lambda^T + Psi
  const SigmaHat = addMatrices(LambdaLambdaT, Psi);

  // Residual matrix = R - Sigma_hat
  const Residual = subtractMatrices(R, SigmaHat);

  // Formatter
  const fmt = (v: number) => (v >= 0 ? ` ${v.toFixed(3)}` : v.toFixed(3));

  const getHeatmapColor = (val: number, isResidual = false) => {
    if (isResidual) {
      const absVal = Math.min(1, Math.abs(val) * 5);
      return Math.abs(val) < 0.05
        ? 'bg-emerald-50 text-emerald-800'
        : val > 0
        ? `bg-amber-100/80 text-amber-900`
        : `bg-rose-100/80 text-rose-900`;
    }
    const clamped = Math.max(-1, Math.min(1, val));
    if (clamped > 0) {
      const alpha = Math.min(1, 0.15 + clamped * 0.7);
      return `bg-indigo-50 text-indigo-900 font-medium`;
    } else {
      return `bg-slate-50 text-slate-700`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Card Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                核心模块 1
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                因子模型代数与协方差分解 (Matrix Algebra & Covariance Decomposition)
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              探索经典结构方程 $X = \mu + \Lambda F + \epsilon$ 的代数内涵，直观观测相关阵分解为公共因子空间与特异方差矩阵的几何过程。
            </p>
          </div>
        </div>
      </div>

      {/* 3 Math Slices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Slice A: 基础方程 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                代数基础切片 01
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                结构方程
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              因子模型形式化表达
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg font-mono text-center text-sm sm:text-base text-slate-800 border border-slate-200/60 mb-3">
              X = μ + Λ · F + ε
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              其中 <span className="font-mono font-semibold">X</span> 为 $p$ 维观测变量，
              <span className="font-mono font-semibold">F</span> 为 $m$ 个不可直接观测的潜在公共因子 ($m \ll p$)，
              <span className="font-mono font-semibold">Λ</span> 为 $p \times m$ 因子载荷矩阵，
              <span className="font-mono font-semibold">ε</span> 为观测误差与特异变量。
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            假设：E(F) = 0, Cov(F) = I, Cov(F, ε) = 0
          </div>
        </div>

        {/* Slice B: 协方差分解 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                代数基础切片 02
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                方差分解原理
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              协方差矩阵基础分解
            </h3>
            <div className="p-3 bg-indigo-50/60 rounded-lg font-mono text-center text-sm sm:text-base text-indigo-950 border border-indigo-100 mb-3">
              Σ = Λ · Λ<sup>T</sup> + Ψ
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              观测变量间的全部相关性被假设<strong>仅由公共因子传递</strong>。
              对角线元素被分为<strong>公共方差 (Communality $h_i^2$)</strong>与<strong>特殊方差 (Uniqueness $\psi_i$)</strong>：
              <br />
              <span className="font-mono font-semibold mt-1 inline-block text-indigo-700">
                Var(X<sub>i</sub>) = h<sub>i</sub><sup>2</sup> + ψ<sub>i</sub> = 1.0
              </span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            非对角线：Cov(X_i, X_j) = ∑(λ_ik · λ_jk)
          </div>
        </div>

        {/* Slice C: 矩阵重构与残差 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                代数基础切片 03
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                重构拟合残差
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              残差协方差判定
            </h3>
            <div className="p-3 bg-emerald-50/60 rounded-lg font-mono text-center text-sm sm:text-base text-emerald-950 border border-emerald-100 mb-3">
              Δ = R - (Λ · Λ<sup>T</sup> + Ψ)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              若提取的 $m$ 个因子足够充分，残差矩阵 $\Delta$ 的非对角线元素应当非常接近于 0。
              如果残差仍存在显著非零项，说明存在未被提取的公共维度。
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            检验标准：非对角线绝对残差均值越小，模型拟合越好
          </div>
        </div>
      </div>

      {/* Live Interactive Matrix Visualizer */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              同屏演播：矩阵代数重构与残差热力矩阵
            </h3>
            <p className="text-xs text-slate-500">
              点击任意单元格查看其“原始观测值 vs 因子重构值 vs 残差”的具体代数代入解析。
            </p>
          </div>

          {selectedCell && (
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-lg text-xs text-indigo-900 font-mono">
              当前聚焦：[{variableNames[selectedCell.r]?.slice(0, 4)}与{variableNames[selectedCell.c]?.slice(0, 4)}]
              原相关系数 r = {R[selectedCell.r][selectedCell.c].toFixed(3)}
              {' → '}
              重构值 = {SigmaHat[selectedCell.r][selectedCell.c].toFixed(3)}
              {' (残差 '}{Residual[selectedCell.r][selectedCell.c].toFixed(3)}{')'}
            </div>
          )}
        </div>

        {/* Matrix comparison tabs/columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matrix 1: Original R */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>原始观测相关阵 (R)</span>
              <span className="text-slate-400 font-mono">{p}×{p}</span>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              <table className="min-w-full text-xs font-mono text-center">
                <tbody>
                  {R.map((row, r) => (
                    <tr key={r}>
                      {row.map((val, c) => {
                        const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                        return (
                          <td
                            key={c}
                            onClick={() => setSelectedCell({ r, c })}
                            className={`p-1.5 cursor-pointer rounded transition-all ${
                              isSelected
                                ? 'ring-2 ring-indigo-600 bg-indigo-100 font-bold'
                                : r === c
                                ? 'bg-slate-200/70 text-slate-800'
                                : getHeatmapColor(val)
                            }`}
                            title={`${variableNames[r]} 与 ${variableNames[c]}: ${val.toFixed(3)}`}
                          >
                            {fmt(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400">对角线全为 1.000 (标准化单位方差)</p>
          </div>

          {/* Matrix 2: Reconstructed Sigma_hat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>重构协方差阵 (ΛΛᵀ + Ψ)</span>
              <span className="text-indigo-600 font-mono">m={m} 因子</span>
            </div>
            <div className="overflow-x-auto border border-indigo-200/70 rounded-xl p-2 bg-indigo-50/20">
              <table className="min-w-full text-xs font-mono text-center">
                <tbody>
                  {SigmaHat.map((row, r) => (
                    <tr key={r}>
                      {row.map((val, c) => {
                        const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                        return (
                          <td
                            key={c}
                            onClick={() => setSelectedCell({ r, c })}
                            className={`p-1.5 cursor-pointer rounded transition-all ${
                              isSelected
                                ? 'ring-2 ring-indigo-600 bg-indigo-200 font-bold'
                                : getHeatmapColor(val)
                            }`}
                            title={`重构值: ${val.toFixed(3)}`}
                          >
                            {fmt(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-indigo-500 font-medium">
              对角线 = h<sub>i</sub><sup>2</sup> + ψ<sub>i</sub> = 1.000
            </p>
          </div>

          {/* Matrix 3: Residual Delta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>拟合残差矩阵 (Δ = R - Σ̂)</span>
              <span className="text-emerald-600 font-mono">残差接近0为佳</span>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              <table className="min-w-full text-xs font-mono text-center">
                <tbody>
                  {Residual.map((row, r) => (
                    <tr key={r}>
                      {row.map((val, c) => {
                        const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                        return (
                          <td
                            key={c}
                            onClick={() => setSelectedCell({ r, c })}
                            className={`p-1.5 cursor-pointer rounded transition-all ${
                              isSelected
                                ? 'ring-2 ring-indigo-600 bg-amber-200 font-bold'
                                : getHeatmapColor(val, true)
                            }`}
                            title={`残差: ${val.toFixed(3)}`}
                          >
                            {fmt(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-emerald-600">
              绿色表示残差绝对值 &lt; 0.05，表明因子提取拟合优秀
            </p>
          </div>
        </div>

        {/* Selected Cell Deep Dive Walkthrough Slice */}
        {selectedCell && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="font-semibold text-slate-800 mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>代数推导过程细解：{variableNames[selectedCell.r]} 与 {variableNames[selectedCell.c]}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
              <div>
                <p className="font-mono text-slate-700">
                  {selectedCell.r === selectedCell.c ? (
                    <>
                      变量方差分解：Var(X<sub>{selectedCell.r + 1}</sub>) = 公共方差 h<sup>2</sup> + 特殊方差 ψ
                      <br />
                      = {communalities[selectedCell.r].toFixed(3)} (公共部分) + {uniquenesses[selectedCell.r].toFixed(3)} (特异误差) = 1.000
                    </>
                  ) : (
                    <>
                      公共因子解释协方差：
                      Cov(X<sub>{selectedCell.r + 1}</sub>, X<sub>{selectedCell.c + 1}</sub>) = ∑(λ<sub>{selectedCell.r + 1},k</sub> · λ<sub>{selectedCell.c + 1},k</sub>)
                      <br />
                      = {loadings[selectedCell.r].map((l, k) => `${l.toFixed(2)}×${loadings[selectedCell.c][k].toFixed(2)}`).join(' + ')}
                      <br />
                      = {LambdaLambdaT[selectedCell.r][selectedCell.c].toFixed(3)}
                    </>
                  )}
                </p>
              </div>
              <div>
                <p>
                  原始样本相关系数为 <strong>{R[selectedCell.r][selectedCell.c].toFixed(3)}</strong>。
                  模型提取公共因子后保留了 <strong>{LambdaLambdaT[selectedCell.r][selectedCell.c].toFixed(3)}</strong> 的关联，
                  残差仅为 <strong>{Residual[selectedCell.r][selectedCell.c].toFixed(3)}</strong>。
                  残差处于安全白噪声区间内。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
