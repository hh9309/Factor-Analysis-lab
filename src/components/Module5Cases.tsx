import React, { useState } from 'react';
import { CASE_STUDIES, CaseStudy } from '../data/cases';
import { Check, Database, FileSpreadsheet, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface Module5CasesProps {
  currentCase: CaseStudy;
  onSelectCase: (caseStudy: CaseStudy) => void;
  onApplyCustomData: (name: string, varNames: string[], data: number[][]) => void;
  onClose?: () => void;
}

export const Module5Cases: React.FC<Module5CasesProps> = ({
  currentCase,
  onSelectCase,
  onApplyCustomData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [customCsvText, setCustomCsvText] = useState<string>(
    `Item1,Item2,Item3,Item4,Item5
5.2,4.8,3.1,2.9,4.5
4.9,5.1,3.4,2.7,4.8
5.5,5.3,2.8,3.2,5.0
3.2,2.9,5.2,5.0,2.1
3.0,3.2,5.4,4.8,2.5
2.8,3.1,4.9,5.3,2.4
4.5,4.2,3.8,3.5,4.1
4.7,4.9,3.2,3.0,4.6`
  );
  const [customCaseName, setCustomCaseName] = useState<string>('自定义用户调查问卷数据集');
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParseCustomCsv = () => {
    try {
      setParseError(null);
      const lines = customCsvText
        .trim()
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      if (lines.length < 5) {
        setParseError('样本行数至少需要 5 行以上，推荐 20 行以上以保证矩阵正定。');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      if (headers.length < 3) {
        setParseError('变量数至少需要 3 个以上。');
        return;
      }

      const rows: number[][] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => parseFloat(p.trim()));
        if (parts.length !== headers.length || parts.some(isNaN)) {
          setParseError(`第 ${i + 1} 行数据格式异常，无法解析为浮点数或列数不符。`);
          return;
        }
        rows.push(parts);
      }

      onApplyCustomData(customCaseName, headers, rows);
      if (onClose) onClose();
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : 'CSV 解析失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Modal/Card Slice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>实战案例库与数据中心 (Case Studies & Data Hub)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            切换经典学科领域的预设高仿真数据集，或输入你自己的实验观测 CSV 数据。
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('preset')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              activeTab === 'preset'
                ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            六大实战案例
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              activeTab === 'custom'
                ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            自定义数据导入
          </button>
        </div>
      </div>

      {activeTab === 'preset' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CASE_STUDIES.map(cs => {
            const isSelected = currentCase.id === cs.id;

            return (
              <div
                key={cs.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between bg-white ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {cs.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      N={cs.rawData.length}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {cs.name}
                  </h3>

                  <div className="text-xs font-medium text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100">
                    映射方法：{cs.mappingMethod}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {cs.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">研究问题：</span>
                    {cs.researchQuestion}
                  </div>

                  <div className="text-[11px] text-slate-400 flex flex-wrap gap-1">
                    {cs.variableNames.map((v, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                        {v.slice(0, 5)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onSelectCase(cs);
                      if (onClose) onClose();
                    }}
                    className={`w-full py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>当前已激活案例</span>
                      </>
                    ) : (
                      <>
                        <span>载入此案例数据</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Custom CSV Upload & Fine-tuning slice */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>导入/微调自定义 CSV 数据</span>
            </h3>
            <p className="text-xs text-slate-500">
              首行为变量名称（以逗号分隔），后续各行为数字测量观测值。系统将自动计算样本相关矩阵并实时刷新所有 10 大模块。
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                数据集名称：
              </label>
              <input
                type="text"
                value={customCaseName}
                onChange={e => setCustomCaseName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CSV 纯文本数据 (含表头)：
              </label>
              <textarea
                rows={10}
                value={customCsvText}
                onChange={e => setCustomCsvText(e.target.value)}
                className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                placeholder="Var1,Var2,Var3..."
              />
            </div>

            {parseError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {parseError}
              </div>
            )}

            <button
              onClick={handleParseCustomCsv}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              解析并加载自定义数据集
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
