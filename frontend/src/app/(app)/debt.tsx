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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react-native';

import { Loan, LOAN_TYPES } from '../../components/debt/types';
import { calculateDebtScore, formatMoney } from '../../components/debt/debtMath';
import { AddLoanForm } from '../../components/debt/AddLoanForm';
import { DebtResults } from '../../components/debt/DebtResults';

export default function DebtScreen() {
  const insets = useSafeAreaInsets();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [hasEmergencyFund, setHasEmergencyFund] = useState<boolean | null>(null);
  const [emergencyMonths, setEmergencyMonths] = useState('3');
  const [showResults, setShowResults] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const isLoaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Initial Load with Corruption Safety
  useEffect(() => {
    (async () => {
      try {
        const [savedLoans, savedIncome, savedEF, savedMonths, savedResults] = await Promise.all([
          AsyncStorage.getItem('leveliq_loans'),
          AsyncStorage.getItem('leveliq_income'),
          AsyncStorage.getItem('leveliq_has_ef'),
          AsyncStorage.getItem('leveliq_ef_months'),
          AsyncStorage.getItem('leveliq_debt_results'),
        ]);

        if (savedLoans) {
          try {
            const parsed = JSON.parse(savedLoans);
            if (Array.isArray(parsed)) setLoans(parsed);
          } catch {
            // Corrupted JSON fallback
            setLoans([]);
          }
        }
        if (savedIncome) setMonthlyIncome(savedIncome);
        if (savedEF !== null && savedEF !== '') setHasEmergencyFund(savedEF === 'true');
        if (savedMonths) setEmergencyMonths(savedMonths);
        if (savedResults === 'true') setShowResults(true);
      } catch {
        // Fallback silently without throwing
      } finally {
        isLoaded.current = true;
      }
    })();
  }, []);

  // 2. Debounced Auto-Save (350ms)
  useEffect(() => {
    if (!isLoaded.current) return;
    setIsSaved(false);

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        await AsyncStorage.multiSet([
          ['leveliq_loans', JSON.stringify(loans)],
          ['leveliq_income', monthlyIncome],
          ['leveliq_has_ef', hasEmergencyFund === null ? '' : String(hasEmergencyFund)],
          ['leveliq_ef_months', emergencyMonths],
          ['leveliq_debt_results', String(showResults)],
        ]);
        setIsSaved(true);
      } catch {
        // storage save error
      }
    }, 350);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [loans, monthlyIncome, hasEmergencyFund, emergencyMonths, showResults]);

  const addLoan = (loan: Loan) => {
    setLoans((prev) => [...prev, loan]);
    setShowAddForm(false);
  };

  const removeLoan = (id: string) => {
    Alert.alert('Remove Liability', 'Remove this loan from your list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setLoans((prev) => prev.filter((l) => l.id !== id)) },
    ]);
  };

  const incomeNum = parseFloat(monthlyIncome.replace(/[₹,\s]/g, '')) || 0;
  const efMonthsNum = parseInt(emergencyMonths, 10) || 0;
  const analysis = calculateDebtScore(loans, incomeNum, hasEmergencyFund, efMonthsNum);

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
        {/* Header & Auto-Save Pill */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-2">
            <Text className="text-2xl font-black text-slate-100 tracking-tight">Debt Health Check</Text>
            <Text className="text-xs text-slate-400 mt-0.5">
              Review liabilities before committing funds into long-term SIPs.
            </Text>
          </View>
          <View className="flex-row items-center bg-slate-900 border border-slate-800 px-2 py-1 rounded-full">
            <Check size={10} color={isSaved ? '#10B981' : '#F59E0B'} />
            <Text className={`text-[10px] font-semibold ml-1 ${isSaved ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isSaved ? 'Saved' : 'Saving...'}
            </Text>
          </View>
        </View>

        {/* Financial Insight Callout */}
        <View className="flex-row bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-4 items-start">
          <ShieldCheck size={18} color="#38BDF8" className="mt-0.5" />
          <View className="flex-1 ml-2.5">
            <Text className="text-xs font-bold text-slate-200">The 40% Guideline</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5 leading-4">
              Keeping your total monthly EMIs under 35–40% of income leaves comfortable room for consistent investing.
            </Text>
          </View>
        </View>

        {!showResults ? (
          <>
            {/* Step 1: Income */}
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3.5">
              <View className="flex-row items-center mb-1">
                <View className="bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md mr-2">
                  <Text className="text-[10px] font-extrabold text-sky-400">STEP 1</Text>
                </View>
                <Text className="text-sm font-bold text-slate-100">Monthly Net Income</Text>
              </View>
              <Text className="text-xs text-slate-400 mb-2.5">Calculates your EMI-to-income repayment capacity.</Text>
              <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 h-11">
                <Text className="text-sm font-semibold text-slate-400 mr-2">₹</Text>
                <TextInput
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                  placeholder="75,000"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  className="flex-1 text-slate-100 text-xs font-medium h-full"
                />
              </View>
            </View>

            {/* Step 2: Emergency Fund */}
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3.5">
              <View className="flex-row items-center mb-1">
                <View className="bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md mr-2">
                  <Text className="text-[10px] font-extrabold text-sky-400">STEP 2</Text>
                </View>
                <Text className="text-sm font-bold text-slate-100">Emergency Fund Status</Text>
              </View>
              <Text className="text-xs text-slate-400 mb-3">Do you have 3–6 months expenses in liquid savings?</Text>

              <View className="flex-row gap-2.5 mb-2.5">
                <TouchableOpacity
                  onPress={() => setHasEmergencyFund(true)}
                  className={`flex-1 flex-row items-center justify-center h-11 rounded-xl border ${
                    hasEmergencyFund === true ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <CheckCircle2 size={15} color={hasEmergencyFund === true ? '#10B981' : '#94A3B8'} />
                  <Text className={`text-xs ml-2 ${hasEmergencyFund === true ? 'font-bold text-emerald-400' : 'text-slate-400'}`}>
                    Yes, Saved
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setHasEmergencyFund(false)}
                  className={`flex-1 flex-row items-center justify-center h-11 rounded-xl border ${
                    hasEmergencyFund === false ? 'bg-rose-500/10 border-rose-500' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <XCircle size={15} color={hasEmergencyFund === false ? '#F43F5E' : '#94A3B8'} />
                  <Text className={`text-xs ml-2 ${hasEmergencyFund === false ? 'font-bold text-rose-400' : 'text-slate-400'}`}>
                    Not Yet
                  </Text>
                </TouchableOpacity>
              </View>

              {hasEmergencyFund === true && (
                <View className="flex-row items-center justify-between pt-2 border-t border-slate-800">
                  <Text className="text-xs text-slate-400">Months saved:</Text>
                  <View className="flex-row items-center gap-1.5">
                    {['3', '6', '12'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setEmergencyMonths(m)}
                        className={`px-2.5 py-1 rounded-lg border ${
                          emergencyMonths === m ? 'bg-sky-500/20 border-sky-400' : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <Text className={`text-xs ${emergencyMonths === m ? 'font-bold text-sky-300' : 'text-slate-400'}`}>
                          {m}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Step 3: Loans & Borrowings */}
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <View className="bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md mr-2">
                    <Text className="text-[10px] font-extrabold text-sky-400">STEP 3</Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-100">Loans & Borrowings</Text>
                </View>
                {loans.length > 0 && (
                  <Text className="text-[11px] font-semibold text-slate-400">{loans.length} added</Text>
                )}
              </View>
              <Text className="text-xs text-slate-400 mb-3">Add credit cards, personal loans, or vehicle finances.</Text>

              {loans.map((loan) => {
                const meta = LOAN_TYPES.find((t) => t.value === loan.type) || LOAN_TYPES[0];
                return (
                  <View key={loan.id} className="flex-row items-center bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 mb-2">
                    <View className="w-2.5 h-2.5 rounded-full mr-2.5" style={{ backgroundColor: meta.color }} />
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-100">{loan.name}</Text>
                      <Text className="text-[11px] text-slate-400 mt-0.5">
                        {formatMoney(loan.outstanding)} • EMI ₹{loan.emi.toLocaleString('en-IN')}
                        {loan.rate > 0 ? ` • ${loan.rate}%` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeLoan(loan.id)} className="p-1">
                      <Trash2 size={15} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {showAddForm ? (
                <AddLoanForm onAdd={addLoan} onCancel={() => setShowAddForm(false)} />
              ) : (
                <TouchableOpacity
                  onPress={() => setShowAddForm(true)}
                  className="flex-row items-center justify-center h-11 rounded-xl border border-dashed border-sky-500/50 bg-sky-500/5 mt-1"
                >
                  <Plus size={15} color="#38BDF8" />
                  <Text className="text-xs font-bold text-sky-400 ml-1.5">Add a Loan</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              onPress={() => setShowResults(true)}
              className="flex-row items-center justify-center h-12 bg-blue-600 rounded-xl shadow-md"
            >
              <Text className="text-xs font-bold text-white mr-1.5">Analyze Debt Health</Text>
              <ArrowRight size={15} color="#FFF" />
            </TouchableOpacity>
          </>
        ) : (
          <DebtResults result={analysis} onEdit={() => setShowResults(false)} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}