// src/app/(app)/debt.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AlertCircle, AlertTriangle, TrendingDown, CheckCircle2, XCircle, Plus, Trash2,
  CreditCard, Home, Car, Briefcase, GraduationCap, ArrowRight, Info, Zap,
} from 'lucide-react-native';

// ══════════════════════════════════════════════════════════════
// Theme — same tokens as AuthScreen / analyze / sip-checker
// ══════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#050816', card: 'rgba(15,23,42,0.88)', cardBorder: 'rgba(56,189,248,0.15)',
  input: '#0A0F1E', inputBorder: 'rgba(148,163,184,0.15)',
  accent: '#38BDF8', primary: '#2563EB',
  textPrimary: '#F8FAFC', textMuted: '#94A3B8', textFaint: '#475569',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444', orange: '#F97316',
};

const cardStyle = {
  backgroundColor: COLORS.card, borderColor: COLORS.cardBorder, borderWidth: 1,
  borderRadius: 18, padding: 16, marginBottom: 14,
};

const primaryButtonStyle = {
  backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14,
  alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const,
  shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
};

const inputBase = {
  backgroundColor: COLORS.input, color: COLORS.textPrimary, borderRadius: 10,
  paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, borderWidth: 1,
};

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
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard, color: COLORS.red },
  { value: 'personal', label: 'Personal Loan', icon: Briefcase, color: COLORS.orange },
  { value: 'home', label: 'Home Loan', icon: Home, color: COLORS.green },
  { value: 'car', label: 'Car Loan', icon: Car, color: COLORS.amber },
  { value: 'education', label: 'Education', icon: GraduationCap, color: COLORS.accent },
  { value: 'other', label: 'Other', icon: Briefcase, color: COLORS.textMuted },
];

const PRIORITY_COLORS = [COLORS.red, COLORS.orange, COLORS.amber, COLORS.green];

// ══════════════════════════════════════════════════════════════
// Logic
// ══════════════════════════════════════════════════════════════
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
      title: 'Clear credit card debt immediately',
      desc: `₹${ccTotal.toLocaleString('en-IN')} at 36-42%/yr. This is the most expensive money — clear it before investing further.`,
      impact: 'High',
      action: 'Pay minimums elsewhere, put every spare rupee here first',
    });
  }

  const highLoans = loans.filter((l) => l.rate > 18 && l.type !== 'credit_card');
  if (highLoans.length > 0) {
    priorities.push({
      priority: ccLoans.length > 0 ? 2 : 1,
      title: 'Prepay high-interest loans',
      desc: 'Loans above 18%/yr cost more than markets can reliably return.',
      impact: 'High',
      action: 'Prioritize prepayment over increasing SIP amounts',
    });
  }

  if (!hasEmergencyFund) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Build an emergency fund first',
      desc: `Keep 3-6 months of expenses (₹${monthlyIncome > 0 ? (monthlyIncome * 4).toLocaleString('en-IN') : '1,50,000'}) in liquid funds before investing.`,
      impact: 'High',
      action: 'Open a liquid fund or sweep-in FD for the corpus',
    });
  }

  if (emiRatio > 50 && monthlyIncome > 0) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Reduce EMI burden',
      desc: `EMIs are ${emiRatio.toFixed(0)}% of income — above the recommended 40% limit, leaving little room to invest.`,
      impact: 'Medium',
      action: 'Avoid new loans until the EMI ratio drops below 40%',
    });
  }

  const lowDebt = loans.every((l) => l.rate <= 12);
  if (lowDebt && hasEmergencyFund && emiRatio < 40) {
    priorities.push({
      priority: priorities.length + 1,
      title: 'Debt is manageable — focus on investing',
      desc: 'Low-interest loans (home/car at 8-12%) are fine to continue alongside SIP investments.',
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

const impactColor = (impact: string) =>
  impact === 'High' ? COLORS.red : impact === 'Positive' ? COLORS.green : COLORS.amber;

// ══════════════════════════════════════════════════════════════
// Small reusable pieces
// ══════════════════════════════════════════════════════════════
function Field({
  label, value, onChangeText, placeholder, error, width, prefix,
}: { label: string; value: string; onChangeText: (t: string) => void; placeholder: string; error?: boolean; width?: number; prefix?: string }) {
  return (
    <View style={{ flex: width ? undefined : 1, width }}>
      <Text style={{ color: COLORS.textFaint, fontSize: 10, marginBottom: 5 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix ? <Text style={{ color: COLORS.textFaint, fontSize: 13, marginRight: 4 }}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={COLORS.textFaint}
          style={[inputBase, { flex: 1, borderColor: error ? COLORS.red : COLORS.inputBorder }]}
        />
      </View>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
      <Text style={{ color, fontSize: 15, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: COLORS.textFaint, fontSize: 10, marginTop: 3 }}>{label}</Text>
    </View>
  );
}

function ToggleOption({
  active, activeColor, activeBg, Icon, label, onPress,
}: { active: boolean; activeColor: string; activeBg: string; Icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 11, borderRadius: 10, borderWidth: 1,
        backgroundColor: active ? activeBg : COLORS.input,
        borderColor: active ? activeColor : COLORS.inputBorder,
      }}
    >
      <Icon size={14} color={active ? activeColor : COLORS.textMuted} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? activeColor : COLORS.textMuted }}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmiRatioBadge({ ratio }: { ratio: number }) {
  const [color, Icon, label] = ratio > 50 ? [COLORS.red, AlertTriangle, 'High'] : ratio > 40 ? [COLORS.amber, Zap, 'Watch'] : [COLORS.green, CheckCircle2, 'Healthy'] as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
      <View style={{ flex: 1, height: 5, backgroundColor: 'rgba(148,163,184,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.min(ratio, 100)}%`, borderRadius: 3, backgroundColor: color }} />
      </View>
      <Icon size={12} color={color} />
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{ratio}% · {label}</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// Debt entry
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
    const outstandingNum = parseFloat(outstanding.replace(/[₹,]/g, ''));
    const emiNum = parseFloat(emi.replace(/[₹,]/g, ''));
    const rateNum = parseFloat(rate);
    const tenureNum = parseInt(tenure, 10);

    const missing: string[] = [];
    if (!outstanding || isNaN(outstandingNum) || outstandingNum <= 0) missing.push('outstanding amount');
    if (!emi || isNaN(emiNum) || emiNum <= 0) missing.push('monthly EMI');
    if (!rate || isNaN(rateNum) || rateNum < 0) missing.push('interest rate');
    if (!tenure || isNaN(tenureNum) || tenureNum <= 0) missing.push('remaining tenure');

    if (missing.length) {
      Alert.alert('Check your entries', `Please enter a valid ${missing.join(', ')}.`);
      return;
    }

    onChange([...loans, {
      id: Date.now().toString(),
      type,
      name: name.trim() || LOAN_TYPES.find((t) => t.value === type)?.label || 'Loan',
      outstanding: outstandingNum, emi: emiNum, rate: rateNum, tenure_remaining: tenureNum,
    }]);
    resetForm();
  };

  return (
    <View>
      {loans.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          {loans.map((l) => {
            const meta = LOAN_TYPES.find((t) => t.value === l.type)!;
            const Icon = meta.icon;
            return (
              <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.input, borderColor: COLORS.inputBorder, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: `${meta.color}18`, borderWidth: 1, borderColor: `${meta.color}40` }}>
                  <Icon size={16} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{l.name}</Text>
                  <Text style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>
                    {formatMoney(l.outstanding)} · EMI ₹{l.emi.toLocaleString('en-IN')} · {l.rate}%
                  </Text>
                </View>
                <TouchableOpacity onPress={() => onChange(loans.filter((x) => x.id !== l.id))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 size={14} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {showForm ? (
        <View style={{ backgroundColor: COLORS.input, borderColor: 'rgba(56,189,248,0.2)', borderWidth: 1, borderRadius: 14, padding: 14 }}>
          <Text style={{ color: COLORS.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginBottom: 8 }}>LOAN TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {LOAN_TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1, backgroundColor: active ? 'rgba(56,189,248,0.15)' : 'rgba(148,163,184,0.06)', borderColor: active ? 'rgba(56,189,248,0.5)' : COLORS.inputBorder }}
                >
                  <Icon size={13} color={active ? COLORS.accent : COLORS.textMuted} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: active ? COLORS.accent : COLORS.textMuted }}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Loan name (e.g. HDFC Personal Loan)"
            placeholderTextColor={COLORS.textFaint}
            style={[inputBase, { borderColor: COLORS.inputBorder, backgroundColor: COLORS.bg, marginBottom: 10 }]}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <Field label="OUTSTANDING ₹" value={outstanding} onChangeText={setOutstanding} placeholder="500000" />
            <Field label="MONTHLY EMI ₹" value={emi} onChangeText={setEmi} placeholder="12000" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <Field label="INTEREST %" value={rate} onChangeText={setRate} placeholder="12.5" />
            <Field label="MONTHS LEFT" value={tenure} onChangeText={setTenure} placeholder="36" />
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={resetForm} style={{ flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)' }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addLoan} style={{ flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.primary }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Add Loan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(56,189,248,0.3)', borderRadius: 14, paddingVertical: 14, backgroundColor: 'rgba(56,189,248,0.05)' }}
        >
          <Plus size={16} color={COLORS.accent} />
          <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '700' }}>Add a loan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// Main screen
// ══════════════════════════════════════════════════════════════
export default function DebtScreen() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [hasEmergencyFund, setHasEmergencyFund] = useState<boolean | null>(null);
  const [emergencyMonths, setEmergencyMonths] = useState('');
  const [showResults, setShowResults] = useState(false);
  const loaded = useRef(false);
  const incomeSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [savedLoans, savedIncome, savedEF, savedEFMonths] = await Promise.all([
          AsyncStorage.getItem('leveliq_loans'),
          AsyncStorage.getItem('leveliq_income'),
          AsyncStorage.getItem('leveliq_has_ef'),
          AsyncStorage.getItem('leveliq_ef_months'),
        ]);
        if (savedLoans) {
          const parsed = JSON.parse(savedLoans);
          if (Array.isArray(parsed)) setLoans(parsed);
        }
        if (savedIncome) setMonthlyIncome(savedIncome);
        if (savedEF !== null) setHasEmergencyFund(savedEF === 'true');
        if (savedEFMonths) setEmergencyMonths(savedEFMonths);
      } catch {
        // ignore corrupted/missing storage — screen just starts empty
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
    if (incomeSaveTimer.current) clearTimeout(incomeSaveTimer.current);
    incomeSaveTimer.current = setTimeout(() => {
      AsyncStorage.setItem('leveliq_income', monthlyIncome).catch(() => {});
    }, 400);
    return () => { if (incomeSaveTimer.current) clearTimeout(incomeSaveTimer.current); };
  }, [monthlyIncome]);

  useEffect(() => {
    if (!loaded.current || hasEmergencyFund === null) return;
    AsyncStorage.setItem('leveliq_has_ef', String(hasEmergencyFund)).catch(() => {});
  }, [hasEmergencyFund]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem('leveliq_ef_months', emergencyMonths).catch(() => {});
  }, [emergencyMonths]);

  const incomeNum = parseFloat(monthlyIncome) || 0;
  const debtScore = calcDebtScore(loans);
  const priorities = showResults ? buildPriorities(loans, hasEmergencyFund ?? false, incomeNum) : [];
  const totalDebt = loans.reduce((s, l) => s + l.outstanding, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emi, 0);
  const totalInterest = loans.reduce((s, l) => s + l.outstanding * (l.rate / 100 / 12) * l.tenure_remaining, 0);
  const emiRatio = incomeNum > 0 ? Math.round((totalEMI / incomeNum) * 100) : 0;
  const scoreColor = debtScore >= 75 ? COLORS.green : debtScore >= 55 ? COLORS.amber : COLORS.red;
  const scoreGrade = debtScore >= 80 ? 'A' : debtScore >= 65 ? 'B' : debtScore >= 50 ? 'C' : 'D';
  const emergencyMonthsNum = parseInt(emergencyMonths, 10);
  const canAnalyze = loans.length > 0 || hasEmergencyFund !== null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ backgroundColor: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 12 }}>
            <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700' }}>DEBT HEALTH CHECK</Text>
          </View>
          <Text style={{ color: COLORS.textPrimary, fontSize: 25, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4, marginBottom: 8 }}>Know your debt first</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 8, lineHeight: 19 }}>
            Understand your debt before you grow your investments.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.16)', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <AlertCircle size={15} color={COLORS.red} style={{ marginTop: 1 }} />
          <Text style={{ color: '#FCA5A5', fontSize: 12.5, lineHeight: 18, marginLeft: 10, flex: 1 }}>
            <Text style={{ fontWeight: '700' }}>Why debt first? </Text>
            A personal loan at 18%/yr costs more than most fund returns. Clearing high-interest debt often beats investing.
          </Text>
        </View>

        {/* Income */}
        <View style={cardStyle}>
          <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '700', marginBottom: 2 }}>Your monthly income</Text>
          <Text style={{ color: COLORS.textFaint, fontSize: 12, marginBottom: 12 }}>Helps calculate your EMI-to-income ratio (optional)</Text>
          <TextInput
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            keyboardType="numeric"
            placeholder="75000"
            placeholderTextColor={COLORS.textFaint}
            style={[inputBase, { borderColor: COLORS.inputBorder }]}
          />
          {incomeNum > 0 && totalEMI > 0 && <EmiRatioBadge ratio={emiRatio} />}
        </View>

        {/* Emergency fund */}
        <View style={cardStyle}>
          <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '700', marginBottom: 2 }}>Do you have an emergency fund?</Text>
          <Text style={{ color: COLORS.textFaint, fontSize: 12, marginBottom: 12 }}>3-6 months of expenses in liquid savings</Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ToggleOption active={hasEmergencyFund === true} activeColor={COLORS.green} activeBg="rgba(34,197,94,0.1)" Icon={CheckCircle2} label="Yes, I have one" onPress={() => setHasEmergencyFund(true)} />
            <ToggleOption active={hasEmergencyFund === false} activeColor={COLORS.red} activeBg="rgba(239,68,68,0.1)" Icon={XCircle} label="Not yet" onPress={() => setHasEmergencyFund(false)} />
          </View>

          {hasEmergencyFund === true && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <TextInput
                value={emergencyMonths}
                onChangeText={setEmergencyMonths}
                keyboardType="numeric"
                placeholder="3"
                placeholderTextColor={COLORS.textFaint}
                maxLength={2}
                style={[inputBase, { width: 60, textAlign: 'center', borderColor: COLORS.inputBorder }]}
              />
              <Text style={{ color: COLORS.textFaint, fontSize: 12, flex: 1 }}>months of expenses covered</Text>
              {emergencyMonthsNum >= 3 && <CheckCircle2 size={15} color={COLORS.green} />}
              {emergencyMonthsNum > 0 && emergencyMonthsNum < 3 && <AlertTriangle size={15} color={COLORS.amber} />}
            </View>
          )}

          {hasEmergencyFund === false && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Info size={13} color={COLORS.amber} style={{ marginTop: 1 }} />
              <Text style={{ color: COLORS.amber, fontSize: 12, flex: 1, lineHeight: 17 }}>
                Build a 3-6 month liquid fund before increasing investments.
              </Text>
            </View>
          )}
        </View>

        {/* Loans */}
        <View style={cardStyle}>
          <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '700', marginBottom: 2 }}>Your loans & debts</Text>
          <Text style={{ color: COLORS.textFaint, fontSize: 12, marginBottom: 12 }}>Add all active loans for a complete picture</Text>
          <DebtEntry loans={loans} onChange={setLoans} />
        </View>

        {canAnalyze && !showResults && (
          <TouchableOpacity onPress={() => setShowResults(true)} style={[primaryButtonStyle, { marginBottom: 16 }]}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginRight: 8 }}>Analyze My Debt Health</Text>
            <ArrowRight size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {showResults && (
          <>
            {/* Score hero */}
            <View style={{ backgroundColor: COLORS.card, borderColor: 'rgba(56,189,248,0.2)', borderWidth: 1, borderRadius: 22, padding: 22, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: COLORS.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>DEBT HEALTH SCORE</Text>
              <Text style={{ color: scoreColor, fontSize: 64, fontWeight: '900', lineHeight: 68 }}>{debtScore}</Text>
              <Text style={{ color: scoreColor, fontSize: 18, fontWeight: '700', marginTop: 2, marginBottom: 18 }}>Grade {scoreGrade}</Text>

              {totalDebt > 0 && (
                <View style={{ flexDirection: 'row', width: '100%', gap: 8 }}>
                  <StatPill label="Total Debt" value={formatMoney(totalDebt)} color={COLORS.red} />
                  <StatPill label="Monthly EMI" value={`₹${totalEMI.toLocaleString('en-IN')}`} color={COLORS.amber} />
                  <StatPill label="Total Interest" value={formatMoney(Math.round(totalInterest))} color={COLORS.orange} />
                </View>
              )}
            </View>

            {/* Priorities */}
            <View style={cardStyle}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <TrendingDown size={16} color={COLORS.accent} />
                <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700', marginLeft: 8 }}>Your Financial Priority Order</Text>
              </View>
              <Text style={{ color: COLORS.textFaint, fontSize: 12, marginBottom: 14 }}>Based on your debt profile — focus on these in order:</Text>

              {priorities.length === 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)', borderWidth: 1, borderRadius: 12, padding: 14 }}>
                  <CheckCircle2 size={18} color={COLORS.green} />
                  <Text style={{ color: '#4ADE80', fontSize: 13, fontWeight: '600', marginLeft: 10, flex: 1 }}>No urgent priorities — you're in good shape.</Text>
                </View>
              ) : (
                priorities.map((p, i) => {
                  const idx = Math.min(p.priority - 1, 3);
                  const ic = impactColor(p.impact);
                  return (
                    <View key={i} style={{ flexDirection: 'row', backgroundColor: COLORS.input, borderRadius: 12, padding: 13, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: PRIORITY_COLORS[idx] }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `${PRIORITY_COLORS[idx]}20`, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 }}>
                        <Text style={{ color: PRIORITY_COLORS[idx], fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4, gap: 8 }}>
                          <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '700', flexShrink: 1 }} numberOfLines={2}>{p.title}</Text>
                          <View style={{ backgroundColor: `${ic}1A`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                            <Text style={{ color: ic, fontSize: 9, fontWeight: '800' }}>{p.impact.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={{ color: COLORS.textFaint, fontSize: 12, lineHeight: 17, marginBottom: 6 }}>{p.desc}</Text>
                        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600' }}>{p.action}</Text>
                      </View>
                    </View>
                  );
                })
              )}

              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <Info size={11} color={COLORS.textFaint} style={{ marginTop: 2 }} />
                <Text style={{ color: COLORS.textFaint, fontSize: 10.5, lineHeight: 15, flex: 1 }}>
                  Educational analysis only. Consult your financial advisor before decisions.
                </Text>
              </View>
            </View>

            {/* Next step */}
            <View style={{ backgroundColor: 'rgba(37,99,235,0.08)', borderColor: 'rgba(37,99,235,0.3)', borderWidth: 1, borderRadius: 18, padding: 18 }}>
              <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>Now check your investment portfolio</Text>
              <Text style={{ color: COLORS.textFaint, fontSize: 12.5, marginBottom: 14 }}>Get your Portfolio Health Score alongside this debt view.</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/analyze' as any)} style={{ backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginRight: 8 }}>Analyze My Portfolio</Text>
                <ArrowRight size={15} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowResults(false)} style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4 }}>
              <Text style={{ color: COLORS.textFaint, fontSize: 12, textDecorationLine: 'underline' }}>Edit inputs</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}