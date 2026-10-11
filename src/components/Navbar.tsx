import React from 'react';
import { Sparkles, Database, FileSpreadsheet, Bot, BookOpen, Layers } from 'lucide-react';
import { CaseStudy } from '../data/cases';

interface NavbarProps {
  currentCase: CaseStudy;
  onOpenCaseModal: () => void;
  onOpenCustomDataModal: () => void;
  onToggleAIDrawer: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  aiOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCase,
  onOpenCaseModal,
  onOpenCustomDataModal,
  onToggleAIDrawer,
  activeTab,
  setActiveTab,
  aiOpen,
}) => {
  const navItems = [
    { id: 'workflow', label: '全流程向导', icon: Layers },
    { id: 'suitability', label: '适合性检验', icon: null },
    { id: 'extraction', label: '因子提取与碎石图', icon: null },
    { id: 'rotation', label: '旋转与得分', icon: null },
    { id: 'algebra', label: '矩阵代数分解', icon: null },
    { id: 'code', label: 'Python/R 代码', icon: null },
    { id: 'knowledge', label: '知识导引', icon: BookOpen },
    { id: 'export', label: '报告导出', icon: null },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-600 flex items-center justify-center text-white shadow-sm font-serif font-bold text-lg">
              Ψ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 tracking-tight text-base sm:text-lg">
                  因子分析实验室
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60">
                  Factor Analysis Lab
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                多元统计潜变量建模 · 协方差分解 · 碎石图 · 简单结构旋转
              </p>
            </div>
          </div>

          {/* Current Case Selector Badge */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenCaseModal}
              className="flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200/80 transition shadow-xs"
              title="切换六大实战案例"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span className="max-w-[120px] sm:max-w-[200px] truncate">{currentCase.name}</span>
              <span className="text-slate-400 text-xs">▼</span>
            </button>

            <button
              onClick={onOpenCustomDataModal}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 transition"
              title="导入或微调自定义数据"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>数据录入</span>
            </button>

            {/* AI Assistant button */}
            <button
              onClick={onToggleAIDrawer}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition shadow-xs ${
                aiOpen
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 诊断随诊</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-100 py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
