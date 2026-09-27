// src/app/(app)/sip-calculator.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Search,
  X,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API = process.env.EXPO_PUBLIC_API_URL || 'https://leveliq-production.up.railway.app';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = SCREEN_WIDTH < 340;

const DEFAULT_PORTFOLIO = [
  { scheme_code: '100016', scheme_name: 'HDFC Flexi Cap Fund Direct Growth', value: 50000 },
  { scheme_code: '122639', scheme_name: 'Parag Parikh Flexi Cap Fund Direct Growth', value: 40000 },
  { scheme_code: '120716', scheme_name: 'UTI Nifty 50 Index Fund Direct Growth', value: 30000 },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-[#0F172A] border border-slate-800/60 rounded-2xl p-4 mb-4">
      {children}
    </View>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase">
      {text}
    </Text>
  );
}

function FundSearch({
  value,
  onChangeText,
  results,
  onSelect,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  results: any[];
  onSelect: (fund: any) => void;
  placeholder: string;
}) {
  return (
    <View className="mb-3 relative z-50">
      <View className="flex-row items-center bg-[#0A0F1E] border border-slate-700/60 rounded-xl px-3 py-2.5">
        <Search size={14} color="#475569" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#334155"
          className="flex-1 text-slate-100 text-[13px] ml-2"
          style={{ padding: 0 }}
        />
      </View>

      {results.length > 0 && (
        <View className="bg-[#0F172A] border border-slate-700/60 rounded-xl mt-2 overflow-hidden">
          {results.slice(0, 5).map((r, i) => (
            <TouchableOpacity
              key={r.scheme_code}
              activeOpacity={0.7}
              onPress={() => onSelect(r)}
              className={`px-3.5 py-2.5 ${
                i < Math.min(results.length, 5) - 1 ? 'border-b border-slate-800/60' : ''
              }`}
            >
              <Text className="text-slate-200 text-[13px]" numberOfLines={1}>
                {r.scheme_name}
              </Text>
              <Text className="text-slate-500 text-[11px] mt-0.5" numberOfLines={1}>
                {r.fund_house}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function SIPCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [portfolio, setPortfolio] = useState<any[]>(DEFAULT_PORTFOLIO);

  const [existingQuery, setExistingQuery] = useState('');
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [existingAmount, setExistingAmount] = useState('10000');

  const [newQuery, setNewQuery] = useState('');
  const [newResults, setNewResults] = useState<any[]>([]);
  const [newSelected, setNewSelected] = useState<any>(null);
  const [newAmount, setNewAmount] = useState('5000');

  const [before, setBefore] = useState<any>(null);
  const [after, setAfter] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchFunds = useCallback(async (query: string, setter: (r: any[]) => void) => {
    if (query.length < 3) {
      setter([]);
      return;
    }
    try {
      const r = await fetch(`${API}/api/mf/search?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      setter(d.funds || []);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchFunds(existingQuery, setExistingResults), 300);
    return () => clearTimeout(t);
  }, [existingQuery, searchFunds]);

  useEffect(() => {
    if (newSelected) return;
    const t = setTimeout(() => searchFunds(newQuery, setNewResults), 300);
    return () => clearTimeout(t);
  }, [newQuery, newSelected, searchFunds]);

  const addToPortfolio = (fund: any) => {
    if (portfolio.find((f) => f.scheme_code === fund.scheme_code)) return;
    setPortfolio([...portfolio, { ...fund, value: Number(existingAmount) || 10000 }]);
    setExistingQuery('');
    setExistingResults([]);
  };

  const removeFromPortfolio = (code: string) => {
    setPortfolio(portfolio.filter((f) => f.scheme_code !== code));
    setBefore(null);
    setAfter(null);
  };

  const analyze = async (funds: any[]) => {
    const r = await fetch(`${API}/api/portfolio/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings: funds }),
    });
    return r.json();
  };

  const check = async () => {
    if (!newSelected || portfolio.length === 0) return;
    setLoading(true);
    setBefore(null);
    setAfter(null);
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
    } catch {}
    setLoading(false);
  };

  const diff = before && after ? after.health_score - before.health_score : null;
  const canCheck = newSelected && portfolio.length > 0 && !loading;

  const getVerdict = () => {
    if (diff === null) return null;
    if (diff > 2)
      return {
        Icon: CheckCircle,
        color: '#22C55E',
        bg: 'rgba(34,197,94,0.08)',
        border: 'rgba(34,197,94,0.25)',
        title: 'Good addition',
        text: `${newSelected?.scheme_name} diversifies your portfolio.`,
      };
    if (diff < -2)
      return {
        Icon: AlertTriangle,
        color: '#EF4444',
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.25)',
        title: 'High overlap — reconsider',
        text: `${newSelected?.scheme_name} heavily overlaps with your existing funds.`,
      };
    return {
      Icon: Info,
      color: '#64748B',
      bg: 'rgba(100,116,139,0.08)',
      border: 'rgba(100,116,139,0.2)',
      title: 'Minimal impact',
      text: `${newSelected?.scheme_name} has low impact on your portfolio.`,
    };
  };

  const verdict = getVerdict();

  const relevantOverlaps =
    after?.overlaps?.filter(
      (o: any) =>
        o.fund1_code === newSelected?.scheme_code || o.fund2_code === newSelected?.scheme_code
    ) || [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="flex-1 bg-[#050816]">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: isSmall ? 14 : 18,
            paddingTop: 16,
            paddingBottom: insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-6">
            <View className="bg-sky-500/10 border border-sky-500/30 rounded-full px-3 py-1 mb-3">
              <Text className="text-sky-400 text-[10px] font-bold tracking-wider">
                SIP CALCULATOR
              </Text>
            </View>
            <Text
              className="text-slate-50 font-black text-center mb-2"
              style={{ fontSize: isSmall ? 22 : 26 }}
            >
              Will this fund help or hurt?
            </Text>
            <Text className="text-slate-400 text-[13px] text-center leading-5 px-2">
              Add your existing funds, then search for the new fund you are considering.
            </Text>
          </View>

          <Card>
            <View className="flex-row justify-between items-center mb-3">
              <Label text="Step 1 — Your portfolio" />
              <Text className="text-slate-600 text-[10px]">Pre-loaded</Text>
            </View>

            {portfolio.map((f) => (
              <View
                key={f.scheme_code}
                className="flex-row items-center justify-between bg-[#0A0F1E] rounded-xl px-3 py-2.5 mb-2"
              >
                <View className="flex-1 mr-2">
                  <Text className="text-slate-200 text-[12px] font-semibold" numberOfLines={1}>
                    {f.scheme_name}
                  </Text>
                  <Text className="text-slate-500 text-[11px] mt-0.5">
                    ₹{(f.value / 1000).toFixed(0)}K invested
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeFromPortfolio(f.scheme_code)}
                  className="p-1.5"
                >
                  <X size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
            ))}

            {portfolio.length === 0 && (
              <Text className="text-slate-600 text-[12px] text-center py-3">
                Search and add your existing funds below
              </Text>
            )}

            <View className="mt-2">
              <FundSearch
                value={existingQuery}
                onChangeText={setExistingQuery}
                results={existingResults}
                onSelect={addToPortfolio}
                placeholder="Search and add a fund..."
              />
            </View>

            <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
              <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase">
                Amount ₹
              </Text>
              <TextInput
                value={existingAmount}
                onChangeText={setExistingAmount}
                keyboardType="numeric"
                className="bg-[#0A0F1E] border border-slate-700/60 rounded-lg px-3 py-2 text-slate-100 text-[13px]"
                style={{ width: 110 }}
              />
              <Text className="text-slate-600 text-[11px]">per fund added</Text>
            </View>
          </Card>

          <Card>
            <View className="mb-3">
              <Label text="Step 2 — Fund you want to add" />
            </View>

            <FundSearch
              value={newQuery}
              onChangeText={(t) => {
                setNewQuery(t);
                setNewSelected(null);
              }}
              results={newSelected ? [] : newResults}
              onSelect={(r) => {
                setNewSelected(r);
                setNewQuery(r.scheme_name);
                setNewResults([]);
              }}
              placeholder="Search new fund e.g. Axis Midcap..."
            />

            {newSelected && (
              <View className="bg-sky-500/10 border border-sky-500/25 rounded-xl px-3 py-2.5 mb-3 flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-sky-300 text-[12px] font-semibold" numberOfLines={1}>
                    {newSelected.scheme_name}
                  </Text>
                  <Text className="text-slate-500 text-[11px] mt-0.5">
                    {newSelected.fund_house}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setNewSelected(null);
                    setNewQuery('');
                  }}
                >
                  <X size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row items-end mt-1" style={{ gap: 10 }}>
              <View className="flex-1">
                <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase mb-1.5">
                  Monthly SIP ₹
                </Text>
                <TextInput
                  value={newAmount}
                  onChangeText={setNewAmount}
                  keyboardType="numeric"
                  className="bg-[#0A0F1E] border border-slate-700/60 rounded-xl px-3 py-2.5 text-slate-100 text-[13px]"
                />
              </View>
              <TouchableOpacity
                activeOpacity={canCheck ? 0.8 : 1}
                onPress={canCheck ? check : undefined}
                disabled={!canCheck}
                className={`rounded-xl px-5 py-3 ${
                  canCheck ? 'bg-sky-500' : 'bg-slate-800/40'
                }`}
                style={{ opacity: canCheck ? 1 : 0.5 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    className={`text-[13px] font-bold ${
                      canCheck ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    Check
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {portfolio.length === 0 && (
              <Text className="text-red-400 text-[11px] mt-2">
                Add at least one fund in Step 1 first
              </Text>
            )}
          </Card>

          {before && after && diff !== null && (
            <>
              <Card>
                <View className="mb-4">
                  <Label text="Step 3 — Impact" />
                </View>

                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="flex-1 bg-[#0A0F1E] rounded-xl py-4 items-center">
                    <Text className="text-slate-500 text-[10px] mb-1.5">Before</Text>
                    <Text
                      className="text-slate-50 font-black"
                      style={{ fontSize: 36, lineHeight: 38 }}
                    >
                      {before.health_score}
                    </Text>
                    <Text className="text-amber-400 text-[11px] font-bold mt-1">
                      Grade {before.grade}
                    </Text>
                  </View>

                  <View className="items-center px-1">
                    <Text
                      className="font-black"
                      style={{
                        fontSize: 22,
                        color:
                          diff > 0 ? '#22C55E' : diff < 0 ? '#EF4444' : '#64748B',
                      }}
                    >
                      {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                    </Text>
                    <Text className="text-slate-600 text-[10px] mt-0.5">
                      {diff > 0 ? 'better' : diff < 0 ? 'worse' : 'same'}
                    </Text>
                  </View>

                  <View
                    className="flex-1 rounded-xl py-4 items-center"
                    style={{
                      backgroundColor: '#0A0F1E',
                      borderWidth: 1,
                      borderColor:
                        diff > 0
                          ? 'rgba(34,197,94,0.3)'
                          : diff < 0
                          ? 'rgba(239,68,68,0.3)'
                          : '#1E293B',
                    }}
                  >
                    <Text className="text-slate-500 text-[10px] mb-1.5">After</Text>
                    <Text
                      className="font-black"
                      style={{
                        fontSize: 36,
                        lineHeight: 38,
                        color:
                          diff > 0 ? '#22C55E' : diff < 0 ? '#EF4444' : '#F1F5F9',
                      }}
                    >
                      {after.health_score}
                    </Text>
                    <Text className="text-amber-400 text-[11px] font-bold mt-1">
                      Grade {after.grade}
                    </Text>
                  </View>
                </View>
              </Card>

              {verdict && (
                <View
                  className="rounded-2xl px-4 py-3.5 mb-4 flex-row"
                  style={{
                    backgroundColor: verdict.bg,
                    borderWidth: 1,
                    borderColor: verdict.border,
                    gap: 12,
                  }}
                >
                  <verdict.Icon size={18} color={verdict.color} style={{ marginTop: 1 }} />
                  <View className="flex-1">
                    <Text className="text-slate-100 text-[14px] font-bold mb-1">
                      {verdict.title}
                    </Text>
                    <Text className="text-slate-400 text-[12px] leading-5">
                      {verdict.text}
                    </Text>
                  </View>
                </View>
              )}

              {relevantOverlaps.length > 0 && (
                <Card>
                  <View className="mb-3">
                    <Label text="Overlaps with new fund" />
                  </View>
                  {relevantOverlaps.map((o: any, i: number) => {
                    const otherName =
                      o.fund1_code === newSelected?.scheme_code ? o.fund2_name : o.fund1_name;
                    const color =
                      o.overlap_pct > 50
                        ? '#EF4444'
                        : o.overlap_pct > 30
                        ? '#F59E0B'
                        : '#22C55E';
                    return (
                      <View key={i} className="mb-3">
                        <View className="flex-row justify-between mb-1.5">
                          <Text
                            className="text-slate-300 text-[12px] flex-1 mr-2"
                            numberOfLines={1}
                          >
                            {otherName}
                          </Text>
                          <Text className="text-[13px] font-bold" style={{ color }}>
                            {o.overlap_pct?.toFixed(1)}%
                          </Text>
                        </View>
                        <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(o.overlap_pct, 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </Card>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/(app)/analyze')}
                className="bg-sky-500 rounded-2xl py-3.5 flex-row items-center justify-center"
                style={{ gap: 8 }}
              >
                <Text className="text-white text-[14px] font-bold">
                  Analyze My Full Portfolio
                </Text>
                <ArrowRight size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}