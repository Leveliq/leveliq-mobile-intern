export type LoanType = 'credit_card' | 'personal' | 'home' | 'car' | 'education' | 'other';

export interface Loan {
  id: string;
  type: LoanType;
  name: string;
  outstanding: number;
  emi: number;
  rate: number;
  tenure_remaining: number;
}

export interface PriorityItem {
  priority: number;
  title: string;
  desc: string;
  impact: 'Critical' | 'High' | 'Moderate' | 'Good';
}

export interface DebtScoreResult {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  status: string;
  color: string;
  totalDebt: number;
  totalEMI: number;
  emiRatio: number | null;
  priorities: PriorityItem[];
}

export const LOAN_TYPES = [
  { value: 'credit_card' as const, label: 'Credit Card', color: '#F43F5E', defaultRate: 38 },
  { value: 'personal' as const, label: 'Personal Loan', color: '#F59E0B', defaultRate: 15 },
  { value: 'home' as const, label: 'Home Loan', color: '#10B981', defaultRate: 8.5 },
  { value: 'car' as const, label: 'Car Loan', color: '#38BDF8', defaultRate: 9.5 },
  { value: 'education' as const, label: 'Education', color: '#8B5CF6', defaultRate: 9 },
  { value: 'other' as const, label: 'Other Debt', color: '#94A3B8', defaultRate: 12 },
];
