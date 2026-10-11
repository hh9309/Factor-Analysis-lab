import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Matrix, RotationType } from '../utils/matrixMath';
import { GitCommit, SlidersHorizontal, Eye, HelpCircle, RotateCcw, Sparkles, Filter, Layers } from 'lucide-react';

interface FactorPathDiagramProps {
  loadings: Matrix;
  variableNames: string[];
  factorNames: string[];
  factorCorrelation?: Matrix;
  communalities?: number[];
  uniquenesses?: number[];
  rotationType: RotationType;
  varianceExplained?: number[];
}

interface PathLinkData {
  sourceId: string;
  targetId: string;
  factorIndex: number;
  varIndex: number;
  loading: number;
  absLoading: number;
  isDominant: boolean;
}

export const FactorPathDiagram: React.FC<FactorPathDiagramProps> = ({
  loadings,
  variableNames,
  factorNames,
  factorCorrelation,
  communalities,
  uniquenesses,
  rotationType,
  varianceExplained,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Interactive controls
  const [cutoff, setCutoff] = useState<number>(0.35); // standard SEM cutoff
  const [dominantOnly, setDominantOnly] = useState<boolean>(false);
  const [showErrors, setShowErrors] = useState<boolean>(true);
  const [showCovariances, setShowCovariances] = useState<boolean>(true);
  const [hoveredEntity, setHoveredEntity] = useState<{
    type: 'factor' | 'variable' | 'link' | 'cov';
    title: string;
    description: string;
    value?: number;
  } | null>(null);

  const m = loadings[0]?.length || 1;
  const p = variableNames.length;

  // Safe communalities and uniquenesses fallback
  const computedH2 = useMemo(() => {
    if (communalities && communalities.length === p) return communalities;
    return variableNames.map((_, i) => {
      const sumSq = loadings[i]?.reduce((acc, v) => acc + v * v, 0) || 0;
      return Number(Math.min(1, sumSq).toFixed(3));
    });
  }, [communalities, loadings, variableNames, p]);

  const computedPsi = useMemo(() => {
    if (uniquenesses && uniquenesses.length === p) return uniquenesses;
    return computedH2.map(h => Number(Math.max(0, 1 - h).toFixed(3)));
  }, [uniquenesses, computedH2]);

  // Identify dominant factor for each variable
  const dominantFactors = useMemo(() => {
    return variableNames.map((_, i) => {
      let maxAbs = -1;
      let dom = 0;
      loadings[i]?.forEach((val, f) => {
        if (Math.abs(val) > maxAbs) {
          maxAbs = Math.abs(val);
          dom = f;
        }
      });
      return dom;
    });
  }, [loadings, variableNames]);

  // Generate links data
  const allLinks = useMemo<PathLinkData[]>(() => {
    const list: PathLinkData[] = [];
    variableNames.forEach((_, i) => {
      loadings[i]?.forEach((val, f) => {
        const isDom = dominantFactors[i] === f;
        list.push({
          sourceId: `factor-${f}`,
          targetId: `var-${i}`,
          factorIndex: f,
          varIndex: i,
          loading: val,
          absLoading: Math.abs(val),
          isDominant: isDom,
        });
      });
    });
    return list;
  }, [variableNames, loadings, dominantFactors]);

  // Filter links based on user controls
  const visibleLinks = useMemo(() => {
    return allLinks.filter(l => {
      if (dominantOnly) {
        return l.isDominant && l.absLoading >= cutoff;
      }
      return l.absLoading >= cutoff;
    });
  }, [allLinks, dominantOnly, cutoff]);

  // D3 Path Diagram Rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Canvas geometry
    const width = 820;
    const height = Math.max(460, p * 48 + 80);

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', '100%');

    // Defs for markers & gradients
    const defs = svg.append('defs');

    // Arrow markers for positive links
    defs
      .append('marker')
      .attr('id', 'arrow-pos')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#0d9488'); // teal

    // Arrow markers for negative links
    defs
      .append('marker')
      .attr('id', 'arrow-neg')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#e11d48'); // rose

    // Arrow markers for error terms
    defs
      .append('marker')
      .attr('id', 'arrow-err')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 6)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L6,0L0,3')
      .attr('fill', '#94a3b8');

    // Filter drop shadow for nodes
    const filter = defs.append('filter').attr('id', 'drop-shadow').attr('height', '130%');
    filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 2).attr('result', 'blur');
    filter.append('feOffset').attr('in', 'blur').attr('dx', 0).attr('dy', 2).attr('result', 'offsetBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'offsetBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const mainG = svg.append('g').attr('class', 'main-group');

    // Positions for factors (left column) and observed variables (right column)
    const factorX = 170;
    const factorSpacing = height / (m + 1);
    const factorNodes = Array.from({ length: m }).map((_, f) => ({
      id: `factor-${f}`,
      index: f,
      name: factorNames[f] || `Factor ${f + 1}`,
      x: factorX,
      y: (f + 1) * factorSpacing,
      rx: 75,
      ry: 26,
    }));

    const varX = 540;
    const varSpacing = (height - 60) / p;
    const varNodes = variableNames.map((name, i) => ({
      id: `var-${i}`,
      index: i,
      name,
      x: varX,
      y: 40 + i * varSpacing + varSpacing / 2,
      width: 145,
      height: 32,
    }));

    // Map for fast coordinate lookup
    const factorMap = new Map(factorNodes.map(f => [f.id, f]));
    const varMap = new Map(varNodes.map(v => [v.id, v]));

    // 1. Draw Covariance Arcs between Factors (Promax oblique rotation)
    if (showCovariances && rotationType === 'promax' && factorCorrelation && m > 1) {
      const covG = mainG.append('g').attr('class', 'covariances');

      for (let j = 0; j < m - 1; j++) {
        for (let k = j + 1; k < m; k++) {
          const phi = factorCorrelation[j]?.[k] ?? 0;
          if (Math.abs(phi) >= 0.1) {
            const f1 = factorNodes[j];
            const f2 = factorNodes[k];
            const arcRadius = Math.abs(f2.y - f1.y) * 0.75;
            const startX = f1.x - f1.rx;
            const startY = f1.y;
            const endX = f2.x - f2.rx;
            const endY = f2.y;

            // Arc path curving left
            const pathData = `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 0 0 ${endX} ${endY}`;

            covG
              .append('path')
              .attr('d', pathData)
              .attr('fill', 'none')
              .attr('stroke', '#6366f1') // indigo
              .attr('stroke-width', Math.max(1.2, Math.abs(phi) * 3))
              .attr('stroke-dasharray', '4 3')
              .attr('cursor', 'pointer')
              .on('mouseenter', () => {
                setHoveredEntity({
                  type: 'cov',
                  title: `因子协方差 (Covariance Φ)`,
                  description: `${f1.name} ⟷ ${f2.name} 潜在相关系数: φ = ${phi.toFixed(3)}`,
                  value: phi,
                });
              })
              .on('mouseleave', () => setHoveredEntity(null));

            // Label on the arc
            const midX = startX - Math.min(65, arcRadius * 0.45);
            const midY = (startY + endY) / 2;

            covG
              .append('rect')
              .attr('x', midX - 22)
              .attr('y', midY - 9)
              .attr('width', 44)
              .attr('height', 18)
              .attr('rx', 4)
              .attr('fill', '#ffffff')
              .attr('stroke', '#cbd5e1')
              .attr('stroke-width', 0.8);

            covG
              .append('text')
              .attr('x', midX)
              .attr('y', midY + 3.5)
              .attr('text-anchor', 'middle')
              .attr('font-size', '10px')
              .attr('font-family', 'ui-monospace, monospace')
              .attr('font-weight', 'bold')
              .attr('fill', '#4f46e5')
              .text(`φ=${phi.toFixed(2)}`);
          }
        }
      }
    }

    // 2. Draw Loading Paths (Directed Cubic Curves)
    const linksG = mainG.append('g').attr('class', 'path-links');

    visibleLinks.forEach(link => {
      const fNode = factorMap.get(link.sourceId);
      const vNode = varMap.get(link.targetId);
      if (!fNode || !vNode) return;

      const x0 = fNode.x + fNode.rx;
      const y0 = fNode.y;
      const x1 = vNode.x;
      const y1 = vNode.y;

      // Cubic Bezier curve
      const dx = x1 - x0;
      const cx0 = x0 + dx * 0.45;
      const cx1 = x1 - dx * 0.45;
      const pathD = `M ${x0} ${y0} C ${cx0} ${y0}, ${cx1} ${y1}, ${x1} ${y1}`;

      const isPositive = link.loading >= 0;
      const strokeColor = isPositive ? '#0d9488' : '#e11d48'; // teal or rose
      const markerEnd = isPositive ? 'url(#arrow-pos)' : 'url(#arrow-neg)';
      const strokeWidth = Math.max(1.2, Math.min(6.5, link.absLoading * 6));

      // Path line
      const path = linksG
        .append('path')
        .attr('class', `link-edge ${link.sourceId} ${link.targetId}`)
        .attr('d', pathD)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-opacity', link.isDominant ? 0.88 : 0.45)
        .attr('marker-end', markerEnd)
        .attr('cursor', 'pointer');

      // Interaction
      path
        .on('mouseenter', () => {
          path.attr('stroke-width', strokeWidth + 2).attr('stroke-opacity', 1);
          setHoveredEntity({
            type: 'link',
            title: `因子载荷路径 (Factor Loading λ)`,
            description: `${fNode.name} ➔ ${vNode.name}: λ = ${link.loading >= 0 ? '+' : ''}${link.loading.toFixed(
              3
            )} (解释方差 λ² = ${(link.loading * link.loading * 100).toFixed(1)}%)`,
            value: link.loading,
          });
        })
        .on('mouseleave', () => {
          path.attr('stroke-width', strokeWidth).attr('stroke-opacity', link.isDominant ? 0.88 : 0.45);
          setHoveredEntity(null);
        });

      // Loading value tag on path
      // Midpoint along the curve
      const midX = (x0 + x1) / 2 + (link.isDominant ? 0 : (link.factorIndex - m / 2) * 12);
      const midY = (y0 + y1) / 2;

      const tagG = linksG.append('g').attr('transform', `translate(${midX}, ${midY})`).attr('cursor', 'pointer');

      tagG
        .append('rect')
        .attr('x', -18)
        .attr('y', -8)
        .attr('width', 36)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#ffffff')
        .attr('stroke', isPositive ? '#5eead4' : '#fda4af')
        .attr('stroke-width', 0.8)
        .attr('fill-opacity', 0.95);

      tagG
        .append('text')
        .attr('x', 0)
        .attr('y', 3.5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9.5px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', link.absLoading >= 0.5 ? 'bold' : 'normal')
        .attr('fill', strokeColor)
        .text(`${link.loading >= 0 ? '+' : ''}${link.loading.toFixed(2)}`);

      tagG
        .on('mouseenter', () => {
          setHoveredEntity({
            type: 'link',
            title: `因子载荷路径 (Factor Loading λ)`,
            description: `${fNode.name} ➔ ${vNode.name}: 载荷系数值为 ${link.loading.toFixed(3)}`,
            value: link.loading,
          });
        })
        .on('mouseleave', () => setHoveredEntity(null));
    });

    // 3. Draw Error / Uniqueness Terms (ψ_i) on the far right
    if (showErrors) {
      const errG = mainG.append('g').attr('class', 'error-terms');

      varNodes.forEach(vNode => {
        const uVal = computedPsi[vNode.index] ?? 0.2;
        const errX = vNode.x + vNode.width + 38;
        const errY = vNode.y;

        // Arrow into variable
        errG
          .append('line')
          .attr('x1', errX - 14)
          .attr('y1', errY)
          .attr('x2', vNode.x + vNode.width)
          .attr('y2', errY)
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 1.2)
          .attr('marker-end', 'url(#arrow-err)');

        // Circle for uniqueness epsilon
        const circle = errG
          .append('circle')
          .attr('cx', errX)
          .attr('cy', errY)
          .attr('r', 13)
          .attr('fill', '#f8fafc')
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 1.2)
          .attr('cursor', 'pointer');

        errG
          .append('text')
          .attr('cx', errX)
          .attr('y', errY + 3.5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-family', 'ui-monospace, monospace')
          .attr('font-weight', 'semibold')
          .attr('fill', '#64748b')
          .attr('pointer-events', 'none')
          .text(`ψ=${uVal.toFixed(2)}`);

        circle
          .on('mouseenter', () => {
            setHoveredEntity({
              type: 'variable',
              title: `观测变量特殊方差 (Uniqueness ψ)`,
              description: `${vNode.name} 的独特误差方差 ψ = ${uVal.toFixed(3)} (公共度 h² = ${computedH2[
                vNode.index
              ].toFixed(3)})`,
              value: uVal,
            });
          })
          .on('mouseleave', () => setHoveredEntity(null));
      });
    }

    // 4. Draw Observed Variable Nodes (Rectangles)
    const varsG = mainG.append('g').attr('class', 'variable-nodes');

    varNodes.forEach(vNode => {
      const g = varsG
        .append('g')
        .attr('transform', `translate(${vNode.x}, ${vNode.y - vNode.height / 2})`)
        .attr('cursor', 'pointer');

      // Card rectangle
      g.append('rect')
        .attr('width', vNode.width)
        .attr('height', vNode.height)
        .attr('rx', 6)
        .attr('fill', '#ffffff')
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1.2)
        .attr('filter', 'url(#drop-shadow)')
        .attr('class', 'var-card');

      // Left indicator bar
      const domFactor = dominantFactors[vNode.index];
      const domColor = d3.schemeTableau10[domFactor % 10] || '#4f46e5';

      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 4.5)
        .attr('height', vNode.height)
        .attr('rx', 3)
        .attr('fill', domColor);

      // Label text
      g.append('text')
        .attr('x', 10)
        .attr('y', vNode.height / 2 + 3.5)
        .attr('font-size', '11px')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-weight', '500')
        .attr('fill', '#1e293b')
        .text(vNode.name.length > 9 ? vNode.name.slice(0, 9) + '…' : vNode.name);

      // Communality badge
      const h2 = computedH2[vNode.index];
      g.append('text')
        .attr('x', vNode.width - 8)
        .attr('y', vNode.height / 2 + 3.5)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#0d9488')
        .text(`h²=${h2.toFixed(2)}`);

      // Hover interaction: highlight links connected to this variable
      g.on('mouseenter', () => {
        d3.selectAll('.link-edge').attr('stroke-opacity', 0.15);
        d3.selectAll(`.link-edge.${vNode.id}`).attr('stroke-opacity', 1).attr('stroke-width', 4.5);

        setHoveredEntity({
          type: 'variable',
          title: `观测变量：${vNode.name}`,
          description: `主导属于【${factorNames[domFactor] || `Factor ${domFactor + 1}`}】；公共方差 h² = ${h2.toFixed(
            3
          )}，特殊方差 ψ = ${computedPsi[vNode.index].toFixed(3)}`,
          value: h2,
        });
      }).on('mouseleave', () => {
        d3.selectAll('.link-edge').each(function () {
          const el = d3.select(this);
          const isDom = el.classed(`factor-${domFactor}`);
          el.attr('stroke-opacity', isDom ? 0.88 : 0.45).attr('stroke-width', function () {
            return d3.select(this).attr('stroke-width');
          });
        });
        setHoveredEntity(null);
      });
    });

    // 5. Draw Latent Factor Nodes (Ellipses / Large Rounded Badges)
    const factorsG = mainG.append('g').attr('class', 'factor-nodes');

    factorNodes.forEach(fNode => {
      const g = factorsG
        .append('g')
        .attr('transform', `translate(${fNode.x}, ${fNode.y})`)
        .attr('cursor', 'pointer');

      const factorColor = d3.schemeTableau10[fNode.index % 10] || '#4f46e5';
      const pct = varianceExplained ? varianceExplained[fNode.index] : undefined;

      // Outer ellipse
      g.append('ellipse')
        .attr('rx', fNode.rx)
        .attr('ry', fNode.ry)
        .attr('fill', '#ffffff')
        .attr('stroke', factorColor)
        .attr('stroke-width', 2.2)
        .attr('filter', 'url(#drop-shadow)')
        .attr('class', 'factor-ellipse');

      // Inner subtle tinted background
      g.append('ellipse')
        .attr('rx', fNode.rx - 2)
        .attr('ry', fNode.ry - 2)
        .attr('fill', factorColor)
        .attr('fill-opacity', 0.08);

      // Factor Name
      g.append('text')
        .attr('x', 0)
        .attr('y', pct !== undefined ? -3 : 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('font-weight', 'bold')
        .attr('fill', '#0f172a')
        .text(fNode.name.length > 10 ? fNode.name.slice(0, 10) + '…' : fNode.name);

      // Variance badge
      if (pct !== undefined) {
        g.append('text')
          .attr('x', 0)
          .attr('y', 13)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9.5px')
          .attr('font-family', 'ui-monospace, monospace')
          .attr('font-weight', 'semibold')
          .attr('fill', factorColor)
          .text(`方差贡献: ${pct.toFixed(1)}%`);
      }

      // Hover interaction: highlight links connected to this factor
      g.on('mouseenter', () => {
        d3.selectAll('.link-edge').attr('stroke-opacity', 0.15);
        d3.selectAll(`.link-edge.${fNode.id}`).attr('stroke-opacity', 1).attr('stroke-width', 4.5);

        setHoveredEntity({
          type: 'factor',
          title: `潜变量 (公共因子)：${fNode.name}`,
          description: `Factor ${fNode.index + 1} · ${
            pct !== undefined ? `解释总体方差贡献 ${pct.toFixed(2)}%` : ''
          }。支配与其相连的观测变量。`,
        });
      }).on('mouseleave', () => {
        d3.selectAll('.link-edge').each(function () {
          const el = d3.select(this);
          el.attr('stroke-opacity', 0.88);
        });
        setHoveredEntity(null);
      });
    });
  }, [
    loadings,
    variableNames,
    factorNames,
    factorCorrelation,
    computedH2,
    computedPsi,
    rotationType,
    visibleLinks,
    showErrors,
    showCovariances,
    dominantFactors,
    m,
    p,
    varianceExplained,
  ]);

  // Reset zoom & filter
  const handleReset = () => {
    setCutoff(0.35);
    setDominantOnly(false);
    setShowErrors(true);
    setShowCovariances(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* Header and description */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-1.5">
              <GitCommit className="w-4 h-4 text-teal-600" />
              <span>D3 因子路径图 (Factor Path Diagram / SEM 结构图)</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-teal-50 text-teal-700 border border-teal-200/60">
              D3.js 驱动 · 贝塞尔曲线载荷
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            可视化结构方程模型 (SEM) 经典路径拓扑：左侧椭圆为<strong>潜变量 (Latent Factors)</strong>，右侧矩形为<strong>观测变量 (Indicators)</strong>，线条粗细与颜色表达载荷强度。
          </p>
        </div>

        {/* Toolbar action buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Dominant path toggle */}
          <button
            onClick={() => setDominantOnly(!dominantOnly)}
            className={`px-3 py-1.5 rounded-lg border transition font-medium flex items-center space-x-1.5 ${
              dominantOnly
                ? 'bg-teal-50 text-teal-700 border-teal-200 font-semibold shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="仅保留每个观测变量载荷最大的主导因子路径，过滤交叉污染"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{dominantOnly ? '仅主导路径 (开启)' : '全载荷网络 (全开)'}</span>
          </button>

          {/* Show error terms toggle */}
          <button
            onClick={() => setShowErrors(!showErrors)}
            className={`px-3 py-1.5 rounded-lg border transition font-medium ${
              showErrors
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="显示每个观测变量的特殊方差误差项 (ψ)"
          >
            误差项 (ψ)
          </button>

          {/* Show factor covariance toggle (Promax) */}
          {rotationType === 'promax' && (
            <button
              onClick={() => setShowCovariances(!showCovariances)}
              className={`px-3 py-1.5 rounded-lg border transition font-medium ${
                showCovariances
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="显示斜交旋转下因子之间的协方差双向弧 (φ)"
            >
              因子协方差弧 (Φ)
            </button>
          )}

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
            title="复位默认视图与标准门槛"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Path loading cutoff slider and visual legends bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
        {/* Loading threshold slider */}
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>路径载荷门槛 (|λ| ≥ {cutoff.toFixed(2)})：</span>
          </span>
          <input
            type="range"
            min="0.10"
            max="0.65"
            step="0.05"
            value={cutoff}
            onChange={e => setCutoff(parseFloat(e.target.value))}
            className="w-36 accent-teal-600 cursor-pointer"
          />
          <span className="font-mono text-teal-700 font-bold">
            当前显示 {visibleLinks.length} / {allLinks.length} 条路径
          </span>
        </div>

        {/* Path Legends */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-teal-600"></span>
            <span>正向载荷 (λ &gt; 0)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-rose-600"></span>
            <span>负向载荷 (λ &lt; 0)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white"></span>
            <span>误差项 (ψ)</span>
          </div>
          {rotationType === 'promax' && (
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-indigo-600"></span>
              <span>因子协方差 (φ)</span>
            </div>
          )}
        </div>
      </div>

      {/* D3 SVG Canvas Container */}
      <div className="w-full overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/40 p-2 flex justify-center">
        <svg ref={svgRef} className="w-full max-w-[840px] select-none" />
      </div>

      {/* Interactive Hover Deep Dive Inspector Card */}
      {hoveredEntity ? (
        <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              {hoveredEntity.type === 'link' ? 'λ' : hoveredEntity.type === 'cov' ? 'φ' : 'Ψ'}
            </div>
            <div>
              <div className="font-semibold text-slate-100">{hoveredEntity.title}</div>
              <div className="text-slate-300 text-[11px] mt-0.5">{hoveredEntity.description}</div>
            </div>
          </div>

          {hoveredEntity.value !== undefined && (
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold shrink-0 ${
                Math.abs(hoveredEntity.value) >= 0.5
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              值 = {hoveredEntity.value >= 0 ? '+' : ''}
              {hoveredEntity.value.toFixed(3)}
            </span>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500 flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>
            交互提示：鼠标悬停在左侧<strong>潜变量椭圆</strong>或右侧<strong>观测变量矩形</strong>上可单独高亮其关联路径；悬停在<strong>连线或标签</strong>上可实时探测载荷系数与方差贡献。
          </span>
        </div>
      )}
    </div>
  );
};
