// src/app/(app)/sip-checker.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { X, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

import {
  FundItem,
  PortfolioHolding,
  AnalysisResponse,
  DEFAULT_PORTFOLIO,
  API_BASE_URL,
} from '../../components/sip/types';
import { useFundSearch } from '../../components/sip/useFundSearch';
import { FundSearchInput } from '../../components/sip/FundSearchInput';
import { SIPImpactResults } from '../../components/sip/SIPImpactResults';

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[₹,\s]/g, ''));
  return raw.trim() !== '' && !isNaN(n) && n > 0 ? n : null;
}

export default function SIPCheckerScreen() {
  const { user } = useAuth();
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Step 1 State: Portfolio Holdings
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>(DEFAULT_PORTFOLIO);
  const [existingQuery, setExistingQuery] = useState('');
  const [existingAmount, setExistingAmount] = useState('10000');
  const {
    results: existingResults,
    loading: existingLoading,
    clearResults: clearExistingResults,
  } = useFundSearch(existingQuery);

  // Step 2 State: Candidate Fund
  const [newQuery, setNewQuery] = useState('');
  const [newAmount, setNewAmount] = useState('5000');
  const [newSelected, setNewSelected] = useState<FundItem | null>(null);
  const {
    results: newResults,
    loading: newLoading,
    clearResults: clearNewResults,
  } = useFundSearch(newQuery);

  // Step 3 State: Analysis Results
  const [before, setBefore] = useState<AnalysisResponse | null>(null);
  const [after, setAfter] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const existingAmountValue = parseAmount(existingAmount);
  const newAmountValue = parseAmount(newAmount);

  const addToPortfolio = (fund: FundItem) => {
    if (existingAmountValue === null) return;
    if (portfolio.some((f) => f.scheme_code === fund.scheme_code)) return;

    setPortfolio((prev) => [...prev, { ...fund, value: existingAmountValue }]);
    setExistingQuery('');
    clearExistingResults();
    Keyboard.dismiss();
  };

  const removeFromPortfolio = (code: string) => {
    setPortfolio((prev) => prev.filter((f) => f.scheme_code !== code));
    if (before) {
      setBefore(null);
      setAfter(null);
    }
  };

  const handleSelectNewFund = (fund: FundItem) => {
    setNewSelected(fund);
    setNewQuery(fund.scheme_name);
    clearNewResults();
    Keyboard.dismiss();
  };

  const analyzePortfolio = async (
    holdings: PortfolioHolding[],
    signal: AbortSignal
  ): Promise<AnalysisResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/portfolio/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings, user_id: user?.id || null }),
      signal,
    });
    if (!res.ok) throw new Error('Analysis request failed');
    return res.json();
  };

  const runCheck = async () => {
    if (!newSelected || portfolio.length === 0 || newAmountValue === null) return;
    const currentRequestId = ++requestIdRef.current;
    const controller = new AbortController();

    setLoading(true);
    setError('');
    setBefore(null);
    setAfter(null);
    Keyboard.dismiss();

    try {
      const [beforeRes, afterRes] = await Promise.all([
        analyzePortfolio(portfolio, controller.signal),
        analyzePortfolio(
          [
            ...portfolio,
            {
              scheme_code: newSelected.scheme_code,
              scheme_name: newSelected.scheme_name,
              fund_house: newSelected.fund_house,
              value: newAmountValue,
            },
          ],
          controller.signal
        ),
      ]);

      if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;
      setBefore(beforeRes);
      setAfter(afterRes);
    } catch (err: unknown) {
      if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Analysis failed. Please check your connection and try again.');
    } finally {
      if (mountedRef.current && currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const canCheck = Boolean(newSelected && portfolio.length > 0 && newAmountValue !== null && !loading);

  return (
    <View className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 18, paddingBottom: 72 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-6 mt-1">
            <View className="flex-row items-center bg-slate-900 border border-slate-800 px-3 py-1 rounded-full mb-3">
              <ShieldCheck size={13} color="#38BDF8" className="mr-1.5" />
              <Text className="text-[11px] font-bold text-sky-400 tracking-wider">
                PRE-SIP CHECKER
              </Text>
            </View>
            <Text className="text-2xl font-black text-slate-100 text-center tracking-tight">
              Will this fund improve your portfolio?
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1.5 leading-5 px-3">
              Test a mutual fund against your existing investments to prevent unwanted stock overlaps.
            </Text>
          </View>

          {/* ── STEP 1: Current Portfolio ── */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-1">
              <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center mr-2">
                <Text className="text-[10px] font-bold text-white">1</Text>
              </View>
              <Text className="text-sm font-bold text-slate-100">Your Current Portfolio</Text>
            </View>
            <Text className="text-xs text-slate-400 ml-7 mb-3">
              Add the funds you currently hold to establish a baseline.
            </Text>

            {/* Holdings List */}
            {portfolio.length > 0 ? (
              <View className="mb-3">
                {portfolio.map((f) => (
                  <View
                    key={f.scheme_code}
                    className="flex-row items-center justify-between bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 mb-2"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-semibold text-slate-200" numberOfLines={1}>
                        {f.scheme_name}
                      </Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">
                        ₹{(f.value / 1000).toFixed(0)}K invested
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFromPortfolio(f.scheme_code)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="p-1"
                    >
                      <X size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-4 items-center bg-slate-800/40 rounded-xl mb-3 border border-dashed border-slate-700">
                <Text className="text-xs text-slate-500">No funds added yet.</Text>
              </View>
            )}

            {/* Search Input for Step 1 */}
            <FundSearchInput
              query={existingQuery}
              onChangeQuery={setExistingQuery}
              placeholder="Search to add an existing fund..."
              loading={existingLoading}
              results={existingResults}
              onSelectFund={addToPortfolio}
              disabled={existingAmountValue === null}
            />

            {/* Default Investment Value Input */}
            <View className="flex-row items-center justify-between bg-slate-800/50 border border-slate-700/60 px-3.5 h-11 rounded-xl">
              <Text className="text-xs text-slate-400">Default invested amount per fund</Text>
              <View className="flex-row items-center">
                <Text className="text-xs font-semibold text-slate-400 mr-1">₹</Text>
                <TextInput
                  value={existingAmount}
                  onChangeText={setExistingAmount}
                  keyboardType="numeric"
                  className={`w-20 text-right text-xs font-bold ${
                    existingAmountValue === null ? 'text-rose-400' : 'text-slate-100'
                  }`}
                />
              </View>
            </View>
            {existingAmountValue === null && (
              <Text className="text-[11px] text-rose-400 mt-1 text-right">
                Please enter a valid amount
              </Text>
            )}
          </View>

          {/* ── STEP 2: Candidate Fund ── */}
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-1">
              <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center mr-2">
                <Text className="text-[10px] font-bold text-white">2</Text>
              </View>
              <Text className="text-sm font-bold text-slate-100">Fund You Want to Add</Text>
            </View>
            <Text className="text-xs text-slate-400 ml-7 mb-3">
              Search for the new mutual fund you are considering.
            </Text>

            {/* Search Input for Step 2 */}
            <FundSearchInput
              query={newQuery}
              onChangeQuery={(text) => {
                setNewQuery(text);
                setNewSelected(null);
              }}
              placeholder="Search new fund (e.g. Axis Midcap)..."
              loading={newLoading}
              results={newResults}
              onSelectFund={handleSelectNewFund}
            />

            {/* Selected Fund Pill */}
            {newSelected && (
              <View className="flex-row items-center justify-between bg-blue-600/10 border border-blue-500/30 rounded-xl p-3 mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-bold text-sky-400" numberOfLines={1}>
                    {newSelected.scheme_name}
                  </Text>
                  {newSelected.fund_house && (
                    <Text className="text-[10px] text-slate-400 mt-0.5">
                      {newSelected.fund_house}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setNewSelected(null);
                    setNewQuery('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="p-1"
                >
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}

            {/* Monthly SIP Amount */}
            <View className="flex-row items-center justify-between bg-slate-800/50 border border-slate-700/60 px-3.5 h-11 rounded-xl mb-3">
              <Text className="text-xs text-slate-400">Planned Monthly SIP</Text>
              <View className="flex-row items-center">
                <Text className="text-xs font-semibold text-slate-400 mr-1">₹</Text>
                <TextInput
                  value={newAmount}
                  onChangeText={setNewAmount}
                  keyboardType="numeric"
                  className={`w-20 text-right text-xs font-bold ${
                    newAmountValue === null ? 'text-rose-400' : 'text-slate-100'
                  }`}
                />
              </View>
            </View>
            {newAmountValue === null && (
              <Text className="text-[11px] text-rose-400 -mt-2 mb-2 text-right">
                Please enter a valid SIP amount
              </Text>
            )}

            {/* Check CTA */}
            <TouchableOpacity
              onPress={runCheck}
              disabled={!canCheck}
              activeOpacity={0.8}
              className={`h-12 rounded-xl flex-row items-center justify-center ${
                canCheck ? 'bg-blue-600 shadow-md' : 'bg-slate-800'
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text
                    className={`text-xs font-bold mr-1.5 ${
                      canCheck ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    Run Impact Check
                  </Text>
                  {canCheck && <ArrowRight size={15} color="#fff" />}
                </>
              )}
            </TouchableOpacity>

            {portfolio.length === 0 && (
              <Text className="text-[11px] text-amber-400 text-center mt-2.5">
                Add at least one holding in Step 1 first.
              </Text>
            )}
            {error ? (
              <Text className="text-[11px] text-rose-400 text-center mt-2.5">{error}</Text>
            ) : null}
          </View>

          {/* ── STEP 3: Results ── */}
          {before && after && newSelected && (
            <SIPImpactResults before={before} after={after} newFund={newSelected} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}