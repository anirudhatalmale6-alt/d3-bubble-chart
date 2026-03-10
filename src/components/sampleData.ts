import { ChartData } from './types';

// Cluster color palette
export const CLUSTER_COLORS: Record<string, string> = {
  'cluster_binance': '#a78bfa',
  'cluster_korean': '#f97316',
  'cluster_okx': '#22c55e',
  'cluster_defi': '#ec4899',
  'cluster_smartmoney': '#eab308',
  'cluster_dead': '#06b6d4',
  'cluster_robinhood': '#ef4444',
  'cluster_crypto_com': '#8b5cf6',
  'cluster_mm': '#14b8a6',
  'cluster_whale': '#f59e0b',
  'cluster_gate': '#6366f1',
  'cluster_kucoin': '#84cc16',
};

// Default color for nodes without a cluster
export const DEFAULT_NODE_COLOR = '#4a5568';

function makeNodes() {
  const nodes = [
    // Cluster: Binance
    { id: '0x977e3587acec', name: '0x977e...acec', amount: 56000000000000, percentage: 0.1334, color: '#a78bfa', isExchange: true, isContract: false, cluster: 'cluster_binance', clusterPercentage: 0.26 },
    { id: '0x73ad1293d935', name: '0x73ad...d935', amount: 25700000000000, percentage: 0.0613, color: '#a78bfa', isExchange: true, isContract: false, cluster: 'cluster_binance', clusterPercentage: 0.26 },
    { id: '0x5a52e96efcb', name: '0x5a52...efcb', amount: 16900000000000, percentage: 0.0402, color: '#a78bfa', isExchange: true, isContract: false, cluster: 'cluster_binance', clusterPercentage: 0.26 },
    { id: '0xf893a21eaa21', name: '0xf893...aa21', amount: 4700000000000, percentage: 0.0112, color: '#a78bfa', isExchange: true, isContract: false, cluster: 'cluster_binance', clusterPercentage: 0.26 },
    { id: '0x21a7bc44', name: '0x21a7...bc44', amount: 3730000000000, percentage: 0.0089, color: '#a78bfa', isExchange: true, isContract: false, cluster: 'cluster_binance', clusterPercentage: 0.26 },
    { id: '0xbb1fef22', name: '0xbb1f...ef22', amount: 1430000000000, percentage: 0.0034, color: '#a78bfa', isExchange: false, isContract: false, cluster: 'cluster_binance', clusterPercentage: 0.26 },
    { id: '0xcc201133', name: '0xcc20...1133', amount: 924000000000, percentage: 0.0022, color: '#a78bfa', isExchange: false, isContract: false, cluster: 'cluster_binance', clusterPercentage: 0.26 },

    // Cluster: Korean exchanges
    { id: '0x3f9a99b8', name: '0x3f9a...99b8', amount: 15400000000000, percentage: 0.0368, color: '#f97316', isExchange: true, isContract: false, cluster: 'cluster_korean', clusterPercentage: 0.11 },
    { id: '0xc93e13b4', name: '0xc93e...13b4', amount: 10300000000000, percentage: 0.0245, color: '#f97316', isExchange: true, isContract: false, cluster: 'cluster_korean', clusterPercentage: 0.11 },
    { id: '0xd4407a81', name: '0xd440...7a81', amount: 8980000000000, percentage: 0.0214, color: '#f97316', isExchange: true, isContract: false, cluster: 'cluster_korean', clusterPercentage: 0.11 },
    { id: '0xe5508b92', name: '0xe550...8b92', amount: 8690000000000, percentage: 0.0207, color: '#f97316', isExchange: true, isContract: false, cluster: 'cluster_korean', clusterPercentage: 0.11 },
    { id: '0xab3ccc55', name: '0xab3c...cc55', amount: 1720000000000, percentage: 0.0041, color: '#f97316', isExchange: false, isContract: false, cluster: 'cluster_korean', clusterPercentage: 0.11 },
    { id: '0xbc4ddd66', name: '0xbc4d...dd66', amount: 1180000000000, percentage: 0.0028, color: '#f97316', isExchange: false, isContract: false, cluster: 'cluster_korean', clusterPercentage: 0.11 },

    // Cluster: OKX
    { id: '0x61f0b09d', name: '0x61f0...b09d', amount: 14100000000000, percentage: 0.0337, color: '#22c55e', isExchange: true, isContract: false, cluster: 'cluster_okx', clusterPercentage: 0.09 },
    { id: '0x9b008d46', name: '0x9b00...8d46', amount: 11800000000000, percentage: 0.0282, color: '#22c55e', isExchange: true, isContract: false, cluster: 'cluster_okx', clusterPercentage: 0.09 },
    { id: '0x76ecfbd3', name: '0x76ec...fbd3', amount: 8560000000000, percentage: 0.0204, color: '#22c55e', isExchange: true, isContract: false, cluster: 'cluster_okx', clusterPercentage: 0.09 },
    { id: '0xaa1bbb11', name: '0xaa1b...bb11', amount: 2180000000000, percentage: 0.0052, color: '#22c55e', isExchange: false, isContract: false, cluster: 'cluster_okx', clusterPercentage: 0.09 },
    { id: '0xdd7eee88', name: '0xdd7e...ee88', amount: 1300000000000, percentage: 0.0031, color: '#22c55e', isExchange: false, isContract: false, cluster: 'cluster_okx', clusterPercentage: 0.09 },

    // Cluster: DeFi
    { id: '0xc671f271', name: '0xc671...f271', amount: 8810000000000, percentage: 0.021, color: '#ec4899', isExchange: false, isContract: true, cluster: 'cluster_defi', clusterPercentage: 0.05 },
    { id: '0xa1102233', name: '0xa110...2233', amount: 5160000000000, percentage: 0.0123, color: '#ec4899', isExchange: false, isContract: true, cluster: 'cluster_defi', clusterPercentage: 0.05 },
    { id: '0xb2203344', name: '0xb220...3344', amount: 3650000000000, percentage: 0.0087, color: '#ec4899', isExchange: false, isContract: true, cluster: 'cluster_defi', clusterPercentage: 0.05 },
    { id: '0xc3304455', name: '0xc330...4455', amount: 2350000000000, percentage: 0.0056, color: '#ec4899', isExchange: false, isContract: true, cluster: 'cluster_defi', clusterPercentage: 0.05 },
    { id: '0xd4405566', name: '0xd440...5566', amount: 1590000000000, percentage: 0.0038, color: '#ec4899', isExchange: false, isContract: false, cluster: 'cluster_defi', clusterPercentage: 0.05 },

    // Cluster: Smart money
    { id: '0xe5506677', name: '0xe550...6677', amount: 6080000000000, percentage: 0.0145, color: '#eab308', isExchange: false, isContract: false, cluster: 'cluster_smartmoney', clusterPercentage: 0.04 },
    { id: '0xf6607788', name: '0xf660...7788', amount: 4110000000000, percentage: 0.0098, color: '#eab308', isExchange: false, isContract: false, cluster: 'cluster_smartmoney', clusterPercentage: 0.04 },
    { id: '0x17708899', name: '0x1770...8899', amount: 2810000000000, percentage: 0.0067, color: '#eab308', isExchange: false, isContract: false, cluster: 'cluster_smartmoney', clusterPercentage: 0.04 },
    { id: '0x288099aa', name: '0x2880...99aa', amount: 1890000000000, percentage: 0.0045, color: '#eab308', isExchange: false, isContract: false, cluster: 'cluster_smartmoney', clusterPercentage: 0.04 },
    { id: '0x3990aabb', name: '0x3990...aabb', amount: 1380000000000, percentage: 0.0033, color: '#eab308', isExchange: false, isContract: false, cluster: 'cluster_smartmoney', clusterPercentage: 0.04 },
    { id: '0x4aa0bbcc', name: '0x4aa0...bbcc', amount: 881000000000, percentage: 0.0021, color: '#eab308', isExchange: false, isContract: false, cluster: 'cluster_smartmoney', clusterPercentage: 0.04 },

    // Cluster: Dead
    { id: '0x0000dead', name: '0x0000...dead', amount: 6880000000000, percentage: 0.0164, color: '#06b6d4', isExchange: false, isContract: true, cluster: 'cluster_dead', clusterPercentage: 0.02 },
    { id: '0x00000000', name: '0x0000...0000', amount: 1800000000000, percentage: 0.0043, color: '#06b6d4', isExchange: false, isContract: true, cluster: 'cluster_dead', clusterPercentage: 0.02 },

    // Cluster: Robinhood
    { id: '0x5bb0ccdd', name: '0x5bb0...ccdd', amount: 6460000000000, percentage: 0.0154, color: '#ef4444', isExchange: true, isContract: false, cluster: 'cluster_robinhood', clusterPercentage: 0.03 },
    { id: '0x6cc0ddee', name: '0x6cc0...ddee', amount: 3440000000000, percentage: 0.0082, color: '#ef4444', isExchange: false, isContract: false, cluster: 'cluster_robinhood', clusterPercentage: 0.03 },
    { id: '0x7dd0eeff', name: '0x7dd0...eeff', amount: 2310000000000, percentage: 0.0055, color: '#ef4444', isExchange: false, isContract: false, cluster: 'cluster_robinhood', clusterPercentage: 0.03 },
    { id: '0x8ee0ff11', name: '0x8ee0...ff11', amount: 1220000000000, percentage: 0.0029, color: '#ef4444', isExchange: false, isContract: false, cluster: 'cluster_robinhood', clusterPercentage: 0.03 },

    // Cluster: Crypto.com
    { id: '0x9ff01122', name: '0x9ff0...1122', amount: 6250000000000, percentage: 0.0149, color: '#8b5cf6', isExchange: true, isContract: false, cluster: 'cluster_crypto_com', clusterPercentage: 0.03 },
    { id: '0xa1102234', name: '0xa110...2234', amount: 3060000000000, percentage: 0.0073, color: '#8b5cf6', isExchange: false, isContract: false, cluster: 'cluster_crypto_com', clusterPercentage: 0.03 },
    { id: '0xb2203345', name: '0xb220...3345', amount: 2010000000000, percentage: 0.0048, color: '#8b5cf6', isExchange: false, isContract: false, cluster: 'cluster_crypto_com', clusterPercentage: 0.03 },
    { id: '0xc3304456', name: '0xc330...4456', amount: 1050000000000, percentage: 0.0025, color: '#8b5cf6', isExchange: false, isContract: false, cluster: 'cluster_crypto_com', clusterPercentage: 0.03 },

    // Cluster: Market makers
    { id: '0xd4405567', name: '0xd440...5567', amount: 5500000000000, percentage: 0.0131, color: '#14b8a6', isExchange: false, isContract: false, cluster: 'cluster_mm', clusterPercentage: 0.03 },
    { id: '0xe5506678', name: '0xe550...6678', amount: 3820000000000, percentage: 0.0091, color: '#14b8a6', isExchange: false, isContract: false, cluster: 'cluster_mm', clusterPercentage: 0.03 },
    { id: '0xf6607789', name: '0xf660...7789', amount: 1760000000000, percentage: 0.0042, color: '#14b8a6', isExchange: false, isContract: false, cluster: 'cluster_mm', clusterPercentage: 0.03 },
    { id: '0x1770889a', name: '0x1770...889a', amount: 797000000000, percentage: 0.0019, color: '#14b8a6', isExchange: false, isContract: false, cluster: 'cluster_mm', clusterPercentage: 0.03 },

    // Cluster: Whale wallets
    { id: '0x288099ab', name: '0x2880...99ab', amount: 4950000000000, percentage: 0.0118, color: '#f59e0b', isExchange: false, isContract: false, cluster: 'cluster_whale', clusterPercentage: 0.03 },
    { id: '0x3990aabc', name: '0x3990...aabc', amount: 3190000000000, percentage: 0.0076, color: '#f59e0b', isExchange: false, isContract: false, cluster: 'cluster_whale', clusterPercentage: 0.03 },
    { id: '0x4aa0bbcd', name: '0x4aa0...bbcd', amount: 2140000000000, percentage: 0.0051, color: '#f59e0b', isExchange: false, isContract: false, cluster: 'cluster_whale', clusterPercentage: 0.03 },
    { id: '0x5bb0ccde', name: '0x5bb0...ccde', amount: 1130000000000, percentage: 0.0027, color: '#f59e0b', isExchange: false, isContract: false, cluster: 'cluster_whale', clusterPercentage: 0.03 },
    { id: '0x6cc0ddef', name: '0x6cc0...ddef', amount: 630000000000, percentage: 0.0015, color: '#f59e0b', isExchange: false, isContract: false, cluster: 'cluster_whale', clusterPercentage: 0.03 },

    // Cluster: Gate
    { id: '0x7dd0ef01', name: '0x7dd0...ef01', amount: 3990000000000, percentage: 0.0095, color: '#6366f1', isExchange: true, isContract: false, cluster: 'cluster_gate', clusterPercentage: 0.02 },
    { id: '0x8ee0f012', name: '0x8ee0...f012', amount: 2430000000000, percentage: 0.0058, color: '#6366f1', isExchange: false, isContract: false, cluster: 'cluster_gate', clusterPercentage: 0.02 },
    { id: '0x9ff00123', name: '0x9ff0...0123', amount: 1510000000000, percentage: 0.0036, color: '#6366f1', isExchange: false, isContract: false, cluster: 'cluster_gate', clusterPercentage: 0.02 },
    { id: '0xa0001234', name: '0xa000...1234', amount: 755000000000, percentage: 0.0018, color: '#6366f1', isExchange: false, isContract: false, cluster: 'cluster_gate', clusterPercentage: 0.02 },

    // Cluster: KuCoin
    { id: '0xb1102345', name: '0xb110...2345', amount: 3690000000000, percentage: 0.0088, color: '#84cc16', isExchange: true, isContract: false, cluster: 'cluster_kucoin', clusterPercentage: 0.016 },
    { id: '0xc2203456', name: '0xc220...3456', amount: 1850000000000, percentage: 0.0044, color: '#84cc16', isExchange: false, isContract: false, cluster: 'cluster_kucoin', clusterPercentage: 0.016 },
    { id: '0xd3304567', name: '0xd330...4567', amount: 965000000000, percentage: 0.0023, color: '#84cc16', isExchange: false, isContract: false, cluster: 'cluster_kucoin', clusterPercentage: 0.016 },

    // Scattered small wallets
    ...Array.from({ length: 50 }, (_, i) => {
      const clusters = Object.keys(CLUSTER_COLORS);
      const cluster = clusters[i % clusters.length];
      return {
        id: `0xsm${i.toString(16).padStart(6, '0')}`,
        name: `0xsm${i.toString(16).padStart(2, '0')}...${(i * 7 + 100).toString(16).padStart(4, '0')}`,
        amount: Math.max(50000000, 800000000000 - i * 15000000000),
        percentage: Math.max(0.0001, 0.002 - i * 0.000035),
        color: CLUSTER_COLORS[cluster],
        isExchange: false,
        isContract: false,
        cluster,
        clusterPercentage: 0.01,
      };
    }),
  ];

  // Assign ranks
  nodes.sort((a, b) => b.percentage - a.percentage);
  return nodes.map((n, i) => ({ ...n, rank: i + 1 }));
}

function makeLinks(nodes: ReturnType<typeof makeNodes>) {
  const nodeIds = new Set(nodes.map(n => n.id));
  const links: { source: string; target: string; value: number }[] = [];

  // Group by cluster
  const clusters: Record<string, string[]> = {};
  nodes.forEach(n => {
    if (n.cluster) {
      if (!clusters[n.cluster]) clusters[n.cluster] = [];
      clusters[n.cluster].push(n.id);
    }
  });

  // Create intra-cluster links (chain-like + some cross connections)
  Object.values(clusters).forEach(ids => {
    for (let i = 0; i < ids.length - 1; i++) {
      links.push({ source: ids[i], target: ids[i + 1], value: Math.max(1, 5 - i) });
    }
    // Add a few extra cross-links within cluster for density
    if (ids.length > 3) {
      links.push({ source: ids[0], target: ids[2], value: 2 });
    }
    if (ids.length > 5) {
      links.push({ source: ids[1], target: ids[4], value: 1 });
    }
  });

  // Cross-cluster links (sparse)
  const clusterKeys = Object.keys(clusters);
  for (let i = 0; i < clusterKeys.length - 1; i += 2) {
    const a = clusters[clusterKeys[i]];
    const b = clusters[clusterKeys[i + 1]];
    if (a && b && a[0] && b[0]) {
      links.push({ source: a[0], target: b[0], value: 1 });
    }
  }

  return links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
}

const sampleNodes = makeNodes();
const sampleLinks = makeLinks(sampleNodes);

export const SAMPLE_DATA: ChartData = {
  nodes: sampleNodes,
  links: sampleLinks,
};
