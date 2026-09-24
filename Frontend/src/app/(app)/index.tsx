// src/app/(app)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, Upload, Search, Target, CreditCard, Activity } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const GRADE_COLOR: Record<string, string> = {
  'A+': '#22C55E', 'A': '#22C55E', 'B+': '#84CC16',
  'B-': '#F59E0B', 'C+': '#F97316', 'C': '#F97316', 'D': '#EF4444',
};

export default function DashboardScreen() {
  const { user, userName } = useAuth();
  const router = useRouter();

  const [plan, setPlan] = useState<string>('free');
  const [reports, setReports] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        const { data: planData } = await supabase.from('users').select('plan').eq('id', user.id).single();
        if (planData) setPlan(planData.plan);

        const { data: reportData } = await supabase
          .from('reports')
          .select('id, health_score, grade, share_token, created_at, sector_breakdown, overlap_matrix')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (reportData) setReports(reportData);
      } catch (error) {
        console.error('[Dashboard] Unexpected error:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loadingData) {
    return (
      <View className="flex-1 bg-[#050816] items-center justify-center">
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text className="mt-4 text-slate-400 font-medium">Loading Portfolio...</Text>
      </View>
    );
  }

  const gc = (grade: string) => GRADE_COLOR[grade] || '#94A3B8';
  const latest = reports[0];
  const previous = reports[1];
  const scoreTrend = latest && previous ? latest.health_score - previous.health_score : null;

  const TrendIcon = () => {
    if (scoreTrend === null) return null;
    if (scoreTrend > 0) return <TrendingUp size={16} color="#22C55E" />;
    if (scoreTrend < 0) return <TrendingDown size={16} color="#EF4444" />;
    return <Minus size={16} color="#64748B" />;
  };

  const displayName = userName || 'Investor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-[#050816]">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-12 h-12 rounded-full bg-slate-800" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-blue-600/25 border border-[#38BDF8] items-center justify-center">
                <Text className="text-[#38BDF8] text-xl font-bold">{initial}</Text>
              </View>
            )}
            <View className="ml-3.5">
              <Text className="text-slate-50 text-[22px] font-extrabold tracking-tight">{displayName}</Text>
              <Text className="text-slate-400 text-xs">{user?.email}</Text>
            </View>
          </View>

          {plan === 'premium' && (
            <View className="bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-full">
              <Text className="text-[#38BDF8] text-[10px] font-bold tracking-wide">PRO</Text>
            </View>
          )}
        </View>

        {/* Empty State */}
        {reports.length === 0 && (
          <View className="bg-[#0f172a] rounded-3xl p-8 border border-sky-400/20 items-center justify-center mb-6">
            <Text className="text-[40px] mb-3">📊</Text>
            <Text className="text-slate-50 text-lg font-bold mb-2">No analyses yet</Text>
            <Text className="text-slate-400 text-sm text-center mb-6 px-2">
              Analyze your portfolio to see your Health Score and track it over time.
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/(app)/analyze' as any)}
              className="w-full flex-row items-center justify-center bg-blue-600 py-3.5 rounded-xl"
            >
              <Upload size={16} color="#FFF" />
              <Text className="text-white font-bold ml-2">Analyze Portfolio</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Premium Latest Score Card */}
        {latest && (
          <View className="bg-[#0f172a] rounded-[24px] p-6 border border-sky-400/20 mb-6 shadow-lg shadow-black/50">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-slate-400 text-[10px] font-bold tracking-[1.5px]">LATEST HEALTH SCORE™</Text>
              <Text className="text-slate-500 text-[10px] font-medium">
                {new Date(latest.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-[64px] font-black tracking-tighter" style={{ color: gc(latest.grade), lineHeight: 70 }}>
                  {latest.health_score}
                </Text>
                <Text className="text-lg font-bold mt-[-4px]" style={{ color: gc(latest.grade) }}>
                  Grade {latest.grade}
                </Text>
              </View>

              <View className="items-end justify-center">
                {scoreTrend !== null ? (
                  <View className={`flex-row items-center px-3 py-2 rounded-xl border ${scoreTrend > 0 ? 'bg-green-500/10 border-green-500/20' : scoreTrend < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                    <TrendIcon />
                    <Text className={`text-[12px] font-bold ml-1.5 ${scoreTrend > 0 ? 'text-green-500' : scoreTrend < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {scoreTrend > 0 ? '+' : ''}{scoreTrend} pts
                    </Text>
                  </View>
                ) : (
                  <View className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <Text className="text-slate-400 text-[11px] font-bold">First Scan</Text>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => router.push(`/(app)/report/${latest.share_token}`)}
                className="flex-1 bg-blue-600/15 border border-blue-500/30 py-3.5 rounded-xl items-center justify-center"
              >
                <Text className="text-[#38BDF8] text-[13px] font-bold">View Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(app)/analyze' as any)}
                className="flex-1 bg-blue-600 py-3.5 rounded-xl items-center justify-center flex-row"
              >
                <Upload size={14} color="#FFF" />
                <Text className="text-white text-[13px] font-bold ml-2">Analyze</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions Grid */}
        <Text className="text-slate-400 text-[10px] font-bold tracking-[1.5px] mb-3 px-1 mt-4">QUICK TOOLS</Text>
        <View className="flex-row flex-wrap justify-between">
          <TouchableOpacity
            onPress={() => router.push('/(app)/sip-checker' as any)}
            className="w-[48%] bg-[#0f172a] p-4 rounded-2xl border border-sky-400/15 mb-3"
          >
            <Search size={20} color="#38BDF8" style={{ marginBottom: 10 }} />
            <Text className="text-slate-50 text-xs font-bold mb-1">Pre-SIP Check</Text>
            <Text className="text-slate-500 text-[10px]">Check overlap before buying</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] bg-[#0f172a] p-4 rounded-2xl border border-sky-400/15 mb-3">
            <Target size={20} color="#38BDF8" style={{ marginBottom: 10 }} />
            <Text className="text-slate-50 text-xs font-bold mb-1">Goal Planner</Text>
            <Text className="text-slate-500 text-[10px]">Coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] bg-[#0f172a] p-4 rounded-2xl border border-sky-400/15 mb-3">
            <CreditCard size={20} color="#38BDF8" style={{ marginBottom: 10 }} />
            <Text className="text-slate-50 text-xs font-bold mb-1">Debt Check</Text>
            <Text className="text-slate-500 text-[10px]">Coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] bg-[#0f234e]/50 p-4 rounded-2xl border border-blue-500/30 mb-3">
            <Activity size={20} color="#60A5FA" style={{ marginBottom: 10 }} />
            <Text className="text-[#60A5FA] text-xs font-bold mb-1">Health Score</Text>
            <Text className="text-slate-500 text-[10px]">On latest report</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}