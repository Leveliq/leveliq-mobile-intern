import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { Calculator, TrendingUp, ArrowRight, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = SCREEN_WIDTH < 340;

// ── Helpers ──
const fmt = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

// ── Chip ──
function Chip({ label, active, onPress }: any) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 border ${
        active ? 'bg-sky-500/15 border-sky-500/40' : 'bg-slate-800/30 border-slate-700/60'
      }`}
    >
      <Text
        className={`text-[11px] font-semibold ${active ? 'text-sky-400' : 'text-slate-400'}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Input Field with label + value display ──
function InputField({
  label,
  value,
  displayValue,
  onChangeText,
  keyboardType = 'numeric',
  suffix,
}: any) {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-slate-400 text-[12px]">{label}</Text>
        <Text className="text-sky-400 text-[14px] font-bold">{displayValue}</Text>
      </View>
      <View className="flex-row items-center bg-[#0A0F1E] border border-slate-700/60 rounded-xl px-3 py-3">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor="#334155"
          className="flex-1 text-slate-100 text-[15px]"
          style={{ padding: 0 }}
        />
        {suffix && <Text className="text-slate-500 text-[13px] ml-2">{suffix}</Text>}
      </View>
    </View>
  );
}

export default function SIPCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'sip' | 'lumpsum'>('sip');
  const [monthly, setMonthly] = useState('10000');
  const [lumpsum, setLumpsum] = useState('100000');
  const [years, setYears] = useState('10');
  const [rate, setRate] = useState('12');

  const result = useMemo(() => {
    const m = Number(monthly) || 0;
    const l = Number(lumpsum) || 0;
    const y = Number(years) || 0;
    const rt = Number(rate) || 0;

    const r = rt / 100 / 12;
    const n = y * 12;

    if (mode === 'sip') {
      if (r === 0 || n === 0) return { corpus: 0, invested: 0, gain: 0 };
      const corpus = m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const invested = m * n;
      return { corpus, invested, gain: corpus - invested };
    } else {
      const corpus = l * Math.pow(1 + rt / 100, y);
      return { corpus, invested: l, gain: corpus - l };
    }
  }, [monthly, lumpsum, years, rate, mode]);

  const pct = result.corpus > 0 ? Math.round((result.invested / result.corpus) * 100) : 0;
  const returnsPct =
    result.invested > 0 ? ((result.gain / result.invested) * 100).toFixed(0) : '0';

  const amountPresets = mode === 'sip' ? [5000, 10000, 25000, 50000] : [50000, 100000, 500000, 1000000];
  const yearPresets = [3, 5, 10, 15, 20, 30];
  const ratePresets = [
    { label: 'FD 6%', val: 6 },
    { label: 'Debt 8%', val: 8 },
    { label: 'Index 11%', val: 11 },
    { label: 'Equity 12%', val: 12 },
    { label: 'Small 15%', val: 15 },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View className="flex-1 bg-[#050816]">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: isSmall ? 14 : 18,
            paddingTop: 12,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-5">
            <View className="bg-sky-500/10 border border-sky-500/30 rounded-full px-3 py-1 mb-3 flex-row items-center" style={{ gap: 6 }}>
              <Calculator size={11} color="#38BDF8" />
              <Text className="text-sky-400 text-[10px] font-bold tracking-wider">
                SIP CALCULATOR
              </Text>
            </View>
            <Text
              className="text-slate-50 font-black text-center mb-1.5"
              style={{ fontSize: isSmall ? 22 : 26, letterSpacing: -0.5 }}
            >
              Plan your wealth
            </Text>
            <Text className="text-slate-400 text-[13px] text-center leading-5 px-2">
              See how much wealth your monthly SIP or lumpsum can create over time.
            </Text>
          </View>

          {/* Mode Toggle */}
          <View className="flex-row bg-[#0A0F1E] border border-slate-800/60 rounded-xl p-1 mb-4">
            {(['sip', 'lumpsum'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                activeOpacity={0.8}
                onPress={() => setMode(m)}
                className={`flex-1 rounded-lg py-2.5 items-center ${
                  mode === m ? 'bg-sky-500' : ''
                }`}
              >
                <Text
                  className={`text-[13px] font-bold ${
                    mode === m ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {m === 'sip' ? 'Monthly SIP' : 'Lumpsum'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Inputs Card ── */}
          <View className="bg-[#0F172A] border border-slate-800/60 rounded-2xl p-4 mb-4">
            <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase mb-3">
              Your Investment
            </Text>

            {/* Amount */}
            <InputField
              label={mode === 'sip' ? 'Monthly SIP Amount' : 'Lumpsum Amount'}
              value={mode === 'sip' ? monthly : lumpsum}
              displayValue={fmt(Number(mode === 'sip' ? monthly : lumpsum) || 0)}
              onChangeText={mode === 'sip' ? setMonthly : setLumpsum}
              suffix="₹"
            />
            <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
              {amountPresets.map((p) => (
                <Chip
                  key={p}
                  label={fmt(p)}
                  active={Number(mode === 'sip' ? monthly : lumpsum) === p}
                  onPress={() =>
                    mode === 'sip' ? setMonthly(String(p)) : setLumpsum(String(p))
                  }
                />
              ))}
            </View>

            {/* Years */}
            <InputField
              label="Investment Period"
              value={years}
              displayValue={`${years || 0} yrs`}
              onChangeText={setYears}
              suffix="years"
            />
            <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
              {yearPresets.map((y) => (
                <Chip
                  key={y}
                  label={`${y}Y`}
                  active={Number(years) === y}
                  onPress={() => setYears(String(y))}
                />
              ))}
            </View>

            {/* Rate */}
            <InputField
              label="Expected Return"
              value={rate}
              displayValue={`${rate || 0}% p.a.`}
              onChangeText={setRate}
              suffix="%"
            />
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {ratePresets.map((p) => (
                <Chip
                  key={p.val}
                  label={p.label}
                  active={Number(rate) === p.val}
                  onPress={() => setRate(String(p.val))}
                />
              ))}
            </View>
          </View>

          {/* ── Total Corpus Hero ── */}
          <View className="bg-sky-500/8 border border-sky-500/25 rounded-2xl p-5 items-center mb-3">
            <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase mb-2">
              Total Corpus
            </Text>
            <Text
              className="text-sky-400 font-black"
              style={{ fontSize: isSmall ? 32 : 38, letterSpacing: -0.5, lineHeight: isSmall ? 38 : 44 }}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {fmt(result.corpus)}
            </Text>
            <Text className="text-slate-500 text-[12px] mt-1">
              after {years || 0} years at {rate || 0}% p.a.
            </Text>
          </View>

          {/* ── Breakdown ── */}
          <View className="bg-[#0F172A] border border-slate-800/60 rounded-2xl p-4 mb-3">
            {/* Split bar */}
            <View className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2 flex-row">
              <View className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
              <View className="h-full bg-emerald-500" style={{ width: `${100 - pct}%` }} />
            </View>

            {/* Legend */}
            <View className="flex-row mb-3" style={{ gap: 14 }}>
              <View className="flex-row items-center" style={{ gap: 5 }}>
                <View className="w-2 h-2 rounded-sm bg-blue-500" />
                <Text className="text-slate-500 text-[10px]">Invested</Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 5 }}>
                <View className="w-2 h-2 rounded-sm bg-emerald-500" />
                <Text className="text-slate-500 text-[10px]">Wealth Gain</Text>
              </View>
            </View>

            {/* Rows */}
            {[
              { label: mode === 'sip' ? 'Total Invested' : 'Lumpsum Amount', value: fmt(result.invested), color: '#60A5FA' },
              { label: 'Wealth Gain', value: fmt(result.gain), color: '#22C55E' },
              { label: 'Total Returns', value: `${returnsPct}%`, color: '#38BDF8' },
            ].map((s, i) => (
              <View
                key={i}
                className={`flex-row justify-between py-2.5 ${
                  i < 2 ? 'border-b border-slate-800/60' : ''
                }`}
              >
                <Text className="text-slate-400 text-[13px]">{s.label}</Text>
                <Text className="text-[14px] font-bold" style={{ color: s.color }}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Insight ── */}
          {result.corpus > 0 && (
            <View className="bg-emerald-500/6 border border-emerald-500/20 rounded-2xl p-3.5 mb-3 flex-row" style={{ gap: 10 }}>
              <TrendingUp size={16} color="#22C55E" style={{ marginTop: 1 }} />
              <Text className="text-emerald-300 text-[12px] flex-1 leading-5">
                {mode === 'sip'
                  ? `₹${Number(monthly).toLocaleString('en-IN')}/mo for ${years} years grows to ${fmt(result.corpus)} — ${returnsPct}% growth on your investment.`
                  : `₹${Number(lumpsum).toLocaleString('en-IN')} today becomes ${fmt(result.corpus)} in ${years} years at ${rate}% CAGR.`}
              </Text>
            </View>
          )}

          {/* ── CTA ── */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(app)/analyze')}
            className="bg-sky-500 rounded-2xl py-3.5 flex-row items-center justify-center mb-4"
            style={{ gap: 8 }}
          >
            <Text className="text-white text-[14px] font-bold">
              Check If Your MFs Deliver {rate || 0}%
            </Text>
            <ArrowRight size={15} color="#FFFFFF" />
          </TouchableOpacity>

          {/* ── Disclaimer ── */}
          <View className="flex-row items-start px-2" style={{ gap: 6 }}>
            <Info size={11} color="#334155" style={{ marginTop: 2 }} />
            <Text className="text-slate-600 text-[10px] flex-1 leading-4">
              Returns shown are illustrative. Mutual funds are subject to market risks. Past performance doesn't guarantee future results.
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}