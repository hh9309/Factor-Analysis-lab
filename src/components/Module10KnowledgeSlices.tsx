import React, { useState } from 'react';
import { BookOpen, AlertOctagon, HelpCircle, Layers, CheckCircle2, Split, Compass } from 'lucide-react';

export const Module10KnowledgeSlices: React.FC = () => {
  const [activeSlice, setActiveSlice] = useState<number>(1);

  const slices = [
    { id: 1, title: '切片一：FA vs. PCA 机理差异', icon: Split },
    { id: 2, title: '切片二：适用条件与空间几何', icon: Compass },
    { id: 3, title: '切片三：三大致命建模陷阱', icon: AlertOctagon },
    { id: 4, title: '切片四：误区警示与诊断陷阱', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Title Card Slice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                核心模块 10
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                知识导引 (Knowledge Slices)
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              结构化拆解多元统计核心认知：从数学模型本质、多维向量几何、常见学术翻车陷阱到审稿人视角防坑指南。
            </p>
          </div>
        </div>

        {/* Slice Navigation Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {slices.map(s => {
            const Icon = s.icon;
            const isActive = activeSlice === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSlice(s.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center space-x-3 ${
                  isActive
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900">{s.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slice 1 */}
      {activeSlice === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-semibold text-indigo-600">KNOWLEDGE SLICE 01</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              因子分析 (FA) vs. 主成分分析 (PCA) 机理差异
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              这是统计学与数据科学中最容易混淆的两大经典方法。二者在数学哲学、建模假设与误差处理上存在本质分歧。
            </p>
          </div>

          {/* Comparison Table Slice */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">比较维度</th>
                  <th className="py-3 px-4 text-indigo-900 bg-indigo-50/50">
                    探索性因子分析 (EFA / FA)
                  </th>
                  <th className="py-3 px-4 text-slate-800">主成分分析 (PCA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700">理论哲学</td>
                  <td className="py-3 px-4 bg-indigo-50/20 text-indigo-950">
                    <strong>潜在生成模型 (Generative Model)</strong>：假定现实中存在不可直接测量的深层隐变量（如“智商”、“抗压特质”），它们是支配观测变量表现的因。
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <strong>数据压缩降维 (Data Reduction)</strong>：没有生成模型假设，仅仅是观测变量的线性正交投影变换，旨在用尽量少的综合变量保留最大总方差。
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700">数学结构方程</td>
                  <td className="py-3 px-4 bg-indigo-50/20 font-mono text-indigo-900">
                    X = μ + Λ · F + ε
                    <br />
                    <span className="font-sans text-[11px] text-slate-500">
                      (X 由公共因子 F 与误差 ε 共同决定)
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    Y = Wᵀ · X
                    <br />
                    <span className="font-sans text-[11px] text-slate-500">
                      (主成分 Y 为观测变量 X 的直接线性加权)
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700">对角线处理与方差</td>
                  <td className="py-3 px-4 bg-indigo-50/20 text-indigo-950">
                    <strong>仅对公共方差建模</strong>：相关矩阵对角线被替换为共同度估值 $h_i^2 &lt; 1.0$，将特殊方差 $\psi_i$ 作为残差噪音剥离。
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <strong>对总方差建模</strong>：相关矩阵对角线严格为 1.0，不区分公共方差与特殊误差，非系统性噪音会被一并压缩进前几个主成分。
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700">坐标轴旋转</td>
                  <td className="py-3 px-4 bg-indigo-50/20 text-indigo-950">
                    <strong>必须旋转</strong>：初始提取往往大因子通吃，必须通过 Varimax 或 Promax 旋转获得瑟斯顿简单结构才能命名。
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <strong>旋转后丧失主成分性质</strong>：PCA 旋转后各分量不再按最大化方差递减排列，丧失了正交主成分的原生特征。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slice 2 */}
      {activeSlice === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-semibold text-indigo-600">KNOWLEDGE SLICE 02</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              适用条件与多维向量几何空间表示
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              从线性代数视角理解因子分析：如何将 $p$ 个观测向量构成的超几何空间投影分解到 $m$ 维潜变量基底。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>因子分析三大适用先决条件</span>
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>强烈的多重线性相关性</strong>：变量之间必须有足够的共变（Covariance）。如果相关阵接近单位阵（Bartlett 检验不显著），因子分析完全失效。
                </li>
                <li>
                  <strong>概念背后的潜在隐变量假设</strong>：所测量的指标应服务于共同的概念构念（Construct），如心理特质、满意度维度或宏观经济周期。
                </li>
                <li>
                  <strong>样本量与变量比充足</strong>：通常要求样本量 $N \ge 100$，且 $N/p \ge 5:1$（理想状态为 $10:1$ 以上），以保证样本相关矩阵具有足够的统计功效。
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>向量空间与载荷的几何意义</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                在 $N$ 维样本空间中，每个观测变量可视为一个长度为 1 的标准化向量：
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>两向量夹角余弦值 cos(θ) = r_ij 即为相关系数；</li>
                <li>因子载荷 λ_ik 代表变量向量向因子轴 F_k 的投影长度；</li>
                <li>公共方差 h_i² 是变量向量在整个 m 维公共因子子空间上的投影长度平方。</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Slice 3 */}
      {activeSlice === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-semibold text-rose-600">KNOWLEDGE SLICE 03</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              三大致命建模陷阱 (Fatal Traps)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              在审稿人或工业界专家评审中，以下三大低级错误会导致论文被秒拒或风控模型直接崩溃。
            </p>
          </div>

          <div className="space-y-4">
            {/* Trap 1 */}
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-rose-900 text-sm">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>致命陷阱一：未做 KMO 适合度检验强行降维</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                <strong>后果</strong>：当变量间偏相关性过高、整体 KMO &lt; 0.50 时强行做因子提取，会导致提取出的公共因子方差解释力极弱，残差矩阵非零元素巨大，最终得到的“潜变量”纯属统计幻觉。
                <br />
                <strong>排查对策</strong>：务必先跑 KMO 与 Bartlett 检验；若个别变量 MSA 极低，务必先行剔除。
              </p>
            </div>

            {/* Trap 2 */}
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-rose-900 text-sm">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>致命陷阱二：忽视 Heywood 现象导致模型病态与迭代崩溃</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                <strong>后果</strong>：在最大似然 (ML) 或主轴因子迭代中，某变量的公共度估计值 $h^2 \ge 1.0$，致使其特殊方差 $\psi_i \le 0$。在现实世界中方差不可能为负数！这说明矩阵已不可逆，求解算法出现伪局部收敛。
                <br />
                <strong>排查对策</strong>：检查是否提取了过多因子、样本量是否过小（小样本下易引发 Heywood），或该变量与其他题项相关性接近 1.0（共线性极端）。
              </p>
            </div>

            {/* Trap 3 */}
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-rose-900 text-sm">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>致命陷阱三：在因子高度相关时误用正交旋转 (Varimax) 扭曲现实</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                <strong>后果</strong>：在经济学、金融学或复杂心理学中，潜变量之间（如宏观通胀与信用溢价、外向性与情绪性）天然具有协同关联。强行施加 Varimax 强制相关为 0，会人为割裂现实相关性，导致载荷矩阵出现虚假交叉载荷。
                <br />
                <strong>排查对策</strong>：优先尝试 Promax 斜交旋转。若因子相关阵 $\Phi$ 中的相关系数大于 0.32，应坚决保留斜交旋转结果。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Slice 4 */}
      {activeSlice === 4 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-mono font-semibold text-amber-600">KNOWLEDGE SLICE 04</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              误区警示与诊断陷阱 (Practical Warnings)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              走出教科书理想假设：因子命名的主观性风险、交叉载荷处置方案与因子得分加权误区。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
              <div className="font-bold text-slate-900 text-sm">
                ① 警惕“因子命名随意性”
              </div>
              <p className="text-slate-600 leading-relaxed">
                因子分析只能给出冷冰冰的数字载荷，无法自动赋予含义。命名必须以该因子上<strong>绝对载荷最大（通常 $\ge 0.50$）的前 2~3 个题项的核心语义</strong>为锚点，绝不能主观臆造与观测变量无关的概念。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
              <div className="font-bold text-slate-900 text-sm">
                ② 因子得分 ≠ 原始指标简单加权
              </div>
              <p className="text-slate-600 leading-relaxed">
                很多初学者误以为因子得分就是高载荷变量的平均分。实际上，真正的因子得分由 Thurstone 回归权重矩阵 $W = R^{-1} \Lambda$ 确定，充分校正了观测变量之间的重叠协方差，其得分标准差约为 1.0。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
              <div className="font-bold text-slate-900 text-sm">
                ③ 交叉载荷 (Cross-Loading) 处置准则
              </div>
              <p className="text-slate-600 leading-relaxed">
                若某个变量在两个或更多因子上的载荷均 $\ge 0.40$，且载荷差值 &lt; 0.20，说明该题项“脚踩两只船”，破坏了瑟斯顿简单结构。在严肃问卷开发中，通常应予以果断剔除。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
