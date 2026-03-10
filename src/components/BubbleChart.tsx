import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { BubbleChartData, BubbleNode, BubbleLink } from './types';
import { CLUSTER_COLORS } from './sampleData';

interface BubbleChartProps {
  data: BubbleChartData;
  width?: number;
  height?: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  node: BubbleNode | null;
}

const TYPE_ICONS: Record<string, string> = {
  cex: '◈',
  dex: '⬡',
  contract: '▣',
  wallet: '●',
};

const TYPE_LABELS: Record<string, string> = {
  cex: 'CEX',
  dex: 'DEX',
  contract: 'Contract',
  wallet: 'Wallet',
};

function formatNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

function formatUSD(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

const BubbleChart: React.FC<BubbleChartProps> = ({ data, width = 900, height = 700 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<BubbleNode, BubbleLink> | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, node: null });
  const [selectedNode, setSelectedNode] = useState<BubbleNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['wallet', 'contract', 'cex', 'dex']));
  const [hoveredListItem, setHoveredListItem] = useState<string | null>(null);

  // Build nodes
  const { nodes, links } = useMemo(() => {
    const minRadius = 3;
    const maxRadius = 55;
    const maxPerc = Math.max(...data.holders.map(h => h.percentage));

    const builtNodes: BubbleNode[] = data.holders.map(h => {
      const pctNorm = h.percentage / maxPerc;
      const radius = minRadius + Math.sqrt(pctNorm) * (maxRadius - minRadius);
      const clusterColor = CLUSTER_COLORS[h.clusterId % CLUSTER_COLORS.length];
      const lighterColor = d3.color(clusterColor)?.brighter(0.3)?.toString() || clusterColor;

      return {
        id: h.address,
        address: h.address,
        label: h.label,
        percentage: h.percentage,
        balance: h.balance,
        balanceUSD: h.balanceUSD,
        type: h.type,
        icon: h.icon,
        clusterId: h.clusterId,
        radius,
        color: clusterColor,
        borderColor: lighterColor,
      };
    });

    const nodeSet = new Set(builtNodes.map(n => n.id));
    const builtLinks: BubbleLink[] = data.transfers
      .filter(t => nodeSet.has(t.source) && nodeSet.has(t.target))
      .map(t => ({
        source: t.source,
        target: t.target,
        weight: t.weight || 1,
      }));

    return { nodes: builtNodes, links: builtLinks };
  }, [data]);

  // Filtered nodes for sidebar
  const filteredHolders = useMemo(() => {
    return nodes
      .filter(n => activeFilters.has(n.type))
      .filter(n => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          n.address.toLowerCase().includes(term) ||
          (n.label && n.label.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [nodes, searchTerm, activeFilters]);

  const toggleFilter = useCallback((type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs for glow filter
    const defs = svg.append('defs');

    const glowFilter = defs.append('filter').attr('id', 'glow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Selected glow
    const selectedGlow = defs.append('filter').attr('id', 'selectedGlow');
    selectedGlow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge2 = selectedGlow.append('feMerge');
    feMerge2.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge2.append('feMergeNode').attr('in', 'SourceGraphic');

    // Zoom container
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial zoom to center
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.75);
    svg.call(zoom.transform, initialTransform);

    // Links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkElements = linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.15)')
      .attr('stroke-width', (d: any) => Math.max(0.5, (d.weight || 1) * 0.5));

    // Node groups
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    // Outer ring (border)
    nodeElements.append('circle')
      .attr('class', 'node-border')
      .attr('r', (d: BubbleNode) => d.radius + 1.5)
      .attr('fill', 'none')
      .attr('stroke', (d: BubbleNode) => d.borderColor)
      .attr('stroke-width', (d: BubbleNode) => Math.max(1, d.radius * 0.06))
      .attr('opacity', 0.7);

    // Inner circle
    nodeElements.append('circle')
      .attr('class', 'node-circle')
      .attr('r', (d: BubbleNode) => d.radius)
      .attr('fill', (d: BubbleNode) => {
        const baseColor = d3.color(d.color);
        if (!baseColor) return d.color;
        return baseColor.darker(0.4).toString();
      })
      .attr('stroke', (d: BubbleNode) => d.color)
      .attr('stroke-width', (d: BubbleNode) => Math.max(1.5, d.radius * 0.08))
      .attr('opacity', 0.9);

    // Inner shine (gradient effect)
    nodeElements.append('circle')
      .attr('class', 'node-shine')
      .attr('r', (d: BubbleNode) => d.radius * 0.7)
      .attr('fill', (d: BubbleNode) => d.color)
      .attr('opacity', 0.15);

    // Labels for large nodes
    nodeElements.filter((d: BubbleNode) => d.radius > 18 && d.label != null)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', '#fff')
      .attr('font-size', (d: BubbleNode) => `${Math.max(7, d.radius * 0.28)}px`)
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text((d: BubbleNode) => {
        const maxLen = Math.floor(d.radius / 4);
        const label = d.label || '';
        return label.length > maxLen ? label.substring(0, maxLen) + '...' : label;
      });

    // Percentage labels for large nodes
    nodeElements.filter((d: BubbleNode) => d.radius > 14)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: BubbleNode) => d.label && d.radius > 18 ? '1em' : '0.35em')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', (d: BubbleNode) => `${Math.max(7, d.radius * 0.24)}px`)
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text((d: BubbleNode) => `${d.percentage.toFixed(2)}%`);

    // Type indicator dot for medium+ nodes
    nodeElements.filter((d: BubbleNode) => d.radius > 10 && d.type !== 'wallet')
      .append('circle')
      .attr('cx', (d: BubbleNode) => d.radius * 0.6)
      .attr('cy', (d: BubbleNode) => -d.radius * 0.6)
      .attr('r', (d: BubbleNode) => Math.max(3, d.radius * 0.15))
      .attr('fill', (d: BubbleNode) => {
        switch (d.type) {
          case 'cex': return '#f97316';
          case 'dex': return '#22c55e';
          case 'contract': return '#64748b';
          default: return '#fff';
        }
      })
      .attr('stroke', '#1a1a2e')
      .attr('stroke-width', 1);

    // Hover and click events
    nodeElements
      .on('mouseenter', function (event: MouseEvent, d: BubbleNode) {
        d3.select(this).select('.node-circle').attr('filter', 'url(#glow)');
        d3.select(this).select('.node-border').attr('opacity', 1).attr('stroke-width', 2.5);

        // Highlight connected links
        linkElements
          .attr('stroke', (l: any) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            if (sourceId === d.id || targetId === d.id) return d.color;
            return 'rgba(255, 255, 255, 0.08)';
          })
          .attr('stroke-width', (l: any) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            if (sourceId === d.id || targetId === d.id) return 2;
            return Math.max(0.3, ((l.weight || 1) * 0.5));
          });

        // Dim non-connected nodes
        nodeElements.select('.node-circle')
          .attr('opacity', (n: any) => {
            if (n.id === d.id) return 1;
            const isConnected = links.some((l: any) => {
              const sId = typeof l.source === 'object' ? (l.source as BubbleNode).id : l.source;
              const tId = typeof l.target === 'object' ? (l.target as BubbleNode).id : l.target;
              return (sId === d.id && tId === n.id) || (tId === d.id && sId === n.id);
            });
            return isConnected ? 0.9 : 0.25;
          });

        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            visible: true,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            node: d,
          });
        }
      })
      .on('mousemove', function (event: MouseEvent) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip(prev => ({
            ...prev,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          }));
        }
      })
      .on('mouseleave', function () {
        d3.select(this).select('.node-circle').attr('filter', null);
        d3.select(this).select('.node-border').attr('opacity', 0.7).attr('stroke-width', function (d: any) {
          return Math.max(1, d.radius * 0.06);
        });
        linkElements
          .attr('stroke', 'rgba(255, 255, 255, 0.15)')
          .attr('stroke-width', (d: any) => Math.max(0.5, (d.weight || 1) * 0.5));
        nodeElements.select('.node-circle').attr('opacity', 0.9);
        setTooltip({ visible: false, x: 0, y: 0, node: null });
      })
      .on('click', function (_: MouseEvent, d: BubbleNode) {
        setSelectedNode(prev => prev?.id === d.id ? null : d);
      });

    // Drag behavior
    const drag = d3.drag<SVGGElement, BubbleNode>()
      .on('start', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeElements.call(drag as any);

    // Cluster center positions
    const clusterIds = Array.from(new Set(nodes.map(n => n.clusterId)));
    const clusterCenters: Record<number, { x: number; y: number }> = {};
    const angleStep = (2 * Math.PI) / clusterIds.length;
    const clusterRadius = Math.min(width, height) * 0.3;
    clusterIds.forEach((id, i) => {
      clusterCenters[id] = {
        x: Math.cos(i * angleStep - Math.PI / 2) * clusterRadius,
        y: Math.sin(i * angleStep - Math.PI / 2) * clusterRadius,
      };
    });

    // Force simulation
    const simulation = d3.forceSimulation<BubbleNode>(nodes)
      .force('link', d3.forceLink<BubbleNode, BubbleLink>(links)
        .id(d => d.id)
        .distance(d => {
          const src = d.source as BubbleNode;
          const tgt = d.target as BubbleNode;
          return (src.radius + tgt.radius) * 1.3 + 15;
        })
        .strength(d => {
          const src = d.source as BubbleNode;
          const tgt = d.target as BubbleNode;
          return src.clusterId === tgt.clusterId ? 0.8 : 0.1;
        })
      )
      .force('charge', d3.forceManyBody<BubbleNode>()
        .strength(d => -d.radius * 3)
      )
      .force('collide', d3.forceCollide<BubbleNode>()
        .radius(d => d.radius + 3)
        .strength(0.9)
        .iterations(3)
      )
      .force('cluster', (alpha: number) => {
        nodes.forEach(d => {
          const center = clusterCenters[d.clusterId];
          if (center) {
            const k = alpha * 0.3;
            d.vx = (d.vx || 0) + (center.x - (d.x || 0)) * k;
            d.vy = (d.vy || 0) + (center.y - (d.y || 0)) * k;
          }
        });
      })
      .force('center', d3.forceCenter(0, 0).strength(0.05))
      .alpha(1)
      .alphaDecay(0.015)
      .velocityDecay(0.35)
      .on('tick', () => {
        linkElements
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        nodeElements.attr('transform', (d: BubbleNode) => `translate(${d.x},${d.y})`);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height]);

  // Highlight from sidebar hover
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    if (hoveredListItem) {
      svg.selectAll('.node-group').select('.node-circle')
        .attr('opacity', (d: any) => d.id === hoveredListItem ? 1 : 0.2);
      svg.selectAll('.node-group').select('.node-border')
        .attr('opacity', (d: any) => d.id === hoveredListItem ? 1 : 0.15)
        .attr('stroke-width', (d: any) => d.id === hoveredListItem ? 3 : Math.max(1, d.radius * 0.06));
      svg.selectAll('.node-group').filter((d: any) => d.id === hoveredListItem)
        .select('.node-circle').attr('filter', 'url(#selectedGlow)');
    } else {
      svg.selectAll('.node-group').select('.node-circle')
        .attr('opacity', 0.9)
        .attr('filter', null);
      svg.selectAll('.node-group').select('.node-border')
        .attr('opacity', 0.7)
        .attr('stroke-width', (d: any) => Math.max(1, d.radius * 0.06));
    }
  }, [hoveredListItem]);

  return (
    <div ref={containerRef} style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      background: '#0d0d1a',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#fff',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Main chart area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Token info badge */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(30, 30, 60, 0.9)',
          borderRadius: 12,
          padding: '12px 18px',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{data.tokenImage || '🪙'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {data.tokenSymbol} <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{data.tokenName}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                Top {data.holders.length} Holders + {data.totalHolders - data.holders.length}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          gap: 16,
          fontSize: 11,
          color: 'rgba(255,255,255,0.6)',
          zIndex: 10,
        }}>
          <span>● Wallets</span>
          <span style={{ color: '#f97316' }}>◈ CEX</span>
          <span style={{ color: '#22c55e' }}>⬡ DEX</span>
          <span style={{ color: '#64748b' }}>▣ Contracts</span>
        </div>

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          style={{ background: 'transparent' }}
        />

        {/* Tooltip */}
        {tooltip.visible && tooltip.node && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 15, width - 260),
            top: Math.min(tooltip.y - 10, height - 160),
            background: 'rgba(20, 20, 45, 0.95)',
            border: `1px solid ${tooltip.node.color}`,
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 100,
            minWidth: 220,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 15px ${tooltip.node.color}33`,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: tooltip.node.color }}>
              {tooltip.node.label || tooltip.node.address}
            </div>
            {tooltip.node.label && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 6, fontFamily: 'monospace' }}>
                {tooltip.node.address}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Supply:</span>
              <span style={{ fontWeight: 600 }}>{tooltip.node.percentage.toFixed(2)}%</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Balance:</span>
              <span>{formatNumber(tooltip.node.balance)}</span>
              {tooltip.node.balanceUSD && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Value:</span>
                  <span style={{ color: '#22c55e' }}>{formatUSD(tooltip.node.balanceUSD)}</span>
                </>
              )}
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Type:</span>
              <span>
                <span style={{
                  background: tooltip.node.color + '33',
                  color: tooltip.node.color,
                  padding: '1px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                }}>{TYPE_LABELS[tooltip.node.type]}</span>
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Cluster:</span>
              <span>
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: tooltip.node.color,
                  marginRight: 6,
                }} />
                #{tooltip.node.clusterId}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{
        width: 320,
        background: 'rgba(15, 15, 35, 0.95)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Address List</h2>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px' }}>
          <input
            type="text"
            placeholder="Search wallets..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filters */}
        <div style={{
          padding: '0 16px 12px',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}>
          {(['wallet', 'cex', 'dex', 'contract'] as const).map(type => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: `1px solid ${activeFilters.has(type) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                background: activeFilters.has(type) ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeFilters.has(type) ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {TYPE_ICONS[type]} {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 8px',
        }}>
          {filteredHolders.map((node, i) => (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredListItem(node.id)}
              onMouseLeave={() => setHoveredListItem(null)}
              onClick={() => setSelectedNode(prev => prev?.id === node.id ? null : node)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: selectedNode?.id === node.id
                  ? 'rgba(255,255,255,0.08)'
                  : hoveredListItem === node.id
                  ? 'rgba(255,255,255,0.04)'
                  : 'transparent',
                borderLeft: `3px solid ${node.color}`,
                marginBottom: 2,
              }}
            >
              <span style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: 11,
                width: 28,
                flexShrink: 0,
                fontWeight: 500,
              }}>
                #{i + 1}
              </span>

              <span style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: node.color + '33',
                border: `1.5px solid ${node.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                marginRight: 10,
                flexShrink: 0,
              }}>
                {TYPE_ICONS[node.type]}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: node.label ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: node.label ? '#fff' : 'rgba(255,255,255,0.7)',
                }}>
                  {node.label || node.address}
                </div>
              </div>

              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: node.color,
                marginLeft: 8,
                flexShrink: 0,
              }}>
                {node.percentage.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>

        {/* Selected node detail panel */}
        {selectedNode && (
          <div style={{
            padding: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(20, 20, 45, 0.95)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: selectedNode.color }}>
                {selectedNode.label || 'Unknown Wallet'}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontFamily: 'inherit',
                }}>✕</button>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, wordBreak: 'break-all' }}>
              {selectedNode.address}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Supply</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedNode.percentage.toFixed(2)}%</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Value</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
                  {selectedNode.balanceUSD ? formatUSD(selectedNode.balanceUSD) : 'N/A'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Balance</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatNumber(selectedNode.balance)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Type</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  <span style={{
                    background: selectedNode.color + '33',
                    color: selectedNode.color,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>{TYPE_LABELS[selectedNode.type]}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BubbleChart;
