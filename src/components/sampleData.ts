import { BubbleChartData } from './types';

// Cluster color palette (matching BubbleMaps style)
const CLUSTER_COLORS = [
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

export const SAMPLE_DATA: BubbleChartData = {
  tokenName: 'Pepe',
  tokenSymbol: 'PEPE',
  tokenImage: '🐸',
  totalHolders: 250,
  holders: [
    // Cluster 0 - Major CEX (purple)
    { address: '0x977...acec', label: 'Binance 8', percentage: 13.34, balance: 5.6e13, balanceUSD: 420000000, type: 'cex', clusterId: 0 },
    { address: '0x73a...d935', label: 'Robinhood', percentage: 6.13, balance: 2.57e13, balanceUSD: 193000000, type: 'cex', clusterId: 0 },
    { address: '0x5a5...efcb', label: 'Binance 28', percentage: 4.02, balance: 1.69e13, balanceUSD: 126600000, type: 'cex', clusterId: 0 },
    { address: '0xf89...aa21', label: 'Binance 14', percentage: 1.12, balance: 4.7e12, balanceUSD: 35280000, type: 'cex', clusterId: 0 },
    { address: '0x21a...bc44', label: 'Binance Cold', percentage: 0.89, balance: 3.73e12, balanceUSD: 28030000, type: 'cex', clusterId: 0 },
    { address: '0xbb1...ef22', percentage: 0.34, balance: 1.43e12, balanceUSD: 10710000, type: 'wallet', clusterId: 0 },
    { address: '0xcc2...1133', percentage: 0.22, balance: 9.24e11, balanceUSD: 6930000, type: 'wallet', clusterId: 0 },

    // Cluster 1 - Korean exchanges (orange)
    { address: '0x3f9...99b8', label: 'Upbit Cold Wallet', percentage: 3.68, balance: 1.54e13, balanceUSD: 115900000, type: 'cex', clusterId: 1 },
    { address: '0xc93...13b4', label: 'Bybit', percentage: 2.45, balance: 1.03e13, balanceUSD: 77100000, type: 'cex', clusterId: 1 },
    { address: '0xd44...7a81', label: 'BtcTurk Hot Wallet', percentage: 2.14, balance: 8.98e12, balanceUSD: 67350000, type: 'cex', clusterId: 1 },
    { address: '0xe55...8b92', label: 'Bithumb Hot Wallet', percentage: 2.07, balance: 8.69e12, balanceUSD: 65150000, type: 'cex', clusterId: 1 },
    { address: '0xab3...cc55', label: undefined, percentage: 0.41, balance: 1.72e12, balanceUSD: 12900000, type: 'wallet', clusterId: 1 },
    { address: '0xbc4...dd66', label: undefined, percentage: 0.28, balance: 1.18e12, balanceUSD: 8820000, type: 'wallet', clusterId: 1 },

    // Cluster 2 - OKX & Revolut (green)
    { address: '0x61f...b09d', label: 'OKX Cold Wallet', percentage: 3.37, balance: 1.41e13, balanceUSD: 106100000, type: 'cex', clusterId: 2 },
    { address: '0x9b0...8d46', label: 'Revolut', percentage: 2.82, balance: 1.18e13, balanceUSD: 88800000, type: 'cex', clusterId: 2 },
    { address: '0x76e...fbd3', label: 'Crypto.com Hot Wallet', percentage: 2.04, balance: 8.56e12, balanceUSD: 64200000, type: 'cex', clusterId: 2 },
    { address: '0xaa1...bb11', label: undefined, percentage: 0.52, balance: 2.18e12, balanceUSD: 16380000, type: 'wallet', clusterId: 2 },
    { address: '0xdd7...ee88', label: undefined, percentage: 0.31, balance: 1.3e12, balanceUSD: 9750000, type: 'wallet', clusterId: 2 },

    // Cluster 3 - DeFi / DEX (pink)
    { address: '0xc67...f271', label: 'Uniswap V3', percentage: 2.10, balance: 8.81e12, balanceUSD: 66100000, type: 'dex', clusterId: 3 },
    { address: '0xa11...2233', label: 'Uniswap V2', percentage: 1.23, balance: 5.16e12, balanceUSD: 38700000, type: 'dex', clusterId: 3 },
    { address: '0xb22...3344', label: '1inch Router', percentage: 0.87, balance: 3.65e12, balanceUSD: 27400000, type: 'dex', clusterId: 3 },
    { address: '0xc33...4455', label: 'SushiSwap', percentage: 0.56, balance: 2.35e12, balanceUSD: 17630000, type: 'dex', clusterId: 3 },
    { address: '0xd44...5566', label: undefined, percentage: 0.38, balance: 1.59e12, balanceUSD: 11970000, type: 'wallet', clusterId: 3 },

    // Cluster 4 - Smart money wallets (yellow)
    { address: '0xe55...6677', label: 'Smart Money 1', percentage: 1.45, balance: 6.08e12, balanceUSD: 45670000, type: 'wallet', clusterId: 4 },
    { address: '0xf66...7788', label: 'Smart Money 2', percentage: 0.98, balance: 4.11e12, balanceUSD: 30850000, type: 'wallet', clusterId: 4 },
    { address: '0x177...8899', label: undefined, percentage: 0.67, balance: 2.81e12, balanceUSD: 21100000, type: 'wallet', clusterId: 4 },
    { address: '0x288...99aa', label: undefined, percentage: 0.45, balance: 1.89e12, balanceUSD: 14170000, type: 'wallet', clusterId: 4 },
    { address: '0x399...aabb', label: undefined, percentage: 0.33, balance: 1.38e12, balanceUSD: 10390000, type: 'wallet', clusterId: 4 },
    { address: '0x4aa...bbcc', label: undefined, percentage: 0.21, balance: 8.81e11, balanceUSD: 6610000, type: 'wallet', clusterId: 4 },

    // Cluster 5 - Dead/Burn (cyan)
    { address: '0x000...dead', label: 'Dead Address', percentage: 1.64, balance: 6.88e12, balanceUSD: 51600000, type: 'contract', clusterId: 5 },
    { address: '0x000...0000', label: 'Null Address', percentage: 0.43, balance: 1.8e12, balanceUSD: 13540000, type: 'contract', clusterId: 5 },

    // Cluster 6 - Robinhood related (red)
    { address: '0x5bb...ccdd', label: 'Robinhood Cold Wall...', percentage: 1.54, balance: 6.46e12, balanceUSD: 48470000, type: 'cex', clusterId: 6 },
    { address: '0x6cc...ddee', label: undefined, percentage: 0.82, balance: 3.44e12, balanceUSD: 25810000, type: 'wallet', clusterId: 6 },
    { address: '0x7dd...eeff', label: undefined, percentage: 0.55, balance: 2.31e12, balanceUSD: 17300000, type: 'wallet', clusterId: 6 },
    { address: '0x8ee...ff11', label: undefined, percentage: 0.29, balance: 1.22e12, balanceUSD: 9130000, type: 'wallet', clusterId: 6 },

    // Cluster 7 - Misc wallets (violet)
    { address: '0x9ff...1122', label: 'Crypto.com Cold', percentage: 1.49, balance: 6.25e12, balanceUSD: 46920000, type: 'cex', clusterId: 7 },
    { address: '0xa11...2234', label: undefined, percentage: 0.73, balance: 3.06e12, balanceUSD: 22970000, type: 'wallet', clusterId: 7 },
    { address: '0xb22...3345', label: undefined, percentage: 0.48, balance: 2.01e12, balanceUSD: 15100000, type: 'wallet', clusterId: 7 },
    { address: '0xc33...4456', label: undefined, percentage: 0.25, balance: 1.05e12, balanceUSD: 7870000, type: 'wallet', clusterId: 7 },

    // Cluster 8 - Market makers (teal)
    { address: '0xd44...5567', label: 'Wintermute', percentage: 1.31, balance: 5.5e12, balanceUSD: 41230000, type: 'wallet', clusterId: 8 },
    { address: '0xe55...6678', label: 'Jump Trading', percentage: 0.91, balance: 3.82e12, balanceUSD: 28640000, type: 'wallet', clusterId: 8 },
    { address: '0xf66...7789', label: undefined, percentage: 0.42, balance: 1.76e12, balanceUSD: 13210000, type: 'wallet', clusterId: 8 },
    { address: '0x177...889a', label: undefined, percentage: 0.19, balance: 7.97e11, balanceUSD: 5980000, type: 'wallet', clusterId: 8 },

    // Cluster 9 - Whale wallets (amber)
    { address: '0x288...99ab', label: 'Whale 0x288', percentage: 1.18, balance: 4.95e12, balanceUSD: 37150000, type: 'wallet', clusterId: 9 },
    { address: '0x399...aabc', label: undefined, percentage: 0.76, balance: 3.19e12, balanceUSD: 23920000, type: 'wallet', clusterId: 9 },
    { address: '0x4aa...bbcd', label: undefined, percentage: 0.51, balance: 2.14e12, balanceUSD: 16050000, type: 'wallet', clusterId: 9 },
    { address: '0x5bb...ccde', label: undefined, percentage: 0.27, balance: 1.13e12, balanceUSD: 8500000, type: 'wallet', clusterId: 9 },
    { address: '0x6cc...ddef', label: undefined, percentage: 0.15, balance: 6.3e11, balanceUSD: 4720000, type: 'wallet', clusterId: 9 },

    // Cluster 10 - Scattered small holders (indigo)
    { address: '0x7dd...ef01', label: 'Gate.io', percentage: 0.95, balance: 3.99e12, balanceUSD: 29900000, type: 'cex', clusterId: 10 },
    { address: '0x8ee...f012', label: undefined, percentage: 0.58, balance: 2.43e12, balanceUSD: 18250000, type: 'wallet', clusterId: 10 },
    { address: '0x9ff...0123', label: undefined, percentage: 0.36, balance: 1.51e12, balanceUSD: 11330000, type: 'wallet', clusterId: 10 },
    { address: '0xa00...1234', label: undefined, percentage: 0.18, balance: 7.55e11, balanceUSD: 5660000, type: 'wallet', clusterId: 10 },

    // Cluster 11 - KuCoin ecosystem (lime)
    { address: '0xb11...2345', label: 'KuCoin Hot', percentage: 0.88, balance: 3.69e12, balanceUSD: 27700000, type: 'cex', clusterId: 11 },
    { address: '0xc22...3456', label: undefined, percentage: 0.44, balance: 1.85e12, balanceUSD: 13850000, type: 'wallet', clusterId: 11 },
    { address: '0xd33...4567', label: undefined, percentage: 0.23, balance: 9.65e11, balanceUSD: 7240000, type: 'wallet', clusterId: 11 },

    // More scattered small wallets across clusters
    ...Array.from({ length: 40 }, (_, i) => ({
      address: `0x${(i + 100).toString(16).padStart(3, '0')}...${(i * 1111 + 1000).toString(16).padStart(4, '0')}`,
      label: undefined as string | undefined,
      percentage: Math.max(0.01, 0.35 - i * 0.007),
      balance: Math.max(4.2e9, (1.47e12 - i * 3.5e10)),
      balanceUSD: Math.max(31500, 11000000 - i * 260000),
      type: 'wallet' as const,
      clusterId: i % 12,
    })),
  ],
  transfers: [
    // Cluster 0 internal
    { source: '0x977...acec', target: '0x73a...d935', weight: 3 },
    { source: '0x977...acec', target: '0x5a5...efcb', weight: 5 },
    { source: '0x5a5...efcb', target: '0xf89...aa21', weight: 2 },
    { source: '0xf89...aa21', target: '0x21a...bc44', weight: 2 },
    { source: '0x21a...bc44', target: '0xbb1...ef22', weight: 1 },
    { source: '0xbb1...ef22', target: '0xcc2...1133', weight: 1 },
    { source: '0x73a...d935', target: '0xf89...aa21', weight: 1 },

    // Cluster 1 internal
    { source: '0x3f9...99b8', target: '0xc93...13b4', weight: 3 },
    { source: '0xc93...13b4', target: '0xd44...7a81', weight: 2 },
    { source: '0xd44...7a81', target: '0xe55...8b92', weight: 2 },
    { source: '0xe55...8b92', target: '0xab3...cc55', weight: 1 },
    { source: '0xab3...cc55', target: '0xbc4...dd66', weight: 1 },

    // Cluster 2 internal
    { source: '0x61f...b09d', target: '0x9b0...8d46', weight: 3 },
    { source: '0x9b0...8d46', target: '0x76e...fbd3', weight: 2 },
    { source: '0x76e...fbd3', target: '0xaa1...bb11', weight: 1 },
    { source: '0xaa1...bb11', target: '0xdd7...ee88', weight: 1 },

    // Cluster 3 internal (DeFi)
    { source: '0xc67...f271', target: '0xa11...2233', weight: 4 },
    { source: '0xa11...2233', target: '0xb22...3344', weight: 2 },
    { source: '0xb22...3344', target: '0xc33...4455', weight: 2 },
    { source: '0xc33...4455', target: '0xd44...5566', weight: 1 },

    // Cluster 4 internal (Smart money)
    { source: '0xe55...6677', target: '0xf66...7788', weight: 3 },
    { source: '0xf66...7788', target: '0x177...8899', weight: 2 },
    { source: '0x177...8899', target: '0x288...99aa', weight: 1 },
    { source: '0x288...99aa', target: '0x399...aabb', weight: 1 },
    { source: '0x399...aabb', target: '0x4aa...bbcc', weight: 1 },

    // Cluster 5 internal (Dead)
    { source: '0x000...dead', target: '0x000...0000', weight: 2 },

    // Cluster 6 internal
    { source: '0x5bb...ccdd', target: '0x6cc...ddee', weight: 2 },
    { source: '0x6cc...ddee', target: '0x7dd...eeff', weight: 1 },
    { source: '0x7dd...eeff', target: '0x8ee...ff11', weight: 1 },

    // Cluster 7 internal
    { source: '0x9ff...1122', target: '0xa11...2234', weight: 2 },
    { source: '0xa11...2234', target: '0xb22...3345', weight: 1 },
    { source: '0xb22...3345', target: '0xc33...4456', weight: 1 },

    // Cluster 8 internal (Market makers)
    { source: '0xd44...5567', target: '0xe55...6678', weight: 3 },
    { source: '0xe55...6678', target: '0xf66...7789', weight: 1 },
    { source: '0xf66...7789', target: '0x177...889a', weight: 1 },

    // Cluster 9 internal (Whales)
    { source: '0x288...99ab', target: '0x399...aabc', weight: 2 },
    { source: '0x399...aabc', target: '0x4aa...bbcd', weight: 1 },
    { source: '0x4aa...bbcd', target: '0x5bb...ccde', weight: 1 },
    { source: '0x5bb...ccde', target: '0x6cc...ddef', weight: 1 },

    // Cluster 10 internal
    { source: '0x7dd...ef01', target: '0x8ee...f012', weight: 2 },
    { source: '0x8ee...f012', target: '0x9ff...0123', weight: 1 },
    { source: '0x9ff...0123', target: '0xa00...1234', weight: 1 },

    // Cluster 11 internal
    { source: '0xb11...2345', target: '0xc22...3456', weight: 2 },
    { source: '0xc22...3456', target: '0xd33...4567', weight: 1 },

    // Cross-cluster transfers (fewer, weaker)
    { source: '0x977...acec', target: '0x3f9...99b8', weight: 1 },
    { source: '0x977...acec', target: '0xc67...f271', weight: 1 },
    { source: '0x73a...d935', target: '0x5bb...ccdd', weight: 1 },
    { source: '0x61f...b09d', target: '0xd44...5567', weight: 1 },
    { source: '0xc67...f271', target: '0xe55...6677', weight: 1 },
    { source: '0x9b0...8d46', target: '0x9ff...1122', weight: 1 },
    { source: '0x3f9...99b8', target: '0x7dd...ef01', weight: 1 },
    { source: '0xd44...5567', target: '0x288...99ab', weight: 1 },
    { source: '0xb11...2345', target: '0x8ee...f012', weight: 1 },
  ],
};

export { CLUSTER_COLORS };
