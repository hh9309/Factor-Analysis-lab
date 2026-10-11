/**
 * 因子分析实验室 (Factor Analysis Lab)
 * 主应用集成入口
 */
import React, { useState, useMemo } from 'react';
import { CASE_STUDIES, CaseStudy } from './data/cases';
import {
  computeCorrelationMatrix,
  calculateKMOBartlett,
  extractFactors,
  rotateVarimax,
  rotatePromax,
  calculateFactorScores,
  scanModelDiagnostics,
  ExtractionMethod,
  RotationType,
  identityMatrix,
  createMatrix,
} from './utils/matrixMath';

import { Navbar } from './components/Navbar';
import { Module1Algebra } from './components/Module1Algebra';
import { Module2Suitability } from './components/Module2Suitability';
import { Module3Extraction } from './components/Module3Extraction';
import { Module4RotationScores } from './components/Module4RotationScores';
import { Module5Cases } from './components/Module5Cases';
import { Module6CodeEngine } from './components/Module6CodeEngine';
import { Module7AIDiagnostics } from './components/Module7AIDiagnostics';
import { Module8Workflow } from './components/Module8Workflow';
import { Module9Export } from './components/Module9Export';
import { Module10KnowledgeSlices } from './components/Module10KnowledgeSlices';

import {
  Sparkles,
  Layers,
  Database,
  ShieldCheck,
  PieChart,
  RotateCw,
  Cpu,
  BookOpen,
  Download,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function App() {
  const [currentCase, setCurrentCase] = useState<CaseStudy>(CASE_STUDIES[0]);
  const [dataset, setDataset] = useState<number[][]>(CASE_STUDIES[0].rawData);
  const [variableNames, setVariableNames] = useState<string[]>(CASE_STUDIES[0].variableNames);
  const [numFactors, setNumFactors] = useState<number>(CASE_STUDIES[0].defaultNumFactors);
  const [method, setMethod] = useState<ExtractionMethod>(CASE_STUDIES[0].defaultMethod);
  const [rotationType, setRotationType] = useState<RotationType>(CASE_STUDIES[0].defaultRotation);
  const [factorNames, setFactorNames] = useState<string[]>(CASE_STUDIES[0].suggestedFactorNames);

  // Variable weights and pruning state (indexed against variableNames)
  const [variableWeights, setVariableWeights] = useState<number[]>(() =>
    Array(CASE_STUDIES[0].variableNames.length).fill(1.0)
  );
  const [variableEnabled, setVariableEnabled] = useState<boolean[]>(() =>
    Array(CASE_STUDIES[0].variableNames.length).fill(true)
  );

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('workflow');
  const [workflowStep, setWorkflowStep] = useState<number>(1);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState<boolean>(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState<boolean>(false);

  // Active variables subset after weighting & pruning
  const {
    activeIndices,
    activeVariableNames,
    activeDataset,
    activeWeights,
    isCustomizedWeights,
  } = useMemo(() => {
    let active = variableNames
      .map((_, i) => i)
      .filter(i => (variableEnabled[i] ?? true) && (variableWeights[i] ?? 1.0) > 0);

    if (active.length < 2) {
      active = variableNames.map((_, i) => i).slice(0, Math.min(2, variableNames.length));
    }

    const names = active.map(i => variableNames[i]);
    const d = dataset.map(row => active.map(i => row[i]));
    const w = active.map(i => variableWeights[i] ?? 1.0);
    const hasCustom =
      variableWeights.some(v => Math.abs(v - 1.0) > 0.01) ||
      variableEnabled.some(e => !e);

    return {
      activeIndices: active,
      activeVariableNames: names,
      activeDataset: d,
      activeWeights: w,
      isCustomizedWeights: hasCustom,
    };
  }, [variableNames, dataset, variableWeights, variableEnabled]);

  // Effective number of factors clamped to active variables count - 1
  const effectiveNumFactors = useMemo(() => {
    return Math.max(1, Math.min(numFactors, activeVariableNames.length - 1));
  }, [numFactors, activeVariableNames.length]);

  // 1. Correlation Matrix & Standardized Data on active dataset
  const { corr: R_raw, standardized } = useMemo(() => {
    return computeCorrelationMatrix(activeDataset);
  }, [activeDataset]);

  // Weighted covariance matrix for factor extraction:
  // SW[i][j] = R_raw[i][j] * activeWeights[i] * activeWeights[j]
  const R = useMemo(() => {
    const p = activeWeights.length;
    const SW = createMatrix(p, p, 0);
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        SW[i][j] = R_raw[i][j] * activeWeights[i] * activeWeights[j];
      }
    }
    return SW;
  }, [R_raw, activeWeights]);

  // 2. KMO & Bartlett Test (evaluated on normalized correlation matrix)
  const kmoRes = useMemo(() => {
    return calculateKMOBartlett(R_raw, activeDataset.length);
  }, [R_raw, activeDataset.length]);

  // 3. Factor Extraction
  const extraction = useMemo(() => {
    return extractFactors(R, effectiveNumFactors, method);
  }, [R, effectiveNumFactors, method]);

  // 4. Factor Rotation
  const rotationResult = useMemo(() => {
    if (rotationType === 'varimax') {
      return rotateVarimax(extraction.unrotatedLoadings);
    } else if (rotationType === 'promax') {
      return rotatePromax(extraction.unrotatedLoadings);
    } else {
      const m = extraction.unrotatedLoadings[0]?.length || 1;
      return {
        rotatedLoadings: extraction.unrotatedLoadings,
        rotationMatrix: identityMatrix(m),
        factorCorrelation: identityMatrix(m),
        varianceExplained: extraction.varianceExplained,
        cumulativeVariance: extraction.cumulativeVariance,
      };
    }
  }, [extraction.unrotatedLoadings, rotationType, extraction.varianceExplained, extraction.cumulativeVariance]);

  // 5. Factor Scores
  const { scores: factorScores } = useMemo(() => {
    return calculateFactorScores(
      standardized,
      R,
      rotationResult.rotatedLoadings,
      extraction.uniquenesses,
      'regression'
    );
  }, [standardized, R, rotationResult.rotatedLoadings, extraction.uniquenesses]);

  // 6. Automated Model Diagnostics
  const diagnostics = useMemo(() => {
    return scanModelDiagnostics(
      kmoRes,
      extraction,
      rotationResult.rotatedLoadings,
      activeVariableNames,
      rotationType
    );
  }, [kmoRes, extraction, rotationResult.rotatedLoadings, activeVariableNames, rotationType]);

  // Context for AI assistant
  const aiContext = useMemo(() => {
    return {
      caseName: currentCase.name,
      domain: currentCase.domain,
      sampleSize: activeDataset.length,
      variablesCount: activeVariableNames.length,
      variableNames: activeVariableNames,
      overallKMO: kmoRes.overallKMO,
      kmoRating: kmoRes.kmoRating,
      bartlettChi2: kmoRes.bartlettChi2,
      bartlettPValue: kmoRes.bartlettPValue,
      numFactors: effectiveNumFactors,
      extractionMethod: method,
      rotationType,
      factorNames,
      varianceExplained: rotationResult.varianceExplained,
      hasHeywood: extraction.hasHeywood,
      heywoodVariables: extraction.heywoodVariables.map(i => activeVariableNames[i]),
      topRotatedLoadings: activeVariableNames.map((name, i) => ({
        variable: name,
        loadings: rotationResult.rotatedLoadings[i],
        communality: extraction.communalities[i],
      })),
    };
  }, [
    currentCase,
    activeDataset.length,
    activeVariableNames,
    kmoRes,
    effectiveNumFactors,
    method,
    rotationType,
    factorNames,
    rotationResult,
    extraction,
  ]);

  // Handler to select a case study
  const handleSelectCase = (cs: CaseStudy) => {
    setCurrentCase(cs);
    setDataset(cs.rawData);
    setVariableNames(cs.variableNames);
    setNumFactors(cs.defaultNumFactors);
    setMethod(cs.defaultMethod);
    setRotationType(cs.defaultRotation);
    setFactorNames(cs.suggestedFactorNames);
    setVariableWeights(Array(cs.variableNames.length).fill(1.0));
    setVariableEnabled(Array(cs.variableNames.length).fill(true));
    setIsCaseModalOpen(false);
  };

  // Variable weights and pruning handlers
  const handleUpdateWeight = (origIndex: number, weight: number) => {
    setVariableWeights(prev => {
      const next = [...prev];
      next[origIndex] = Math.max(0, Math.min(2.0, weight));
      return next;
    });
  };

  const handleToggleVariable = (origIndex: number) => {
    const currentActiveCount = variableEnabled.filter(Boolean).length;
    if (variableEnabled[origIndex] && currentActiveCount <= 2) {
      return;
    }
    setVariableEnabled(prev => {
      const next = [...prev];
      next[origIndex] = !next[origIndex];
      return next;
    });
  };

  const handleResetWeights = () => {
    setVariableWeights(Array(variableNames.length).fill(1.0));
    setVariableEnabled(Array(variableNames.length).fill(true));
  };

  const handleApplyPresetWeights = (preset: 'default' | 'boost_core' | 'dampen_edge' | 'prune_weak' | 'cascade') => {
    const len = variableNames.length;
    if (preset === 'default') {
      handleResetWeights();
    } else if (preset === 'boost_core') {
      setVariableWeights(variableNames.map((_, i) => (i < 2 ? 1.5 : 1.0)));
      setVariableEnabled(Array(len).fill(true));
    } else if (preset === 'dampen_edge') {
      setVariableWeights(variableNames.map((_, i) => (i >= len - 2 ? 0.5 : 1.0)));
      setVariableEnabled(Array(len).fill(true));
    } else if (preset === 'prune_weak') {
      if (len > 2) {
        setVariableEnabled(variableNames.map((_, i) => i !== len - 1));
      }
    } else if (preset === 'cascade') {
      setVariableWeights(variableNames.map((_, i) => +(1.4 - (i / Math.max(1, len - 1)) * 0.8).toFixed(2)));
      setVariableEnabled(Array(len).fill(true));
    }
  };

  // Handler to apply custom CSV data
  const handleApplyCustomData = (name: string, varNames: string[], data: number[][]) => {
    const customCase: CaseStudy = {
      id: 'custom-' + Date.now(),
      name,
      domain: '用户自定义数据集',
      badge: '自定义数据',
      mappingMethod: '通用因子分析建模',
      description: '由用户自定义导入或粘贴的多元观测问卷数据集。',
      researchQuestion: '探索该自定义多指标背后的公共潜变量结构。',
      variableNames: varNames,
      variableDescriptions: {},
      defaultMethod: 'PAF',
      defaultNumFactors: Math.max(1, Math.min(3, varNames.length - 1)),
      defaultRotation: 'varimax',
      suggestedFactorNames: Array.from({ length: Math.min(3, varNames.length - 1) }, (_, i) => `潜变量_${i + 1}`),
      rawData: data,
      academicNotes: '自定义数据已成功载入，系统已自动重构相关阵与特征值。',
    };
    handleSelectCase(customCase);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentCase={currentCase}
        onOpenCaseModal={() => setIsCaseModalOpen(true)}
        onOpenCustomDataModal={() => setIsCaseModalOpen(true)}
        onToggleAIDrawer={() => setIsAIDrawerOpen(!isAIDrawerOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aiOpen={isAIDrawerOpen}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active Tab Router */}
        {activeTab === 'workflow' && (
          <Module8Workflow
            currentStep={workflowStep}
            setCurrentStep={setWorkflowStep}
            kmoRes={kmoRes}
            extraction={extraction}
            rotationResult={rotationResult}
            numFactors={effectiveNumFactors}
            factorNames={factorNames}
            setFactorNames={setFactorNames}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'suitability' && (
          <Module2Suitability
            kmoRes={kmoRes}
            variableNames={activeVariableNames}
            sampleSize={activeDataset.length}
          />
        )}

        {activeTab === 'extraction' && (
          <Module3Extraction
            extraction={extraction}
            numFactors={effectiveNumFactors}
            setNumFactors={setNumFactors}
            method={method}
            setMethod={setMethod}
            variableNames={activeVariableNames}
          />
        )}

        {activeTab === 'rotation' && (
          <Module4RotationScores
            rotationType={rotationType}
            setRotationType={setRotationType}
            unrotatedLoadings={extraction.unrotatedLoadings}
            rotationResult={rotationResult}
            variableNames={activeVariableNames}
            rawVariableNames={variableNames}
            variableDescriptions={currentCase.variableDescriptions}
            variableWeights={variableWeights}
            variableEnabled={variableEnabled}
            onUpdateWeight={handleUpdateWeight}
            onToggleVariable={handleToggleVariable}
            onResetWeights={handleResetWeights}
            onApplyPresetWeights={handleApplyPresetWeights}
            isCustomizedWeights={isCustomizedWeights}
            factorScores={factorScores}
            factorNames={factorNames}
            setFactorNames={setFactorNames}
            communalities={extraction.communalities}
            uniquenesses={extraction.uniquenesses}
          />
        )}

        {activeTab === 'algebra' && (
          <Module1Algebra
            R={R}
            loadings={rotationResult.rotatedLoadings}
            communalities={extraction.communalities}
            uniquenesses={extraction.uniquenesses}
            variableNames={activeVariableNames}
          />
        )}

        {activeTab === 'code' && (
          <Module6CodeEngine
            caseName={currentCase.name}
            variableNames={activeVariableNames}
            numFactors={effectiveNumFactors}
            method={method}
            rotation={rotationType}
            sampleSize={activeDataset.length}
            kmoRes={kmoRes}
            extraction={extraction}
            rotationResult={rotationResult}
            factorScores={factorScores}
            factorNames={factorNames}
          />
        )}

        {activeTab === 'knowledge' && <Module10KnowledgeSlices />}

        {activeTab === 'export' && (
          <Module9Export
            currentCase={currentCase}
            caseName={currentCase.name}
            variableNames={activeVariableNames}
            kmoRes={kmoRes}
            extraction={extraction}
            rotationResult={rotationResult}
            factorScores={factorScores}
            factorNames={factorNames}
            rotationType={rotationType}
            extractionMethod={method}
            dataset={activeDataset}
          />
        )}
      </main>

      {/* Case Selection & Custom Data Modal */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setIsCaseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Module5Cases
              currentCase={currentCase}
              onSelectCase={handleSelectCase}
              onApplyCustomData={handleApplyCustomData}
              onClose={() => setIsCaseModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* AI Consultation Drawer / Floating Dialog */}
      <Module7AIDiagnostics
        diagnostics={diagnostics}
        contextData={aiContext}
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
      />

      {/* Floating Quick AI Button (when drawer is closed) */}
      {!isAIDrawerOpen && (
        <button
          onClick={() => setIsAIDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all font-medium text-xs sm:text-sm tracking-wide"
        >
          <Sparkles className="w-4 h-4 animate-bounce" />
          <span>AI 诊断随诊</span>
          {diagnostics.some(d => d.type === 'danger') && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          )}
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">因子分析实验室</span>
            <span>· 探索性因子分析 (EFA) 与隐变量降维交互系统</span>
          </div>
          <div className="text-slate-400">
            10 大核心模块联动 · 矩阵代数 · KMO/Bartlett · 碎石图 · 简单结构旋转 · AI 随诊
          </div>
        </div>
      </footer>
    </div>
  );
}
