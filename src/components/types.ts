import * as d3 from 'd3';

export interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  rank: number;
  color: string;
  visable?: boolean;
  isExchange: boolean;
  isContract?: boolean;
  cluster?: string;
  clusterPercentage?: number;
  // Internal fields added by chart
  _radius?: number;
  _clusterColor?: string;
}

export interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
  value: number;
}

export interface ChartData {
  links: LinkDatum[];
  nodes: NodeDatum[];
}
