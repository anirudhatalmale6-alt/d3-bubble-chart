import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { ChartData, NodeDatum, LinkDatum } from './types';
import { detectClusters } from './clusterDetection';

interface BubbleChartProps {
  data: ChartData;
  width?: number;
  height?: number;
}

function formatAddr(addr: string): string {
  if (addr.length <= 13) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

const BubbleChart: React.FC<BubbleChartProps> = ({ data, width: propWidth, height: propHeight }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null);

  const [selectedWallet, setSelectedWallet] = useState<NodeDatum | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeDatum | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: propWidth || 900, height: propHeight || 700 });

  useEffect(() => {
    if (propWidth && propHeight) return;
    const update = () => {
      const sidebar = 320;
      setDimensions({ width: Math.max(400, window.innerWidth - sidebar), height: Math.max(400, window.innerHeight) });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [propWidth, propHeight]);

  const { width, height } = dimensions;

  const processedData = useMemo(() => {
    const allNodes: NodeDatum[] = data.nodes.map(n => ({ ...n }));
    const links: LinkDatum[] = data.links.map(l => ({ ...l }));

    allNodes.sort((a, b) => b.percentage - a.percentage);
    allNodes.forEach((n, i) => { n.rank = i + 1; });
    detectClusters(allNodes, links);

    const chartNodes = allNodes.filter(n => !n.isExchange);
    const chartNodeIds = new Set(chartNodes.map(n => n.id));
    const chartLinks = links.filter(l => {
      const sId = typeof l.source === 'string' ? l.source : (l.source as NodeDatum).id;
      const tId = typeof l.target === 'string' ? l.target : (l.target as NodeDatum).id;
      return chartNodeIds.has(sId) && chartNodeIds.has(tId);
    });

    return { allNodes, chartNodes, chartLinks, links };
  }, [data]);

  const filteredWallets = useMemo(() => {
    if (!searchTerm) return processedData.allNodes;
    const term = searchTerm.toLowerCase();
    return processedData.allNodes.filter(w =>
      w.name.toLowerCase().includes(term) || w.id.toLowerCase().includes(term)
    );
  }, [processedData.allNodes, searchTerm]);

  const radiusScale = useMemo(() => {
    const maxAmt = d3.max(processedData.chartNodes, d => d.amount) || 1;
    return d3.scaleSqrt().domain([0, maxAmt]).range([3, 55]);
  }, [processedData.chartNodes]);

  const handleSidebarClick = useCallback((node: NodeDatum) => {
    setSelectedWallet(node);
    if (!node.isExchange && svgRef.current && node.x != null && node.y != null) {
      setHighlightedId(node.id);
      const svg = d3.select(svgRef.current);
      const zoom = (svg.node() as any).__zoom_behavior;
      if (zoom) {
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(2)
          .translate(-(node.x || 0), -(node.y || 0));
        svg.transition().duration(750).call(zoom.transform, transform);
      }
      setTimeout(() => setHighlightedId(null), 3000);
    }
  }, [width, height]);

  // ===== D3 Rendering =====
  useEffect(() => {
    if (!svgRef.current || !processedData.chartNodes.length) return;

    const { chartNodes: nodes, chartLinks: links } = processedData;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Arrow markers
    const makeArrow = (id: string, fill: string) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 8).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-3L8,0L0,3').attr('fill', fill);
    };
    makeArrow('arrow', 'rgba(255,255,255,0.25)');
    makeArrow('arrow-hl', '#fff');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const fm = glow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    // Pulse filter
    const pulse = defs.append('filter').attr('id', 'pulse')
      .attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    pulse.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
    const fm2 = pulse.append('feMerge');
    fm2.append('feMergeNode').attr('in', 'blur');
    fm2.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    // Zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoomBehavior);
    (svg.node() as any).__zoom_behavior = zoomBehavior;

    // Assign radii
    nodes.forEach(n => { n._radius = radiusScale(n.amount); });

    // === KEY CHANGE: Scatter initial positions across a large area ===
    // Group by cluster, position each cluster group in a different area
    const clusterMap: Record<number, NodeDatum[]> = {};
    nodes.forEach(n => {
      const c = n._cluster ?? 0;
      if (!clusterMap[c]) clusterMap[c] = [];
      clusterMap[c].push(n);
    });
    const clusterKeys = Object.keys(clusterMap).map(Number);
    const spread = Math.max(width, height) * 1.5;

    // Position clusters using golden angle spiral for even spread
    clusterKeys.forEach((key, i) => {
      const angle = i * 2.399963; // golden angle in radians
      const r = Math.sqrt(i + 0.5) * spread / Math.sqrt(clusterKeys.length) * 0.4;
      const cx = Math.cos(angle) * r;
      const cy = Math.sin(angle) * r;

      const members = clusterMap[key];
      members.forEach((n, j) => {
        // Pack nodes within cluster close together
        const innerAngle = j * 2.399963;
        const innerR = Math.sqrt(j + 0.5) * (n._radius || 5) * 2;
        n.x = cx + Math.cos(innerAngle) * innerR;
        n.y = cy + Math.sin(innerAngle) * innerR;
      });
    });

    // Initial zoom to fit
    svg.call(zoomBehavior.transform, d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.45));

    // Links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkLines = linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('stroke-width', 0.8)
      .attr('marker-end', 'url(#arrow)');

    // Node groups
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup.selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-g')
      .style('cursor', 'pointer');

    // Outer dashed ring (BubbleMaps style — small nodes get dashed ring)
    nodeElements.append('circle')
      .attr('class', 'ring')
      .attr('r', d => (d._radius || 5) + 2)
      .attr('fill', 'none')
      .attr('stroke', d => d._clusterColor || d.color)
      .attr('stroke-width', d => (d._radius || 5) > 12 ? 1.5 : 1)
      .attr('stroke-dasharray', d => (d._radius || 5) < 8 ? '2,2' : 'none')
      .attr('opacity', 0.5);

    // Main circle — darker fill with colored stroke
    nodeElements.append('circle')
      .attr('class', 'main-circle')
      .attr('r', d => d._radius || 5)
      .attr('fill', d => {
        const c = d3.color(d._clusterColor || d.color);
        return c ? c.darker(0.6).toString() : d.color;
      })
      .attr('stroke', d => d._clusterColor || d.color)
      .attr('stroke-width', d => Math.max(1.2, (d._radius || 5) * 0.08))
      .attr('opacity', 0.9);

    // Inner highlight spot
    nodeElements.filter(d => (d._radius || 0) > 6)
      .append('circle')
      .attr('r', d => (d._radius || 5) * 0.4)
      .attr('fill', d => d._clusterColor || d.color)
      .attr('opacity', 0.08);

    // Percentage labels on large nodes
    nodeElements.filter(d => (d._radius || 0) > 18)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', d => `${Math.max(8, (d._radius || 10) * 0.26)}px`)
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text(d => `${(d.percentage * 100).toFixed(1)}%`);

    // Contract badge
    nodeElements.filter(d => (d._radius || 0) > 8 && !!d.isContract)
      .append('circle')
      .attr('cx', d => (d._radius || 5) * 0.65)
      .attr('cy', d => -(d._radius || 5) * 0.65)
      .attr('r', d => Math.max(2.5, (d._radius || 5) * 0.14))
      .attr('fill', '#10b981')
      .attr('stroke', '#0a0a18')
      .attr('stroke-width', 1);

    // Hover — ONLY glow the hovered node
    nodeElements
      .on('mouseenter', function (event: MouseEvent, d: NodeDatum) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setHoveredNode(d);
          setHoverPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        }
        // Highlight connected links
        linkLines
          .attr('stroke', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return (sId === d.id || tId === d.id) ? '#fff' : 'rgba(255,255,255,0.2)';
          })
          .attr('stroke-width', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return (sId === d.id || tId === d.id) ? 2 : 0.8;
          });
        d3.select(this).select('.main-circle').attr('filter', 'url(#glow)');
        d3.select(this).select('.ring').attr('stroke-width', 2.5).attr('opacity', 1);
      })
      .on('mousemove', function (event: MouseEvent) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) setHoverPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      })
      .on('mouseleave', function () {
        setHoveredNode(null);
        linkLines.attr('stroke', 'rgba(255,255,255,0.2)').attr('stroke-width', 0.8);
        d3.select(this).select('.main-circle').attr('filter', null);
        const nd = d3.select(this).datum() as NodeDatum;
        d3.select(this).select('.ring')
          .attr('stroke-width', (nd._radius || 5) > 12 ? 1.5 : 1)
          .attr('opacity', 0.5);
      })
      .on('click', function (_: MouseEvent, d: NodeDatum) {
        setSelectedWallet(prev => prev?.id === d.id ? null : d);
      });

    // Drag
    const drag = d3.drag<SVGGElement, NodeDatum>()
      .on('start', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0);
        d.fx = null; d.fy = null;
      });
    nodeElements.call(drag);

    // === FORCE SIMULATION — Organic, BubbleMaps-style ===
    // Key: Strong links pull connected nodes together naturally.
    // No artificial cluster force. Clusters form organically from link topology.
    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links)
        .id(d => d.id)
        .distance(d => {
          const s = d.source as NodeDatum;
          const t = d.target as NodeDatum;
          return ((s._radius || 5) + (t._radius || 5)) * 1.8 + 20;
        })
        .strength(0.9)
      )
      .force('charge', d3.forceManyBody<NodeDatum>()
        .strength(d => {
          // Linked nodes get less repulsion, isolated nodes get more spread
          return -(d._radius || 5) * 1.5 - 5;
        })
        .distanceMax(300)
      )
      .force('collide', d3.forceCollide<NodeDatum>()
        .radius(d => (d._radius || 5) + 2)
        .strength(0.8)
        .iterations(3)
      )
      // Very weak center — just prevents infinite drift
      .force('center', d3.forceCenter(0, 0).strength(0.005))
      .alpha(0.8)
      .alphaDecay(0.02)
      .velocityDecay(0.4)
      .on('tick', () => {
        linkLines
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return d.target.x;
            return d.target.x - (dx / dist) * ((d.target._radius || 5) + 4);
          })
          .attr('y2', (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return d.target.y;
            return d.target.y - (dy / dist) * ((d.target._radius || 5) + 4);
          });
        nodeElements.attr('transform', (d: NodeDatum) => `translate(${d.x},${d.y})`);
      });

    simulationRef.current = simulation;
    return () => { simulation.stop(); };
  }, [processedData, width, height, radiusScale]);

  // Highlight from sidebar
  useEffect(() => {
    if (!svgRef.current || !highlightedId) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('.node-g').each(function () {
      const el = d3.select(this);
      const d = el.datum() as NodeDatum;
      if (d.id === highlightedId) {
        el.select('.main-circle').attr('filter', 'url(#pulse)');
        el.select('.ring').attr('stroke-width', 4).attr('opacity', 1);
      }
    });
    return () => {
      svg.selectAll('.node-g').each(function () {
        const el = d3.select(this);
        const d = el.datum() as NodeDatum;
        el.select('.main-circle').attr('filter', null);
        el.select('.ring')
          .attr('stroke-width', (d._radius || 5) > 12 ? 1.5 : 1)
          .attr('opacity', 0.5);
      });
    };
  }, [highlightedId]);

  const selectedLinks = useMemo(() => {
    if (!selectedWallet) return [];
    return processedData.links.filter((l: any) => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      return sId === selectedWallet.id || tId === selectedWallet.id;
    });
  }, [selectedWallet, processedData.links]);

  return (
    <div ref={containerRef} style={{
      display: 'flex', width: '100%', height: '100vh',
      background: '#0a0a18', fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#fff', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Detail card */}
        {selectedWallet && (
          <div style={{
            position: 'absolute', top: 16, left: 16, width: 290,
            background: 'rgba(20, 20, 45, 0.95)',
            border: `1px solid ${selectedWallet._clusterColor || selectedWallet.color}`,
            borderRadius: 10, zIndex: 20, backdropFilter: 'blur(10px)',
            boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
          }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: selectedWallet._clusterColor || selectedWallet.color }}>
                #{selectedWallet.rank}
                {selectedWallet.isExchange ? ' ⭐ Exchange' : selectedWallet.isContract ? ' 📄 Contract' : ' 👛 Wallet'}
              </span>
              <button onClick={() => setSelectedWallet(null)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
              }}>✕</button>
            </div>
            <div style={{ padding: '10px 16px' }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.6)',
                wordBreak: 'break-all', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ flex: 1 }}>{selectedWallet.id}</span>
                <button onClick={() => navigator.clipboard?.writeText(selectedWallet.id)} style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
                  cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontSize: 9, flexShrink: 0,
                }}>Copy</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Percentage</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{(selectedWallet.percentage * 100).toFixed(3)}%</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Amount</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{formatNumber(selectedWallet.amount)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Cluster</div>
                  <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: selectedWallet._clusterColor || selectedWallet.color }} />
                    {selectedWallet.clusterPercentage != null ? `${(selectedWallet.clusterPercentage * 100).toFixed(1)}%` : '—'}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Transfers</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedLinks.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16, display: 'flex',
          gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.6)', zIndex: 10,
        }}>
          <span><span style={{ color: '#8a5cf6' }}>●</span> Wallets</span>
          <span><span style={{ color: '#10b981' }}>●</span> Contracts</span>
        </div>

        <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ background: 'transparent' }} />

        {hoveredNode && (
          <div style={{
            position: 'absolute',
            left: Math.min(hoverPos.x + 14, width - 220),
            top: hoverPos.y - 36,
            background: 'rgba(15, 15, 35, 0.92)',
            border: `1px solid ${hoveredNode._clusterColor || hoveredNode.color}`,
            borderRadius: 6, padding: '5px 10px', fontSize: 12,
            pointerEvents: 'none', zIndex: 50, fontFamily: 'monospace',
            backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
          }}>
            {hoveredNode.name || formatAddr(hoveredNode.id)}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{
        width: 320, background: 'rgba(15, 15, 35, 0.95)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Wallets List</h2>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <input
            type="text" placeholder="Search Wallets"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)', color: '#fff',
              fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {filteredWallets.map((wallet) => (
            <div
              key={wallet.id}
              onClick={() => handleSidebarClick(wallet)}
              style={{
                display: 'flex', alignItems: 'center', padding: '7px 10px',
                borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                background: selectedWallet?.id === wallet.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderLeft: `3px solid ${wallet._clusterColor || wallet.color}`, marginBottom: 1,
                opacity: wallet.isExchange ? 0.6 : 1,
              }}
            >
              <span style={{
                color: 'rgba(255,255,255,0.35)', fontSize: 10, width: 28,
                flexShrink: 0, fontWeight: 500,
              }}>#{wallet.rank}</span>
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                background: (wallet._clusterColor || wallet.color) + '33',
                border: `1.5px solid ${wallet._clusterColor || wallet.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, marginRight: 8, flexShrink: 0,
              }}>
                {wallet.isExchange ? '⭐' : wallet.isContract ? '📄' : '●'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', color: 'rgba(255,255,255,0.75)',
                  fontFamily: 'monospace',
                }}>
                  {wallet.name}
                  {wallet.isExchange && <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 4 }}>(exchange)</span>}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: wallet._clusterColor || wallet.color,
                marginLeft: 6, flexShrink: 0,
              }}>
                {(wallet.percentage * 100).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BubbleChart;
