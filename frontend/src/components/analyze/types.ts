import React from 'react';
import { FileText, Camera, Edit3 } from 'lucide-react-native';

export type Tab = 'pdf' | 'screenshot' | 'manual';

export interface TabItem {
  id: Tab;
  label: string;
  icon: React.ElementType;
}

export const TABS: TabItem[] = [
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'screenshot', label: 'Screenshot', icon: Camera },
  { id: 'manual', label: 'Type it in', icon: Edit3 },
];

export interface ResolvedFund {
  scheme_code: string;
  scheme_name: string;
  input_name?: string;
  value: number;
  confidence?: number;
}

export interface ParsedResponse {
  success: boolean;
  error?: string;
  stats?: { resolved_count: number; unresolved_count: number };
  resolved?: ResolvedFund[];
  unresolved?: { name: string }[];
}

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

export interface HoldingRow {
  name: string;
  value: string;
  scheme_code: string;
  touched: boolean;
}

export interface SearchFundItem {
  scheme_code: string;
  scheme_name: string;
  fund_house?: string;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://leveliq-production.up.railway.app';
