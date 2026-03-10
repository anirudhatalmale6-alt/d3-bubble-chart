export interface TokenHolder {
  address: string;
  label?: string;
  percentage: number;
  balance: number;
  balanceUSD?: number;
  type: 'wallet' | 'contract' | 'cex' | 'dex';
  icon?: string;
  clusterId: number;
}

export interface TokenTransfer {
  source: string; // address
  target: string; // address
  weight?: number;
}

export interface BubbleChartData {
  tokenName: string;
  tokenSymbol: string;
  tokenImage?: string;
  totalHolders: number;
  holders: TokenHolder[];
  transfers: TokenTransfer[];
}

export interface BubbleNode extends d3.SimulationNodeDatum {
  id: string;
  address: string;
  label?: string;
  percentage: number;
  balance: number;
  balanceUSD?: number;
  type: 'wallet' | 'contract' | 'cex' | 'dex';
  icon?: string;
  clusterId: number;
  radius: number;
  color: string;
  borderColor: string;
}

export interface BubbleLink extends d3.SimulationLinkDatum<BubbleNode> {
  source: string | BubbleNode;
  target: string | BubbleNode;
  weight?: number;
}

import * as d3 from 'd3';
