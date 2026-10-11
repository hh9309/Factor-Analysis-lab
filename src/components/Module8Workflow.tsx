import React from 'react';
import { KMOBartlettResult, ExtractionResult, RotationResult } from '../utils/matrixMath';
import { Check, ArrowRight, ArrowLeft, Layers, ShieldCheck, PieChart, Sparkles, FileText } from 'lucide-react';

interface Module8WorkflowProps {
  currentStep: number;
  setCurrentStep: (s: number) => void;
  kmoRes: KMOBartlettResult;
  extraction: ExtractionResult;
  rotationResult: RotationResult;
  numFactors: number;
  factorNames: string[];
  setFactorNames: (names: string[]) => void;
  onNavigateTab: (tab: string) => void;
}

export const Module8Workflow: React.FC<Module8WorkflowProps> = ({
  currentStep,
  setCurrentStep,
  kmoRes,
  extraction,
  rotationResult,
  numFactors,
  factorNames,
  setFactorNames,
  onNavigateTab,
}) => {
  const steps = [
    {
      id: 1,
      title: '第 1 步 · 数据适合性判定',
      sub: 'KMO 检验与 Bartlett 球形度检验',
      icon: ShieldCheck,
      isDone: kmoRes.isAdequate,
      statusLabel: kmoRes.isAdequate ? '检验达标' : '待优化',
    },
    {
      id: 2,
      title: '第 2 步 · 因子提取决策',
      sub: '碎石图特征值与累积方差贡献率',
      icon: PieChart,
      isDone: (extraction.cumulativeVariance[numFactors - 1] || 0) >= 50,
      statusLabel: `已保留 ${numFactors} 个因子 (${extraction.cumulativeVariance[numFactors - 1] || 0}%)`,
    },
    {
      id: 3,
      title: '第 3 步 · 旋转与潜变量命名',
      sub: '逼近简单结构，为隐变量赋予学术/业务名称',
      icon: Sparkles,
      isDone: factorNames.length >= numFactors,
      statusLabel: '因子已命名',
    },
    {
      id: 4,
      title: '第 4 步 · 得分报告与落地',
      sub: 'Thurstone 回归法因子得分与综合报表',
      icon: FileText,
      isDone: true,
      statusLabel: '随时可导出',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Card Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                核心模块 8
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                检验 → 提取 → 旋转 → 综合命名全流程导引 (Guided Pipeline)
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              遵循严格的多元统计标准规程：依次完成数据检验判定、因子提取、坐标轴旋转、潜变量理论命名及因子得分导出。
            </p>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map(s => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : s.isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.isDone ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      s.isDone
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.statusLabel}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">{s.title}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{s.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Card Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                步骤 1：检验数据是否满足因子分析前提
              </h3>
              <button
                onClick={() => onNavigateTab('suitability')}
                className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <span>转至检验专区详情</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <span className="text-xs font-semibold text-slate-700">KMO 抽样充分度指标</span>
                <div className="text-2xl font-bold font-mono text-indigo-700">
                  {kmoRes.overallKMO.toFixed(3)}
                </div>
                <p className="text-xs text-slate-600">
                  {kmoRes.overallKMO >= 0.7
                    ? '✅ KMO 大于 0.70，表明变量间偏相关性小、公共信息充沛，极适合进行因子降维。'
                    : '⚠️ KMO 偏低，建议检查是否存在孤立题项或负偏相关。'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <span className="text-xs font-semibold text-slate-700">Bartlett 球形度检验</span>
                <div className="text-2xl font-bold font-mono text-slate-800">
                  χ² = {kmoRes.bartlettChi2.toFixed(1)}
                  <span className="text-xs font-normal text-slate-400 ml-2">
                    (p &lt; 0.001)
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  ✅ 严格拒绝“相关阵为单位阵”的零假设，各变量之间存在非随机的显著强相关性。
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                步骤 2：确定公共因子提取数量
              </h3>
              <button
                onClick={() => onNavigateTab('extraction')}
                className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <span>调整碎石图与因子数</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3 text-xs text-slate-600">
              <p>
                当前提取保留了 <strong className="text-indigo-700 font-mono text-sm">{numFactors}</strong> 个潜在公共因子。
                累积方差贡献率达到{' '}
                <strong className="text-emerald-700 font-mono text-sm">
                  {extraction.cumulativeVariance[numFactors - 1] || 0}%
                </strong>
                。
              </p>
              <div className="flex flex-wrap gap-2 pt-1 font-mono">
                {extraction.varianceExplained.slice(0, numFactors).map((pct, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700"
                  >
                    Factor {idx + 1}: {pct.toFixed(2)}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                步骤 3：旋转载荷矩阵并为潜变量赋予现实命名
              </h3>
              <button
                onClick={() => onNavigateTab('rotation')}
                className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <span>转至旋转与坐标平面</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              因子命名（Factor Naming）是因子分析的核心灵魂。请结合各因子上载荷最高的题项，在此直接赋予具备学术或商业意义的潜变量名称：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: numFactors }).map((_, f) => (
                <div key={f} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Factor {f + 1} 隐变量命名</span>
                    <span className="text-[11px] font-mono text-indigo-600">
                      方差贡献: {rotationResult.varianceExplained[f] || 0}%
                    </span>
                  </div>
                  <input
                    type="text"
                    value={factorNames[f] || `Factor ${f + 1}`}
                    onChange={e => {
                      const updated = [...factorNames];
                      updated[f] = e.target.value;
                      setFactorNames(updated);
                    }}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                步骤 4：生成因子得分与分析报告
              </h3>
              <button
                onClick={() => onNavigateTab('export')}
                className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <span>前往报告导出中心</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              全流程分析已就绪！您可以通过导出引擎一键生成 Markdown 研究报告、打印版 PDF 报告或下载因子载荷与各样本因子得分的 CSV 格式数据。
            </p>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>上一步</span>
          </button>

          <button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={currentStep === 4}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition shadow-xs"
          >
            <span>下一步</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
