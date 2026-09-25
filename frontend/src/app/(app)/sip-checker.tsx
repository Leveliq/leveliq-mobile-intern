// src/app/(app)/sip-checker.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, X, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const API = process.env.EXPO_PUBLIC_API_URL || 'https://leveliq-production.up.railway.app';

const DEFAULT_PORTFOLIO = [
  { scheme_code: '100016', scheme_name: 'HDFC Flexi Cap Fund Direct Growth', value: 50000 },
  { scheme_code: '122639', scheme_name: 'Parag Parikh Flexi Cap Fund Direct Growth', value: 40000 },
  { scheme_code: '120716', scheme_name: 'UTI Nifty 50 Index Fund Direct Growth', value: 30000 },
];

// ══════════════════════════════════════════════════════════════
// Custom Debounced Search Hook
// ══════════════════════════════════════════════════════════════
function useDebounceSearch(query: string) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/mf/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.funds || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, setResults };
}

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function SIPCheckerScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<any[]>(DEFAULT_PORTFOLIO);

  // Step 1: Existing fund search
  const [existingQuery, setExistingQuery] = useState('');
  const [existingAmount, setExistingAmount] = useState('10000');
  const { results: existingResults, setResults: setExistingResults } = useDebounceSearch(existingQuery);

  // Step 2: New fund search
  const [newQuery, setNewQuery] = useState('');
  const [newAmount, setNewAmount] = useState('5000');
  const [newSelected, setNewSelected] = useState<any>(null);
  const { results: newResults, setResults: setNewResults } = useDebounceSearch(newQuery);

  // Results
  const [before, setBefore] = useState<any>(null);
  const [after, setAfter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addToPortfolio = (fund: any) => {
    if (portfolio.find((f) => f.scheme_code === fund.scheme_code)) return;
    setPortfolio([...portfolio, { ...fund, value: Number(existingAmount) || 10000 }]);
    setExistingQuery('');
    setExistingResults([]);
    Keyboard.dismiss();
  };

  const removeFromPortfolio = (code: string) => {
    setPortfolio(portfolio.filter((f) => f.scheme_code !== code));
    if (before) {
      setBefore(null);
      setAfter(null);
    }
  };

  const analyze = async (funds: any[]) => {
    const res = await fetch(`${API}/api/portfolio/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings: funds, user_id: user?.id || null }),
    });
    if (!res.ok) throw new Error('Analysis failed');
    return res.json();
  };

  const runCheck = async () => {
    if (!newSelected || portfolio.length === 0) return;
    setLoading(true);
    setError('');
    setBefore(null);
    setAfter(null);
    Keyboard.dismiss();
    try {
      const [b, a] = await Promise.all([
        analyze(portfolio),
        analyze([
          ...portfolio,
          {
            scheme_code: newSelected.scheme_code,
            scheme_name: newSelected.scheme_name,
            value: Number(newAmount) || 5000,
          },
        ]),
      ]);
      setBefore(b);
      setAfter(a);
    } catch {
      setError('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const diff = before && after ? after.health_score - before.health_score : null;
  const canCheck = newSelected && portfolio.length > 0 && !loading;

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
        <View className="items-center mb-6">
          <View className="bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-full mb-3">
            <Text className="text-purple-400 text-[11px] font-semibold">PRE-SIP CHECKER</Text>
          </View>
          <Text className="text-slate-50 text-[26px] font-extrabold text-center tracking-tight mb-2">
            Will this fund help or hurt?
          </Text>
          <Text className="text-slate-500 text-[13px] text-center px-2 leading-5">
            Add your existing funds, then search the new fund you're considering.
          </Text>
        </View>

        {/* ─── STEP 1: Current Portfolio ─────────────────── */}
        <View className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase">
              Step 1 — Your current portfolio
            </Text>
          </View>

          {/* Existing funds */}
          {portfolio.length > 0 ? (
            <View className="mb-3">
              {portfolio.map((f) => (
                <View
                  key={f.scheme_code}
                  className="flex-row items-center justify-between bg-[#0A0F1E] rounded-xl p-3 mb-2"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-slate-200 text-[13px] font-semibold" numberOfLines={2}>
                      {f.scheme_name}
                    </Text>
                    <Text className="text-slate-500 text-[11px] mt-1">
                      ₹{(f.value / 1000).toFixed(0)}K invested
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFromPortfolio(f.scheme_code)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-1"
                  >
                    <X size={14} color="#475569" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="py-3">
              <Text className="text-slate-600 text-[13px] text-center">
                Search and add your existing funds below
              </Text>
            </View>
          )}

          {/* Existing search input */}
          <View className="relative mb-3">
            <View className="absolute left-3 top-3 z-10">
              <Search size={13} color="#475569" />
            </View>
            <TextInput
              value={existingQuery}
              onChangeText={setExistingQuery}
              placeholder="Search and add a fund..."
              placeholderTextColor="#475569"
              className="bg-[#0A0F1E] border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-slate-50 text-[13px]"
            />

            {existingResults.length > 0 && (
              <View className="absolute top-[48px] left-0 right-0 z-50 bg-[#0F172A] border border-slate-800 rounded-xl max-h-[220px] overflow-hidden">
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  {existingResults.slice(0, 5).map((r, i) => (
                    <TouchableOpacity
                      key={r.scheme_code}
                      onPress={() => addToPortfolio(r)}
                      className={`px-3.5 py-3 ${i < 4 ? 'border-b border-slate-800' : ''}`}
                    >
                      <Text className="text-slate-200 text-[13px]" numberOfLines={1}>{r.scheme_name}</Text>
                      <Text className="text-slate-500 text-[11px] mt-0.5">{r.fund_house}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Amount input */}
          <View className="flex-row items-center gap-2">
            <Text className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Amount ₹</Text>
            <TextInput
              value={existingAmount}
              onChangeText={setExistingAmount}
              keyboardType="numeric"
              className="bg-[#0A0F1E] border border-slate-800 rounded-lg px-3 py-2 text-slate-50 text-[13px] w-[110px]"
            />
            <Text className="text-slate-600 text-[11px]">per fund added</Text>
          </View>
        </View>

        {/* ─── STEP 2: New Fund ─────────────────────────── */}
        <View className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 mb-4">
          <Text className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase mb-4">
            Step 2 — Fund you want to add
          </Text>

          <View className="relative mb-3">
            <View className="absolute left-3 top-3 z-10">
              <Search size={13} color="#475569" />
            </View>
            <TextInput
              value={newQuery}
              onChangeText={(text) => {
                setNewQuery(text);
                setNewSelected(null);
              }}
              placeholder="Search new fund e.g. Axis Midcap..."
              placeholderTextColor="#475569"
              className="bg-[#0A0F1E] border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-slate-50 text-[13px]"
            />

            {newResults.length > 0 && !newSelected && (
              <View className="absolute top-[48px] left-0 right-0 z-50 bg-[#0F172A] border border-slate-800 rounded-xl max-h-[220px] overflow-hidden">
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  {newResults.slice(0, 5).map((r, i) => (
                    <TouchableOpacity
                      key={r.scheme_code}
                      onPress={() => {
                        setNewSelected(r);
                        setNewQuery(r.scheme_name);
                        setNewResults([]);
                        Keyboard.dismiss();
                      }}
                      className={`px-3.5 py-3 ${i < 4 ? 'border-b border-slate-800' : ''}`}
                    >
                      <Text className="text-slate-200 text-[13px]" numberOfLines={1}>{r.scheme_name}</Text>
                      <Text className="text-slate-500 text-[11px] mt-0.5">{r.fund_house}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Selected new fund pill */}
          {newSelected && (
            <View className="flex-row items-center justify-between bg-blue-500/10 border border-blue-500/25 rounded-xl px-3.5 py-2.5 mb-3">
              <View className="flex-1 mr-2">
                <Text className="text-blue-300 text-[13px] font-semibold" numberOfLines={2}>
                  {newSelected.scheme_name}
                </Text>
                <Text className="text-slate-500 text-[11px] mt-0.5">{newSelected.fund_house}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setNewSelected(null);
                  setNewQuery('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color="#475569" />
              </TouchableOpacity>
            </View>
          )}

          {/* Monthly SIP amount */}
          <View className="mb-3">
            <Text className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
              Monthly SIP ₹
            </Text>
            <TextInput
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
              className="bg-[#0A0F1E] border border-slate-800 rounded-xl px-3 py-3 text-slate-50 text-[13px]"
            />
          </View>

          {/* Check button */}
          <TouchableOpacity
            onPress={runCheck}
            disabled={!canCheck}
            className={`py-3.5 rounded-xl items-center justify-center flex-row ${canCheck ? 'bg-purple-600' : 'bg-slate-800/60'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text className={`text-[14px] font-bold ${canCheck ? 'text-white' : 'text-slate-600'}`}>
                  Check Impact
                </Text>
                {canCheck && <ArrowRight size={14} color="#fff" style={{ marginLeft: 6 }} />}
              </>
            )}
          </TouchableOpacity>

          {portfolio.length === 0 && (
            <Text className="text-red-500 text-[11px] mt-2">↑ Add at least one fund in Step 1 first</Text>
          )}

          {error ? (
            <Text className="text-red-500 text-[12px] mt-2 text-center">{error}</Text>
          ) : null}
        </View>

        {/* ─── STEP 3: Results ─────────────────────────── */}
        {before && after && diff !== null && (
          <>
            {/* Score comparison */}
            <View className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 mb-4">
              <Text className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase mb-4">
                Step 3 — Impact
              </Text>

              <View className="flex-row items-center justify-between">
                {/* Before */}
                <View className="flex-1 bg-[#0A0F1E] rounded-xl py-4 items-center mr-2">
                  <Text className="text-slate-500 text-[11px] mb-1.5">Before</Text>
                  <Text className="text-slate-100 text-[38px] font-black leading-[42px]">
                    {before.health_score}
                  </Text>
                  <Text className="text-amber-500 text-[12px] font-bold mt-1">Grade {before.grade}</Text>
                </View>

                {/* Diff */}
                <View className="items-center px-2">
                  {diff > 0 ? (
                    <TrendingUp size={22} color="#22C55E" />
                  ) : diff < 0 ? (
                    <TrendingDown size={22} color="#EF4444" />
                  ) : (
                    <Minus size={22} color="#64748B" />
                  )}
                  <Text
                    className="text-[22px] font-black mt-1"
                    style={{ color: diff > 0 ? '#22C55E' : diff < 0 ? '#EF4444' : '#64748B' }}
                  >
                    {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                  </Text>
                  <Text className="text-slate-600 text-[10px] mt-0.5">
                    {diff > 0 ? 'better' : diff < 0 ? 'worse' : 'same'}
                  </Text>
                </View>

                {/* After */}
                <View
                  className="flex-1 rounded-xl py-4 items-center ml-2 bg-[#0A0F1E] border"
                  style={{
                    borderColor:
                      diff > 0 ? 'rgba(34,197,94,0.3)' : diff < 0 ? 'rgba(239,68,68,0.3)' : '#1E293B',
                  }}
                >
                  <Text className="text-slate-500 text-[11px] mb-1.5">After</Text>
                  <Text
                    className="text-[38px] font-black leading-[42px]"
                    style={{ color: diff > 0 ? '#22C55E' : diff < 0 ? '#EF4444' : '#F1F5F9' }}
                  >
                    {after.health_score}
                  </Text>
                  <Text className="text-amber-500 text-[12px] font-bold mt-1">Grade {after.grade}</Text>
                </View>
              </View>
            </View>

            {/* Verdict */}
            <View
              className="rounded-2xl p-4 mb-4 flex-row"
              style={{
                backgroundColor:
                  diff > 2 ? 'rgba(34,197,94,0.08)' :
                  diff < -2 ? 'rgba(239,68,68,0.08)' :
                  'rgba(100,116,139,0.08)',
                borderWidth: 1,
                borderColor:
                  diff > 2 ? 'rgba(34,197,94,0.25)' :
                  diff < -2 ? 'rgba(239,68,68,0.25)' :
                  'rgba(100,116,139,0.2)',
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 10 }}>
                {diff > 2 ? '✅' : diff < -2 ? '⚠️' : 'ℹ️'}
              </Text>
              <View className="flex-1">
                <Text className="text-slate-100 text-[14px] font-bold mb-1">
                  {diff > 2 ? 'Good addition' : diff < -2 ? 'High overlap — reconsider' : 'Minimal impact'}
                </Text>
                <Text className="text-slate-500 text-[13px] leading-5">
                  {diff > 2
                    ? `${newSelected?.scheme_name} diversifies your portfolio.`
                    : diff < -2
                    ? `${newSelected?.scheme_name} heavily overlaps with your existing funds.`
                    : `${newSelected?.scheme_name} has low impact on your portfolio.`}
                </Text>
              </View>
            </View>

            {/* Overlaps with the new fund */}
            {after.overlaps?.filter(
              (o: any) =>
                o.fund1_code === newSelected?.scheme_code ||
                o.fund2_code === newSelected?.scheme_code
            ).length > 0 && (
              <View className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 mb-4">
                <Text className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase mb-4">
                  Overlaps with new fund
                </Text>

                {after.overlaps
                  .filter(
                    (o: any) =>
                      o.fund1_code === newSelected?.scheme_code ||
                      o.fund2_code === newSelected?.scheme_code
                  )
                  .map((o: any, i: number) => {
                    const pct = o.overlap_pct ?? 0;
                    const otherName =
                      o.fund1_code === newSelected?.scheme_code ? o.fund2_name : o.fund1_name;
                    const color = pct > 50 ? '#EF4444' : pct > 30 ? '#F59E0B' : '#22C55E';

                    return (
                      <View key={i} className="mb-3">
                        <View className="flex-row justify-between mb-1.5">
                          <Text className="text-slate-300 text-[13px] flex-1 mr-2" numberOfLines={2}>
                            {otherName}
                          </Text>
                          <Text className="text-[14px] font-black" style={{ color }}>
                            {pct.toFixed(1)}%
                          </Text>
                        </View>
                        <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                          />
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}

            {/* CTA — Analyze full portfolio */}
            <View className="items-center pt-2">
              <TouchableOpacity
                onPress={() => router.push('/(app)/analyze' as any)}
                className="flex-row items-center bg-blue-600 py-3.5 px-6 rounded-xl"
              >
                <Text className="text-white text-[14px] font-bold mr-2">Analyze My Full Portfolio</Text>
                <ArrowRight size={15} color="#fff" />
              </TouchableOpacity>
              <Text className="text-slate-600 text-[11px] mt-2">Quick portfolio deep-dive</Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}