// src/app/(app)/sip-checker.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, X, ArrowRight, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const API = process.env.EXPO_PUBLIC_API_URL || 'https://leveliq-production.up.railway.app';

const DEFAULT_PORTFOLIO = [
  { scheme_code: '100016', scheme_name: 'HDFC Flexi Cap Fund Direct Growth', value: 50000 },
  { scheme_code: '122639', scheme_name: 'Parag Parikh Flexi Cap Fund Direct Growth', value: 40000 },
  { scheme_code: '120716', scheme_name: 'UTI Nifty 50 Index Fund Direct Growth', value: 30000 },
];

// ══════════════════════════════════════════════════════════════
// Theme — same tokens as AuthScreen.tsx / analyze.tsx
// ══════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#050816',
  card: 'rgba(15, 23, 42, 0.88)',
  cardBorder: 'rgba(56, 189, 248, 0.15)',
  input: '#0b1326',
  inputBorder: 'rgba(148, 163, 184, 0.15)',
  accent: '#38BDF8',
  primary: '#2563EB',
  textPrimary: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#475569',
  green: '#22C55E',
  red: '#EF4444',
  amber: '#F59E0B',
};

const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.45,
  shadowRadius: 20,
  elevation: 8,
};

const cardStyle = {
  backgroundColor: COLORS.card,
  borderColor: COLORS.cardBorder,
  borderWidth: 1,
  borderRadius: 20,
  padding: 18,
  marginBottom: 16,
  ...cardShadow,
};

const primaryButtonStyle = (enabled: boolean) => ({
  backgroundColor: enabled ? COLORS.primary : 'rgba(148,163,184,0.08)',
  borderRadius: 14,
  paddingVertical: 15,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexDirection: 'row' as const,
  ...(enabled
    ? { shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 5 }
    : {}),
});

const inputStyle = (hasError?: boolean) => ({
  backgroundColor: COLORS.input,
  borderColor: hasError ? COLORS.red : COLORS.inputBorder,
  borderWidth: 1,
  borderRadius: 12,
  color: COLORS.textPrimary,
  fontSize: 13,
});

function StepBadge({ n }: { n: number }) {
  return (
    <View style={{
      width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(56,189,248,0.12)',
      borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 8,
    }}>
      <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '800' }}>{n}</Text>
    </View>
  );
}

function StepLabel({ n, text, trailing }: { n: number; text: string; trailing?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <StepBadge n={n} />
        <Text style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>{text}</Text>
      </View>
      {trailing}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// Debounced, abortable fund search
// ══════════════════════════════════════════════════════════════
function useDebounceSearch(query: string) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`${API}/api/mf/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.funds || []);
      } catch (err: any) {
        if (err?.name !== 'AbortError') setResults([]);
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { results, loading, setResults };
}

// Small spinner/chevron that lives inside a search input's right edge.
function SearchAdornment({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View style={{ position: 'absolute', right: 12, top: 12 }}>
      <ActivityIndicator size="small" color={COLORS.accent} />
    </View>
  );
}

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[₹,]/g, ''));
  return raw.trim() !== '' && !isNaN(n) && n > 0 ? n : null;
}

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function SIPCheckerScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const [portfolio, setPortfolio] = useState<any[]>(DEFAULT_PORTFOLIO);

  const [existingQuery, setExistingQuery] = useState('');
  const [existingAmount, setExistingAmount] = useState('10000');
  const { results: existingResults, loading: existingLoading, setResults: setExistingResults } = useDebounceSearch(existingQuery);

  const [newQuery, setNewQuery] = useState('');
  const [newAmount, setNewAmount] = useState('5000');
  const [newSelected, setNewSelected] = useState<any>(null);
  const { results: newResults, loading: newLoading, setResults: setNewResults } = useDebounceSearch(newQuery);

  const [before, setBefore] = useState<any>(null);
  const [after, setAfter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const existingAmountValue = parseAmount(existingAmount);
  const newAmountValue = parseAmount(newAmount);

  const addToPortfolio = (fund: any) => {
    if (existingAmountValue === null) return; // guarded by disabled state too, belt-and-braces
    if (portfolio.find((f) => f.scheme_code === fund.scheme_code)) return;
    setPortfolio([...portfolio, { ...fund, value: existingAmountValue }]);
    setExistingQuery('');
    setExistingResults([]);
    Keyboard.dismiss();
  };

  const removeFromPortfolio = (code: string) => {
    setPortfolio(portfolio.filter((f) => f.scheme_code !== code));
    if (before) { setBefore(null); setAfter(null); }
  };

  const analyze = async (funds: any[], signal: AbortSignal) => {
    const res = await fetch(`${API}/api/portfolio/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings: funds, user_id: user?.id || null }),
      signal,
    });
    if (!res.ok) throw new Error('Analysis failed');
    return res.json();
  };

  const runCheck = async () => {
    if (!newSelected || portfolio.length === 0 || newAmountValue === null) return;
    const myRequestId = ++requestIdRef.current;
    const controller = new AbortController();

    setLoading(true);
    setError('');
    setBefore(null);
    setAfter(null);
    Keyboard.dismiss();

    try {
      const [b, a] = await Promise.all([
        analyze(portfolio, controller.signal),
        analyze([...portfolio, { scheme_code: newSelected.scheme_code, scheme_name: newSelected.scheme_name, value: newAmountValue }], controller.signal),
      ]);
      // Only the most recent check may apply its result — an older stale call can still resolve later.
      if (!mountedRef.current || myRequestId !== requestIdRef.current) return;
      setBefore(b);
      setAfter(a);
    } catch (err: any) {
      if (!mountedRef.current || myRequestId !== requestIdRef.current || err?.name === 'AbortError') return;
      setError('Failed to analyze. Please try again.');
    } finally {
      if (mountedRef.current && myRequestId === requestIdRef.current) setLoading(false);
    }
  };

  const diff = before && after ? after.health_score - before.health_score : null;
  const canCheck = !!newSelected && portfolio.length > 0 && newAmountValue !== null && !loading;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Ambient glows — same treatment as AuthScreen */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -110, alignSelf: 'center', width: 320, height: 320, borderRadius: 160, backgroundColor: '#123D91', opacity: 0.22 }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: -140, alignSelf: 'center', width: 320, height: 320, borderRadius: 160, backgroundColor: '#0C4A6E', opacity: 0.2 }} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.28)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 14 }}>
              <Sparkles size={11} color={COLORS.accent} style={{ marginRight: 6 }} />
              <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>PRE-SIP CHECKER</Text>
            </View>
            <Text style={{ color: COLORS.textPrimary, fontSize: 25, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4, marginBottom: 8 }}>
              Will this fund help or hurt?
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 8, lineHeight: 19 }}>
              Add your existing funds, then search the new fund you're considering.
            </Text>
          </View>

          {/* ── STEP 1: Current Portfolio ── */}
          <View style={cardStyle}>
            <StepLabel n={1} text="Your current portfolio" />

            {portfolio.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                {portfolio.map((f) => (
                  <View key={f.scheme_code} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.input, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600' }} numberOfLines={2}>{f.scheme_name}</Text>
                      <Text style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 3 }}>₹{(f.value / 1000).toFixed(0)}K invested</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromPortfolio(f.scheme_code)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ padding: 4 }}>
                      <X size={14} color={COLORS.textFaint} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 14 }}>
                <Text style={{ color: '#334155', fontSize: 13, textAlign: 'center' }}>Search and add your existing funds below</Text>
              </View>
            )}

            <View style={{ position: 'relative', marginBottom: 12 }}>
              <View style={{ position: 'absolute', left: 13, top: 13, zIndex: 10 }}>
                <Search size={13} color={COLORS.textFaint} />
              </View>
              <TextInput
                value={existingQuery}
                onChangeText={setExistingQuery}
                placeholder="Search and add a fund..."
                placeholderTextColor={COLORS.textFaint}
                style={[inputStyle(), { paddingLeft: 34, paddingRight: 34, paddingVertical: 12 }]}
              />
              <SearchAdornment loading={existingLoading} />

              {existingResults.length > 0 && (
                <View style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 50, backgroundColor: '#0F172A', borderColor: COLORS.cardBorder, borderWidth: 1, borderRadius: 12, maxHeight: 220, overflow: 'hidden' }}>
                  <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {existingResults.slice(0, 5).map((r, i) => (
                      <TouchableOpacity
                        key={r.scheme_code}
                        onPress={() => addToPortfolio(r)}
                        disabled={existingAmountValue === null}
                        style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: 'rgba(51,65,85,0.5)', opacity: existingAmountValue === null ? 0.4 : 1 }}
                      >
                        <Text style={{ color: '#E2E8F0', fontSize: 13 }} numberOfLines={1}>{r.scheme_name}</Text>
                        <Text style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>{r.fund_house}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' as any }}>Amount ₹</Text>
                <TextInput
                  value={existingAmount}
                  onChangeText={setExistingAmount}
                  keyboardType="numeric"
                  style={[inputStyle(existingAmountValue === null), { paddingHorizontal: 12, paddingVertical: 9, width: 120 }]}
                />
                <Text style={{ color: '#334155', fontSize: 11 }}>per fund added</Text>
              </View>
              {existingAmountValue === null && (
                <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 6 }}>Enter a valid amount before adding a fund</Text>
              )}
            </View>
          </View>

          {/* ── STEP 2: New Fund ── */}
          <View style={cardStyle}>
            <StepLabel n={2} text="Fund you want to add" />

            <View style={{ position: 'relative', marginBottom: 12 }}>
              <View style={{ position: 'absolute', left: 13, top: 13, zIndex: 10 }}>
                <Search size={13} color={COLORS.textFaint} />
              </View>
              <TextInput
                value={newQuery}
                onChangeText={(text) => { setNewQuery(text); setNewSelected(null); }}
                placeholder="Search new fund e.g. Axis Midcap..."
                placeholderTextColor={COLORS.textFaint}
                style={[inputStyle(), { paddingLeft: 34, paddingRight: 34, paddingVertical: 12 }]}
              />
              <SearchAdornment loading={newLoading} />

              {newResults.length > 0 && !newSelected && (
                <View style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 50, backgroundColor: '#0F172A', borderColor: COLORS.cardBorder, borderWidth: 1, borderRadius: 12, maxHeight: 220, overflow: 'hidden' }}>
                  <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {newResults.slice(0, 5).map((r, i) => (
                      <TouchableOpacity
                        key={r.scheme_code}
                        onPress={() => { setNewSelected(r); setNewQuery(r.scheme_name); setNewResults([]); Keyboard.dismiss(); }}
                        style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: 'rgba(51,65,85,0.5)' }}
                      >
                        <Text style={{ color: '#E2E8F0', fontSize: 13 }} numberOfLines={1}>{r.scheme_name}</Text>
                        <Text style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>{r.fund_house}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {newSelected && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.25)', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '600' }} numberOfLines={2}>{newSelected.scheme_name}</Text>
                  <Text style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>{newSelected.fund_house}</Text>
                </View>
                <TouchableOpacity onPress={() => { setNewSelected(null); setNewQuery(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={14} color={COLORS.textFaint} />
                </TouchableOpacity>
              </View>
            )}

            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 7 }}>Monthly SIP ₹</Text>
              <TextInput
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="numeric"
                style={[inputStyle(newAmountValue === null), { paddingHorizontal: 13, paddingVertical: 12 }]}
              />
              {newAmountValue === null && <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 6 }}>Enter a valid SIP amount</Text>}
            </View>

            <TouchableOpacity onPress={runCheck} disabled={!canCheck} activeOpacity={0.85} style={primaryButtonStyle(canCheck)}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: canCheck ? '#fff' : COLORS.textFaint }}>Check Impact</Text>
                  {canCheck && <ArrowRight size={14} color="#fff" style={{ marginLeft: 8 }} />}
                </>
              )}
            </TouchableOpacity>

            {portfolio.length === 0 && (
              <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 8 }}>↑ Add at least one fund in Step 1 first</Text>
            )}
            {error ? <Text style={{ color: COLORS.red, fontSize: 12, marginTop: 8, textAlign: 'center' }}>{error}</Text> : null}
          </View>

          {/* ── STEP 3: Results ── */}
          {before && after && diff !== null && (
            <>
              <View style={cardStyle}>
                <StepLabel n={3} text="Impact" />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, backgroundColor: COLORS.input, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginRight: 8 }}>
                    <Text style={{ color: COLORS.textFaint, fontSize: 11, marginBottom: 6 }}>Before</Text>
                    <Text style={{ color: '#F1F5F9', fontSize: 36, fontWeight: '900', lineHeight: 40 }}>{before.health_score}</Text>
                    <Text style={{ color: COLORS.amber, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Grade {before.grade}</Text>
                  </View>

                  <View style={{ alignItems: 'center', paddingHorizontal: 6 }}>
                    {diff > 0 ? <TrendingUp size={22} color={COLORS.green} /> : diff < 0 ? <TrendingDown size={22} color={COLORS.red} /> : <Minus size={22} color={COLORS.textMuted} />}
                    <Text style={{ fontSize: 20, fontWeight: '900', marginTop: 4, color: diff > 0 ? COLORS.green : diff < 0 ? COLORS.red : COLORS.textMuted }}>
                      {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                    </Text>
                    <Text style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>{diff > 0 ? 'better' : diff < 0 ? 'worse' : 'same'}</Text>
                  </View>

                  <View style={{
                    flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginLeft: 8,
                    backgroundColor: COLORS.input, borderWidth: 1,
                    borderColor: diff > 0 ? 'rgba(34,197,94,0.3)' : diff < 0 ? 'rgba(239,68,68,0.3)' : COLORS.inputBorder,
                  }}>
                    <Text style={{ color: COLORS.textFaint, fontSize: 11, marginBottom: 6 }}>After</Text>
                    <Text style={{ fontSize: 36, fontWeight: '900', lineHeight: 40, color: diff > 0 ? COLORS.green : diff < 0 ? COLORS.red : '#F1F5F9' }}>{after.health_score}</Text>
                    <Text style={{ color: COLORS.amber, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Grade {after.grade}</Text>
                  </View>
                </View>
              </View>

              <View style={{
                borderRadius: 18, padding: 16, marginBottom: 16, flexDirection: 'row',
                backgroundColor: diff > 2 ? 'rgba(34,197,94,0.08)' : diff < -2 ? 'rgba(239,68,68,0.08)' : 'rgba(100,116,139,0.08)',
                borderWidth: 1,
                borderColor: diff > 2 ? 'rgba(34,197,94,0.25)' : diff < -2 ? 'rgba(239,68,68,0.25)' : 'rgba(100,116,139,0.2)',
              }}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>{diff > 2 ? '✅' : diff < -2 ? '⚠️' : 'ℹ️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
                    {diff > 2 ? 'Good addition' : diff < -2 ? 'High overlap — reconsider' : 'Minimal impact'}
                  </Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, lineHeight: 19 }}>
                    {diff > 2
                      ? `${newSelected?.scheme_name} diversifies your portfolio.`
                      : diff < -2
                      ? `${newSelected?.scheme_name} heavily overlaps with your existing funds.`
                      : `${newSelected?.scheme_name} has low impact on your portfolio.`}
                  </Text>
                </View>
              </View>

              {after.overlaps?.filter((o: any) => o.fund1_code === newSelected?.scheme_code || o.fund2_code === newSelected?.scheme_code).length > 0 && (
                <View style={cardStyle}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>
                    Overlaps with new fund
                  </Text>
                  {after.overlaps
                    .filter((o: any) => o.fund1_code === newSelected?.scheme_code || o.fund2_code === newSelected?.scheme_code)
                    .map((o: any, i: number) => {
                      const pct = o.overlap_pct ?? 0;
                      const otherName = o.fund1_code === newSelected?.scheme_code ? o.fund2_name : o.fund1_name;
                      const color = pct > 50 ? COLORS.red : pct > 30 ? COLORS.amber : COLORS.green;
                      return (
                        <View key={i} style={{ marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#CBD5E1', fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={2}>{otherName}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '900', color }}>{pct.toFixed(1)}%</Text>
                          </View>
                          <View style={{ height: 6, backgroundColor: 'rgba(148,163,184,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{ height: '100%', borderRadius: 3, width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                          </View>
                        </View>
                      );
                    })}
                </View>
              )}

              <View style={{ alignItems: 'center', paddingTop: 4 }}>
                <TouchableOpacity
                  onPress={() => router.push('/(app)/analyze' as any)}
                  activeOpacity={0.85}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 5 }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginRight: 8 }}>Analyze My Full Portfolio</Text>
                  <ArrowRight size={15} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#334155', fontSize: 11, marginTop: 8 }}>Quick portfolio deep-dive</Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}