import { NodeDatum, LinkDatum } from './types';

// Cluster colors palette (15 distinct colors)
const CLUSTER_PALETTE = [
  '#a78bfa', // purple
  '#f97316', // orange
  '#22c55e', // green
  '#ec4899', // pink
  '#eab308', // yellow
  '#06b6d4', // cyan
  '#ef4444', // red
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#84cc16', // lime
  '#d946ef', // fuchsia
  '#0ea5e9', // sky
  '#f43f5e', // rose
];

/**
 * Union-Find data structure for connected components
 */
class UnionFind {
  parent: Map<string, string>;
  rankMap: Map<string, number>;

  constructor() {
    this.parent = new Map();
    this.rankMap = new Map();
  }

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rankMap.set(x, 0);
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rankMap.get(ra) || 0;
    const rankB = this.rankMap.get(rb) || 0;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rankMap.set(ra, rankA + 1);
    }
  }
}

/**
 * Detect clusters from the link graph using connected components.
 * Assigns _cluster (number) and _clusterColor to each node.
 * Returns the number of clusters found.
 */
export function detectClusters(nodes: NodeDatum[], links: LinkDatum[]): number {
  const uf = new UnionFind();

  // Initialize all nodes
  nodes.forEach(n => uf.find(n.id));

  // Union linked nodes
  links.forEach(l => {
    const sId = typeof l.source === 'object' ? (l.source as NodeDatum).id : l.source;
    const tId = typeof l.target === 'object' ? (l.target as NodeDatum).id : l.target;
    uf.union(sId, tId);
  });

  // Map roots to cluster IDs, sorted by total percentage (largest cluster first)
  const rootGroups: Map<string, NodeDatum[]> = new Map();
  nodes.forEach(n => {
    const root = uf.find(n.id);
    if (!rootGroups.has(root)) rootGroups.set(root, []);
    rootGroups.get(root)!.push(n);
  });

  // Sort clusters by total percentage descending
  const sortedClusters = Array.from(rootGroups.entries())
    .map(([root, members]) => ({
      root,
      members,
      totalPerc: members.reduce((s, n) => s + n.percentage, 0),
    }))
    .sort((a, b) => b.totalPerc - a.totalPerc);

  // Assign cluster IDs and colors
  sortedClusters.forEach((cluster, idx) => {
    const color = CLUSTER_PALETTE[idx % CLUSTER_PALETTE.length];
    cluster.members.forEach(n => {
      n._cluster = idx;
      n._clusterColor = color;
      // Override the flat color with cluster color
      n.color = color;
      n.cluster = `cluster_${idx}`;
      n.clusterPercentage = cluster.totalPerc;
    });
  });

  return sortedClusters.length;
}

export { CLUSTER_PALETTE };
