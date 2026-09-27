// src/app/(app)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, Upload, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  const [showAllHistory, setShowAllHistory] = useState(false);

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

  const TrendIcon = ({ trend }: { trend: number }) => {
    if (trend > 0) return <TrendingUp size={14} color="#22C55E" />;
    if (trend < 0) return <TrendingDown size={14} color="#EF4444" />;
    return <Minus size={14} color="#64748B" />;
  };

  const displayName = userName || 'Investor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  const displayedReports = showAllHistory ? reports : reports.slice(0, 3);

  return (
    <View className="flex-1 bg-[#050816]">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center flex-1 pr-2">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-12 h-12 rounded-full bg-slate-800" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-blue-600/25 border border-[#38BDF8] items-center justify-center">
                <Text className="text-[#38BDF8] text-xl font-bold">{initial}</Text>
              </View>
            )}
            <View className="ml-3.5 flex-1">
              <Text numberOfLines={1} className="text-slate-50 text-[20px] font-extrabold tracking-tight">{displayName}</Text>
              <Text numberOfLines={1} className="text-slate-400 text-xs">{user?.email}</Text>
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
                    <TrendIcon trend={scoreTrend} />
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

        {/* Score Trend Mini Bar Chart */}
        {reports.length >= 2 && (
          <View className="bg-[#0f172a] rounded-[24px] p-5 border border-sky-400/15 mb-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-slate-400 text-[10px] font-bold tracking-[1.5px]">
                SCORE TREND (LAST {Math.min(reports.length, 8)})
              </Text>
              <Text className="text-slate-500 text-[10px] font-semibold">
                Score / 100
              </Text>
            </View>

            <View className="flex-row items-end justify-between" style={{ gap: 8 }}>
              {reports.slice(0, 8).reverse().map((r, i, arr) => {
                const score = r.health_score || 0;
                const barHeight = Math.max((score / 100) * 72, 14);
                const color = gc(r.grade);
                const isLatest = i === arr.length - 1;
                const d = new Date(r.created_at);
                const day = d.getDate();
                const month = d.toLocaleDateString('en-IN', { month: 'short' });

                return (
                  <View key={r.id || i} className="flex-1 items-center">
                    {/* Score value above bar */}
                    <Text
                      className="text-[10px] font-bold mb-1.5"
                      style={{ color: isLatest ? color : '#94A3B8' }}
                    >
                      {score}
                    </Text>

                    {/* Bar track and filled bar */}
                    <View className="w-full h-[76px] justify-end items-center bg-slate-800/35 rounded-t-md overflow-hidden">
                      <View
                        style={{ height: barHeight, backgroundColor: color }}
                        className={`w-full rounded-t-md ${isLatest ? 'opacity-100' : 'opacity-65'}`}
                      />
                    </View>

                    {/* Date label */}
                    <View className="items-center mt-2.5">
                      <Text className={`text-[10px] ${isLatest ? 'text-slate-200 font-bold' : 'text-slate-400 font-medium'}`}>
                        {day}
                      </Text>
                      <Text className="text-[8px] text-slate-500 uppercase tracking-tight">
                        {month}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Responsive Analysis History Section */}
        {reports.length > 0 && (
          <View className="bg-[#0f172a] rounded-[24px] p-5 border border-sky-400/15">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-slate-400 text-[10px] font-bold tracking-[1.5px]">
                ANALYSIS HISTORY ({reports.length})
              </Text>
            </View>

            <View className="space-y-3">
              {displayedReports.map((r, i) => {
                const prevScore = reports[i + 1]?.health_score;
                const diff = prevScore !== undefined ? r.health_score - prevScore : null;

                return (
                  <View 
                    key={r.id || i} 
                    className={`flex-row items-center justify-between py-3 ${i < displayedReports.length - 1 ? 'border-b border-slate-800/80' : ''}`}
                  >
                    <View className="flex-row items-center flex-1 pr-3">
                      <View 
                        style={{ backgroundColor: `${gc(r.grade)}15` }}
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      >
                        <Text style={{ color: gc(r.grade) }} className="text-sm font-black">{r.health_score}</Text>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center space-x-2">
                          <Text style={{ color: gc(r.grade) }} className="text-xs font-bold">Grade {r.grade}</Text>
                          {i === 0 && (
                            <View className="bg-green-500/10 px-1.5 py-0.5 rounded ml-2">
                              <Text className="text-[9px] text-green-500 font-bold">Latest</Text>
                            </View>
                          )}
                          {diff !== null && diff !== 0 && (
                            <View className="flex-row items-center ml-1">
                              <TrendIcon trend={diff} />
                              <Text className={`text-[10px] font-bold ml-0.5 ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {diff > 0 ? '+' : ''}{diff}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>

                    {r.share_token && (
                      <TouchableOpacity
                        onPress={() => router.push(`/(app)/report/${r.share_token}`)}
                        className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/50"
                      >
                        <Text className="text-slate-300 text-xs font-semibold">View →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {reports.length > 3 && (
              <TouchableOpacity
                onPress={() => setShowAllHistory(!showAllHistory)}
                className="mt-4 pt-3 border-t border-slate-800/80 flex-row items-center justify-center"
              >
                <Text className="text-[#38BDF8] text-xs font-bold mr-1">
                  {showAllHistory ? 'Show Less' : `View All History (${reports.length})`}
                </Text>
                {showAllHistory ? <ChevronUp size={14} color="#38BDF8" /> : <ChevronDown size={14} color="#38BDF8" />}
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}