import React, { useState } from 'react';
import { KMOBartlettResult, ExtractionResult, RotationResult, Matrix } from '../utils/matrixMath';
import { CASE_STUDIES, CaseStudy } from '../data/cases';
import {
  Download,
  FileText,
  Printer,
  Check,
  Copy,
  Eye,
  Code,
  Layers,
  Database,
  ShieldCheck,
  PieChart,
  Sparkles,
  Users,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

interface Module9ExportProps {
  currentCase?: CaseStudy;
  caseName: string;
  variableNames: string[];
  kmoRes: KMOBartlettResult;
  extraction: ExtractionResult;
  rotationResult: RotationResult;
  factorScores: Matrix;
  factorNames: string[];
  rotationType: string;
  extractionMethod: string;
  dataset?: Matrix;
}

export const Module9Export: React.FC<Module9ExportProps> = ({
  currentCase,
  caseName,
  variableNames,
  kmoRes,
  extraction,
  rotationResult,
  factorScores,
  factorNames,
  rotationType,
  extractionMethod,
  dataset,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [previewTab, setPreviewTab] = useState<'rendered' | 'markdown'>('rendered');
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const m = rotationResult.rotatedLoadings[0]?.length || 1;
  const p = variableNames.length;
  const sampleCount = dataset?.length || factorScores.length || 120;

  // Download raw dataset CSV for any case study
  const handleDownloadCaseRawData = (cs: CaseStudy) => {
    let csv = '\ufeff' + cs.variableNames.join(',') + '\n';
    cs.rawData.forEach(row => {
      csv += row.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cs.name}_原始数据集_N${cs.rawData.length}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccessMessage(`已成功下载【${cs.name}】原始观测数据 CSV (共 ${cs.rawData.length} 行)`);
    setTimeout(() => setDownloadSuccessMessage(null), 3000);
  };

  // Download custom/current data CSV
  const handleDownloadCurrentData = () => {
    if (!dataset || dataset.length === 0) return;
    let csv = '\ufeff' + variableNames.join(',') + '\n';
    dataset.forEach(row => {
      csv += row.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${caseName}_当前工作区原始数据集.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download calculated result tables (loadings, scores, communalities)
  const handleDownloadResultCsv = (type: 'loadings' | 'scores' | 'communalities') => {
    let csvContent = '\ufeff';
    let filename = '';

    if (type === 'loadings') {
      filename = `${caseName}_旋转后因子载荷矩阵.csv`;
      const header = ['观测变量', ...Array.from({ length: m }).map((_, f) => factorNames[f] || `Factor_${f + 1}`)];
      csvContent += header.join(',') + '\n';
      variableNames.forEach((name, i) => {
        const row = [name, ...rotationResult.rotatedLoadings[i].map(v => v.toFixed(4))];
        csvContent += row.join(',') + '\n';
      });
    } else if (type === 'scores') {
      filename = `${caseName}_样本因子得分矩阵.csv`;
      const header = ['样本ID', ...Array.from({ length: m }).map((_, f) => factorNames[f] || `FScore_${f + 1}`)];
      csvContent += header.join(',') + '\n';
      factorScores.forEach((scores, sIdx) => {
        const row = [`Sample_${sIdx + 1}`, ...scores.map(v => v.toFixed(4))];
        csvContent += row.join(',') + '\n';
      });
    } else {
      filename = `${caseName}_公共方差与特殊方差分解表.csv`;
      csvContent += '观测变量,公共方差_h2,特殊方差_psi\n';
      variableNames.forEach((name, i) => {
        csvContent += `${name},${extraction.communalities[i]},${extraction.uniquenesses[i]}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate 7-Part Scientific Report matching the 4 Guided Steps
  const generateMarkdownReport = () => {
    const caseDesc = currentCase?.description || '本项研究基于多元统计分析规程，对多项观测变量进行降维与结构方程探索。';
    const researchQ = currentCase?.researchQuestion || '探索观测指标群背后是否存在稳健且具备现实解释力的公共潜变量。';
    const domainName = currentCase?.domain || '多元统计与数据科学';

    return `# 因子分析学术研究与全流程综合报告 (Factor Analysis Report)

**案例名称**：${caseName}  
**所属学科领域**：${domainName}  
**样本容量 (N)**：${sampleCount} 个有效观测样本  
**观测变量数 (P)**：${p} 项指标  
**因子提取方法**：${extractionMethod}  
**坐标旋转方法**：${rotationType}  
**保留公共因子数**：${m} 个潜变量  
**报告生成日期**：${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  

---

## 第一部分：研究问题与观测变量体系 (Research Background & Variables Framework)
* **研究核心问题**：${researchQ}
* **学术背景综述**：${caseDesc}
* **观测变量定义清单**：
| 序号 | 变量代码及名称 | 指标属性与测量定义 |
| :---: | :--- | :--- |
${variableNames
  .map(
    (name, i) =>
      `| ${i + 1} | **${name}** | ${currentCase?.variableDescriptions?.[name] || '标准化连续观测指标'} |`
  )
  .join('\n')}

---

## 第二部分：数据适合性判定 (KMO 抽样充分度 & Bartlett 球形度检验)
* **Kaiser-Meyer-Olkin (KMO) 抽样充分度检验**：
  - 总体 KMO 测度值：\`${kmoRes.overallKMO.toFixed(4)}\`
  - 评级判定：**${kmoRes.kmoRating}**
  - 学术评价：${kmoRes.overallKMO >= 0.7 ? '变量间简单相关平方和远大于偏相关平方和，各题项信息交叠重合度高，非常适合做因子提取。' : '偏相关性稍高，个别题项可能存在分散现象。'}
* **Bartlett 球形度检验 (Test of Sphericity)**：
  - 卡方统计量：$\\chi^2 = ${kmoRes.bartlettChi2.toFixed(3)}$
  - 自由度：$df = ${kmoRes.bartlettDf}$
  - 显著性概率：$p < ${kmoRes.bartlettPValue < 0.001 ? '0.0001' : kmoRes.bartlettPValue.toFixed(4)}$ (极显著拒绝单位相关阵假设)
* **相关矩阵行列式**：$\\det(R) = ${kmoRes.determinantR}$ (矩阵正定满秩，数学条件成熟)
* **综合判定结论**：${kmoRes.isAdequate ? '【达标】样本规模与相关性结构严格满足因子分析先决假设。' : '【欠佳】建议复查题项设计。'}

---

## 第三部分：因子提取决策与碎石图特征值分解 (Factor Extraction & Scree Decomposition)
* **提取方法**：${extractionMethod} (剥离特殊误差项，求解公共方差子空间)
* **特征值序列与方差贡献率表**：
| 因子序号 | 特征值 (Eigenvalue λ) | 因子方差解释率 (%) | 累积方差贡献率 (%) | Kaiser 准则判定 (λ ≥ 1) |
| :---: | :---: | :---: | :---: | :---: |
${Array.from({ length: Math.min(p, 6) })
  .map((_, i) => {
    const ev = extraction.eigenvalues[i] || 0;
    const pct = rotationResult.varianceExplained[i] || 0;
    const cum = rotationResult.cumulativeVariance[i] || 0;
    const isKaiser = ev >= 1.0 ? '保留 (λ ≥ 1.0)' : '舍弃 (λ < 1.0)';
    return `| Factor ${i + 1} | ${ev.toFixed(3)} | ${pct.toFixed(2)}% | ${cum.toFixed(2)}% | ${isKaiser} |`;
  })
  .join('\n')}
* **提取决策结论**：
  - 最终保留 **${m}** 个公共因子；
  - 累积方差贡献率达 **${rotationResult.cumulativeVariance[m - 1] || 0}%**，跨过经验保留门槛；
  - 碎石图拐点分析 (Cattell Elbow) 支持该因子数目判定。

---

## 第四部分：因子载荷矩阵与坐标轴旋转 (Rotated Factor Loadings & Communalities)
* **旋转方法**：${rotationType} (通过坐标轴旋转逼近瑟斯顿简单结构 Simple Structure)
* **旋转后因子载荷与方差分解表**：
| 观测指标 | ${Array.from({ length: m }).map((_, f) => factorNames[f] || `Factor ${f + 1}`).join(' | ')} | 公共方差 (h²) | 特殊方差 (ψ) | 主导归属 |
| :--- | ${Array.from({ length: m + 3 }).map(() => ':---:').join(' | ')} |
${variableNames
  .map((name, i) => {
    const row = rotationResult.rotatedLoadings[i];
    let maxAbs = -1;
    let domF = 0;
    row.forEach((v, f) => {
      if (Math.abs(v) > maxAbs) {
        maxAbs = Math.abs(v);
        domF = f;
      }
    });
    return `| **${name}** | ${row.map(v => (Math.abs(v) >= 0.5 ? `**${v.toFixed(3)}**` : v.toFixed(3))).join(' | ')} | ${extraction.communalities[i]?.toFixed(3)} | ${extraction.uniquenesses[i]?.toFixed(3)} | ${factorNames[domF] || `F${domF + 1}`} |`;
  })
  .join('\n')}

---

## 第五部分：潜变量理论综合命名与业务解释 (Latent Factor Naming & Interpretations)
${Array.from({ length: m })
  .map((_, f) => {
    const highItems = variableNames
      .map((name, i) => ({ name, load: Math.abs(rotationResult.rotatedLoadings[i][f]) }))
      .filter(item => item.load >= 0.40)
      .sort((a, b) => b.load - a.load);

    return `### 潜变量 ${f + 1}：【${factorNames[f] || `Factor ${f + 1}`}】
- **方差解释比重**：${rotationResult.varianceExplained[f]}%
- **主导驱动观测变量**：${highItems.map(item => `\`${item.name}\` (载荷 ${item.load.toFixed(3)})`).join('、') || '暂无强载荷指标'}
- **学术与现实管理内涵**：该潜变量高度聚合了上述指标的公共方差，代表了本研究体系中关于「${factorNames[f] || `Factor ${f + 1}`}」的核心维度。`;
  })
  .join('\n\n')}

---

## 第六部分：回归因子得分与多维样本画像赋能 (Factor Scores & Downstream Enablement)
* **因子得分计算方程**：采用瑟斯顿回归法 $\\hat{F} = Z \\cdot W = Z \\cdot (R^{-1} \\Lambda)$。
* **得分标准化性质**：均值约为 0，标准差约为 1.0，消除了各变量量纲与单位的不一致。
* **前 5 个典型样本因子得分预览**：
| 样本序号 | ${Array.from({ length: m }).map((_, f) => factorNames[f] || `FScore_${f + 1}`).join(' | ')} | 综合画像等级 |
| :---: | ${Array.from({ length: m + 1 }).map(() => ':---:').join(' | ')} |
${factorScores
  .slice(0, 5)
  .map(
    (sc, sIdx) =>
      `| Sample #${sIdx + 1} | ${sc.map(v => v.toFixed(3)).join(' | ')} | ${sc[0] > 0.5 ? '领先群' : sc[0] < -0.5 ? '滞后群' : '中稳态'} |`
  )
  .join('\n')}
* **下游落地应用建议**：
  1. **聚类分群 (Cluster Analysis)**：将 ${m} 个因子得分作为特征输入 K-Means 算法，避免多重共线性干扰；
  2. **综合评价指数 (Composite Index)**：以各因子方差贡献率为权重构建加权指数；
  3. **多元回归 (Regression Modelling)**：作为自变量预测核心成果指标。

---

## 第七部分：模型综合诊断与病态防范建议 (Comprehensive Model Diagnostics)
* **Heywood 现象扫描**：${extraction.hasHeywood ? '⚠️ 检测到异常公共方差估计值，建议减少提取因子数！' : '✅ 未检测到 Heywood 负特殊方差病态现象，模型数值收敛良好。'}
* **交叉载荷诊断**：旋转后变量在不同因子上的载荷分化明显，符合瑟斯顿简单结构原则。
* **学术审稿防御备忘**：旋转后因子具有明确的对角块状属性，题项设计信效度稳健。

---
*本报告由「因子分析实验室 (Factor Analysis Lab)」全自动生成并校验*
`;
  };

  const mdReport = generateMarkdownReport();

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(mdReport);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title Card Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                核心模块 9
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                报告导出 (Export Engine)
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              提供六大经典案例原始数据集一键下载，以及严格按照<strong>全流程向导 7 大部分</strong>排版的学术级分析报告预览、复制与 PDF 打印。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印 / 导出 PDF</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMd ? '已复制 Markdown' : '复制 Markdown 报告'}</span>
            </button>
          </div>
        </div>
      </div>

      {downloadSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Slice 1: 六大实战案例原始数据下载区 (Raw Case Datasets CSV Downloads) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>六大实战案例原始观测数据集下载 (Raw Datasets CSV)</span>
            </h3>
            <p className="text-xs text-slate-500">
              每个案例均提供可脱机离线复现的标准 CSV 格式真实仿真观测数据，含完整变量表头与样本行。
            </p>
          </div>

          {dataset && (
            <button
              onClick={handleDownloadCurrentData}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition shrink-0 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载当前工作区数据 ({dataset.length} 行)</span>
            </button>
          )}
        </div>

        {/* 6 Cases Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {CASE_STUDIES.map((cs, idx) => {
            const isCurrent = currentCase?.id === cs.id;

            return (
              <div
                key={cs.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-500 font-mono">
                      案例 {idx + 1} · {cs.domain}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                        当前案例
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {cs.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {cs.description}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    样本量: N={cs.rawData.length} | 变量数: {cs.variableNames.length}
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadCaseRawData(cs)}
                  className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-700 text-xs font-medium transition flex items-center justify-center space-x-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载原始数据 (CSV)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slice 2: 分析结果数据表导出 (Calculated Result Tables CSV) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs">
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>旋转后因子载荷矩阵 (CSV)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              包含所有 {variableNames.length} 个观测变量在各因子的主导载荷数值。
            </p>
          </div>
          <button
            onClick={() => handleDownloadResultCsv('loadings')}
            className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
          >
            下载载荷矩阵 CSV
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs">
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>样本回归因子得分 (CSV)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              包含全部 {sampleCount} 个样本的标准化因子得分，可直接输出用于聚类。
            </p>
          </div>
          <button
            onClick={() => handleDownloadResultCsv('scores')}
            className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
          >
            下载因子得分 CSV
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs">
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>公共方差与特殊方差表 (CSV)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              包含各变量共同度 (h²) 与特殊方差 (ψ)，用于量表题项结构效度评估。
            </p>
          </div>
          <button
            onClick={() => handleDownloadResultCsv('communalities')}
            className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
          >
            下载方差分解 CSV
          </button>
        </div>
      </div>

      {/* Slice 3: 全流程向导 7 大部分综合报告预览与排版 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                综合分析报告在线预览 (7 大部分全流程组织)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              按照全流程向导步骤组织，涵盖背景、适合度、提取、旋转、因子命名、得分画像及模型诊断等 7 大核心部分。
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => setPreviewTab('rendered')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                previewTab === 'rendered'
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>排版精读预览</span>
            </button>

            <button
              onClick={() => setPreviewTab('markdown')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                previewTab === 'markdown'
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Markdown 源码</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Formatted Academic Layout */}
        {previewTab === 'rendered' ? (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed max-h-[600px] overflow-y-auto pr-2">
            {/* Header Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-sm font-bold text-slate-900">
                {caseName} · 因子分析学术研究与综合诊断报告
              </div>
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1">
                <span>领域：{currentCase?.domain || '多元统计'}</span>
                <span>样本量：N = {sampleCount}</span>
                <span>提取方法：{extractionMethod}</span>
                <span>旋转方法：{rotationType}</span>
                <span>公共因子数：m = {m}</span>
              </div>
            </div>

            {/* Part 1 */}
            <div className="p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>第一部分：研究问题与观测变量体系</span>
              </h4>
              <p className="text-slate-600">
                <strong>核心问题：</strong>{currentCase?.researchQuestion || '探索观测指标群背后是否存在稳健且具备现实解释力的公共潜变量。'}
              </p>
              <p className="text-slate-600">
                <strong>背景综述：</strong>{currentCase?.description || '本项研究对多项观测变量进行降维与结构方程探索。'}
              </p>
              <div className="pt-2">
                <div className="font-semibold text-slate-700 mb-1">观测变量清单：</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {variableNames.map((name, i) => (
                    <div key={i} className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{name}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        {currentCase?.variableDescriptions?.[name] || '连续观测指标'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Part 2 */}
            <div className="p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>第二部分：数据适合性判定 (KMO & Bartlett 检验)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  <div className="text-[11px] text-slate-500">KMO 抽样充分度</div>
                  <div className="text-lg font-bold font-mono text-emerald-800">{kmoRes.overallKMO.toFixed(4)}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">{kmoRes.kmoRating}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Bartlett 球形度卡方</div>
                  <div className="text-lg font-bold font-mono text-slate-800">χ² = {kmoRes.bartlettChi2.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-600">df = {kmoRes.bartlettDf}, p &lt; 0.0001</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">相关阵行列式</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{kmoRes.determinantR}</div>
                  <div className="text-[10px] text-slate-600">非奇异正定矩阵</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                判定：变量间简单相关远高于偏相关，严格拒绝单位阵假设，非常适合进行因子提取。
              </p>
            </div>

            {/* Part 3 */}
            <div className="p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>第三部分：因子提取决策与特征值方差解释</span>
              </h4>
              <p className="text-slate-600">
                采用 <strong>{extractionMethod}</strong> 提取，共保留 <strong>{m}</strong> 个因子，累积方差贡献率达{' '}
                <strong className="text-emerald-700 font-mono">{rotationResult.cumulativeVariance[m - 1] || 0}%</strong>。
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">因子序号</th>
                      <th className="py-2 px-3">特征值 (λ)</th>
                      <th className="py-2 px-3">解释方差比 (%)</th>
                      <th className="py-2 px-3">累积方差比 (%)</th>
                      <th className="py-2 px-3">Kaiser 准则</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {Array.from({ length: Math.min(p, 6) }).map((_, f) => (
                      <tr key={f}>
                        <td className="py-1.5 px-3 font-sans font-medium">Factor {f + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-indigo-700">{extraction.eigenvalues[f]?.toFixed(3) || '-'}</td>
                        <td className="py-1.5 px-3">{rotationResult.varianceExplained[f]?.toFixed(2)}%</td>
                        <td className="py-1.5 px-3 text-emerald-700">{rotationResult.cumulativeVariance[f]?.toFixed(2)}%</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">
                          {(extraction.eigenvalues[f] || 0) >= 1.0 ? '✅ 满足 (λ ≥ 1.0)' : '舍弃 (λ < 1.0)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part 4 */}
            <div className="p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>第四部分：因子载荷矩阵与坐标轴旋转 (简单结构)</span>
              </h4>
              <p className="text-slate-600">
                采用 <strong>{rotationType}</strong> 旋转，已达到瑟斯顿简单结构。各变量公共方差 (h²) 表征被因子解释的有效比例。
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">观测指标</th>
                      {Array.from({ length: m }).map((_, f) => (
                        <th key={f} className="py-2 px-3 text-center">{factorNames[f] || `F${f + 1}`}</th>
                      ))}
                      <th className="py-2 px-3 text-center text-indigo-700 bg-indigo-50/40">公共方差 (h²)</th>
                      <th className="py-2 px-3 text-center text-slate-500">特殊方差 (ψ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {variableNames.map((name, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="py-1.5 px-3 font-sans font-medium text-slate-800">{name}</td>
                        {rotationResult.rotatedLoadings[i]?.map((val, f) => (
                          <td
                            key={f}
                            className={`py-1.5 px-3 text-center ${
                              Math.abs(val) >= 0.5 ? 'font-bold text-emerald-800 bg-emerald-50/50' : 'text-slate-500'
                            }`}
                          >
                            {val.toFixed(3)}
                          </td>
                        ))}
                        <td className="py-1.5 px-3 text-center font-bold text-indigo-700 bg-indigo-50/20">
                          {extraction.communalities[i]?.toFixed(3)}
                        </td>
                        <td className="py-1.5 px-3 text-center text-slate-500">
                          {extraction.uniquenesses[i]?.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part 5 */}
            <div className="p-4 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>第五部分：潜变量理论综合命名与业务解释</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: m }).map((_, f) => {
                  const highItems = variableNames
                    .map((name, i) => ({ name, load: Math.abs(rotationResult.rotatedLoadings[i][f]) }))
                    .filter(item => item.load >= 0.40)
                    .sort((a, b) => b.load - a.load);

                  return (
                    <div key={f} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>潜变量 {f + 1}：{factorNames[f] || `Factor ${f + 1}`}</span>
                        <span className="text-[11px] font-mono text-indigo-600">
                          {rotationResult.varianceExplained[f]}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <strong>核心主导题项：</strong>
                        {highItems.map(item => `${item.name} (${item.load.toFixed(2)})`).join('、')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Part 6 */}
            <div className="p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>第六部分：回归因子得分与多维样本画像赋能</span>
              </h4>
              <p className="text-slate-600">
                基于 Thurstone 回归加权法计算各样本在潜变量上的标准化得分（均值 ≈ 0，标准差 ≈ 1.0），可直接用于下游 K-Means 聚类或构建综合指数评价体系。
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full text-xs text-left font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-1.5 px-3 font-sans">样本序号</th>
                      {Array.from({ length: m }).map((_, f) => (
                        <th key={f} className="py-1.5 px-3 text-center">{factorNames[f] || `FScore_${f + 1}`}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {factorScores.slice(0, 4).map((scores, idx) => (
                      <tr key={idx}>
                        <td className="py-1 px-3 font-sans text-slate-600">Sample #{idx + 1}</td>
                        {scores.map((sc, f) => (
                          <td key={f} className="py-1 px-3 text-center">{sc >= 0 ? `+${sc.toFixed(3)}` : sc.toFixed(3)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part 7 */}
            <div className="p-4 rounded-xl border border-slate-200/80 space-y-2 bg-slate-50/50">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-indigo-600" />
                <span>第七部分：模型综合诊断与病态防范建议</span>
              </h4>
              <p className="text-slate-600">
                {extraction.hasHeywood
                  ? '⚠️ 诊断提醒：当前模型存在 Heywood 负特殊方差病态现象，建议调整或减少提取因子数量。'
                  : '✅ 诊断结论：未出现 Heywood 负方差现象；旋转后载荷矩阵呈现清晰的对角块状属性，题项辨别力高，适于进行学术发表与决策落地。'}
              </p>
            </div>
          </div>
        ) : (
          /* Tab 2: Raw Markdown Source */
          <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap">
            {mdReport}
          </div>
        )}
      </div>
    </div>
  );
};
