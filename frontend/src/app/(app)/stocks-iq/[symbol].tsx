import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, BackHandler,
} from 'react-native';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Upload } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API = process.env.EXPO_PUBLIC_API_URL ;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = SCREEN_WIDTH < 340;

function Card({ children, className = '' }: any) {
  return (
    <View className={`bg-[#0F172A] border border-slate-800/60 rounded-2xl p-4 mb-3 ${className}`}>
      {children}
    </View>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase mb-3">
      {text}
    </Text>
  );
}

function StatBox({ label, value, color = '#F1F5F9' }: any) {
  return (
    <View className="flex-1 bg-[#0A0F1E] rounded-xl px-2 py-2.5 items-center">
      <Text className="font-black" style={{ fontSize: 17, color, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="text-slate-500 text-[10px] mt-1 text-center" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function FundamentalBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-[#0A0F1E] rounded-xl px-3 py-2.5" style={{ width: '48%' }}>
      <Text className="text-slate-500 text-[11px] mb-1">{label}</Text>
      <Text className="text-slate-100 text-[13px] font-bold" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  );
}

export default function StockDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();

  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleBack = useCallback(() => {
    router.replace('/(app)/stocks-iq' as any);
  }, [router]);

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleBack]);

  useEffect(() => {
    if (!symbol) return;
    fetch(`${API}/api/stocks/${symbol}`)
      .then((r) => r.json())
      .then((d) => setStock(d.stock || null))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#050816] justify-center items-center">
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (!stock) {
    return (
      <View className="flex-1 bg-[#050816] justify-center items-center px-6">
        <Text className="text-slate-100 text-[16px] font-semibold mb-2">Stock not found</Text>
        <TouchableOpacity onPress={handleBack}>
          <Text className="text-sky-400 text-[13px]">← Back to Stocks IQ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isUp = stock.change_pct >= 0;

  const fundamentals = [
    { label: 'Market Cap', value: stock.market_cap ? `₹${(stock.market_cap / 10000000).toFixed(0)}Cr` : '—' },
    { label: 'P/E Ratio', value: stock.pe ? `${stock.pe}x` : '—' },
    { label: 'P/B Ratio', value: stock.pb ? `${stock.pb}x` : '—' },
    { label: 'ROE', value: stock.roe ? `${stock.roe}%` : '—' },
    { label: 'Div Yield', value: stock.div_yield ? `${stock.div_yield}%` : '—' },
    { label: 'Beta', value: stock.beta || '—' },
    { label: '52W High', value: stock.high_52w ? `₹${stock.high_52w.toLocaleString('en-IN')}` : '—' },
    { label: '52W Low', value: stock.low_52w ? `₹${stock.low_52w.toLocaleString('en-IN')}` : '—' },
  ];

  return (
    <View className="flex-1 bg-[#050816]">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isSmall ? 14 : 18,
          paddingTop: 12,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={handleBack}
          className="flex-row items-center mb-5"
          style={{ gap: 6 }}
        >
          <ArrowLeft size={14} color="#64748B" />
          <Text className="text-slate-400 text-[13px]">Stocks IQ</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="mb-5">
          <Text
            className="text-slate-50 font-black mb-2"
            style={{ fontSize: isSmall ? 22 : 26, letterSpacing: -0.5 }}
          >
            {stock.name}
          </Text>

          <View className="flex-row flex-wrap mb-3" style={{ gap: 6 }}>
            <View className="bg-slate-800 rounded-md px-2 py-1">
              <Text className="text-slate-400 text-[10px] font-semibold">{stock.symbol}</Text>
            </View>
            <View className="bg-slate-800 rounded-md px-2 py-1">
              <Text className="text-slate-400 text-[10px] font-semibold">{stock.sector}</Text>
            </View>
            {stock.index && (
              <View className="bg-sky-500/10 rounded-md px-2 py-1">
                <Text className="text-sky-400 text-[10px] font-semibold">{stock.index}</Text>
              </View>
            )}
          </View>

          {stock.price && (
            <View className="flex-row items-end" style={{ gap: 10 }}>
              <Text
                className="text-slate-50 font-black"
                style={{ fontSize: 30, letterSpacing: -0.5, fontVariant: ['tabular-nums'] }}
              >
                ₹{stock.price.toLocaleString('en-IN')}
              </Text>
              {stock.change_pct !== null && (
                <View className="flex-row items-center mb-1" style={{ gap: 4 }}>
                  {isUp ? (
                    <TrendingUp size={14} color="#22C55E" />
                  ) : (
                    <TrendingDown size={14} color="#EF4444" />
                  )}
                  <Text
                    className="text-[13px] font-bold"
                    style={{ color: isUp ? '#22C55E' : '#EF4444', fontVariant: ['tabular-nums'] }}
                  >
                    {isUp ? '+' : ''}{stock.change_pct?.toFixed(2)}%
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* MF Holdings */}
        <View className="bg-sky-500/6 border border-sky-500/20 rounded-2xl p-4 mb-3">
          <Label text="Mutual Fund Holdings" />

          <View className="flex-row mb-4" style={{ gap: 8 }}>
            <StatBox label="MFs holding" value={stock.mf_count || 0} color="#38BDF8" />
            <StatBox
              label="Avg allocation"
              value={stock.avg_portfolio_weight ? `${stock.avg_portfolio_weight?.toFixed(1)}%` : '—'}
              color="#60A5FA"
            />
            <StatBox
              label="Total MF value"
              value={stock.total_mf_value ? `₹${(stock.total_mf_value / 10000000).toFixed(1)}Cr` : '—'}
              color="#22C55E"
            />
          </View>

          {stock.top_mf_holders?.length > 0 && (
            <>
              <Text className="text-slate-400 text-[12px] mb-2">
                Top funds holding {stock.name}:
              </Text>
              {stock.top_mf_holders.slice(0, 5).map((mf: any, i: number) => (
                <View
                  key={i}
                  className={`flex-row justify-between py-2.5 ${
                    i < Math.min(stock.top_mf_holders.length, 5) - 1
                      ? 'border-b border-slate-800/60'
                      : ''
                  }`}
                >
                  <Text className="text-slate-300 text-[12px] flex-1 mr-2" numberOfLines={1}>
                    {mf.scheme_name?.replace(/- Direct Plan.*/i, '').trim()}
                  </Text>
                  <Text className="text-sky-400 text-[12px] font-bold" style={{ fontVariant: ['tabular-nums'] }}>
                    {mf.weight?.toFixed(2)}%
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Fundamentals */}
        <Card>
          <Label text="Key Fundamentals" />
          <View className="flex-row flex-wrap justify-between" style={{ rowGap: 8 }}>
            {fundamentals.map((f, i) => (
              <FundamentalBox key={i} label={f.label} value={f.value} />
            ))}
          </View>
        </Card>

        {/* About */}
        {stock.about && (
          <Card>
            <Label text="About" />
            <Text className="text-slate-400 text-[13px] leading-6">{stock.about}</Text>
          </Card>
        )}

        {/* CTA */}
        <View className="bg-sky-500/6 border border-sky-500/15 rounded-2xl p-4 mb-3">
          <Text className="text-slate-100 text-[14px] font-bold mb-1">
            Own this via mutual funds?
          </Text>
          <Text className="text-slate-400 text-[12px] leading-5 mb-3">
            Check your portfolio to see total exposure to {stock.name}.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(app)/analyze')}
            className="bg-sky-500 rounded-xl py-3 flex-row items-center justify-center"
            style={{ gap: 8 }}
          >
            <Upload size={14} color="#FFFFFF" />
            <Text className="text-white text-[13px] font-bold">Check My Portfolio</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-start mt-3 px-2" style={{ gap: 6 }}>
          <Info size={11} color="#334155" style={{ marginTop: 2 }} />
          <Text className="text-slate-600 text-[10px] flex-1 leading-4">
            Price data may be delayed. Not investment advice. MF data from AMFI.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}