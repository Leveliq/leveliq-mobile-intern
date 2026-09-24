// src/app/(app)/debt.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AlertCircle, TrendingDown, CheckCircle, Plus, Trash2,
  CreditCard, Home, Car, Briefcase, GraduationCap, ArrowRight,
} from 'lucide-react-native';

// ══════════════════════════════════════════════════════════════
// Types & Constants
// ══════════════════════════════════════════════════════════════
type LoanType = 'credit_card' | 'personal' | 'home' | 'car' | 'education' | 'other';

interface Loan {
  id: string;
  type: LoanType;
  name: string;
  outstanding: number;
  emi: number;
  rate: number;
  tenure_remaining: number; // months
}

const LOAN_TYPES: { value: LoanType; label: string; icon: any; color: string }[] = [
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard, color: '#EF4444' },
  { value: 'personal', label: 'Personal Loan', icon: Briefcase, color: '#F97316' },
  { value: 'home', label: 'Home Loan', icon: Home, color: '#22C55E' },
  { value: 'car', label: 'Car Loan', icon: Car, color: '#F59E0B' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: '#38BDF8' },
  { value: 'other', label: 'Other', icon: Briefcase, color: '#94A3B8' },
];

const PRIORITY_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#22C55E'];
const PRIORITY_EMOJIS = ['🔴', '🟠', '🟡', '🟢'];

// ══════════════════════════════════════════════════════════════
// Logic Helpers
// ══════════════════════════════════════════════════════════════
function calcDebtScore(loans: Loan[]): number {
  if (!loans.length) return 100;
  const totalDebt = loans.reduce((s, l) => s + l.outstanding, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emi, 0);
  const hasHighInterest = loans.some(l => l.rate > 18);
  const hasCreditCard = loans.some(l => l.type === 'credit_card');

  let score = 100;
  if (totalDebt > 5000000) score -= 25;
  else if (totalDebt > 2000000) score -= 15;
  else if (totalDebt > 500000) score -= 8;

  if (totalEMI > 50000) score -= 20;
  else if (totalEMI > 25000) score -= 10;

  if (hasHighInterest) score -= 20;
  if (hasCreditCard) score -= 15;

  return Math.max(score, 10);
}

function buildPriorities(loans: Loan[], hasEmergencyFund: boolean, monthlyIncome: number) {
  const priorities: any[] = [];
  const totalEMI = loans.reduce((s, l) => s + l.emi, 0);
  const emiRatio = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;

  const ccLoans = loans.filter(l => l.type === 'credit_card');
  if (ccLoans.length > 0) {
    const ccTotal = ccLoans.reduce((s, l) => s + l.outstanding, 0);
    priorities.push({
      priority: 1,
      title: 'Clear credit card debt immediately',
      desc: `₹${ccTotal.toLocaleString('en-IN')} at 36-42%/yr. This is the most expensive money. Clear this before any investment.`,
      impact: 'High',
      action: 'Pay minimum on all others, put everything on credit card first',
    });
  }

  const highLoans = loans.filter(l => l.rate > 18 && l.type !== 'credit_card');
  if (highLoans.length > 0) {
    priorities.push({
      priority: ccLoans.length > 0 ? 2 : 1,
      title: 'Prepay high-interest loans',
      desc: 'Loans above 18%/yr are costing you more than markets can reliably return.',
      impact: 'High',
      action: 'Prioritize prepayment over increasing SIP amounts',
    });
  }

  if (!hasEmergencyFund) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Build emergency fund first',
      desc: `Keep 3-6 months of expenses (₹${monthlyIncome > 0 ? (monthlyIncome * 4).toLocaleString('en-IN') : '1,50,000'}) in liquid funds before investing.`,
      impact: 'High',
      action: 'Open a liquid fund or sweep-in FD for emergency corpus',
    });
  }

  if (emiRatio > 50 && monthlyIncome > 0) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Reduce EMI burden',
      desc: `Your EMIs are ${emiRatio.toFixed(0)}% of income — above the recommended 40% limit. Limited room for investments.`,
      impact: 'Medium',
      action: 'Avoid taking new loans until EMI ratio drops below 40%',
    });
  }

  const lowDebt = loans.every(l => l.rate <= 12);
  if (lowDebt && hasEmergencyFund && emiRatio < 40) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Your debt is manageable — focus on investing',
      desc: 'Low-interest loans (home/car at 8-12%) are fine to continue. SIP investments can grow alongside.',
      impact: 'Positive',
      action: 'Continue existing loans, increase SIP by ₹5,000-10,000/month',
    });
  }

  return priorities;
}

const formatMoney = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

// ══════════════════════════════════════════════════════════════
// DEBT ENTRY COMPONENT (inline)
// ══════════════════════════════════════════════════════════════
function DebtEntry({ loans, onChange }: { loans: Loan[]; onChange: (l: Loan[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<LoanType>('personal');
  const [name, setName] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [emi, setEmi] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');

  const resetForm = () => {
    setName(''); setOutstanding(''); setEmi(''); setRate(''); setTenure('');
    setType('personal'); setShowForm(false);
  };

  const addLoan = () => {
    if (!outstanding || !emi || !rate) {
      Alert.alert('Missing info', 'Please fill outstanding, EMI, and interest rate.');
      return;
    }
    const newLoan: Loan = {
      id: Date.now().toString(),
      type, name: name.trim() || LOAN_TYPES.find(t => t.value === type)?.label || 'Loan',
      outstanding: parseFloat(outstanding.replace(/[₹,]/g, '')) || 0,
      emi: parseFloat(emi.replace(/[₹,]/g, '')) || 0,
      rate: parseFloat(rate) || 0,
      tenure_remaining: parseInt(tenure) || 12,
    };
    onChange([...loans, newLoan]);
    resetForm();
  };

  const removeLoan = (id: string) => {
    onChange(loans.filter(l => l.id !== id));
  };

  return (
    <View>
      {/* Loan list */}
      {loans.length > 0 && (
        <View className="mb-3">
          {loans.map((l) => {
            const meta = LOAN_TYPES.find(t => t.value === l.type)!;
            const Icon = meta.icon;
            return (
              <View key={l.id} className="flex-row items-center bg-[#0A0F1E] border border-slate-800 rounded-xl p-3 mb-2">
                <View
                  className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${meta.color}15`, borderWidth: 1, borderColor: `${meta.color}30` }}
                >
                  <Icon size={16} color={meta.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-100 text-[13px] font-bold" numberOfLines={1}>{l.name}</Text>
                  <Text className="text-slate-500 text-[11px] mt-0.5">
                    {formatMoney(l.outstanding)} · EMI ₹{l.emi.toLocaleString('en-IN')} · {l.rate}%
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeLoan(l.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Add loan form */}
      {showForm ? (
        <View className="bg-[#0A0F1E] border border-sky-500/20 rounded-xl p-3.5">
          <Text className="text-slate-400 text-[10px] font-bold tracking-wider mb-2">LOAN TYPE</Text>

          {/* Type selector - horizontal scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {LOAN_TYPES.map((t) => {
              const Icon = t.icon;
              const isActive = type === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value)}
                  className={`flex-row items-center px-3 py-2 rounded-lg mr-2 border ${isActive ? 'bg-sky-500/15 border-sky-500/50' : 'bg-slate-800/30 border-slate-800'}`}
                >
                  <Icon size={13} color={isActive ? '#38BDF8' : '#64748B'} />
                  <Text className={`ml-1.5 text-[11px] font-semibold ${isActive ? 'text-[#38BDF8]' : 'text-slate-500'}`}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Name */}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Loan name (e.g. HDFC Personal Loan)"
            placeholderTextColor="#475569"
            className="bg-[#050816] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-50 text-[13px] mb-2"
          />

          {/* Outstanding & EMI */}
          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Text className="text-slate-500 text-[10px] mb-1">Outstanding ₹</Text>
              <TextInput
                value={outstanding}
                onChangeText={setOutstanding}
                keyboardType="numeric"
                placeholder="500000"
                placeholderTextColor="#475569"
                className="bg-[#050816] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-50 text-[13px]"
              />
            </View>
            <View className="flex-1">
              <Text className="text-slate-500 text-[10px] mb-1">Monthly EMI ₹</Text>
              <TextInput
                value={emi}
                onChangeText={setEmi}
                keyboardType="numeric"
                placeholder="12000"
                placeholderTextColor="#475569"
                className="bg-[#050816] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-50 text-[13px]"
              />
            </View>
          </View>

          {/* Rate & Tenure */}
          <View className="flex-row gap-2 mb-3">
            <View className="flex-1">
              <Text className="text-slate-500 text-[10px] mb-1">Interest %</Text>
              <TextInput
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
                placeholder="12.5"
                placeholderTextColor="#475569"
                className="bg-[#050816] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-50 text-[13px]"
              />
            </View>
            <View className="flex-1">
              <Text className="text-slate-500 text-[10px] mb-1">Months left</Text>
              <TextInput
                value={tenure}
                onChangeText={setTenure}
                keyboardType="numeric"
                placeholder="36"
                placeholderTextColor="#475569"
                className="bg-[#050816] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-50 text-[13px]"
              />
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity onPress={resetForm} className="flex-1 py-2.5 rounded-lg items-center border border-slate-700">
              <Text className="text-slate-400 text-xs font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addLoan} className="flex-1 py-2.5 rounded-lg items-center bg-blue-600">
              <Text className="text-white text-xs font-bold">Add Loan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="flex-row items-center justify-center border-2 border-dashed border-sky-500/30 rounded-xl py-3.5 bg-sky-500/5"
        >
          <Plus size={16} color="#38BDF8" />
          <Text className="text-[#38BDF8] text-[13px] font-bold ml-2">Add a loan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function DebtScreen() {
  const router = useRouter();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [hasEmergencyFund, setHasEmergencyFund] = useState<boolean | null>(null);
  const [emergencyMonths, setEmergencyMonths] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Load saved state
  useEffect(() => {
    (async () => {
      try {
        const savedLoans = await AsyncStorage.getItem('leveliq_loans');
        if (savedLoans) setLoans(JSON.parse(savedLoans));

        const savedIncome = await AsyncStorage.getItem('leveliq_income');
        if (savedIncome) setMonthlyIncome(savedIncome);
      } catch {}
    })();
  }, []);

  // Save loans on change
  useEffect(() => {
    AsyncStorage.setItem('leveliq_loans', JSON.stringify(loans)).catch(() => {});
  }, [loans]);

  // Save income on change
  useEffect(() => {
    AsyncStorage.setItem('leveliq_income', monthlyIncome).catch(() => {});
  }, [monthlyIncome]);

  const incomeNum = parseFloat(monthlyIncome) || 0;
  const debtScore = calcDebtScore(loans);
  const priorities = showResults ? buildPriorities(loans, hasEmergencyFund ?? false, incomeNum) : [];
  const totalDebt = loans.reduce((s, l) => s + l.outstanding, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emi, 0);
  const totalInterest = loans.reduce((s, l) => {
    const r = l.rate / 100 / 12;
    return s + l.outstanding * r * l.tenure_remaining;
  }, 0);
  const emiRatio = incomeNum > 0 ? Math.round((totalEMI / incomeNum) * 100) : 0;
  const scoreColor = debtScore >= 75 ? '#22C55E' : debtScore >= 55 ? '#F59E0B' : '#EF4444';
  const scoreGrade = debtScore >= 80 ? 'A' : debtScore >= 65 ? 'B' : debtScore >= 50 ? 'C' : 'D';

  const canAnalyze = loans.length > 0 || hasEmergencyFund !== null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#050816' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mb-5">
          <View className="bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-full mb-3">
            <Text className="text-[#38BDF8] text-[11px] font-semibold">DEBT HEALTH CHECK</Text>
          </View>
          <Text className="text-slate-50 text-[26px] font-extrabold text-center tracking-tight mb-2">
            Know your debt first
          </Text>
          <Text className="text-slate-500 text-[13px] text-center px-2 leading-5">
            Understand your debt before you grow your investments.
          </Text>
        </View>

        {/* Why this matters */}
        <View className="flex-row bg-red-500/5 border border-red-500/15 rounded-xl p-3.5 mb-4">
          <AlertCircle size={15} color="#EF4444" style={{ marginTop: 1 }} />
          <Text className="text-red-300 text-[12.5px] leading-5 ml-2.5 flex-1">
            <Text className="font-bold">Why check debt first? </Text>
            A personal loan at 18%/yr costs more than most MF returns. Clearing high-interest debt is often better than investing.
          </Text>
        </View>

        {/* ─── Monthly Income ─────────────────────────── */}
        <View className="bg-[#0F172A] border border-sky-500/15 rounded-2xl p-4 mb-3">
          <Text className="text-slate-100 text-[13px] font-bold mb-1">Your monthly income</Text>
          <Text className="text-slate-500 text-[12px] mb-3">Helps calculate your EMI-to-income ratio (optional)</Text>

          <View className="flex-row items-center gap-2">
            <Text className="text-slate-500 text-[14px]">₹</Text>
            <TextInput
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="numeric"
              placeholder="75000"
              placeholderTextColor="#475569"
              className="flex-1 bg-[#0A0F1E] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-50 text-[13px]"
            />
            <Text className="text-slate-500 text-[12px]">per month</Text>
          </View>

          {incomeNum > 0 && totalEMI > 0 && (
            <View className="mt-3">
              <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(emiRatio, 100)}%`,
                    backgroundColor: emiRatio > 50 ? '#EF4444' : emiRatio > 40 ? '#F59E0B' : '#22C55E',
                  }}
                />
              </View>
              <Text
                className="text-[11.5px] font-semibold"
                style={{ color: emiRatio > 50 ? '#EF4444' : emiRatio > 40 ? '#F59E0B' : '#22C55E' }}
              >
                EMI = {emiRatio}% of income {emiRatio > 50 ? '⚠️ High' : emiRatio > 40 ? '⚡ Watch' : '✅ Healthy'}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Emergency Fund ─────────────────────────── */}
        <View className="bg-[#0F172A] border border-sky-500/15 rounded-2xl p-4 mb-3">
          <Text className="text-slate-100 text-[13px] font-bold mb-1">Do you have an emergency fund?</Text>
          <Text className="text-slate-500 text-[12px] mb-3">3-6 months of expenses in liquid savings</Text>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setHasEmergencyFund(true)}
              className={`flex-1 py-2.5 rounded-lg items-center border ${hasEmergencyFund === true ? 'bg-green-500/10 border-green-500/30' : 'bg-[#0A0F1E] border-slate-800'}`}
            >
              <Text
                className="text-[13px] font-semibold"
                style={{ color: hasEmergencyFund === true ? '#22C55E' : '#64748B' }}
              >
                ✅ Yes, I have one
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setHasEmergencyFund(false)}
              className={`flex-1 py-2.5 rounded-lg items-center border ${hasEmergencyFund === false ? 'bg-red-500/10 border-red-500/30' : 'bg-[#0A0F1E] border-slate-800'}`}
            >
              <Text
                className="text-[13px] font-semibold"
                style={{ color: hasEmergencyFund === false ? '#EF4444' : '#64748B' }}
              >
                ❌ No, not yet
              </Text>
            </TouchableOpacity>
          </View>

          {hasEmergencyFund === true && (
            <View className="flex-row items-center gap-2 mt-3">
              <TextInput
                value={emergencyMonths}
                onChangeText={setEmergencyMonths}
                keyboardType="numeric"
                placeholder="3"
                placeholderTextColor="#475569"
                maxLength={2}
                className="bg-[#0A0F1E] border border-slate-800 rounded-lg px-3 py-2 text-slate-50 text-[13px] w-[70px] text-center"
              />
              <Text className="text-slate-500 text-[12px] flex-1">months of expenses covered</Text>
              {parseInt(emergencyMonths) >= 3 && <CheckCircle size={15} color="#22C55E" />}
              {parseInt(emergencyMonths) > 0 && parseInt(emergencyMonths) < 3 && <AlertCircle size={15} color="#F59E0B" />}
            </View>
          )}

          {hasEmergencyFund === false && (
            <Text className="text-amber-500 text-[12px] mt-2.5">
              💡 Build 3-6 months emergency fund in a liquid fund before increasing investments
            </Text>
          )}
        </View>

        {/* ─── Loans ─────────────────────────── */}
        <View className="bg-[#0F172A] border border-sky-500/15 rounded-2xl p-4 mb-4">
          <Text className="text-slate-100 text-[13px] font-bold mb-1">Your loans & debts</Text>
          <Text className="text-slate-500 text-[12px] mb-3">Add all active loans for a complete picture</Text>
          <DebtEntry loans={loans} onChange={setLoans} />
        </View>

        {/* ─── Analyze Button ─────────────────────────── */}
        {canAnalyze && !showResults && (
          <TouchableOpacity
            onPress={() => setShowResults(true)}
            className="bg-blue-600 py-3.5 rounded-xl items-center justify-center flex-row mb-4"
            style={{ shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}
          >
            <Text className="text-white text-[14px] font-bold mr-2">Analyze My Debt Health</Text>
            <ArrowRight size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ─── Results ─────────────────────────── */}
        {showResults && (
          <>
            {/* Score Hero */}
            <View
              className="bg-[#0F172A] border border-sky-500/20 rounded-3xl p-6 items-center mb-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 }}
            >
              <Text className="text-slate-500 text-[10px] font-bold tracking-[2px] mb-4">DEBT HEALTH SCORE</Text>

              <Text className="text-[76px] font-black tracking-tighter" style={{ color: scoreColor, lineHeight: 82 }}>
                {debtScore}
              </Text>
              <Text className="text-xl font-bold mb-5 mt-[-4px]" style={{ color: scoreColor }}>
                Grade {scoreGrade}
              </Text>

              {totalDebt > 0 && (
                <View className="flex-row w-full gap-2">
                  <View className="flex-1 bg-black/25 rounded-xl p-2.5 items-center">
                    <Text className="text-red-500 text-[15px] font-black">{formatMoney(totalDebt)}</Text>
                    <Text className="text-slate-500 text-[10px] mt-1">Total Debt</Text>
                  </View>
                  <View className="flex-1 bg-black/25 rounded-xl p-2.5 items-center">
                    <Text className="text-amber-500 text-[15px] font-black">₹{totalEMI.toLocaleString('en-IN')}</Text>
                    <Text className="text-slate-500 text-[10px] mt-1">Monthly EMI</Text>
                  </View>
                  <View className="flex-1 bg-black/25 rounded-xl p-2.5 items-center">
                    <Text className="text-orange-500 text-[15px] font-black">{formatMoney(Math.round(totalInterest))}</Text>
                    <Text className="text-slate-500 text-[10px] mt-1">Total Interest</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Priority Engine */}
            <View className="bg-[#0F172A] border border-sky-500/15 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <TrendingDown size={16} color="#38BDF8" />
                <Text className="text-slate-100 text-[14px] font-bold ml-2">Your Financial Priority Order</Text>
              </View>
              <Text className="text-slate-500 text-[12px] mb-4">Based on your debt profile — focus on these in order:</Text>

              {priorities.length === 0 ? (
                <View className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex-row items-center">
                  <CheckCircle size={18} color="#22C55E" />
                  <Text className="text-green-400 text-[13px] font-semibold ml-2 flex-1">
                    No urgent priorities — you're in good shape!
                  </Text>
                </View>
              ) : (
                priorities.map((p, i) => {
                  const idx = Math.min(p.priority - 1, 3);
                  const impactColor =
                    p.impact === 'High' ? '#EF4444' :
                    p.impact === 'Positive' ? '#22C55E' :
                    '#F59E0B';
                  const impactBg =
                    p.impact === 'High' ? 'rgba(239,68,68,0.1)' :
                    p.impact === 'Positive' ? 'rgba(34,197,94,0.1)' :
                    'rgba(245,158,11,0.1)';

                  return (
                    <View
                      key={i}
                      className="flex-row bg-[#0A0F1E] rounded-xl p-3.5 mb-2.5"
                      style={{ borderLeftWidth: 3, borderLeftColor: PRIORITY_COLORS[idx] }}
                    >
                      <Text style={{ fontSize: 18, marginRight: 10 }}>{PRIORITY_EMOJIS[idx]}</Text>
                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap mb-1">
                          <Text className="text-slate-100 text-[13px] font-bold mr-2 flex-shrink" numberOfLines={2}>
                            {p.title}
                          </Text>
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: impactBg }}
                          >
                            <Text className="text-[9px] font-bold" style={{ color: impactColor }}>
                              {p.impact.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-slate-500 text-[12px] leading-4 mb-1.5">{p.desc}</Text>
                        <Text className="text-[#38BDF8] text-[12px] font-semibold">→ {p.action}</Text>
                      </View>
                    </View>
                  );
                })
              )}

              <Text className="text-slate-600 text-[10.5px] mt-2 leading-4">
                ⚠️ Educational analysis only. Consult your financial advisor before decisions.
              </Text>
            </View>

            {/* Next Step CTA */}
            <View className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-5">
              <Text className="text-slate-100 text-[14px] font-bold mb-1">Now check your investment portfolio</Text>
              <Text className="text-slate-500 text-[12.5px] mb-4">
                Get your Portfolio Health Score alongside this debt view
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(app)/analyze' as any)}
                className="bg-blue-600 py-3 rounded-xl items-center flex-row justify-center"
              >
                <Text className="text-white text-[13px] font-bold mr-2">Analyze My Portfolio</Text>
                <ArrowRight size={15} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Reset button */}
            <TouchableOpacity
              onPress={() => setShowResults(false)}
              className="items-center py-3 mt-4"
            >
              <Text className="text-slate-500 text-xs underline">Edit inputs</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}