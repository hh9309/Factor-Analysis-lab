import React, { useState, useEffect } from 'react';
import { ModelDiagnostic } from '../utils/matrixMath';
import {
  Sparkles,
  Bot,
  Send,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertOctagon,
  X,
  RefreshCw,
  Settings,
  Key,
  Cpu,
  Check,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';

interface Module7AIDiagnosticsProps {
  diagnostics: ModelDiagnostic[];
  contextData: Record<string, unknown>;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type LLMModelType = 'gemini 3 flash' | 'deepseek-v4-pro';

const STORAGE_KEY_API_KEY = 'factor_analysis_llm_api_key';
const STORAGE_KEY_MODEL = 'factor_analysis_llm_model';
const STORAGE_KEY_CONFIRMED = 'factor_analysis_llm_confirmed';

export const Module7AIDiagnostics: React.FC<Module7AIDiagnosticsProps> = ({
  diagnostics,
  contextData,
  isOpen,
  onClose,
}) => {
  // Model & Key configuration states (persisted in localStorage for GitHub browser deployment)
  const [activeModel, setActiveModel] = useState<LLMModelType>('gemini 3 flash');
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigConfirmed, setIsConfigConfirmed] = useState<boolean>(false);

  // Modal / Settings UI states
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [tempModel, setTempModel] = useState<LLMModelType>('gemini 3 flash');
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '您好！我是因子分析实验室的常驻 AI 学术随诊导师。我已经实时同步了您当前工作区的 KMO、Bartlett 检验、方差提取与旋转载荷矩阵。请先点击右上角【⚙️小齿轮】配置大模型与输入 API-Key，确认后即可进行专家诊断随诊！',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Load saved credentials from localStorage on mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
      const savedModel = (localStorage.getItem(STORAGE_KEY_MODEL) as LLMModelType) || 'gemini 3 flash';
      const savedConfirmed = localStorage.getItem(STORAGE_KEY_CONFIRMED) === 'true';

      if (savedKey) {
        setApiKey(savedKey);
        setTempApiKey(savedKey);
      }
      setActiveModel(savedModel);
      setTempModel(savedModel);
      setIsConfigConfirmed(savedConfirmed && Boolean(savedKey));
    } catch {
      // localStorage may fail in restricted sandboxes
    }
  }, []);

  const quickPrompts = [
    '一键生成当前模型学术临床诊断书',
    '为什么会出现 Heywood 现象以及如何排除？',
    '当前数据适合 Varimax 正交还是 Promax 斜交？',
    '若变量出现交叉载荷 (Cross-loading)，该删题还是保留？',
  ];

  // Confirm Model & API-Key settings
  const handleConfirmSettings = () => {
    if (!tempApiKey.trim()) {
      setConfigError('所有大模型调用必须输入 API-Key 后才能调用！');
      return;
    }
    setConfigError(null);
    setApiKey(tempApiKey.trim());
    setActiveModel(tempModel);
    setIsConfigConfirmed(true);

    try {
      localStorage.setItem(STORAGE_KEY_API_KEY, tempApiKey.trim());
      localStorage.setItem(STORAGE_KEY_MODEL, tempModel);
      localStorage.setItem(STORAGE_KEY_CONFIRMED, 'true');
    } catch {
      // ignore
    }

    setShowSettings(false);

    // Push notification message
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `✅ 已成功确认大模型：【${tempModel}】。API-Key 凭据已加载，已准备就绪！可随时提问或点击下方快捷诊断。`,
      },
    ]);
  };

  // Direct client-side fetch fallback for GitHub Pages static hosting
  const callDirectClientLLM = async (promptText: string): Promise<string> => {
    if (activeModel === 'deepseek-v4-pro') {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一位顶级的统计学与因子分析学术专家。当前语境是多元统计因子分析。',
            },
            { role: 'user', content: promptText },
          ],
          temperature: 0.6,
        }),
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || 'DeepSeek 未返回有效结果。';
    } else {
      // Gemini Direct Client API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        }),
      });
      const data = await res.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Gemini API 返回异常，请检查 API-Key 是否正确。'
      );
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    // Check if API key is provided and confirmed
    if (!apiKey || !isConfigConfirmed) {
      setShowSettings(true);
      setConfigError('项目部署要求：所有大模型调用必须输入 API-Key 并点击【确认大模型】后才能调用！');
      return;
    }

    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      if (query.includes('一键生成当前模型学术临床诊断书')) {
        let reply = '';
        try {
          // Attempt backend route with model & apiKey
          const res = await fetch('/api/ai-diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              diagnosticsData: contextData,
              model: activeModel,
              apiKey,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            reply = data.text;
          } else {
            throw new Error('Backend route fallback to browser direct fetch');
          }
        } catch {
          // GitHub Static Deployment fallback
          const directPrompt = `请对以下因子分析模型进行专家临床级诊断：\n${JSON.stringify(
            contextData,
            null,
            2
          )}`;
          reply = await callDirectClientLLM(directPrompt);
        }
        setMessages([...newMessages, { role: 'assistant', content: reply || '诊断完成。' }]);
      } else {
        let reply = '';
        try {
          const res = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: newMessages,
              context: contextData,
              model: activeModel,
              apiKey,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            reply = data.text;
          } else {
            throw new Error('Backend route fallback to browser direct fetch');
          }
        } catch {
          // GitHub Static Deployment fallback
          const fullPrompt = `当前因子分析工作区指标：${JSON.stringify(
            contextData,
            null,
            2
          )}\n\n用户提问：${query}`;
          reply = await callDirectClientLLM(fullPrompt);
        }
        setMessages([...newMessages, { role: 'assistant', content: reply || '暂无回复。' }]);
      }
    } catch (err: unknown) {
      console.error(err);
      const errMessage = err instanceof Error ? err.message : '未知网络异常';
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `⚠️ 大模型调用失败: ${errMessage}。请点击右上角小齿轮检查 API-Key 是否正确。`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: ModelDiagnostic['type']) => {
    switch (type) {
      case 'danger':
        return <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />;
    }
  };

  const getCardStyle = (type: ModelDiagnostic['type']) => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50/70 border-rose-200 text-rose-900';
      case 'warning':
        return 'bg-amber-50/70 border-amber-200 text-amber-900';
      case 'success':
        return 'bg-emerald-50/70 border-emerald-200 text-emerald-900';
      case 'info':
      default:
        return 'bg-indigo-50/70 border-indigo-200 text-indigo-900';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md sm:max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      {/* Drawer Header with Gear Settings Icon on the Far Right */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                AI 专家学术诊断随诊室
              </h3>
              {/* Confirmed Model Badge */}
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono border truncate ${
                  isConfigConfirmed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                title={isConfigConfirmed ? `已确认: ${activeModel}` : '待输入 API-Key'}
              >
                {activeModel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              实时监测 Heywood、KMO & 交叉载荷风险
            </p>
          </div>
        </div>

        {/* Right Action Icons: Settings Gear + Close X */}
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {/* 小齿轮设置大模型图标 */}
          <button
            onClick={() => {
              setTempModel(activeModel);
              setTempApiKey(apiKey);
              setShowSettings(!showSettings);
            }}
            className={`p-1.5 rounded-lg border transition ${
              showSettings
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                : !isConfigConfirmed
                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="设置大模型与手工输入 API-Key"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model & API-Key Configuration Modal / Popover Slice */}
      {showSettings && (
        <div className="p-4 bg-indigo-50/60 border-b border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>大模型选择与 API-Key 部署设置</span>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>GitHub 部署规范说明</strong>：本项目部署到 GitHub 上供浏览器调用，所有大模型调用必须输入 API-Key 后才能调用。凭据保存在本地浏览器中。
            </span>
          </div>

          {/* 1. 手工输入 API-Key */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. 手工输入 API-Key (必须输入)：</span>
              </span>
              <button
                type="button"
                onClick={() => setShowKeyPassword(!showKeyPassword)}
                className="text-slate-400 hover:text-slate-600 flex items-center space-x-1 font-normal text-[10px]"
              >
                {showKeyPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showKeyPassword ? '隐藏' : '显示'}</span>
              </button>
            </label>
            <input
              type={showKeyPassword ? 'text' : 'password'}
              value={tempApiKey}
              onChange={e => setTempApiKey(e.target.value)}
              placeholder="请输入您的大模型 API-Key (如 sk-... 或 AIza...)"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* 2. 选择两个大模型 */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              2. 选择大模型 (选择两个大模型之一)：
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Option A: gemini 3 flash */}
              <button
                type="button"
                onClick={() => setTempModel('gemini 3 flash')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  tempModel === 'gemini 3 flash'
                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">gemini 3 flash</span>
                  {tempModel === 'gemini 3 flash' && (
                    <Check className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  Google Gemini 系列旗靓轻量模型
                </span>
              </button>

              {/* Option B: deepseek-v4-pro */}
              <button
                type="button"
                onClick={() => setTempModel('deepseek-v4-pro')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  tempModel === 'deepseek-v4-pro'
                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">deepseek-v4-pro</span>
                  {tempModel === 'deepseek-v4-pro' && (
                    <Check className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  DeepSeek 推理与深度逻辑增强
                </span>
              </button>
            </div>
          </div>

          {configError && (
            <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
              {configError}
            </div>
          )}

          {/* 3. 确认大模型操作按钮 */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleConfirmSettings}
              className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>3. 确认大模型</span>
            </button>
          </div>
        </div>
      )}

      {/* Unconfirmed API-Key Warning Banner */}
      {!isConfigConfirmed && !showSettings && (
        <div
          onClick={() => setShowSettings(true)}
          className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition"
        >
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>未配置 API-Key</strong>：请点击右上角小齿轮输入 API-Key 并确认。
            </span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 underline shrink-0 ml-2">
            立即配置
          </span>
        </div>
      )}

      {/* Dynamic Diagnostic Alerts Slice Container */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/30 max-h-40 overflow-y-auto space-y-2">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>当前模型自动扫描诊断 ({diagnostics.length} 项)</span>
        </div>

        {diagnostics.map((diag, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-xl border text-xs space-y-1 ${getCardStyle(diag.type)}`}
          >
            <div className="flex items-start space-x-2 font-semibold">
              {getIcon(diag.type)}
              <span>{diag.title}</span>
            </div>
            <p className="text-[11px] leading-relaxed pl-6 opacity-90">
              {diag.message}
            </p>
            <div className="pl-6 text-[11px] font-medium opacity-100 flex items-center space-x-1">
              <span>建议动作：</span>
              <span>{diag.recommendation}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-800 border border-slate-200/60'
              }`}
            >
              <div className="text-[10px] opacity-70 font-semibold flex items-center space-x-1">
                <span>{m.role === 'user' ? '我的提问' : `AI 学术导师 (${activeModel})`}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed font-sans">
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-indigo-600 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">
              AI ({activeModel}) 正在深度演算并推导学术诊断报告...
            </span>
          </div>
        )}
      </div>

      {/* Quick Prompts Pills */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex space-x-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp)}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 transition shadow-2xs shrink-0"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Message Bar */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              isConfigConfirmed
                ? `向 AI 导师提问 [当前模型: ${activeModel}]...`
                : '请先在右上角齿轮设置中输入 API-Key 并确认...'
            }
            disabled={loading}
            className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
