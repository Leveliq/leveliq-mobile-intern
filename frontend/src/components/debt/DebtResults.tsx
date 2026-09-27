import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, TrendingDown } from 'lucide-react-native';
import { DebtScoreResult } from './types';
import { formatMoney } from './debtMath';

export function DebtResults({
  result,
  onEdit,
}: {
  result: DebtScoreResult;
  onEdit: () => void;
}) {
  const router = useRouter();

  return (
    <View>
      {/* Score Hero */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 items-center mb-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-[10px] font-black text-slate-400 tracking-wider">
            DEBT HEALTH SCORE
          </Text>
          <View
            className="px-2 py-0.5 rounded-full border"
            style={{ backgroundColor: `${result.color}15`, borderColor: `${result.color}35` }}
          >
            <Text className="text-[10px] font-bold" style={{ color: result.color }}>
              GRADE {result.grade}
            </Text>
          </View>
        </View>

        <Text className="text-6xl font-black my-1" style={{ color: result.color }}>
          {result.score}
        </Text>
        <Text className="text-xs font-bold text-slate-300 mb-4">{result.status}</Text>

        <View className="flex-row gap-2 w-full pt-3.5 border-t border-slate-800">
          <View className="flex-1 bg-slate-800/60 rounded-xl p-2.5 items-center">
            <Text className="text-xs font-bold text-slate-100" numberOfLines={1}>
              {formatMoney(result.totalDebt)}
            </Text>
            <Text className="text-[10px] text-slate-400 mt-0.5">Total Balance</Text>
          </View>
          <View className="flex-1 bg-slate-800/60 rounded-xl p-2.5 items-center">
            <Text className="text-xs font-bold text-slate-100" numberOfLines={1}>
              ₹{result.totalEMI.toLocaleString('en-IN')}
            </Text>
            <Text className="text-[10px] text-slate-400 mt-0.5">Monthly EMI</Text>
          </View>
          <View className="flex-1 bg-slate-800/60 rounded-xl p-2.5 items-center">
            <Text className="text-xs font-bold text-slate-100" numberOfLines={1}>
              {result.emiRatio !== null ? `${result.emiRatio}%` : 'N/A'}
            </Text>
            <Text className="text-[10px] text-slate-400 mt-0.5">EMI Burden</Text>
          </View>
        </View>
      </View>

      {/* Priorities List */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <TrendingDown size={16} color="#38BDF8" />
          <Text className="text-sm font-bold text-slate-100 ml-2">Action Priorities</Text>
        </View>
        <Text className="text-xs text-slate-400 mb-3">Ranked by risk and financial returns:</Text>

        {result.priorities.map((p, i) => (
          <View key={i} className="bg-slate-800/50 border-l-2 border-l-sky-400 rounded-r-xl p-3 mb-2.5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-bold text-slate-100 flex-1 mr-2">{p.title}</Text>
              <View className="bg-sky-500/10 px-2 py-0.5 rounded">
                <Text className="text-[9px] font-black text-sky-400">{p.impact}</Text>
              </View>
            </View>
            <Text className="text-[11px] text-slate-400 leading-4">{p.desc}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <TouchableOpacity
        onPress={onEdit}
        className="h-11 rounded-xl border border-slate-800 bg-slate-900 items-center justify-center mb-2.5"
      >
        <Text className="text-xs font-semibold text-slate-300">Modify Financial Inputs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(app)/analyze' as any)}
        className="flex-row items-center justify-center h-12 bg-blue-600 rounded-xl"
      >
        <Text className="text-xs font-bold text-white mr-1">Proceed to Portfolio Check</Text>
        <ChevronRight size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}
