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

  // Responsive sizing
  useEffect(() => {
    if (propWidth && propHeight) return;
    const update = () => {
      const sidebar = 320;
      const w = window.innerWidth - sidebar;
      const h = window.innerHeight;
      setDimensions({ width: Math.max(400, w), height: Math.max(400, h) });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [propWidth, propHeight]);

  const { width, height } = dimensions;

  // Run cluster detection on data
  const processedData = useMemo(() => {
    // Deep copy to avoid mutating props
    const nodes: NodeDatum[] = data.nodes.map(n => ({ ...n }));
    const links: LinkDatum[] = data.links.map(l => ({ ...l }));

    // Sort by percentage descending and assign ranks
    nodes.sort((a, b) => b.percentage - a.percentage);
    nodes.forEach((n, i) => { n.rank = i + 1; });

    // Detect clusters from link graph
    detectClusters(nodes, links);

    return { nodes, links };
  }, [data]);

  // Filtered list for sidebar
  const filteredWallets = useMemo(() => {
    if (!searchTerm) return processedData.nodes;
    const term = searchTerm.toLowerCase();
    return processedData.nodes.filter(w =>
      w.name.toLowerCase().includes(term) || w.id.toLowerCase().includes(term)
    );
  }, [processedData.nodes, searchTerm]);

  // Radius scale
  const radiusScale = useMemo(() => {
    const maxAmt = d3.max(processedData.nodes, d => d.amount) || 1;
    return d3.scaleSqrt().domain([0, maxAmt]).range([3, 50]);
  }, [processedData.nodes]);

  // Click on sidebar → highlight + zoom
  const handleSidebarClick = useCallback((node: NodeDatum) => {
    setSelectedWallet(node);
    setHighlightedId(node.id);

    if (svgRef.current && node.x != null && node.y != null) {
      const svg = d3.select(svgRef.current);
      const zoom = (svg.node() as any).__zoom_behavior;
      if (zoom) {
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(2)
          .translate(-(node.x || 0), -(node.y || 0));
        svg.transition().duration(750).call(zoom.transform, transform);
      }
    }

    setTimeout(() => setHighlightedId(null), 3000);
  }, [width, height]);

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current || !processedData.nodes.length) return;

    const { nodes, links } = processedData;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs
    const defs = svg.append('defs');

    // Arrow markers — one default and one highlighted
    const makeArrow = (id: string, fill: string) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-3L8,0L0,3')
        .attr('fill', fill);
    };
    makeArrow('arrow', 'rgba(255,255,255,0.2)');
    makeArrow('arrow-hl', '#fff');

    // Glow
    const glow = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const m = glow.append('feMerge');
    m.append('feMergeNode').attr('in', 'blur');
    m.append('feMergeNode').attr('in', 'SourceGraphic');

    // Pulse glow for sidebar highlight
    const pulse = defs.append('filter').attr('id', 'pulse').attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    pulse.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
    const m2 = pulse.append('feMerge');
    m2.append('feMergeNode').attr('in', 'blur');
    m2.append('feMergeNode').attr('in', 'SourceGraphic');

    // Main group
    const g = svg.append('g');

    // Zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoomBehavior);
    (svg.node() as any).__zoom_behavior = zoomBehavior;

    // Initial transform
    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.6));

    // Assign radii
    nodes.forEach(n => { n._radius = radiusScale(n.amount); });

    // Cluster centers
    const clusterMap: Record<number, NodeDatum[]> = {};
    nodes.forEach(n => {
      const c = n._cluster ?? 0;
      if (!clusterMap[c]) clusterMap[c] = [];
      clusterMap[c].push(n);
    });
    const clusterKeys = Object.keys(clusterMap).map(Number);
    const clusterCenters: Record<number, { x: number; y: number }> = {};
    const cAngle = (2 * Math.PI) / Math.max(1, clusterKeys.length);
    // Layout clusters in a spiral pattern for more organic spread
    const totalClusters = clusterKeys.length;
    clusterKeys.forEach((key, i) => {
      // Spiral layout: bigger clusters closer to center, smaller ones radiate out
      const clusterSize = clusterMap[key]?.length || 1;
      const spiralAngle = i * 2.4; // golden angle-ish
      const baseRadius = Math.min(width, height) * 0.2;
      const spiralRadius = baseRadius + (i / totalClusters) * baseRadius * 1.5;
      clusterCenters[key] = {
        x: Math.cos(spiralAngle) * spiralRadius,
        y: Math.sin(spiralAngle) * spiralRadius,
      };
    });

    // Custom cluster force
    function clusterForce(alpha: number) {
      nodes.forEach(d => {
        const c = d._cluster ?? 0;
        const center = clusterCenters[c];
        if (!center) return;
        const k = alpha * 0.35;
        d.vx = (d.vx || 0) + (center.x - (d.x || 0)) * k;
        d.vy = (d.vy || 0) + (center.y - (d.y || 0)) * k;
      });
    }

    // For each link, determine primary direction from atob/btoa
    // We'll draw two lines if bidirectional, or one if unidirectional
    // Build expanded link data for directed rendering
    interface DirectedLink {
      sourceNode: string;
      targetNode: string;
      amount: number;
      linkRef: LinkDatum;
    }
    const directedLinks: DirectedLink[] = [];
    links.forEach(l => {
      const sId = typeof l.source === 'object' ? (l.source as NodeDatum).id : l.source as string;
      const tId = typeof l.target === 'object' ? (l.target as NodeDatum).id : l.target as string;
      const atob = (l as any).atob || 0;
      const btoa = (l as any).btoa || 0;

      if (atob > 0) {
        directedLinks.push({ sourceNode: sId, targetNode: tId, amount: atob, linkRef: l });
      }
      if (btoa > 0) {
        directedLinks.push({ sourceNode: tId, targetNode: sId, amount: btoa, linkRef: l });
      }
      // If neither, still show an undirected line
      if (atob === 0 && btoa === 0) {
        directedLinks.push({ sourceNode: sId, targetNode: tId, amount: l.value || 0, linkRef: l });
      }
    });

    // Links — use the original links for d3 force, but render directed arrows
    const linkGroup = g.append('g').attr('class', 'links');

    // We render from the original links (for force), then overlay arrows per direction
    const linkLines = linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .attr('stroke-width', 0.7)
      .attr('marker-end', (l: any) => {
        // Show arrow based on primary direction
        const atob = l.atob || 0;
        const btoa_val = l.btoa || 0;
        if (atob > 0 || btoa_val > 0) return 'url(#arrow)';
        return '';
      });

    // Node groups
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup.selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-g')
      .style('cursor', 'pointer');

    // Outer ring
    nodeElements.append('circle')
      .attr('class', 'ring')
      .attr('r', d => (d._radius || 5) + 1.5)
      .attr('fill', 'none')
      .attr('stroke', d => {
        const c = d3.color(d._clusterColor || d.color);
        return c ? c.brighter(0.4).toString() : d.color;
      })
      .attr('stroke-width', d => Math.max(1, (d._radius || 5) * 0.07))
      .attr('opacity', 0.6);

    // Main circle
    nodeElements.append('circle')
      .attr('class', 'main-circle')
      .attr('r', d => d._radius || 5)
      .attr('fill', d => {
        const c = d3.color(d._clusterColor || d.color);
        return c ? c.darker(0.3).toString() : d.color;
      })
      .attr('stroke', d => d._clusterColor || d.color)
      .attr('stroke-width', d => Math.max(1.5, (d._radius || 5) * 0.09))
      .attr('opacity', 0.85);

    // Inner glow
    nodeElements.append('circle')
      .attr('r', d => (d._radius || 5) * 0.55)
      .attr('fill', d => d._clusterColor || d.color)
      .attr('opacity', 0.1);

    // Percentage labels on larger nodes
    nodeElements.filter(d => (d._radius || 0) > 16)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', d => `${Math.max(7, (d._radius || 10) * 0.28)}px`)
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text(d => `${(d.percentage * 100).toFixed(1)}%`);

    // Type badge for exchanges/contracts
    nodeElements.filter(d => (d._radius || 0) > 8 && (d.isExchange || !!d.isContract))
      .append('circle')
      .attr('cx', d => (d._radius || 5) * 0.65)
      .attr('cy', d => -(d._radius || 5) * 0.65)
      .attr('r', d => Math.max(2.5, (d._radius || 5) * 0.15))
      .attr('fill', d => d.isExchange ? '#f97316' : '#10b981')
      .attr('stroke', '#0a0a18')
      .attr('stroke-width', 1);

    // Hover events
    nodeElements
      .on('mouseenter', function (event: MouseEvent, d: NodeDatum) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setHoveredNode(d);
          setHoverPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        }

        // Highlight connected links only, don't dim other nodes
        linkLines
          .attr('stroke', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return (sId === d.id || tId === d.id) ? '#fff' : 'rgba(255,255,255,0.12)';
          })
          .attr('stroke-width', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return (sId === d.id || tId === d.id) ? 1.8 : 0.7;
          })
          .attr('marker-end', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return (sId === d.id || tId === d.id) ? 'url(#arrow-hl)' : 'url(#arrow)';
          });

        // Only glow the hovered node
        d3.select(this).select('.main-circle').attr('filter', 'url(#glow)').attr('opacity', 1);
        d3.select(this).select('.ring').attr('opacity', 1).attr('stroke-width', 3);
      })
      .on('mousemove', function (event: MouseEvent) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) setHoverPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      })
      .on('mouseleave', function () {
        setHoveredNode(null);
        linkLines
          .attr('stroke', 'rgba(255,255,255,0.12)')
          .attr('stroke-width', 0.7)
          .attr('marker-end', (l: any) => {
            const atob = l.atob || 0;
            const btoa_val = l.btoa || 0;
            return (atob > 0 || btoa_val > 0) ? 'url(#arrow)' : '';
          });
        nodeElements.select('.main-circle').attr('opacity', 0.85).attr('filter', null);
        nodeElements.select('.ring')
          .attr('opacity', 0.6)
          .attr('stroke-width', (d: any) => Math.max(1, (d._radius || 5) * 0.07));
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

    // Simulation
    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links)
        .id(d => d.id)
        .distance(d => {
          const s = d.source as NodeDatum;
          const t = d.target as NodeDatum;
          return ((s._radius || 5) + (t._radius || 5)) * 1.1 + 6;
        })
        .strength(d => {
          const s = d.source as NodeDatum;
          const t = d.target as NodeDatum;
          return s._cluster === t._cluster ? 1.0 : 0.05;
        })
      )
      .force('charge', d3.forceManyBody<NodeDatum>().strength(d => -(d._radius || 5) * 3))
      .force('collide', d3.forceCollide<NodeDatum>()
        .radius(d => (d._radius || 5) + 2)
        .strength(1)
        .iterations(4)
      )
      .force('cluster', clusterForce)
      .force('center', d3.forceCenter(0, 0).strength(0.02))
      .alpha(1)
      .alphaDecay(0.015)
      .velocityDecay(0.35)
      .on('tick', () => {
        linkLines
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return d.target.x;
            const r = d.target._radius || 5;
            return d.target.x - (dx / dist) * (r + 4);
          })
          .attr('y2', (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return d.target.y;
            const r = d.target._radius || 5;
            return d.target.y - (dy / dist) * (r + 4);
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
    svg.selectAll('.node-g').select('.ring')
      .attr('stroke-width', (d: any) => d.id === highlightedId ? 4 : Math.max(1, (d._radius || 5) * 0.07))
      .attr('opacity', (d: any) => d.id === highlightedId ? 1 : 0.6);
    svg.selectAll('.node-g').select('.main-circle')
      .attr('filter', (d: any) => d.id === highlightedId ? 'url(#pulse)' : null)
      .attr('opacity', (d: any) => d.id === highlightedId ? 1 : 0.85);

    return () => {
      svg.selectAll('.node-g').select('.ring')
        .attr('stroke-width', (d: any) => Math.max(1, (d._radius || 5) * 0.07))
        .attr('opacity', 0.6);
      svg.selectAll('.node-g').select('.main-circle').attr('filter', null).attr('opacity', 0.85);
    };
  }, [highlightedId]);

  // Get connected links for selected wallet
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
      {/* Chart area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Selected wallet detail — top left */}
        {selectedWallet && (
          <div style={{
            position: 'absolute', top: 16, left: 16, width: 290,
            background: 'rgba(20, 20, 45, 0.95)', border: `1px solid ${selectedWallet._clusterColor || selectedWallet.color}`,
            borderRadius: 10, zIndex: 20, backdropFilter: 'blur(10px)',
            boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${(selectedWallet._clusterColor || selectedWallet.color)}22`,
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
          <span><span style={{ color: '#f59e0b' }}>●</span> Exchanges</span>
          <span><span style={{ color: '#10b981' }}>●</span> Contracts</span>
        </div>

        <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ background: 'transparent' }} />

        {/* Hover tooltip — address only */}
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
