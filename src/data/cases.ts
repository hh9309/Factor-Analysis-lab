/**
 * Six Comprehensive Real-World Factor Analysis Case Datasets
 */
import { Matrix } from '../utils/matrixMath';

export interface CaseStudy {
  id: string;
  name: string;
  domain: string;
  badge: string;
  mappingMethod: string;
  description: string;
  researchQuestion: string;
  variableNames: string[];
  variableDescriptions: Record<string, string>;
  defaultMethod: 'PAF' | 'PC' | 'ML';
  defaultNumFactors: number;
  defaultRotation: 'varimax' | 'promax' | 'none';
  suggestedFactorNames: string[];
  rawData: Matrix;
  academicNotes: string;
}

// Deterministic Pseudo-Random Generator for reproducible realistic data
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Generate realistic observations given a latent factor model: X = mu + Lambda * F + eps
function generateCaseData(
  sampleSize: number,
  means: number[],
  loadings: number[][], // P x M
  uniquenesses: number[], // P
  seed: number
): Matrix {
  const rand = createSeededRandom(seed);
  const p = means.length;
  const m = loadings[0].length;
  const data: Matrix = [];

  // Box-Muller normal sample
  const randNorm = () => {
    const u1 = Math.max(1e-6, rand());
    const u2 = rand();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };

  for (let i = 0; i < sampleSize; i++) {
    // Latent factors F ~ N(0, 1)
    const F: number[] = Array.from({ length: m }, () => randNorm());
    const row: number[] = [];

    for (let j = 0; j < p; j++) {
      let val = means[j];
      // Lambda * F
      for (let k = 0; k < m; k++) {
        val += loadings[j][k] * F[k];
      }
      // Unique error
      val += Math.sqrt(Math.max(0.01, uniquenesses[j])) * randNorm();
      row.push(Number(val.toFixed(2)));
    }
    data.push(row);
  }

  return data;
}

// Case 1: 心理测量与人格特质建模 (EFA)
const case1Loadings = [
  // F1: 外向性, F2: 尽责性, F3: 神经质/情绪性
  [0.85, 0.12, -0.05], // E1 外向社交
  [0.82, 0.08, -0.10], // E2 热情活跃
  [0.78, 0.15, -0.08], // E3 语言表达
  [0.10, 0.88, 0.05],  // C1 尽责自律
  [0.12, 0.84, 0.02],  // C2 条理条规
  [0.05, 0.79, -0.12], // C3 目标导向
  [-0.08, 0.02, 0.86], // N1 焦虑倾向
  [-0.12, -0.05, 0.82],// N2 情绪敏感
];
const case1Data = generateCaseData(
  160,
  [5.2, 5.0, 4.8, 5.5, 5.3, 5.6, 3.4, 3.2],
  case1Loadings,
  [0.25, 0.28, 0.35, 0.20, 0.26, 0.32, 0.24, 0.30],
  101
);

// Case 2: 消费者满意度与品牌感知度 (Varimax)
const case2Loadings = [
  // F1: 产品品质, F2: 服务保障, F3: 品牌溢价认同
  [0.86, 0.15, 0.10], // Q1 核心性能
  [0.82, 0.20, 0.12], // Q2 耐用可靠
  [0.15, 0.88, 0.08], // S1 响应时效
  [0.18, 0.84, 0.14], // S2 售后专业
  [0.12, 0.10, 0.89], // B1 品牌口碑
  [0.08, 0.15, 0.85], // B2 身份认同
  [0.65, 0.30, 0.35], // V1 总体满意 (具有适度综合载荷)
];
const case2Data = generateCaseData(
  180,
  [8.1, 7.9, 7.5, 7.8, 8.4, 7.2, 8.0],
  case2Loadings,
  [0.22, 0.25, 0.18, 0.24, 0.19, 0.22, 0.30],
  202
);

// Case 3: 金融市场系统性风险评估 (Promax - Correlated factors)
const case3Loadings = [
  // F1: 宏观流动性与利率风险, F2: 信用与违约风险
  [0.88, 0.35], // M1 基准利率利差
  [0.84, 0.40], // M2 货币市场同业存单利率
  [0.79, 0.30], // M3 外汇汇率波动率
  [0.32, 0.86], // C1 高收益债信用利差
  [0.28, 0.82], // C2 企业债违约概率CDS
  [0.36, 0.78], // C3 股票波动率指数VIX
];
const case3Data = generateCaseData(
  150,
  [2.4, 2.8, 1.8, 3.2, 4.1, 20.5],
  case3Loadings,
  [0.18, 0.22, 0.28, 0.19, 0.25, 0.26],
  303
);

// Case 4: 工业设备故障多源传感器诊断 (ML)
const case4Loadings = [
  // F1: 机械传动磨损, F2: 电气与热负荷
  [0.89, 0.10], // V1 驱动轴承径向振动
  [0.85, 0.15], // V2 齿轮箱高频冲击
  [0.78, 0.08], // A1 超声声发射能量
  [0.12, 0.88], // T1 定子绕组线圈温度
  [0.18, 0.83], // T2 轴瓦润滑油温
  [0.10, 0.79], // P1 进气与冷却背压
];
const case4Data = generateCaseData(
  140,
  [4.2, 5.1, 62.0, 75.5, 68.2, 101.3],
  case4Loadings,
  [0.19, 0.24, 0.32, 0.20, 0.27, 0.33],
  404
);

// Case 5: 区域经济发展综合指标评价 (PAF)
const case5Loadings = [
  // F1: 经济总量与产出实力, F2: 科技创新与高技术能级
  [0.88, 0.20], // E1 人均地区生产总值
  [0.85, 0.25], // E2 规模以上工业增加值
  [0.82, 0.18], // E3 一般公共预算地方财政收入
  [0.22, 0.89], // I1 全社会R&D经费投入强度
  [0.18, 0.86], // I2 国家高新技术企业密度
  [0.28, 0.75], // I3 战略性新兴产业产值占比
];
const case5Data = generateCaseData(
  120,
  [95.0, 140.0, 85.0, 3.2, 48.0, 35.0],
  case5Loadings,
  [0.18, 0.23, 0.28, 0.17, 0.22, 0.35],
  505
);

// Case 6: 基因表达谱数据特征降维 (High-Dimensional Small-Sample Sparse)
const case6Loadings = [
  // F1: 细胞增殖与分裂通路, F2: 炎症与免疫微环境
  [0.86, 0.05], // G1 MKI67 (细胞增殖标志)
  [0.82, 0.08], // G2 PCNA (增殖细胞核抗原)
  [0.79, 0.12], // G3 CDK1 (周期蛋白依赖激酶)
  [0.05, 0.89], // G4 IL6 (白细胞介素-6)
  [0.10, 0.85], // G5 TNF-alpha (肿瘤坏死因子)
  [0.12, 0.81], // G6 CXCL8 (促炎趋化因子)
  [0.08, 0.74], // G7 NF-kB (免疫转录因子)
];
const case6Data = generateCaseData(
  90,
  [6.8, 7.2, 6.1, 4.5, 4.2, 5.0, 5.4],
  case6Loadings,
  [0.24, 0.30, 0.34, 0.19, 0.26, 0.31, 0.38],
  606
);

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'psychometrics',
    name: '心理测量与人格特质建模',
    domain: '心理学与行为科学',
    badge: '案例 1 · 探索性因子分析 (EFA)',
    mappingMethod: '探索性因子分析 (EFA)（量表降维与隐变量提取）',
    description: '通过多维度人格自陈量表（外向性、尽责性、神经质），揭示隐藏在复杂多项观测题项背后的核心心理学潜变量。',
    researchQuestion: '量表问卷是否存在清晰、稳定、符合大五理论的三大正交潜变量特质？',
    variableNames: ['E1 外向社交', 'E2 热情活跃', 'E3 语言表达', 'C1 尽责自律', 'C2 条理条规', 'C3 目标导向', 'N1 焦虑倾向', 'N2 情绪敏感'],
    variableDescriptions: {
      'E1 外向社交': '在群体聚会中乐于结识新朋友的频率度量',
      'E2 热情活跃': '日常生活与合作中展现充沛精力的程度',
      'E3 语言表达': '在团队讨论中主动陈述观点的倾向',
      'C1 尽责自律': '遵守既定日程计划与抵御即时诱惑的能力',
      'C2 条理条规': '办公环境与数字文档分类归档的秩序感',
      'C3 目标导向': '长周期项目坚定推进与里程碑对齐的执行力',
      'N1 焦虑倾向': '面对未预期变动时生理及心智紧绷水平',
      'N2 情绪敏感': '对他人微表情及批评意见的内心反应剧烈程度',
    },
    defaultMethod: 'PAF',
    defaultNumFactors: 3,
    defaultRotation: 'varimax',
    suggestedFactorNames: ['外向特质因子 (Extraversion)', '尽责特质因子 (Conscientiousness)', '情绪失衡因子 (Neuroticism)'],
    rawData: case1Data,
    academicNotes: '在心理测量学中，EFA是检验结构效度（Construct Validity）与缩减题项数量的金标准。利用公共方差提取纯粹特质，剥离测量误差。',
  },
  {
    id: 'consumer_branding',
    name: '消费者满意度与品牌感知度',
    domain: '商业与市场营销',
    badge: '案例 2 · 正交旋转 (Varimax)',
    mappingMethod: '正交旋转 (Varimax)（明确潜在因子正交解释）',
    description: '分析消费者对数码旗舰产品的多项主观评测，通过方差最大化正交旋转将混杂的感知体验解耦为互不重叠的核心战略支柱。',
    researchQuestion: '消费者在评估品牌时，核心驱动维度之间是否可以构建正交且互不干涉的认知心智模型？',
    variableNames: ['Q1 核心性能', 'Q2 耐用可靠', 'S1 响应时效', 'S2 售后专业', 'B1 品牌口碑', 'B2 身份认同', 'V1 总体满意'],
    variableDescriptions: {
      'Q1 核心性能': '芯片算力、屏幕显示与日常使用流畅度评分',
      'Q2 耐用可靠': '硬件抗摔耐久与系统稳定性预期得分',
      'S1 响应时效': '在线客服或技术支持接通与解决问题的速度',
      'S2 售后专业': '维修服务中心技术透明度与工程师态度',
      'B1 品牌口碑': '社交网络及亲友圈对该品牌的正面赞誉推荐度',
      'B2 身份认同': '使用该品牌产品对自身品味与圈层契合的认同度',
      'V1 总体满意': '购买体验全生命周期综合愉悦度（1-10分）',
    },
    defaultMethod: 'PC',
    defaultNumFactors: 3,
    defaultRotation: 'varimax',
    suggestedFactorNames: ['产品硬实力因子', '客户服务体验因子', '品牌心智认同因子'],
    rawData: case2Data,
    academicNotes: '营销场景追求管理决策的明确切割（可落地的部门KPI对应），正交旋转强制因子相关性为零，使得研发、客服与市场三方职责清晰。',
  },
  {
    id: 'financial_risk',
    name: '金融市场系统性风险评估',
    domain: '金融工程与宏观经济',
    badge: '案例 3 · 斜交旋转 (Promax)',
    mappingMethod: '斜交旋转 (Promax)（隐因素间存在高度相关性）',
    description: '监测跨资产类别（固收、货币、衍生品、股市）的关键风险溢价指标。现实金融市场中宏观周期与信用风险天然交织，强制正交会扭曲经济学真理。',
    researchQuestion: '当风险因子之间存在不可忽视的协同传染性时，如何使用斜交旋转真实刻画因子协方差？',
    variableNames: ['M1 基准利率利差', 'M2 同业存单利率', 'M3 汇率波动率', 'C1 高收益债利差', 'C2 违约概率CDS', 'C3 波动率指数VIX'],
    variableDescriptions: {
      'M1 基准利率利差': '10Y与1Y国债期限利差（宏观货币政策松紧代理）',
      'M2 同业存单利率': '银行间短期资金拆借紧缺度溢价（bp）',
      'M3 汇率波动率': '离岸汇率平价期权隐含波动率百分比',
      'C1 高收益债利差': '评级AA-及以下民营企业债券相对于国债的信用溢价',
      'C2 违约概率CDS': '大型企业标的信用违约互换基准报价基点',
      'C3 波动率指数VIX': '股票期权市场投资者恐慌指数点位',
    },
    defaultMethod: 'PAF',
    defaultNumFactors: 2,
    defaultRotation: 'promax',
    suggestedFactorNames: ['宏观货币流动性因子', '市场信用与恐慌因子'],
    rawData: case3Data,
    academicNotes: '资本市场存在强烈的跨市场传染机制，因子相关矩阵Phi具有真实的经济学内涵。Promax斜交旋转既保留了简单结构，又输出了客观的因子间相关系数。',
  },
  {
    id: 'industrial_sensors',
    name: '工业设备故障多源传感器诊断',
    domain: '智能制造与预测性维护',
    badge: '案例 4 · 最大似然提取 (ML)',
    mappingMethod: '最大似然提取 (ML)（高斯分布假设与模型拟合度检验）',
    description: '采集重型燃气轮机动力总成各测点连续声学、振动与热工传感器流，基于多元正态性假设检验提取因子数对总体方差的拟合优度检验。',
    researchQuestion: '如何通过最大似然提取与显著性卡方检验确定物理退化因子的最小充分维数？',
    variableNames: ['V1 驱动轴振动', 'V2 齿轮箱冲击', 'A1 超声能量', 'T1 绕组线圈温度', 'T2 轴瓦油温', 'P1 冷却背压'],
    variableDescriptions: {
      'V1 驱动轴振动': '主驱动轴径向振动位移有效值 RMS (mm/s)',
      'V2 齿轮箱冲击': '高速齿轮副啮合频段瞬态加速度峰值峰度',
      'A1 超声能量': '高频应力波声发射能量积分 (dB)',
      'T1 绕组线圈温度': '发电机定子三相绕组热电偶采集温度 (℃)',
      'T2 轴瓦油温': '滑动轴承强制润滑回油管道测温 (℃)',
      'P1 冷却背压': '空冷热交换回路差压变送器压力读数 (kPa)',
    },
    defaultMethod: 'ML',
    defaultNumFactors: 2,
    defaultRotation: 'varimax',
    suggestedFactorNames: ['机械动平衡与冲击因子', '热工流体载荷因子'],
    rawData: case4Data,
    academicNotes: '最大似然法（ML）允许进行严格的似然比卡方检验，评估所选因子个数是否足以解释样本协方差，非常契合工程安全严苛场景。',
  },
  {
    id: 'regional_economy',
    name: '区域经济发展综合指标评价',
    domain: '区域经济与宏观统计',
    badge: '案例 5 · 主轴因子法 (PAF)',
    mappingMethod: '主轴因子法 (PAF)（剥离特殊方差求解公共因子）',
    description: '对全国重点城市的产值、财力、科技投入及新兴产业占比进行多指标降维。各城市存在独特的区位特殊政策与统计口径偏差，必须剥离独特方差。',
    researchQuestion: '主轴因子法如何通过迭代估计共同度，将城市特质噪音与公共发展动能精确剥离？',
    variableNames: ['E1 人均GDP', 'E2 工业增加值', 'E3 地方财政收入', 'I1 研发经费强度', 'I2 高企密度', 'I3 战略新兴产值比'],
    variableDescriptions: {
      'E1 人均GDP': '按常住人口折算的地区生产总值（万元/人）',
      'E2 工业增加值': '规模以上重点工业制造增加值总额（亿元）',
      'E3 地方财政收入': '一般公共预算收入扣除中央转移支付部分（亿元）',
      'I1 研发经费强度': 'R&D内部经费支出占全社会GDP比重 (%)',
      'I2 高企密度': '每万人口拥有的国家级高新技术企业户数',
      'I3 战略新兴产值比': '新能源、集成电路等战略新兴产业占工业总产值比例 (%)',
    },
    defaultMethod: 'PAF',
    defaultNumFactors: 2,
    defaultRotation: 'varimax',
    suggestedFactorNames: ['传统经济体量实力因子', '科技创新与产业动能因子'],
    rawData: case5Data,
    academicNotes: 'PCA会误将城市政策特例的非系统性噪声混入主成分中；PAF仅分解公共方差矩阵，得到的评价得分更加公允、抗噪声能力强。',
  },
  {
    id: 'gene_expression',
    name: '基因表达谱数据特征降维',
    domain: '生物信息与基因组学',
    badge: '案例 6 · 高维小样本因子建模',
    mappingMethod: '高维小样本因子建模（稀疏因子载荷结构）',
    description: '肿瘤微环境活检穿刺样本的代表性基因表达谱。样本量有限但基因共调控网络紧密，需要识别驱动肿瘤恶性增殖与炎性浸润的主控生物通路。',
    researchQuestion: '在小样本且观测变量高共线性的生物医学数据中，因子模型如何呈现高特异性与稀疏调控网络？',
    variableNames: ['G1 MKI67', 'G2 PCNA', 'G3 CDK1', 'G4 IL6', 'G5 TNF-a', 'G6 CXCL8', 'G7 NF-kB'],
    variableDescriptions: {
      'G1 MKI67': '经典肿瘤细胞核增殖标志物 mRNA 归一化 log2 表达量',
      'G2 PCNA': 'DNA聚合酶辅助蛋白，直接反映S期DNA复制活跃度',
      'G3 CDK1': '细胞周期关键蛋白激酶，调控G2/M期转换的关键驱动子',
      'G4 IL6': '强效促炎细胞因子，介导肿瘤促生长微环境与免疫抑制',
      'G5 TNF-a': '肿瘤坏死因子，调控巨噬细胞趋化与组织水肿',
      'G6 CXCL8': '促血管生成与中性粒细胞浸润的趋化因子',
      'G7 NF-kB': '促炎转录总控调控基因信号通路丰度',
    },
    defaultMethod: 'PAF',
    defaultNumFactors: 2,
    defaultRotation: 'promax',
    suggestedFactorNames: ['肿瘤细胞分裂周期通路因子', '肿瘤炎性免疫微环境因子'],
    rawData: case6Data,
    academicNotes: '生物信号通路通常呈现高度模块化（Modularity），因子载荷矩阵在此类数据中表现出优异的稀疏性（Sparse Loadings），直击核心生物机理。',
  },
];
