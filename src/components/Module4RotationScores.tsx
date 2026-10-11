import React, { useState } from 'react';
import { Matrix, RotationType, RotationResult } from '../utils/matrixMath';
import {
  RotateCw,
  Compass,
  Users,
  Sparkles,
  SlidersHorizontal,
  Table,
  LayoutGrid,
  GitCommit,
  Filter,
  RotateCcw,
  Zap,
  Scissors,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Sliders,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { FactorLoadingsHeatmap } from './FactorLoadingsHeatmap';
import { FactorPathDiagram } from './FactorPathDiagram';

interface Module4RotationScoresProps {
  rotationType: RotationType;
  setRotationType: (t: RotationType) => void;
  unrotatedLoadings: Matrix;
  rotationResult: RotationResult;
  variableNames: string[];
  factorScores: Matrix;
  factorNames: string[];
  setFactorNames: (names: string[]) => void;
  communalities?: number[];
  uniquenesses?: number[];
  // Interactive variable weighting & pruning props
  rawVariableNames?: string[];
  variableDescriptions?: Record<string, string>;
  variableWeights?: number[];
  variableEnabled?: boolean[];
  onUpdateWeight?: (origIndex: number, weight: number) => void;
  onToggleVariable?: (origIndex: number) => void;
  onResetWeights?: () => void;
  onApplyPresetWeights?: (preset: 'default' | 'boost_core' | 'dampen_edge' | 'prune_weak' | 'cascade') => void;
  isCustomizedWeights?: boolean;
}

export const Module4RotationScores: React.FC<Module4RotationScoresProps> = ({
  rotationType,
  setRotationType,
  unrotatedLoadings,
  rotationResult,
  variableNames,
  factorScores,
  factorNames,
  setFactorNames,
  communalities,
  uniquenesses,
  rawVariableNames = variableNames,
  variableDescriptions = {},
  variableWeights = [],
  variableEnabled = [],
  onUpdateWeight,
  onToggleVariable,
  onResetWeights,
  onApplyPresetWeights,
  isCustomizedWeights = false,
}) => {
  const [interactiveAngle, setInteractiveAngle] = useState<number>(0);
  const [showVectorRays, setShowVectorRays] = useState<boolean>(true);
  const [isSliderGroupOpen, setIsSliderGroupOpen] = useState<boolean>(true);

  const { rotatedLoadings, factorCorrelation, varianceExplained, cumulativeVariance } = rotationResult;
  const p = variableNames.length;
  const m = rotatedLoadings[0]?.length || 1;

  // Manual interactive 2D rotation for F1 and F2 demonstration
  const rad = (interactiveAngle * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);

  // SVG coordinate transformation
  const svgSize = 340;
  const center = svgSize / 2;
  const scale = 130; // mapping [-1, 1] to [-130, 130]

  // Get 2D coordinates for first two factors (either from rotated or manually adjusted)
  const current2DPoints = variableNames.map((name, i) => {
    // Base loadings for F1 and F2
    const baseL1 = rotationType === 'none' ? unrotatedLoadings[i]?.[0] ?? 0 : rotatedLoadings[i]?.[0] ?? 0;
    const baseL2 = (rotationType === 'none' ? unrotatedLoadings[i]?.[1] : rotatedLoadings[i]?.[1]) || 0;

    // Apply interactive manual angle offset
    const l1 = baseL1 * cosT - baseL2 * sinT;
    const l2 = baseL1 * sinT + baseL2 * cosT;

    const x = center + l1 * scale;
    const y = center - l2 * scale; // invert Y for SVG

    return { name, l1, l2, x, y };
  });

  const handleRenameFactor = (index: number, newName: string) => {
    const next = [...factorNames];
    next[index] = newName;
    setFactorNames(next);
  };

  const totalRawCount = rawVariableNames.length;
  const activeCount = variableEnabled.length > 0 ? variableEnabled.filter(Boolean).length : p;
  const avgWeight =
    variableWeights.length > 0
      ? variableWeights.reduce((a, b) => a + b, 0) / (variableWeights.length || 1)
      : 1.0;

  return (
    <div className="space-y-6">
      {/* Title Card Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                核心模块 4
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                因子旋转与得分计算 (Factor Rotation & Scores)
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              通过正交 (Varimax) 或斜交 (Promax) 坐标旋转逼近瑟斯顿简单结构 (Simple Structure)，消除交叉载荷，便于赋予潜变量实际含义。
            </p>
          </div>

          {/* Rotation Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70">
            <button
              onClick={() => {
                setRotationType('varimax');
                setInteractiveAngle(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                rotationType === 'varimax'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              正交旋转 (Varimax)
            </button>
            <button
              onClick={() => {
                setRotationType('promax');
                setInteractiveAngle(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                rotationType === 'promax'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              斜交旋转 (Promax)
            </button>
            <button
              onClick={() => {
                setRotationType('none');
                setInteractiveAngle(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                rotationType === 'none'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不旋转 (Initial)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Variable Weighting & Pruning Slider Group */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Header with Title, Stats & Collapse Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>观测变量手动加权与题项筛选滑块组 (Variable Weighting & Pruning)</span>
                {isCustomizedWeights && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    已启用自定义加权
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              在模型旋转前手动调节各观测变量权重 (0.0x ~ 2.0x) 或剔除特定题项，实时观察因子载荷、简单结构及因子路径图的动态重构。
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs shrink-0">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-mono">
              <span>纳入:</span>
              <strong className="text-indigo-700">{activeCount}</strong>
              <span>/</span>
              <span>{totalRawCount} 项</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-mono">
              <span>均权:</span>
              <strong className="text-emerald-700">{avgWeight.toFixed(2)}x</strong>
            </div>

            <button
              onClick={() => setIsSliderGroupOpen(!isSliderGroupOpen)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition"
              title={isSliderGroupOpen ? '收起滑块组' : '展开滑块组'}
            >
              {isSliderGroupOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Slider Body */}
        {isSliderGroupOpen && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* Quick Action Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>一键微调预设 (Quick Presets)：</span>
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => onApplyPresetWeights && onApplyPresetWeights('default')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition flex items-center space-x-1 text-[11px]"
                  title="全部恢复为 1.0x 均等权重"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>全部重置 (1.0x)</span>
                </button>

                <button
                  onClick={() => onApplyPresetWeights && onApplyPresetWeights('boost_core')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-medium transition flex items-center space-x-1 text-[11px]"
                  title="前两项核心指标权重提升至 1.5x"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>强化前两项核心 (1.5x)</span>
                </button>

                <button
                  onClick={() => onApplyPresetWeights && onApplyPresetWeights('dampen_edge')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 text-amber-700 font-medium transition flex items-center space-x-1 text-[11px]"
                  title="后两项边缘指标权重降至 0.5x"
                >
                  <TrendingDown className="w-3 h-3 text-amber-500" />
                  <span>弱化后两项边缘 (0.5x)</span>
                </button>

                <button
                  onClick={() => onApplyPresetWeights && onApplyPresetWeights('prune_weak')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-rose-700 font-medium transition flex items-center space-x-1 text-[11px]"
                  title="剔除末位变量，检验因子提取的敏感度"
                >
                  <Scissors className="w-3 h-3 text-rose-500" />
                  <span>剔除末位变量</span>
                </button>

                <button
                  onClick={() => onApplyPresetWeights && onApplyPresetWeights('cascade')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-medium transition flex items-center space-x-1 text-[11px]"
                  title="按指标排列实施 1.4x ~ 0.6x 梯级衰减"
                >
                  <Layers className="w-3 h-3 text-indigo-500" />
                  <span>梯级梯度加权</span>
                </button>
              </div>
            </div>

            {/* Grid of Interactive Variable Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rawVariableNames.map((name, idx) => {
                const isEnabled = variableEnabled[idx] ?? true;
                const weight = variableWeights[idx] ?? 1.0;
                const desc = variableDescriptions[name] || `观测指标 #${idx + 1}`;

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      !isEnabled
                        ? 'bg-slate-50/60 border-slate-200 opacity-60'
                        : weight !== 1.0
                        ? 'bg-indigo-50/30 border-indigo-300 ring-1 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Checkbox Toggle & Name */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleVariable && onToggleVariable(idx)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                            isEnabled
                              ? 'bg-indigo-600 text-white border-indigo-700'
                              : 'bg-white text-transparent border-slate-300 hover:border-slate-400'
                          }`}
                          title={isEnabled ? '点击剔除此变量' : '点击重新纳入此变量'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="min-w-0">
                          <span
                            className={`text-xs font-bold block truncate ${
                              isEnabled ? 'text-slate-900' : 'text-slate-400 line-through'
                            }`}
                          >
                            {name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {desc}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold shrink-0 border ${
                          !isEnabled
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : weight > 1.0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : weight < 1.0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {!isEnabled ? '已剔除' : `${weight.toFixed(2)}x (${Math.round(weight * 100)}%)`}
                      </span>
                    </div>

                    {/* Weight Slider Control */}
                    {isEnabled ? (
                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>0.0x (弱化)</span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => onUpdateWeight && onUpdateWeight(idx, Math.max(0, +(weight - 0.1).toFixed(2)))}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-mono text-[9px]"
                              title="减少 0.1"
                            >
                              -0.1
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateWeight && onUpdateWeight(idx, 1.0)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-mono text-[9px]"
                              title="复位 1.0x"
                            >
                              1.0x
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateWeight && onUpdateWeight(idx, Math.min(2.0, +(weight + 0.1).toFixed(2)))}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-mono text-[9px]"
                              title="增加 0.1"
                            >
                              +0.1
                            </button>
                          </div>
                          <span>2.0x (强化)</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.05"
                          value={weight}
                          onChange={e => onUpdateWeight && onUpdateWeight(idx, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    ) : (
                      <div className="text-[11px] text-rose-500 italic py-1 flex items-center justify-between">
                        <span>该变量已不参与模型提取与旋转</span>
                        <button
                          type="button"
                          onClick={() => onToggleVariable && onToggleVariable(idx)}
                          className="text-[10px] text-indigo-600 hover:underline font-normal"
                        >
                          重新启用
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rotation Plane & Thurstone Theory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic 2D Rotation Coordinate Plane */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>2D 因子载荷几何旋转演播平面 (F1 vs F2)</span>
              </h3>
              <p className="text-xs text-slate-500">
                观察点群向主轴靠拢的极化过程。旋转不改变总公共方差空间，只改变基底取向。
              </p>
            </div>

            <button
              onClick={() => setShowVectorRays(!showVectorRays)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded bg-indigo-50 border border-indigo-100"
            >
              {showVectorRays ? '隐藏载荷射线' : '显示载荷射线'}
            </button>
          </div>

          {/* SVG 2D Coordinate Plane */}
          <div className="flex justify-center p-2 bg-slate-50/70 rounded-xl border border-slate-200/60">
            <svg width={svgSize} height={svgSize} className="select-none overflow-visible">
              {/* Reference Circle r=1.0 */}
              <circle
                cx={center}
                cy={center}
                r={scale}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <circle
                cx={center}
                cy={center}
                r={scale * 0.5}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="1"
              />

              {/* Main Axes */}
              <line
                x1={15}
                y1={center}
                x2={svgSize - 15}
                y2={center}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <line
                x1={center}
                y1={15}
                x2={center}
                y2={svgSize - 15}
                stroke="#64748b"
                strokeWidth="1.5"
              />

              {/* Axis Ticks & Labels */}
              <text x={svgSize - 10} y={center + 14} className="text-[10px] font-mono fill-slate-700 font-bold" textAnchor="end">
                Factor 1
              </text>
              <text x={center + 6} y={18} className="text-[10px] font-mono fill-slate-700 font-bold">
                Factor 2
              </text>
              <text x={center + scale} y={center + 12} className="text-[9px] font-mono fill-slate-400">
                +1.0
              </text>
              <text x={center - scale} y={center + 12} className="text-[9px] font-mono fill-slate-400">
                -1.0
              </text>
              <text x={center + 5} y={center - scale + 10} className="text-[9px] font-mono fill-slate-400">
                +1.0
              </text>

              {/* Loading Vector Rays & Points */}
              {current2DPoints.map((pt, i) => (
                <g key={i}>
                  {showVectorRays && (
                    <line
                      x1={center}
                      y1={center}
                      x2={pt.x}
                      y2={pt.y}
                      stroke="#818cf8"
                      strokeWidth="1.2"
                      strokeOpacity="0.6"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={5}
                    fill="#4f46e5"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="hover:scale-125 transition-transform"
                  />
                  <text
                    x={pt.x + (pt.l1 >= 0 ? 6 : -6)}
                    y={pt.y + (pt.l2 >= 0 ? -4 : 10)}
                    textAnchor={pt.l1 >= 0 ? 'start' : 'end'}
                    className="text-[10px] font-sans font-medium fill-slate-800"
                  >
                    {pt.name.slice(0, 5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Interactive Dynamic Angle Slider */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>手动微调旋转角度 (θ)</span>
              </span>
              <span className="font-mono text-indigo-700 font-bold">
                {interactiveAngle}°
              </span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              value={interactiveAngle}
              onChange={e => setInteractiveAngle(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-90° (逆时针)</span>
              <button
                onClick={() => setInteractiveAngle(0)}
                className="text-indigo-600 hover:underline"
              >
                复位最佳准则角 (0°)
              </button>
              <span>+90° (顺时针)</span>
            </div>
          </div>
        </div>

        {/* Right: Thurstone's Simple Structure & Factor Correlation */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              瑟斯顿“简单结构”五原则与旋转机理
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              心理测量学家瑟斯顿 (Thurstone) 指出，为了让因子具有科学解释性，因子载荷阵必须满足：
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li><strong>每行至少有一零载荷</strong>：各观测变量只由部分因子支配；</li>
              <li><strong>每列至少有若干纯零载荷</strong>：因子只代表特定的指标群；</li>
              <li><strong>两列载荷正负极化</strong>：避免大因子通吃或无意义的中等泛化载荷。</li>
            </ul>

            {/* Varimax vs Promax Comparison card */}
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1.5">
              <div className="font-semibold text-indigo-900">
                当前旋转策略：
                {rotationType === 'varimax'
                  ? 'Kaiser Varimax (正交方差最大化)'
                  : rotationType === 'promax'
                  ? 'Promax (斜交目标幂次旋转)'
                  : '未旋转 (主轴初始对角投影)'}
              </div>
              <p className="text-indigo-800">
                {rotationType === 'varimax'
                  ? '因子轴保持 90° 相互垂直，因子间协方差严格为 0。便于做后续正交回归，避免多重共线性。'
                  : rotationType === 'promax'
                  ? '允许因子轴夹角小于或大于 90°，承认潜在现实中不同潜变量（如宏观风险与信用风险）存在关联。'
                  : '未旋转载荷阵第 1 因子包含最大信息，但含义混杂，通常必须进行旋转。'}
              </p>
            </div>

            {/* Factor Correlation Matrix Phi (for Promax) */}
            {rotationType === 'promax' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>因子间相关矩阵 (Factor Correlation Matrix Φ)</span>
                  <span className="text-xs text-slate-400 font-mono">斜交角度反映相关性</span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  <table className="min-w-full text-xs font-mono text-center">
                    <tbody>
                      {factorCorrelation.map((row, r) => (
                        <tr key={r}>
                          <td className="p-1 text-slate-500 font-semibold">F{r + 1}</td>
                          {row.map((val, c) => (
                            <td
                              key={c}
                              className={`p-1 rounded ${
                                r === c
                                  ? 'bg-slate-200 text-slate-800'
                                  : Math.abs(val) > 0.3
                                  ? 'bg-amber-100 text-amber-900 font-bold'
                                  : 'text-slate-600'
                              }`}
                            >
                              {val.toFixed(3)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            旋转算法：梯度优化 Kaiser 准则函数 V = ∑ [p ∑ (λ²/h²)² - (∑ λ²/h²)²]
          </div>
        </div>
      </div>

      {/* D3 Factor Path Diagram (SEM Path Topology) */}
      <FactorPathDiagram
        loadings={rotatedLoadings}
        variableNames={variableNames}
        factorNames={factorNames}
        factorCorrelation={factorCorrelation}
        communalities={communalities}
        uniquenesses={uniquenesses}
        rotationType={rotationType}
        varianceExplained={varianceExplained}
      />

      {/* Factor Loadings Color-Intensity Heatmap Visualization Component */}
      <FactorLoadingsHeatmap
        loadings={rotatedLoadings}
        unrotatedLoadings={unrotatedLoadings}
        variableNames={variableNames}
        factorNames={factorNames}
        rotationType={rotationType}
      />

      {/* Rotated Factor Loadings Matrix Table Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              旋转后因子载荷矩阵 (Rotated Factor Loadings Matrix)
            </h3>
            <p className="text-xs text-slate-500">
              绿色高亮表示绝对载荷 ≥ 0.50（核心主导指标）；浅黄色表示 0.30 ~ 0.50；支持直接在表头修改因子名称。
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
              <span className="text-slate-600">强载荷 (≥ 0.50)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200"></span>
              <span className="text-slate-600">中等载荷 (0.30~0.50)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-slate-50 border border-slate-200"></span>
              <span className="text-slate-400">弱载荷 (&lt; 0.30)</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-2.5 px-3 font-semibold">观测变量</th>
                {Array.from({ length: m }).map((_, f) => (
                  <th key={f} className="py-2.5 px-3 text-center">
                    <input
                      type="text"
                      value={factorNames[f] || `Factor ${f + 1}`}
                      onChange={e => handleRenameFactor(f, e.target.value)}
                      className="w-full text-center font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-indigo-900 focus:ring-1 focus:ring-indigo-500"
                      title="点击可直接重命名此因子"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {variableNames.map((name, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition">
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">
                    {name}
                  </td>
                  {rotatedLoadings[i]?.map((val, f) => {
                    const absVal = Math.abs(val);
                    let cellStyle = 'text-slate-400';
                    if (absVal >= 0.5) {
                      cellStyle = 'bg-emerald-50 text-emerald-900 font-bold';
                    } else if (absVal >= 0.3) {
                      cellStyle = 'bg-amber-50/70 text-amber-800 font-medium';
                    }

                    return (
                      <td key={f} className={`py-2 px-3 text-center rounded ${cellStyle}`}>
                        {val >= 0 ? ` ${val.toFixed(3)}` : val.toFixed(3)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {/* Variance Explained footer */}
            <tfoot className="bg-slate-50 font-mono font-semibold text-slate-700 border-t border-slate-200">
              <tr>
                <td className="py-2 px-3 font-sans">旋转后解释方差比例 (%)</td>
                {varianceExplained.slice(0, m).map((pct, f) => (
                  <td key={f} className="py-2 px-3 text-center text-indigo-700">
                    {pct.toFixed(2)}%
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Factor Scores Preview Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>因子得分计算 (Factor Scores - Thurstone 回归法)</span>
            </h3>
            <p className="text-xs text-slate-500">
              通过公式 F̂ = Z · W = Z · (R⁻¹ · Λ) 计算每个样本在提取公共因子上的标准化投影得分，可直接输出用于聚类、分类或回归分析。
            </p>
          </div>
        </div>

        {/* Factor Scores Table Preview */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold font-mono">
              <tr>
                <th className="py-2 px-3">样本序号 (ID)</th>
                {Array.from({ length: m }).map((_, f) => (
                  <th key={f} className="py-2 px-3 text-center text-indigo-900">
                    {factorNames[f] || `FScore ${f + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {factorScores.slice(0, 6).map((scores, sIdx) => (
                <tr key={sIdx} className="hover:bg-slate-50 transition">
                  <td className="py-1.5 px-3 text-slate-500 font-medium">
                    Sample #{sIdx + 1}
                  </td>
                  {scores.map((sc, f) => (
                    <td
                      key={f}
                      className={`py-1.5 px-3 text-center ${
                        sc > 1.0
                          ? 'font-bold text-emerald-700'
                          : sc < -1.0
                          ? 'font-bold text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {sc >= 0 ? `+${sc.toFixed(3)}` : sc.toFixed(3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400">
          已显示前 6 个样本。因子得分已通过回归法标准化（均值 ≈ 0，方差 ≈ 1）。
        </p>
      </div>
    </div>
  );
};
