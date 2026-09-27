// src/app/(app)/starter-iq.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Shield,
  Scale,
  Rocket,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Upload,
  Search,
  Info,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API = process.env.EXPO_PUBLIC_API_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = SCREEN_WIDTH < 340;

// ── Starter portfolios by profile ────────────────────────────
const STARTER_PORTFOLIOS: Record<string, any> = {
  young_aggressive: {
    label: 'High Growth',
    description: 'Maximum growth potential. Higher risk, higher reward.',
    funds: [
      { scheme_code: '120505', name: 'Axis Midcap Fund Direct Growth', allocation: 40, type: 'Mid Cap', why: 'High growth potential over 10+ years' },
      { scheme_code: '100016', name: 'HDFC Flexi Cap Fund Direct Growth', allocation: 35, type: 'Flexi Cap', why: 'Flexibility across market caps' },
      { scheme_code: '125354', name: 'Axis Small Cap Fund Direct Growth', allocation: 25, type: 'Small Cap', why: 'High risk, high reward over long term' },
    ],
  },
  young_moderate: {
    label: 'Balanced Growth',
    description: 'Good growth with some stability. Best for most young investors.',
    funds: [
      { scheme_code: '100016', name: 'HDFC Flexi Cap Fund Direct Growth', allocation: 40, type: 'Flexi Cap', why: 'Core holding for long term wealth' },
      { scheme_code: '120505', name: 'Axis Midcap Fund Direct Growth', allocation: 35, type: 'Mid Cap', why: 'Growth booster for your portfolio' },
      { scheme_code: '120716', name: 'UTI Nifty 50 Index Fund Direct Growth', allocation: 25, type: 'Index', why: 'Stable Nifty 50 exposure' },
    ],
  },
  young_conservative: {
    label: 'Steady Growth',
    description: 'Lower risk with decent returns. Good for cautious investors.',
    funds: [
      { scheme_code: '120716', name: 'UTI Nifty 50 Index Fund Direct Growth', allocation: 50, type: 'Index', why: 'Safe, low cost market returns' },
      { scheme_code: '100016', name: 'HDFC Flexi Cap Fund Direct Growth', allocation: 30, type: 'Flexi Cap', why: 'Actively managed growth' },
      { scheme_code: '122639', name: 'Parag Parikh Flexi Cap Fund Direct Growth', allocation: 20, type: 'Flexi Cap', why: 'International diversification' },
    ],
  },
  mid_aggressive: {
    label: 'Growth Focus',
    description: 'Growth oriented with some large cap stability.',
    funds: [
      { scheme_code: '100016', name: 'HDFC Flexi Cap Fund Direct Growth', allocation: 40, type: 'Flexi Cap', why: 'Core large cap exposure' },
      { scheme_code: '120505', name: 'Axis Midcap Fund Direct Growth', allocation: 35, type: 'Mid Cap', why: 'Growth through mid caps' },
      { scheme_code: '122639', name: 'Parag Parikh Flexi Cap Fund Direct Growth', allocation: 25, type: 'Flexi Cap', why: 'Global diversification' },
    ],
  },
  mid_moderate: {
    label: 'Balanced',
    description: 'Balanced approach for wealth preservation and growth.',
    funds: [
      { scheme_code: '120716', name: 'UTI Nifty 50 Index Fund Direct Growth', allocation: 40, type: 'Index', why: 'Stable large cap core' },
      { scheme_code: '100016', name: 'HDFC Flexi Cap Fund Direct Growth', allocation: 35, type: 'Flexi Cap', why: 'Active management alpha' },
      { scheme_code: '122639', name: 'Parag Parikh Flexi Cap Fund Direct Growth', allocation: 25, type: 'Flexi Cap', why: 'International exposure' },
    ],
  },
  mid_conservative: {
    label: 'Capital Protection',
    description: 'Focus on protecting and steadily growing wealth.',
    funds: [
      { scheme_code: '120716', name: 'UTI Nifty 50 Index Fund Direct Growth', allocation: 50, type: 'Index', why: 'Low cost, stable returns' },
      { scheme_code: '122639', name: 'Parag Parikh Flexi Cap Fund Direct Growth', allocation: 30, type: 'Flexi Cap', why: 'Diversified with global exposure' },
      { scheme_code: '118269', name: 'CANARA ROBECO LARGE CAP FUND Direct Growth', allocation: 20, type: 'Large Cap', why: 'Stable large cap allocation' },
    ],
  },
  senior_moderate: {
    label: 'Income + Safety',
    description: 'Capital preservation with steady returns.',
    funds: [
      { scheme_code: '120716', name: 'UTI Nifty 50 Index Fund Direct Growth', allocation: 50, type: 'Index', why: 'Stable blue chip exposure' },
      { scheme_code: '122639', name: 'Parag Parikh Flexi Cap Fund Direct Growth', allocation: 30, type: 'Flexi Cap', why: 'Quality stocks with global hedge' },
      { scheme_code: '118269', name: 'CANARA ROBECO LARGE CAP FUND Direct Growth', allocation: 20, type: 'Large Cap', why: 'Conservative large cap' },
    ],
  },
};

function getPortfolioKey(age: string, risk: string): string {
  const ageGroup = age === 'under25' || age === '25to35' ? 'young' : age === '35to45' ? 'mid' : 'senior';
  const riskLevel = risk === 'aggressive' ? 'aggressive' : risk === 'moderate' ? 'moderate' : 'conservative';
  const key = `${ageGroup}_${riskLevel}`;
  return STARTER_PORTFOLIOS[key] ? key : `${ageGroup}_moderate`;
}

function formatINR(n: number) {
  return n.toLocaleString('en-IN');
}

// ── Reusable Components ──────────────────────────────────────

function OptionButton({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`rounded-2xl px-4 py-3.5 mb-2.5 border ${
        selected
          ? 'bg-sky-500/10 border-sky-500/40'
          : 'bg-slate-800/30 border-slate-700/50'
      }`}
    >
      {children}
    </TouchableOpacity>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`bg-[#0F172A] border border-slate-800/60 rounded-2xl p-5 mb-4 ${className}`}>
      {children}
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-3">
      {text}
    </Text>
  );
}

function ProgressBar({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <View className="flex-row items-center justify-center mt-5 mb-1" style={{ gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-1 rounded-full ${i < step ? 'bg-sky-500' : 'bg-slate-800'}`}
          style={{ width: 32 }}
        />
      ))}
    </View>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface Profile {
  age: string;
  savings: string;
  goal: string;
  risk: string;
}

export default function StarterIQScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<Profile>({ age: '', savings: '', goal: '', risk: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sipAmount, setSipAmount] = useState(5000);
  const [customSip, setCustomSip] = useState('');

  const set = (key: keyof Profile, val: string) => setProfile((p) => ({ ...p, [key]: val }));

  const scrollToTop = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
  };

  async function generatePortfolio() {
    setLoading(true);
    try {
      const key = getPortfolioKey(profile.age, profile.risk);
      const portfolio = STARTER_PORTFOLIOS[key];
      const totalSIP = sipAmount;

      const holdings = portfolio.funds.map((f: any) => ({
        scheme_code: f.scheme_code,
        scheme_name: f.name,
        value: Math.round((f.allocation / 100) * totalSIP * 12),
      }));

      const res = await fetch(`${API}/api/portfolio/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings }),
      });
      const analysis = await res.json();

      setResult({ portfolio, analysis, holdings });
      setStep(4);
      scrollToTop();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const canNext =
    (step === 1 && !!profile.age) ||
    (step === 2 && !!profile.savings && !!profile.goal) ||
    (step === 3 && !!profile.risk);

  const goNext = () => {
    if (step === 3) {
      generatePortfolio();
    } else {
      setStep((s) => (s + 1) as Step);
      scrollToTop();
    }
  };

  const goBack = () => {
    setStep((s) => (s - 1) as Step);
    scrollToTop();
  };

  const startOver = () => {
    setStep(1);
    setProfile({ age: '', savings: '', goal: '', risk: '' });
    setResult(null);
    setSipAmount(5000);
    setCustomSip('');
    scrollToTop();
  };

  // ── SIP amount presets ────
  const SIP_PRESETS = [1000, 2000, 5000, 10000, 25000];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 bg-[#050816]">
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: isSmall ? 14 : 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── HEADER (Steps 1-3) ── */}
          {step < 4 && (
            <View className="items-center mb-6">
              {/* Badge */}
              <View className="bg-sky-500/10 border border-sky-500/30 rounded-full px-4 py-1.5 mb-4">
                <Text className="text-sky-400 text-[11px] font-bold tracking-wider">
                  STARTER IQ
                </Text>
              </View>

              <Text
                className="text-slate-50 font-black text-center mb-2"
                style={{ fontSize: isSmall ? 22 : 26, lineHeight: isSmall ? 28 : 32 }}
              >
                Build your first{'\n'}MF portfolio
              </Text>

              <Text className="text-slate-400 text-[13px] text-center leading-5 px-2">
                Answer 3 quick questions. Get a zero-overlap{'\n'}starter portfolio built for you.
              </Text>

              <ProgressBar step={step} />
              <Text className="text-slate-500 text-[11px] mt-2">
                Step {step} of 3
              </Text>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 1: AGE
           ══════════════════════════════════════════════════════ */}
          {step === 1 && (
            <SectionCard>
              <SectionLabel text="How old are you?" />
              {[
                { val: 'under25', label: 'Under 25', sub: 'Just starting out — time is your biggest asset' },
                { val: '25to35', label: '25 to 35', sub: 'Building wealth — prime investing years' },
                { val: '35to45', label: '35 to 45', sub: 'Growing wealth — balancing growth & stability' },
                { val: 'above45', label: 'Above 45', sub: 'Preserving wealth — focus on stability' },
              ].map((opt) => (
                <OptionButton
                  key={opt.val}
                  selected={profile.age === opt.val}
                  onPress={() => set('age', opt.val)}
                >
                  <Text className="text-slate-100 text-[14px] font-semibold">{opt.label}</Text>
                  <Text className="text-slate-500 text-[12px] mt-0.5">{opt.sub}</Text>
                </OptionButton>
              ))}
            </SectionCard>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 2: SIP AMOUNT + GOAL
           ══════════════════════════════════════════════════════ */}
          {step === 2 && (
            <>
              {/* SIP Amount */}
              <SectionCard>
                <SectionLabel text="Monthly SIP amount you can invest" />

                {/* Preset chips */}
                <View className="flex-row flex-wrap mb-3" style={{ gap: 8 }}>
                  {SIP_PRESETS.map((amt) => {
                    const selected = profile.savings === String(amt) && customSip === '';
                    return (
                      <TouchableOpacity
                        key={amt}
                        activeOpacity={0.7}
                        onPress={() => {
                          set('savings', String(amt));
                          setSipAmount(amt);
                          setCustomSip('');
                        }}
                        className={`rounded-xl border px-4 py-2.5 ${
                          selected
                            ? 'bg-sky-500/10 border-sky-500/40'
                            : 'bg-slate-800/30 border-slate-700/50'
                        }`}
                      >
                        <Text
                          className={`text-[13px] font-bold ${
                            selected ? 'text-sky-400' : 'text-slate-400'
                          }`}
                        >
                          ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom input */}
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <Text className="text-slate-500 text-[12px]">Or enter:</Text>
                  <View className="flex-1 flex-row items-center bg-[#0A0F1E] border border-slate-700/60 rounded-xl px-3 py-2.5">
                    <Text className="text-slate-500 text-[13px] mr-1">₹</Text>
                    <TextInput
                      value={customSip}
                      onChangeText={(text) => {
                        setCustomSip(text);
                        const val = Number(text);
                        if (val >= 500) {
                          set('savings', text);
                          setSipAmount(val);
                        }
                      }}
                      placeholder="e.g. 50000"
                      placeholderTextColor="#334155"
                      keyboardType="numeric"
                      className="flex-1 text-slate-100 text-[13px]"
                      style={{ padding: 0 }}
                    />
                  </View>
                </View>

                <View className="flex-row items-start mt-3" style={{ gap: 6 }}>
                  <Info size={12} color="#475569" style={{ marginTop: 2 }} />
                  <Text className="text-slate-600 text-[11px] flex-1 leading-4">
                    For lumpsum investment, enter your total amount and treat allocation % as investment split.
                  </Text>
                </View>
              </SectionCard>

              {/* Goal */}
              <SectionCard>
                <SectionLabel text="What is your primary goal?" />
                {[
                  { val: 'wealth', label: 'Long-term Wealth Creation', sub: '10+ years horizon, maximize returns' },
                  { val: 'tax', label: 'Tax Saving (ELSS)', sub: 'Save up to ₹1.5L under 80C' },
                  { val: 'retirement', label: 'Retirement Planning', sub: 'Build a retirement corpus' },
                  { val: 'house', label: 'Buy a House / Big Goal', sub: '5-7 year horizon' },
                ].map((opt) => (
                  <OptionButton
                    key={opt.val}
                    selected={profile.goal === opt.val}
                    onPress={() => set('goal', opt.val)}
                  >
                    <Text className="text-slate-100 text-[14px] font-semibold">{opt.label}</Text>
                    <Text className="text-slate-500 text-[12px] mt-0.5">{opt.sub}</Text>
                  </OptionButton>
                ))}
              </SectionCard>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 3: RISK APPETITE
           ══════════════════════════════════════════════════════ */}
          {step === 3 && (
            <SectionCard>
              <SectionLabel text="What's your risk appetite?" />
              {[
                {
                  val: 'conservative',
                  label: 'Conservative',
                  sub: 'I prefer stability over high returns',
                  emoji: '🛡️',
                  Icon: Shield,
                  color: '#22C55E',
                },
                {
                  val: 'moderate',
                  label: 'Moderate',
                  sub: 'I can handle some ups and downs',
                  emoji: '⚖️',
                  Icon: Scale,
                  color: '#38BDF8',
                },
                {
                  val: 'aggressive',
                  label: 'Aggressive',
                  sub: 'Maximum growth, I can handle volatility',
                  emoji: '🚀',
                  Icon: Rocket,
                  color: '#F59E0B',
                },
              ].map((opt) => (
                <OptionButton
                  key={opt.val}
                  selected={profile.risk === opt.val}
                  onPress={() => set('risk', opt.val)}
                >
                  <View className="flex-row items-center" style={{ gap: 14 }}>
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: `${opt.color}15` }}
                    >
                      <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-100 text-[14px] font-semibold">{opt.label}</Text>
                      <Text className="text-slate-500 text-[12px] mt-0.5">{opt.sub}</Text>
                    </View>
                    {profile.risk === opt.val && (
                      <CheckCircle size={18} color="#38BDF8" />
                    )}
                  </View>
                </OptionButton>
              ))}
            </SectionCard>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 4: RESULTS
           ══════════════════════════════════════════════════════ */}
          {step === 4 && result && (
            <>
              {/* Success Header */}
              <View className="items-center mb-6">
                <View className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 items-center justify-center mb-4">
                  <CheckCircle size={24} color="#22C55E" />
                </View>
                <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-3">
                  <Text className="text-emerald-400 text-[11px] font-bold tracking-wider">
                    STARTER IQ PORTFOLIO
                  </Text>
                </View>
                <Text
                  className="text-slate-50 font-black text-center mb-1.5"
                  style={{ fontSize: isSmall ? 22 : 26 }}
                >
                  {result.portfolio.label}
                </Text>
                <Text className="text-slate-400 text-[13px] text-center leading-5 px-4">
                  {result.portfolio.description}
                </Text>
              </View>

              {/* Health Score Card */}
              {result.analysis?.health_score && (
                <SectionCard className="items-center">
                  <Text className="text-slate-500 text-[11px] font-medium tracking-wider uppercase mb-3">
                    Projected Portfolio Health Score™
                  </Text>
                  <Text className="text-emerald-400 font-black" style={{ fontSize: 56, lineHeight: 60 }}>
                    {result.analysis.health_score}
                  </Text>
                  <View className="bg-emerald-500/10 rounded-lg px-3 py-1 mt-2 mb-2">
                    <Text className="text-emerald-400 text-[16px] font-bold">
                      Grade {result.analysis.grade}
                    </Text>
                  </View>
                  <Text className="text-slate-500 text-[11px] text-center">
                    Zero overlap between recommended funds
                  </Text>
                </SectionCard>
              )}

              {/* Fund Allocation */}
              <SectionCard>
                <SectionLabel text="Example Starter Portfolio" />

                {/* Disclaimer */}
                <View className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3.5 py-3 mb-4 flex-row" style={{ gap: 10 }}>
                  <AlertTriangle size={14} color="#FCD34D" style={{ marginTop: 1 }} />
                  <Text className="text-amber-300/80 text-[11px] flex-1 leading-4">
                    Illustrative example only. Not personalized advice. Research each fund before investing.
                  </Text>
                </View>

                {result.portfolio.funds.map((f: any, i: number) => (
                  <View
                    key={i}
                    className={`mb-4 pb-4 ${
                      i < result.portfolio.funds.length - 1 ? 'border-b border-slate-800/60' : ''
                    }`}
                  >
                    {/* Fund header row */}
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-3">
                        <Text
                          className="text-slate-100 text-[13px] font-semibold leading-5"
                          numberOfLines={2}
                        >
                          {f.name}
                        </Text>
                        <View className="bg-sky-500/10 self-start rounded-md px-2 py-0.5 mt-1.5">
                          <Text className="text-sky-400 text-[10px] font-bold">{f.type}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-slate-50 text-[20px] font-black">{f.allocation}%</Text>
                        <Text className="text-slate-500 text-[11px]">
                          ₹{formatINR(Math.round((sipAmount * f.allocation) / 100))}/mo
                        </Text>
                      </View>
                    </View>

                    {/* Allocation bar */}
                    <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <View
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${f.allocation}%` }}
                      />
                    </View>

                    {/* Why */}
                    <View className="flex-row items-start" style={{ gap: 6 }}>
                      <Text className="text-[12px]" style={{ lineHeight: 16 }}>💡</Text>
                      <Text className="text-slate-500 text-[12px] flex-1 leading-4">{f.why}</Text>
                    </View>
                  </View>
                ))}

                {/* Total */}
                <View className="flex-row justify-between items-center pt-3 border-t border-slate-800/60">
                  <Text className="text-slate-400 text-[13px]">Total Monthly SIP</Text>
                  <Text className="text-slate-50 text-[16px] font-bold">
                    ₹{formatINR(sipAmount)}
                  </Text>
                </View>
              </SectionCard>

              {/* Overlap badge */}
              <View className="bg-emerald-500/6 border border-emerald-500/20 rounded-2xl px-4 py-3 mb-4 flex-row items-center" style={{ gap: 10 }}>
                <CheckCircle size={16} color="#22C55E" />
                <Text className="text-emerald-300 text-[12px] flex-1 leading-5 font-medium">
                  These 3 funds have minimal overlap — each adds genuine diversification.
                </Text>
              </View>

              {/* Start Over Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={startOver}
                className="bg-sky-500 rounded-2xl py-4 flex-row items-center justify-center mb-6 shadow-md shadow-sky-500/20"
                style={{ gap: 8 }}
              >
                <RotateCcw size={16} color="#FFFFFF" />
                <Text className="text-white text-[14px] font-bold">
                  Start Over with Different Answers
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Navigation Buttons (Steps 1-3) ── */}
          {step < 4 && (
            <View className="flex-row mt-2 mb-4" style={{ gap: 10 }}>
              {step > 1 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={goBack}
                  className="flex-row items-center border border-slate-700/60 rounded-xl px-5 py-3.5"
                  style={{ gap: 6 }}
                >
                  <ArrowLeft size={14} color="#64748B" />
                  <Text className="text-slate-400 text-[13px] font-semibold">Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={canNext && !loading ? 0.8 : 1}
                onPress={canNext && !loading ? goNext : undefined}
                className={`flex-1 flex-row items-center justify-center rounded-xl py-3.5 ${
                  canNext && !loading ? 'bg-sky-500' : 'bg-slate-800/40'
                }`}
                style={{ gap: 8, opacity: canNext && !loading ? 1 : 0.5 }}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-white text-[14px] font-bold">Building portfolio…</Text>
                  </>
                ) : (
                  <>
                    <Text
                      className={`text-[14px] font-bold ${
                        canNext ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {step === 3 ? 'Build My Portfolio' : 'Next'}
                    </Text>
                    <ArrowRight size={15} color={canNext ? '#FFFFFF' : '#475569'} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}