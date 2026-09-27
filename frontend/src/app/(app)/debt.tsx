// src/app/(app)/debt.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TrendingDown,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  CreditCard,
  Home,
  Car,
  Briefcase,
  GraduationCap,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';

// ══════════════════════════════════════════════════════════════
// Reusable UI Components (Tailwind / NativeWind)
// ══════════════════════════════════════════════════════════════

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  prefix?: string;
  keyboardType?: 'default' | 'numeric';
  maxLength?: number;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  prefix,
  keyboardType = 'default',
  maxLength,
}: InputProps) {
  return (
    <View className="w-full">
      {label && <Text className="text-xs font-semibold text-slate-400 mb-1.5">{label}</Text>}
      <View className="flex-row items-center bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 h-12 focus:border-sky-500">
        {prefix && <Text className="text-slate-400 text-sm font-semibold mr-2">{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          keyboardType={keyboardType}
          maxLength={maxLength}
          className="flex-1 text-slate-100 text-sm font-medium h-full"
        />
      </View>
    </View>
  );
}

interface StepCardProps {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function StepCard({ step, title, subtitle, children }: StepCardProps) {
  return (
    <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-sm">
      <View className="flex-row items-center mb-1">
        <View className="bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md mr-2.5">
          <Text className="text-[10px] font-extrabold text-sky-400 tracking-wider">STEP {step}</Text>
        </View>
        <Text className="text-base font-bold text-slate-100 flex-1">{title}</Text>
      </View>
      <Text className="text-xs text-slate-400 mb-3.5 leading-4">{subtitle}</Text>
      {children}
    </View>
  );
}

interface OptionCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon: React.ElementType;
  variant?: 'success' | 'danger' | 'sky';
}

export function OptionCard({ label, selected, onPress, icon: Icon, variant = 'sky' }: OptionCardProps) {
  const activeStyles = {
    sky: 'bg-sky-500/10 border-sky-500 text-sky-400',
    success: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
    danger: 'bg-rose-500/10 border-rose-500 text-rose-400',
  }[variant];

  const iconColors = {
    sky: '#38BDF8',
    success: '#10B981',
    danger: '#F43F5E',
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-1 flex-row items-center justify-center h-12 rounded-xl border px-3 bg-slate-800/60 border-slate-700/80 ${
        selected ? activeStyles : ''
      }`}
    >
      <Icon size={16} color={selected ? iconColors : '#94A3B8'} />
      <Text className={`text-xs font-semibold ml-2 ${selected ? 'font-bold' : 'text-slate-400'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-slate-800/50 rounded-xl p-3 items-center border border-slate-700/50">
      <Text className="text-sm font-bold text-slate-100" numberOfLines={1}>{value}</Text>
      <Text className="text-[10px] font-medium text-slate-400 mt-0.5">{label}</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// Types & Helpers
// ══════════════════════════════════════════════════════════════
type LoanType = 'credit_card' | 'personal' | 'home' | 'car' | 'education' | 'other';

interface Loan {
  id: string;
  type: LoanType;
  name: string;
  outstanding: number;
  emi: number;
  rate: number;
  tenure_remaining: number;
}

const LOAN_TYPES: { value: LoanType; label: string; icon: any; color: string }[] = [
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard, color: '#F43F5E' },
  { value: 'personal', label: 'Personal Loan', icon: Briefcase, color: '#F59E0B' },
  { value: 'home', label: 'Home Loan', icon: Home, color: '#10B981' },
  { value: 'car', label: 'Car Loan', icon: Car, color: '#38BDF8' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: '#8B5CF6' },
  { value: 'other', label: 'Other Debt', icon: Briefcase, color: '#94A3B8' },
];

function calcDebtScore(loans: Loan[]): number {
  if (!loans.length) return 100;
  const totalDebt = loans.reduce((s, l) => s + l.outstanding, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emi, 0);
  const hasHighInterest = loans.some((l) => l.rate > 18);
  const hasCreditCard = loans.some((l) => l.type === 'credit_card');

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

  const ccLoans = loans.filter((l) => l.type === 'credit_card');
  if (ccLoans.length > 0) {
    const ccTotal = ccLoans.reduce((s, l) => s + l.outstanding, 0);
    priorities.push({
      priority: 1,
      title: 'Clear Credit Card Debt First',
      desc: `₹${ccTotal.toLocaleString('en-IN')} outstanding at 36–42%/yr. Pay minimums elsewhere and clear this first.`,
      impact: 'High Impact',
    });
  }

  const highLoans = loans.filter((l) => l.rate > 18 && l.type !== 'credit_card');
  if (highLoans.length > 0) {
    priorities.push({
      priority: ccLoans.length > 0 ? 2 : 1,
      title: 'Prepay High-Interest Personal Loans',
      desc: 'Loans above 18%/yr interest take precedence over standard investment growth.',
      impact: 'High Impact',
    });
  }

  if (!hasEmergencyFund) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Build Emergency Reserve Buffer',
      desc: `Save 3-6 months of expenses (₹${
        monthlyIncome > 0 ? (monthlyIncome * 4).toLocaleString('en-IN') : '1,50,000'
      }) in a liquid account before expanding investments.`,
      impact: 'Critical Step',
    });
  }

  if (emiRatio > 50 && monthlyIncome > 0) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Reduce EMI-to-Income Burden',
      desc: `Your EMIs consume ${emiRatio.toFixed(0)}% of earnings (recommended maximum: 40%).`,
      impact: 'Medium Impact',
    });
  }

  return priorities;
}

const formatMoney = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} Lakh`;
  return `₹${n.toLocaleString('en-IN')}`;
};

// ══════════════════════════════════════════════════════════════
// Main Screen Component
// ══════════════════════════════════════════════════════════════
export default function DebtScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [hasEmergencyFund, setHasEmergencyFund] = useState<boolean | null>(null);
  const [emergencyMonths, setEmergencyMonths] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Form State
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [loanName, setLoanName] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [emi, setEmi] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');

  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedLoans, savedIncome, savedEF, savedEFMonths] = await Promise.all([
          AsyncStorage.getItem('leveliq_loans'),
          AsyncStorage.getItem('leveliq_income'),
          AsyncStorage.getItem('leveliq_has_ef'),
          AsyncStorage.getItem('leveliq_ef_months'),
        ]);
        if (savedLoans) setLoans(JSON.parse(savedLoans));
        if (savedIncome) setMonthlyIncome(savedIncome);
        if (savedEF !== null) setHasEmergencyFund(savedEF === 'true');
        if (savedEFMonths) setEmergencyMonths(savedEFMonths);
      } catch {
        // Fallback gracefully
      } finally {
        loaded.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem('leveliq_loans', JSON.stringify(loans)).catch(() => {});
  }, [loans]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem('leveliq_income', monthlyIncome).catch(() => {});
  }, [monthlyIncome]);

  useEffect(() => {
    if (!loaded.current || hasEmergencyFund === null) return;
    AsyncStorage.setItem('leveliq_has_ef', String(hasEmergencyFund)).catch(() => {});
  }, [hasEmergencyFund]);

  const addLoan = () => {
    const outstandingNum = parseFloat(outstanding.replace(/[₹,]/g, ''));
    const emiNum = parseFloat(emi.replace(/[₹,]/g, ''));
    const rateNum = parseFloat(rate);
    const tenureNum = parseInt(tenure, 10);

    if (!outstanding || isNaN(outstandingNum) || outstandingNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid loan balance.');
      return;
    }

    const newLoan: Loan = {
      id: Date.now().toString(),
      type: loanType,
      name: loanName.trim() || LOAN_TYPES.find((t) => t.value === loanType)?.label || 'Loan',
      outstanding: outstandingNum,
      emi: emiNum || 0,
      rate: rateNum || 0,
      tenure_remaining: tenureNum || 0,
    };

    setLoans([...loans, newLoan]);
    setLoanName('');
    setOutstanding('');
    setEmi('');
    setRate('');
    setTenure('');
    setShowLoanForm(false);
  };

  const removeLoan = (id: string) => {
    setLoans(loans.filter((l) => l.id !== id));
  };

  const incomeNum = parseFloat(monthlyIncome) || 0;
  const debtScore = calcDebtScore(loans);
  const totalDebt = loans.reduce((s, l) => s + l.outstanding, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emi, 0);
  const emiRatio = incomeNum > 0 ? Math.round((totalEMI / incomeNum) * 100) : 0;
  const priorities = buildPriorities(loans, hasEmergencyFund ?? false, incomeNum);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page Title & Subtitle */}
        <View className="mb-4">
          <Text className="text-2xl font-black text-slate-100 tracking-tight">Debt Health Check</Text>
          <Text className="text-xs text-slate-400 mt-1 leading-5">
            Understand your liabilities and emergency buffers before accelerating portfolio investments.
          </Text>
        </View>

        {/* Financial Insight Callout */}
        <View className="flex-row bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-4 items-start">
          <ShieldCheck size={18} color="#38BDF8" className="mt-0.5" />
          <View className="flex-1 ml-3">
            <Text className="text-xs font-bold text-slate-200">Rule of Thumb</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5 leading-4">
              Clearing high-interest debt provides a guaranteed return equal to the interest saved.
            </Text>
          </View>
        </View>

        {!showResults ? (
          <>
            {/* Step 1: Monthly Income */}
            <StepCard
              step={1}
              title="Monthly Net Income"
              subtitle="Calculates your total EMI-to-income capacity."
            >
              <Input
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                placeholder="75,000"
                prefix="₹"
                keyboardType="numeric"
              />
            </StepCard>

            {/* Step 2: Emergency Savings */}
            <StepCard
              step={2}
              title="Emergency Fund Status"
              subtitle="Do you have 3 to 6 months of living expenses saved in liquid funds?"
            >
              <View className="flex-row gap-2.5">
                <OptionCard
                  label="Yes, Saved"
                  selected={hasEmergencyFund === true}
                  onPress={() => setHasEmergencyFund(true)}
                  icon={CheckCircle2}
                  variant="success"
                />
                <OptionCard
                  label="Not Yet"
                  selected={hasEmergencyFund === false}
                  onPress={() => setHasEmergencyFund(false)}
                  icon={XCircle}
                  variant="danger"
                />
              </View>

              {hasEmergencyFund === true && (
                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-800">
                  <Text className="text-xs text-slate-400 font-medium">Months of expenses saved:</Text>
                  <View className="w-16">
                    <Input
                      value={emergencyMonths}
                      onChangeText={setEmergencyMonths}
                      placeholder="3"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
              )}
            </StepCard>

            {/* Step 3: Loan Portfolio Entry */}
            <StepCard
              step={3}
              title="Active Loans & Borrowings"
              subtitle="Add credit cards, personal, vehicle, or housing liabilities."
            >
              {/* Existing Loans */}
              {loans.map((loan) => {
                const meta = LOAN_TYPES.find((t) => t.value === loan.type)!;
                const Icon = meta.icon;
                return (
                  <View
                    key={loan.id}
                    className="flex-row items-center bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-2.5"
                  >
                    <View
                      className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: `${meta.color}1F` }}
                    >
                      <Icon size={18} color={meta.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-100">{loan.name}</Text>
                      <Text className="text-[11px] text-slate-400 mt-0.5">
                        {formatMoney(loan.outstanding)} • EMI ₹{loan.emi.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeLoan(loan.id)}
                      className="p-1.5"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Dynamic Loan Creation Modal */}
              {showLoanForm ? (
                <View className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 mt-1">
                  <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Select Loan Category
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    {LOAN_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = loanType === type.value;
                      return (
                        <TouchableOpacity
                          key={type.value}
                          onPress={() => setLoanType(type.value)}
                          className={`flex-row items-center px-3 py-1.5 rounded-lg mr-2 border ${
                            isSelected
                              ? 'bg-sky-500/10 border-sky-500'
                              : 'bg-slate-900 border-slate-700/80'
                          }`}
                        >
                          <Icon size={13} color={isSelected ? '#38BDF8' : '#94A3B8'} />
                          <Text
                            className={`text-xs ml-1.5 font-semibold ${
                              isSelected ? 'text-sky-400' : 'text-slate-400'
                            }`}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View className="mb-2">
                    <Input
                      label="Loan Name"
                      value={loanName}
                      onChangeText={setLoanName}
                      placeholder="e.g. HDFC Personal Loan"
                    />
                  </View>

                  <View className="flex-row gap-2 mb-2">
                    <View className="flex-1">
                      <Input
                        label="Outstanding (₹)"
                        value={outstanding}
                        onChangeText={setOutstanding}
                        placeholder="5,00,000"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Input
                        label="Monthly EMI (₹)"
                        value={emi}
                        onChangeText={setEmi}
                        placeholder="12,000"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2 mb-3">
                    <View className="flex-1">
                      <Input
                        label="Interest Rate (%)"
                        value={rate}
                        onChangeText={setRate}
                        placeholder="12.5"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Input
                        label="Months Remaining"
                        value={tenure}
                        onChangeText={setTenure}
                        placeholder="36"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setShowLoanForm(false)}
                      className="flex-1 h-10 rounded-xl border border-slate-700 items-center justify-center"
                    >
                      <Text className="text-xs font-semibold text-slate-400">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={addLoan}
                      className="flex-1 h-10 rounded-xl bg-blue-600 items-center justify-center"
                    >
                      <Text className="text-xs font-bold text-white">Save Entry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowLoanForm(true)}
                  className="flex-row items-center justify-center h-12 rounded-xl border border-dashed border-sky-500/50 bg-sky-500/5 mt-1"
                >
                  <Plus size={16} color="#38BDF8" />
                  <Text className="text-xs font-bold text-sky-400 ml-2">Add Loan or Borrowing</Text>
                </TouchableOpacity>
              )}
            </StepCard>

            {/* Run Analysis Action */}
            <TouchableOpacity
              onPress={() => setShowResults(true)}
              className="flex-row items-center justify-center h-12 bg-blue-600 rounded-xl shadow-lg mt-2"
            >
              <Text className="text-sm font-bold text-white mr-2">Analyze Debt Health</Text>
              <ArrowRight size={16} color="#FFF" />
            </TouchableOpacity>
          </>
        ) : (
          /* Analysis Results View */
          <>
            {/* Score Metric Hero */}
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 items-center mb-4">
              <Text className="text-[10px] font-extrabold text-slate-400 tracking-wider">
                DEBT HEALTH SCORE
              </Text>
              <Text
                className={`text-5xl font-black my-2 ${
                  debtScore >= 75
                    ? 'text-emerald-400'
                    : debtScore >= 50
                    ? 'text-amber-400'
                    : 'text-rose-500'
                }`}
              >
                {debtScore}
              </Text>
              <Text className="text-xs font-semibold text-slate-300 mb-4">
                {debtScore >= 80
                  ? 'Healthy Balance'
                  : debtScore >= 60
                  ? 'Moderate Attention Required'
                  : 'High Risk Profile'}
              </Text>

              {/* Stats Grid */}
              <View className="flex-row gap-2 w-full pt-3 border-t border-slate-800">
                <StatCard label="Total Balance" value={formatMoney(totalDebt)} />
                <StatCard label="Monthly EMI" value={`₹${totalEMI.toLocaleString('en-IN')}`} />
                <StatCard label="EMI Ratio" value={incomeNum > 0 ? `${emiRatio}%` : 'N/A'} />
              </View>
            </View>

            {/* Recommendations */}
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-1">
                <TrendingDown size={16} color="#38BDF8" />
                <Text className="text-sm font-bold text-slate-100 ml-2">Priority Action Steps</Text>
              </View>
              <Text className="text-xs text-slate-400 mb-3">
                Focus on these prioritized tasks in order:
              </Text>

              {priorities.map((p, idx) => (
                <View
                  key={idx}
                  className="bg-slate-800/50 border-l-2 border-l-sky-400 rounded-r-xl p-3 mb-2.5"
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-bold text-slate-100 flex-1 mr-2">{p.title}</Text>
                    <View className="bg-sky-500/10 px-2 py-0.5 rounded">
                      <Text className="text-[9px] font-extrabold text-sky-400">{p.impact}</Text>
                    </View>
                  </View>
                  <Text className="text-[11px] text-slate-400 leading-4">{p.desc}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              onPress={() => setShowResults(false)}
              className="h-11 rounded-xl border border-slate-800 items-center justify-center mb-2"
            >
              <Text className="text-xs font-semibold text-slate-400">Edit Inputs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(app)/analyze' as any)}
              className="flex-row items-center justify-center h-12 bg-blue-600 rounded-xl"
            >
              <Text className="text-xs font-bold text-white mr-1.5">Proceed to Portfolio Check</Text>
              <ChevronRight size={16} color="#FFF" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}