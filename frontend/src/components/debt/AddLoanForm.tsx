import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Keyboard, Alert } from 'react-native';
import { Loan, LoanType, LOAN_TYPES } from './types';

export function AddLoanForm({
  onAdd,
  onCancel,
  onFocusField,
}: {
  onAdd: (loan: Loan) => void;
  onCancel: () => void;
  onFocusField?: () => void;
}) {
  const [type, setType] = useState<LoanType>('personal');
  const [name, setName] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [emi, setEmi] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');

  const outRef = useRef<TextInput>(null);
  const emiRef = useRef<TextInput>(null);
  const rateRef = useRef<TextInput>(null);
  const tenureRef = useRef<TextInput>(null);

  const meta = LOAN_TYPES.find((t) => t.value === type)!;

  const handleTypeSelect = (t: LoanType) => {
    setType(t);
    const m = LOAN_TYPES.find((x) => x.value === t);
    if (m && !rate) setRate(String(m.defaultRate));
  };

  const handleSave = () => {
    Keyboard.dismiss();
    const outNum = parseFloat(outstanding.replace(/[₹,\s]/g, ''));
    const emiNum = parseFloat(emi.replace(/[₹,\s]/g, '')) || 0;
    const rateNum = parseFloat(rate) || meta.defaultRate;
    const tenureNum = parseInt(tenure, 10) || 0;

    if (!outstanding || isNaN(outNum) || outNum <= 0) {
      Alert.alert('Required', 'Please enter a valid loan balance.');
      return;
    }

    onAdd({
      id: Date.now().toString(),
      type,
      name: name.trim() || meta.label,
      outstanding: outNum,
      emi: emiNum,
      rate: rateNum,
      tenure_remaining: tenureNum,
    });
  };

  return (
    <View className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 mt-2 mb-3">
      <Text className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
        Select Loan Type
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3.5" keyboardShouldPersistTaps="handled">
        {LOAN_TYPES.map((t) => {
          const sel = type === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              onPress={() => handleTypeSelect(t.value)}
              className={`px-3 py-1.5 rounded-xl mr-2 border ${sel ? 'bg-sky-500/15 border-sky-400' : 'bg-slate-800 border-slate-700'}`}
            >
              <Text className={`text-xs font-semibold ${sel ? 'text-sky-300' : 'text-slate-400'}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TextInput
        value={name}
        onChangeText={setName}
        onFocus={onFocusField}
        placeholder={`e.g. ${type === 'credit_card' ? 'HDFC Card' : 'SBI Loan'}`}
        placeholderTextColor="#64748B"
        returnKeyType="next"
        onSubmitEditing={() => outRef.current?.focus()}
        className="h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-slate-100 text-xs mb-2.5"
      />

      <View className="flex-row gap-2.5 mb-2.5">
        <TextInput
          ref={outRef}
          value={outstanding}
          onChangeText={setOutstanding}
          onFocus={onFocusField}
          placeholder="Balance (₹) *"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => emiRef.current?.focus()}
          className="flex-1 h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-slate-100 text-xs"
        />
        <TextInput
          ref={emiRef}
          value={emi}
          onChangeText={setEmi}
          onFocus={onFocusField}
          placeholder="Monthly EMI (₹)"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => rateRef.current?.focus()}
          className="flex-1 h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-slate-100 text-xs"
        />
      </View>

      <View className="flex-row gap-2.5 mb-3.5">
        <TextInput
          ref={rateRef}
          value={rate}
          onChangeText={setRate}
          onFocus={onFocusField}
          placeholder={`Rate % (${meta.defaultRate}%)`}
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => tenureRef.current?.focus()}
          className="flex-1 h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-slate-100 text-xs"
        />
        <TextInput
          ref={tenureRef}
          value={tenure}
          onChangeText={setTenure}
          onFocus={onFocusField}
          placeholder="Months Left"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          className="flex-1 h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-slate-100 text-xs"
        />
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => { Keyboard.dismiss(); onCancel(); }}
          className="flex-1 h-10 border border-slate-700 bg-slate-800/80 rounded-xl items-center justify-center"
        >
          <Text className="text-xs font-semibold text-slate-300">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          className="flex-1 h-10 bg-blue-600 rounded-xl items-center justify-center"
        >
          <Text className="text-xs font-bold text-white">Save Loan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
