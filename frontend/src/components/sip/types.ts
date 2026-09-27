export interface FundItem {
  scheme_code: string;
  scheme_name: string;
  fund_house?: string;
}

export interface PortfolioHolding extends FundItem {
  value: number;
}

export interface OverlapItem {
  fund1_code: string;
  fund1_name: string;
  fund2_code: string;
  fund2_name: string;
  overlap_pct: number;
}

export interface AnalysisResponse {
  health_score: number;
  grade: string;
  overlaps?: OverlapItem[];
  [key: string]: unknown;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ;

export const DEFAULT_PORTFOLIO: PortfolioHolding[] = [
  { scheme_code: '100016', scheme_name: 'HDFC Flexi Cap Fund Direct Growth', fund_house: 'HDFC Mutual Fund', value: 50000 },
  { scheme_code: '122639', scheme_name: 'Parag Parikh Flexi Cap Fund Direct Growth', fund_house: 'PPFAS Mutual Fund', value: 40000 },
  { scheme_code: '120716', scheme_name: 'UTI Nifty 50 Index Fund Direct Growth', fund_house: 'UTI Mutual Fund', value: 30000 },
];
