import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { FundItem } from './types';

interface FundSearchInputProps {
  query: string;
  onChangeQuery: (text: string) => void;
  placeholder: string;
  loading: boolean;
  results: FundItem[];
  onSelectFund: (fund: FundItem) => void;
  disabled?: boolean;
}

export function FundSearchInput({
  query,
  onChangeQuery,
  placeholder,
  loading,
  results,
  onSelectFund,
  disabled = false,
}: FundSearchInputProps) {
  return (
    <View className="relative z-20 mb-3.5">
      <View className="flex-row items-center bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 h-12">
        <Search size={16} color="#64748B" />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          editable={!disabled}
          className="flex-1 text-slate-100 text-xs font-medium pl-2.5 pr-2 h-full"
        />
        {loading && <ActivityIndicator size="small" color="#38BDF8" />}
      </View>

      {/* Dropdown Results */}
      {results.length > 0 && (
        <View className="absolute top-13 left-0 right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl max-h-48 overflow-hidden shadow-xl">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {results.slice(0, 5).map((fund, idx) => (
              <TouchableOpacity
                key={fund.scheme_code}
                onPress={() => onSelectFund(fund)}
                activeOpacity={0.7}
                className={`px-4 py-3 ${
                  idx < Math.min(results.length, 5) - 1 ? 'border-b border-slate-700/70' : ''
                }`}
              >
                <Text className="text-xs font-medium text-slate-200" numberOfLines={1}>
                  {fund.scheme_name}
                </Text>
                {fund.fund_house && (
                  <Text className="text-[10px] text-slate-400 mt-0.5">{fund.fund_house}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
