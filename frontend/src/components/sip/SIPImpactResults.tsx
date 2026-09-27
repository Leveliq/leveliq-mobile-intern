import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react-native';
import { AnalysisResponse, FundItem } from './types';

interface SIPImpactResultsProps {
  before: AnalysisResponse;
  after: AnalysisResponse;
  newFund: FundItem;
}

export function SIPImpactResults({ before, after, newFund }: SIPImpactResultsProps) {
  const router = useRouter();
  const diff = after.health_score - before.health_score;

  // Filter overlaps that involve the candidate fund
  const relevantOverlaps = (after.overlaps || []).filter(
    (o) => o.fund1_code === newFund.scheme_code || o.fund2_code === newFund.scheme_code
  );

  const isPositive = diff > 2;
  const isNegative = diff < -2;

  const diffColor = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#94A3B8';

  return (
    <View className="mt-2">
      {/* Score Comparison Card */}
      <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4 shadow-sm">
        <View className="mb-4">
          <View className="flex-row items-center mb-1">
            <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center mr-2">
              <Text className="text-[10px] font-bold text-white">3</Text>
            </View>
            <Text className="text-sm font-bold text-slate-100">Impact Analysis</Text>
          </View>
          <Text className="text-xs text-slate-400 ml-7">
            How this fund modifies your total portfolio health.
          </Text>
        </View>

        {/* Current vs New Score Comparison */}
        <View className="flex-row items-center justify-between mb-4">
          {/* Current Score */}
          <View className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-xl py-3.5 items-center">
            <Text className="text-[11px] font-semibold text-slate-400 mb-1">Current Score</Text>
            <Text className="text-2xl font-black text-slate-100">{before.health_score}</Text>
            <Text className="text-[11px] font-bold text-slate-400 mt-0.5">Grade {before.grade}</Text>
          </View>

          {/* Delta Indicator */}
          <View className="px-3 items-center">
            {diff > 0 ? (
              <TrendingUp size={22} color="#10B981" />
            ) : diff < 0 ? (
              <TrendingDown size={22} color="#EF4444" />
            ) : (
              <Minus size={22} color="#94A3B8" />
            )}
            <Text className="text-sm font-black mt-1" style={{ color: diffColor }}>
              {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
            </Text>
          </View>

          {/* New Score */}
          <View
            className={`flex-1 rounded-xl py-3.5 items-center border ${
              isPositive
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : isNegative
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-slate-800/80 border-slate-700/80'
            }`}
          >
            <Text className="text-[11px] font-semibold text-slate-400 mb-1">New Score</Text>
            <Text className="text-2xl font-black" style={{ color: diffColor }}>
              {after.health_score}
            </Text>
            <Text className="text-[11px] font-bold text-slate-400 mt-0.5">Grade {after.grade}</Text>
          </View>
        </View>

        {/* Diagnosis Callout */}
        <View
          className={`rounded-xl p-3.5 flex-row items-start border ${
            isPositive
              ? 'bg-emerald-500/10 border-emerald-500/25'
              : isNegative
              ? 'bg-rose-500/10 border-rose-500/25'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}
        >
          <Text className="text-lg mr-2.5">{isPositive ? '✅' : isNegative ? '⚠️' : 'ℹ️'}</Text>
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-100 mb-0.5">
              {isPositive
                ? 'Good Addition'
                : isNegative
                ? 'High Overlap Detected'
                : 'Minimal Overall Impact'}
            </Text>
            <Text className="text-[11px] text-slate-400 leading-4">
              {isPositive
                ? `Adding ${newFund.scheme_name} meaningfully diversifies your existing portfolio.`
                : isNegative
                ? `This fund heavily overlaps with your current stocks and sectors. Consider alternative categories.`
                : `Adding ${newFund.scheme_name} does not significantly alter your portfolio profile.`}
            </Text>
          </View>
        </View>
      </View>

      {/* Overlap Breakdown (if any) */}
      {relevantOverlaps.length > 0 && (
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">
            Holding Overlap Breakdown
          </Text>
          {relevantOverlaps.map((item, idx) => {
            const pct = item.overlap_pct ?? 0;
            const otherName =
              item.fund1_code === newFund.scheme_code ? item.fund2_name : item.fund1_name;
            const barColor = pct > 50 ? '#EF4444' : pct > 30 ? '#F59E0B' : '#10B981';

            return (
              <View key={idx} className="mb-3.5">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-xs text-slate-300 flex-1 mr-2" numberOfLines={1}>
                    {otherName}
                  </Text>
                  <Text className="text-xs font-bold" style={{ color: barColor }}>
                    {pct.toFixed(1)}%
                  </Text>
                </View>
                <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Deep-Dive CTA */}
      <View className="items-center mb-4">
        <TouchableOpacity
          onPress={() => router.push('/(app)/analyze' as any)}
          activeOpacity={0.8}
          className="flex-row items-center justify-center bg-slate-900 border border-slate-700/80 px-6 h-12 rounded-xl"
        >
          <Text className="text-xs font-semibold text-slate-200 mr-2">
            View Full Portfolio Analysis
          </Text>
          <ArrowRight size={15} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
