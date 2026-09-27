import { Loan, DebtScoreResult, PriorityItem } from './types';

export const formatMoney = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} Lakh`;
  return `₹${n.toLocaleString('en-IN')}`;
};

export function calculateDebtScore(
  loans: Loan[],
  income: number,
  hasEmergencyFund: boolean | null,
  emergencyMonths: number
): DebtScoreResult {
  const totalDebt = loans.reduce((s, l) => s + (l.outstanding || 0), 0);
  const totalEMI = loans.reduce((s, l) => s + (l.emi || 0), 0);
  const emiRatio = income > 0 ? Math.round((totalEMI / income) * 100) : null;
  const ccTotal = loans.filter((l) => l.type === 'credit_card').reduce((s, l) => s + l.outstanding, 0);

  if (loans.length === 0) {
    const score = hasEmergencyFund ? 100 : 85;
    return {
      score,
      grade: 'A+',
      status: 'Debt-Free Position',
      color: '#10B981',
      totalDebt: 0,
      totalEMI: 0,
      emiRatio: 0,
      priorities: [{ priority: 1, title: 'Build Emergency Cushion', desc: 'Maintain 3–6 months liquid expenses before aggressive equity SIPs.', impact: 'Good' }],
    };
  }

  let score = 100;

  // 1. Dynamic EMI Capacity (scaled to income)
  if (emiRatio !== null) {
    if (emiRatio > 50) score -= 30;
    else if (emiRatio > 35) score -= 18;
    else if (emiRatio > 25) score -= 8;
  } else {
    if (totalEMI > 50000) score -= 20;
    else if (totalEMI > 20000) score -= 10;
  }

  // 2. Toxic Credit Card & High Rate (>18%) Debt
  if (ccTotal > 0) {
    const ccBurden = income > 0 ? ccTotal / income : ccTotal / 50000;
    score -= ccBurden > 0.5 ? 28 : 15;
  }
  const hasHighRate = loans.some((l) => l.rate >= 18 && l.type !== 'credit_card');
  if (hasHighRate) score -= 15;

  // 3. Emergency Buffer
  if (hasEmergencyFund === false) score -= 15;
  else if (hasEmergencyFund === true && emergencyMonths < 3) score -= 6;

  score = Math.max(15, Math.min(100, Math.round(score)));

  const grade = score >= 85 ? 'A+' : score >= 70 ? 'A' : score >= 55 ? 'B' : score >= 40 ? 'C' : 'D';
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#38BDF8' : score >= 45 ? '#F59E0B' : '#F43F5E';
  const status = score >= 80 ? 'Healthy Balance' : score >= 60 ? 'Manageable Debt' : score >= 45 ? 'Elevated Burden' : 'High Risk';

  // Strategic Avalanche Priorities
  const priorities: PriorityItem[] = [];
  if (ccTotal > 0) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Pay Off Credit Card Balances',
      desc: `${formatMoney(ccTotal)} at 36–42% interest. Clear this first before investing.`,
      impact: 'Critical',
    });
  }
  if (hasHighRate) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Prepay High-APR Personal Loans',
      desc: 'Loans above 18% APR erode wealth faster than index mutual funds compound.',
      impact: 'High',
    });
  }
  if (!hasEmergencyFund) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Establish 3–6 Month Emergency Fund',
      desc: `Save ~${formatMoney(income > 0 ? income * 3 : 150000)} in liquid savings to avoid taking high-interest emergency debt.`,
      impact: 'High',
    });
  }
  if (emiRatio && emiRatio > 40) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Rationalize EMI-to-Income',
      desc: `EMIs take ${emiRatio}% of income. Keep total EMIs under 35–40%.`,
      impact: 'Moderate',
    });
  }
  if (priorities.length === 0) {
    priorities.push({
      priority: 1,
      title: 'Healthy Liabilities — Grow SIPs',
      desc: 'Your debt is low-rate and asset-backed. Continue existing EMIs and invest surplus cash into SIPs.',
      impact: 'Good',
    });
  }

  return { score, grade, status, color, totalDebt, totalEMI, emiRatio, priorities };
}
