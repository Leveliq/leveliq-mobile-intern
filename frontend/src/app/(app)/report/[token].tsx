// src/app/(app)/report/[token].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Share, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, AlertCircle, CheckCircle2, Info, Activity, Layers, Briefcase, ShieldAlert, BarChart2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API = process.env.EXPO_PUBLIC_API_URL || "https://leveliq-production.up.railway.app";
const { width } = Dimensions.get('window');

const GRADE_COLOR: Record<string, string> = {
  "A+": "#22C55E", "A": "#22C55E", "B+": "#84CC16",
  "B-": "#F59E0B", "C+": "#F97316", "C": "#F97316", "D": "#EF4444",
};

// Helper: Convert backend emojis/colors into sleek Native SVG Icons
const getInsightIcon = (color: string) => {
  if (color?.includes('EF4444') || color?.includes('red')) return <AlertCircle size={20} color="#EF4444" />;
  if (color?.includes('22C55E') || color?.includes('green')) return <CheckCircle2 size={20} color="#22C55E" />;
  if (color?.includes('F59E0B') || color?.includes('orange')) return <AlertCircle size={20} color="#F59E0B" />;
  return <Info size={20} color="#38BDF8" />;
};

function SectionHeader({ title, icon: Icon, color }: { title: string, icon: any, color: string }) {
  return (
    <View className="flex-row items-center mb-5 pb-3 border-b border-slate-800/60">
      <View className="w-8 h-8 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: `${color}15` }}>
        <Icon size={16} color={color} />
      </View>
      <Text className="text-slate-50 text-sm font-bold tracking-wide">{title}</Text>
    </View>
  );
}

export default function SharedReportScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || token === "undefined") { 
      setError("Invalid report link."); 
      setLoading(false); 
      return; 
    }

    fetch(`${API}/api/report/${token}`)
      .then(r => r.json())
      .then(d => { 
        if (d.success) setReport(d.report); 
        else setError("Report not found."); 
      })
      .catch(() => setError("Failed to load report data."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#050816] items-center justify-center">
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text className="text-slate-400 mt-4 text-xs font-semibold tracking-widest">ANALYZING DATA...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-[#050816] items-center justify-center px-6">
        <AlertCircle size={48} color="#EF4444" className="mb-4" />
        <Text className="text-slate-50 text-lg font-bold mb-6 text-center">{error}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-blue-600/20 border border-blue-500/30 px-8 py-3.5 rounded-xl">
          <Text className="text-[#38BDF8] font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const full = report.full_report || {};
  const score = full.health_score ?? report.health_score;
  const grade = full.grade ?? report.grade;
  const gc = GRADE_COLOR[grade] || "#94A3B8";
  
  const avgOverlap = full.avg_overlap ?? 0;
  const overlaps = full.overlaps ?? report.overlap_matrix ?? [];
  const stocks = full.stock_concentration ?? [];
  const insights = full.insights ?? [];
  
  const breakdown = full.breakdown ?? {
    diversification: report.diversification_score,
    overlap_control: report.overlap_score,
    concentration: report.concentration_score,
    risk_balance: report.risk_score,
    quality: report.quality_score,
  };

  const cleanName = (n: string) => n?.replace(/- Direct Plan.*/i,"").replace(/Direct Plan.*/i,"").replace(/-Direct.*/i,"").replace(/- Growth.*/i,"").trim() ?? n;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My portfolio scored ${score}/100 (Grade ${grade}) on LevelIQ! Check your overlap before investing: https://leveliq.in`,
      });
    } catch (error) {
      console.error("Error sharing", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#050816]" edges={['top']}>
      
      {/* Premium Native Header */}
      <View className="flex-row items-center justify-between px-2 py-2 border-b border-sky-400/10 bg-[#050816]">
        <TouchableOpacity onPress={() => router.back()} className="p-3" hitSlop={10}>
          <ArrowLeft size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <Text className="text-slate-50 font-extrabold text-[15px] tracking-wide">Report Summary</Text>
        <TouchableOpacity onPress={handleShare} className="p-3" hitSlop={10}>
          <Share2 size={20} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Main Score Hero */}
        <View className="bg-[#0f172a] rounded-[24px] p-8 items-center mb-6 border border-sky-400/10 shadow-lg shadow-black/40">
          <Text className="text-slate-500 text-[10px] font-bold tracking-[2px] mb-6">PORTFOLIO HEALTH SCORE</Text>
          
          <Text className="text-[84px] font-black tracking-tighter" style={{ color: gc, lineHeight: 90 }}>{score}</Text>
          <Text className="text-2xl font-bold mb-6 mt-[-5px]" style={{ color: gc }}>Grade {grade}</Text>
          
          <View className="flex-row items-center">
            <View className="bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
              <Text className="text-slate-400 text-[10px] font-bold">
                ANALYZED ON {new Date(report.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* InsightIQ™ - Smart Insights */}
        {insights.length > 0 && (
          <View className="bg-[#0f172a] border border-sky-400/10 rounded-[20px] p-5 mb-5">
            <SectionHeader title="InsightIQ™" icon={Activity} color="#38BDF8" />
            
            <View className="gap-4">
              {insights.map((ins: any, i: number) => {
                const IconComponent = getInsightIcon(ins.color);
                // Strip emoji if backend sent one in text
                const cleanText = ins.text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

                return (
                  <View key={i} className="flex-row items-start bg-[#0a0f1e]/50 p-4 rounded-2xl border border-slate-800/50">
                    <View className="mt-0.5 mr-3">{IconComponent}</View>
                    <Text className="text-slate-300 text-[13px] leading-5 flex-1">{cleanText}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* OverlapIQ™ - Fund Overlap */}
        <View className="bg-[#0f172a] border border-sky-400/10 rounded-[20px] p-5 mb-5">
          <SectionHeader title="OverlapIQ™" icon={Layers} color="#EF4444" />
          
          {overlaps.length > 0 ? overlaps.map((o: any, i: number) => {
            const pct = o.overlap_pct ?? o.overlap_percentage ?? 0;
            const pctColor = pct > 50 ? "#EF4444" : pct > 30 ? "#F59E0B" : "#22C55E";
            
            return (
              <View key={i} className={`mb-4 pb-4 ${i < overlaps.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                <View className="flex-row justify-between items-end mb-2.5">
                  <View className="flex-1 pr-4">
                    <Text className="text-slate-50 text-[11px] font-bold leading-4 mb-1" numberOfLines={2}>{cleanName(o.fund1_name)}</Text>
                    <Text className="text-slate-500 text-[10px] font-bold">×</Text>
                    <Text className="text-slate-50 text-[11px] font-bold leading-4 mt-1" numberOfLines={2}>{cleanName(o.fund2_name)}</Text>
                  </View>
                  <Text className="text-lg font-black" style={{ color: pctColor }}>{Number(pct).toFixed(1)}%</Text>
                </View>
                
                <View className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pctColor }} />
                </View>
                
                {o.common_stock_list?.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {o.common_stock_list.slice(0, 4).map((s: string, j: number) => (
                      <View key={j} className="bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-md">
                        <Text className="text-slate-400 text-[9px] font-semibold">{s}</Text>
                      </View>
                    ))}
                    {o.common_stock_list.length > 4 && (
                      <View className="bg-slate-800/60 border border-slate-700/50 px-2 py-1 rounded-md">
                        <Text className="text-slate-500 text-[9px] font-bold">+{o.common_stock_list.length - 4}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          }) : (
            <View className="flex-row items-center bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
              <CheckCircle2 size={18} color="#22C55E" />
              <Text className="text-green-400 text-[13px] font-bold ml-3">Excellent! No significant overlap.</Text>
            </View>
          )}
        </View>

        {/* StocksIQ™ - Top Exposure */}
        {stocks.length > 0 && (
          <View className="bg-[#0f172a] border border-sky-400/10 rounded-[20px] p-5 mb-5">
            <SectionHeader title="StocksIQ™" icon={Briefcase} color="#A78BFA" />
            
            {stocks.slice(0, 6).map((s: any, i: number) => (
              <View key={i} className="mb-3.5">
                <View className="flex-row justify-between items-center mb-1.5">
                  <View className="flex-row items-center flex-1 pr-2">
                    <Text className="text-slate-50 text-[13px] font-bold" numberOfLines={1}>{s.stock}</Text>
                    {s.appears_in?.length > 1 && (
                      <View className="bg-slate-800 ml-2 px-1.5 py-0.5 rounded border border-slate-700">
                        <Text className="text-slate-400 text-[8px] font-bold">{s.appears_in.length} FUNDS</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[13px] font-black" style={{ color: s.total_pct > 10 ? "#EF4444" : s.total_pct > 5 ? "#F59E0B" : "#94A3B8" }}>
                    {s.total_pct?.toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-slate-500 text-[10px] w-[90px] font-medium" numberOfLines={1}>{s.sector?.toUpperCase()}</Text>
                  <View className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden ml-2">
                    <View className="h-full rounded-full" style={{ width: `${Math.min(s.total_pct * 4, 100)}%`, backgroundColor: s.total_pct > 10 ? "#EF4444" : s.total_pct > 5 ? "#F59E0B" : "#2563EB" }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PortfolioIQ™ - Score Breakdown Matrix */}
        <View className="bg-[#0f172a] border border-sky-400/10 rounded-[20px] p-5 mb-6">
          <SectionHeader title="Portfolio Matrix" icon={BarChart2} color="#22C55E" />
          
          <View className="flex-row flex-wrap justify-between">
            {Object.entries(breakdown).map(([key, val]: any) => val !== null && val !== undefined && (
              <View key={key} className="w-[47%] mb-4 bg-[#0a0f1e]/50 p-3 rounded-xl border border-slate-800/50">
                <Text className="text-slate-400 text-[10px] font-bold tracking-wide uppercase mb-2">{key.replace(/_/g, " ")}</Text>
                <View className="flex-row justify-between items-end mb-1.5">
                  <Text className="text-lg font-black" style={{ color: val >= 70 ? "#22C55E" : val >= 50 ? "#F59E0B" : "#EF4444" }}>{val}</Text>
                  <Text className="text-slate-600 text-[10px] font-bold mb-1">/100</Text>
                </View>
                <View className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${Math.min(val, 100)}%`, backgroundColor: val >= 70 ? "#22C55E" : val >= 50 ? "#F59E0B" : "#EF4444" }} />
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}