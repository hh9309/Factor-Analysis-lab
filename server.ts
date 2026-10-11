import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Chat endpoint
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { messages, context, model = 'gemini 3 flash', apiKey } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const systemInstruction = `你是一位世界顶级的统计学与多元统计分析专家，担任“因子分析实验室 (Factor Analysis Lab)”的首席常驻AI学术导师。
你的职责：
1. 深入解释探索性因子分析 (EFA)、验证性因子分析 (CFA)、主成分分析 (PCA) 的数学本质与实践差异。
2. 针对用户当前的实战数据指标（如当前KMO检验值、Bartlett球形度检验p值、公共方差 communality、载荷矩阵 loading、旋转方式 Varimax/Promax、Heywood 现象等）提供严谨、透彻且具操作性的建议。
3. 如果模型存在隐患（例如 KMO < 0.5、Heywood 负方差现象、交叉载荷严重），清晰指出统计学成因与排查手段（删题、重构量表、调整提取因子数、换用斜交旋转等）。
4. 语言风格：专业、清晰、亲切、结构化，使用严谨的数学符号与学术规范中文。

当前用户实验室工作区上下文：
${context ? JSON.stringify(context, null, 2) : '暂无特定上下文'}
`;

    // Support DeepSeek V4 Pro
    if (model === 'deepseek-v4-pro') {
      const deepseekKey = apiKey || process.env.DEEPSEEK_API_KEY;
      if (!deepseekKey) {
        return res.status(400).json({ error: '请在齿轮设置中输入有效的 DeepSeek API-Key 后方可调用。' });
      }

      const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemInstruction },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
          ],
          temperature: 0.7,
        }),
      });

      if (!dsRes.ok) {
        const errJson = await dsRes.json().catch(() => ({}));
        throw new Error(`DeepSeek API 错误: ${errJson.error?.message || dsRes.statusText}`);
      }

      const dsData = await dsRes.json();
      const reply = dsData.choices?.[0]?.message?.content || 'DeepSeek 未返回有效文本。';
      return res.json({ text: reply });
    }

    // Default: Gemini 3 Flash
    const effectiveAi = apiKey
      ? new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : ai;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await effectiveAi.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (err: unknown) {
    console.error('AI chat error:', err);
    const message = err instanceof Error ? err.message : 'Unknown AI error';
    res.status(500).json({ error: message });
  }
});

// AI Instant Diagnostic endpoint
app.post('/api/ai-diagnose', async (req, res) => {
  try {
    const { diagnosticsData, model = 'gemini 3 flash', apiKey } = req.body;
    const prompt = `请对以下因子分析模型当前的检验与提取指标进行全面的“AI专家临床级诊断”：

数据集与模型指标：
${JSON.stringify(diagnosticsData, null, 2)}

请以专业的结构化格式返回诊断意见，包含以下维度：
1. 【适合度评估】：KMO 与 Bartlett 检验结果分析与数据降维可行性评级；
2. 【因子提取与方差解释】：因子数目合理性与信息保留度判定；
3. 【结构稳定性与潜在病态 (Heywood / 交叉载荷)】：是否存在负方差、载荷过大或交叉污染；
4. 【因子命名与现实含义建议】：结合案例变量，给出潜在因子建议命名与依据；
5. 【改进处方】：若进入学术研究或工业落地，下一步关键修正动作。`;

    if (model === 'deepseek-v4-pro') {
      const deepseekKey = apiKey || process.env.DEEPSEEK_API_KEY;
      if (!deepseekKey) {
        return res.status(400).json({ error: '请在齿轮设置中输入有效的 DeepSeek API-Key 后方可调用。' });
      }

      const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一位资深多元统计学评审专家，用语简练凝练、洞察深刻、直击问题要害。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
        }),
      });

      if (!dsRes.ok) {
        const errJson = await dsRes.json().catch(() => ({}));
        throw new Error(`DeepSeek API 错误: ${errJson.error?.message || dsRes.statusText}`);
      }

      const dsData = await dsRes.json();
      const reply = dsData.choices?.[0]?.message?.content || 'DeepSeek 未返回有效诊断文本。';
      return res.json({ text: reply });
    }

    const effectiveAi = apiKey
      ? new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : ai;

    const response = await effectiveAi.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '你是一位资深多元统计学评审专家，用语简练凝练、洞察深刻、直击问题要害。',
        temperature: 0.5,
      },
    });

    res.json({ text: response.text });
  } catch (err: unknown) {
    console.error('AI diagnose error:', err);
    const message = err instanceof Error ? err.message : 'Unknown AI error';
    res.status(500).json({ error: message });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Factor Analysis Lab server running on http://localhost:${PORT}`);
  });
}

startServer();
