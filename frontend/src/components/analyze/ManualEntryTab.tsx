import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Plus, Trash2, CheckCircle, ArrowRight } from 'lucide-react-native';

import { HoldingRow, SearchFundItem, ResolvedFund } from './types';
import { searchMutualFunds, runAnalysis } from './analyzeApi';

interface ManualEntryTabProps {
  userId: string;
  onComplete: (token: string) => void;
}

export function ManualEntryTab({ userId, onComplete }: ManualEntryTabProps) {
  const [holdings, setHoldings] = useState<HoldingRow[]>([
    { name: '', value: '', scheme_code: '', touched: false },
    { name: '', value: '', scheme_code: '', touched: false },
    { name: '', value: '', scheme_code: '', touched: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchFundItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const searchFunds = useCallback((query: string, index: number) => {
    setActiveIndex(index);
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const results = await searchMutualFunds(query, controller.signal);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setActiveIndex(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const selectFund = (fund: SearchFundItem, index: number) => {
    setHoldings((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: fund.scheme_name,
        scheme_code: fund.scheme_code,
        touched: true,
      };
      return updated;
    });
    clearSuggestions();
  };

  const updateField = (index: number, field: 'name' | 'value', value: string) => {
    setHoldings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, touched: true };
      if (field === 'name') updated[index].scheme_code = '';
      return updated;
    });
  };

  const addRow = () => {
    setHoldings((prev) => [...prev, { name: '', value: '', scheme_code: '', touched: false }]);
  };

  const removeRow = (index: number) => {
    if (holdings.length <= 2) return;
    setHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const validateRow = (h: HoldingRow): string | null => {
    if (!h.touched || (!h.name && !h.value)) return null;
    if (h.name && !h.scheme_code) return 'Select a fund from the suggestions';
    const amount = parseFloat(h.value.replace(/[₹,\s]/g, ''));
    if (h.name && h.scheme_code && (!h.value || isNaN(amount) || amount <= 0)) {
      return 'Enter a valid amount';
    }
    return null;
  };

  const handleAnalyze = async () => {
    const errors = holdings.map(validateRow).filter(Boolean);
    if (errors.length) {
      setHoldings((prev) => prev.map((h) => ({ ...h, touched: true })));
      Alert.alert('Check Entries', errors[0] as string);
      return;
    }

    const valid = holdings.filter((h) => h.scheme_code && h.value);
    if (valid.length < 2) {
      Alert.alert('Add More Funds', 'Please select and specify amounts for at least 2 funds.');
      return;
    }

    setLoading(true);
    let token: string | null = null;
    try {
      const resolved: ResolvedFund[] = valid.map((h) => ({
        scheme_code: h.scheme_code,
        scheme_name: h.name,
        value: parseFloat(h.value.replace(/[₹,\s]/g, '')),
      }));

      token = await runAnalysis(resolved, userId);
    } catch (err: any) {
      console.error('ManualEntryTab analysis error:', err);
      Alert.alert('Analysis Failed', err?.message || 'Could not generate report. Please try again.');
    } finally {
      setLoading(false);
    }

    if (token) {
      onComplete(token);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xs text-slate-400 mb-3.5">
          Search for mutual funds and enter your invested amounts:
        </Text>

        {holdings.map((h, i) => {
          const error = h.touched ? validateRow(h) : null;
          const zIndexStyle = activeIndex === i ? { zIndex: 100 - i, elevation: 10 + i } : { zIndex: 1 };

          return (
            <View key={i} className="mb-3" style={zIndexStyle}>
              <View className="flex-row items-center gap-2">
                {/* Fund Search Field */}
                <View className="flex-1 relative">
                  <TextInput
                    value={h.name}
                    onChangeText={(text) => {
                      updateField(i, 'name', text);
                      searchFunds(text, i);
                    }}
                    onFocus={() => {
                      if (h.name.trim().length >= 2) {
                        searchFunds(h.name, i);
                      }
                    }}
                    placeholder="Search fund e.g. HDFC Flexi"
                    placeholderTextColor="#64748B"
                    className={`h-11 bg-slate-900 border rounded-xl px-3 text-xs text-slate-100 pr-8 ${
                      error ? 'border-rose-500/80' : 'border-slate-700/80'
                    }`}
                  />
                  {h.scheme_code ? (
                    <View className="absolute right-2.5 top-3.5">
                      <CheckCircle size={15} color="#10B981" />
                    </View>
                  ) : null}

                  {/* Suggestions Dropdown */}
                  {activeIndex === i && suggestions.length > 0 && (
                    <View className="absolute top-12 left-0 right-0 bg-slate-800 border border-sky-500/60 rounded-xl max-h-48 z-50 shadow-xl overflow-hidden">
                      <ScrollView
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                      >
                        {suggestions.map((fund) => (
                          <TouchableOpacity
                            key={fund.scheme_code}
                            onPress={() => selectFund(fund, i)}
                            className="px-3.5 py-2.5 border-b border-slate-700/60 active:bg-slate-700/50"
                          >
                            <Text className="text-xs font-medium text-slate-100" numberOfLines={1}>
                              {fund.scheme_name}
                            </Text>
                            {fund.fund_house && (
                              <Text className="text-[10px] text-slate-400 mt-0.5">
                                {fund.fund_house}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Amount Field */}
                <TextInput
                  value={h.value}
                  onChangeText={(text) => updateField(i, 'value', text)}
                  placeholder="₹ amount"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  className={`w-24 h-11 bg-slate-900 border rounded-xl px-3 text-xs text-slate-100 ${
                    error ? 'border-rose-500/80' : 'border-slate-700/80'
                  }`}
                />

                {/* Delete Button - Scaled nicely to avoid overlap */}
                {holdings.length > 2 && (
                  <TouchableOpacity
                    onPress={() => removeRow(i)}
                    className="w-9 h-11 border border-rose-500/30 bg-rose-500/5 rounded-xl items-center justify-center shrink-0"
                  >
                    <Trash2 size={15} color="#F43F5E" />
                  </TouchableOpacity>
                )}
              </View>
              {error && <Text className="text-[10px] text-rose-400 mt-1 ml-1">{error}</Text>}
            </View>
          );
        })}

        {/* Add Row Button */}
        <TouchableOpacity
          onPress={addRow}
          activeOpacity={0.7}
          className="flex-row items-center border border-sky-500/30 rounded-xl py-2 px-3 self-start mb-6 mt-1"
        >
          <Plus size={13} color="#38BDF8" />
          <Text className="text-xs font-bold text-sky-400 ml-1.5">Add Fund</Text>
        </TouchableOpacity>

        {/* Primary Submit Button */}
        <TouchableOpacity
          onPress={handleAnalyze}
          disabled={loading}
          activeOpacity={0.8}
          className={`h-12 rounded-xl flex-row items-center justify-center ${
            loading ? 'bg-blue-600/60' : 'bg-blue-600 shadow-md'
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text className="text-xs font-bold text-white mr-1.5">Analyze My Portfolio</Text>
              <ArrowRight size={15} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}