import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { Search, TrendingUp, TrendingDown, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API = process.env.EXPO_PUBLIC_API_URL || 'https://leveliq-production.up.railway.app';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = SCREEN_WIDTH < 340;

function StockRow({ stock, rank, onPress }: any) {
  const isUp = stock.change_pct >= 0;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className="bg-[#0F172A] border border-slate-800/60 rounded-2xl px-4 py-3 mb-2.5 flex-row items-center"
    >
      {rank !== undefined && (
        <View className="w-9 h-9 rounded-xl bg-sky-500/10 items-center justify-center mr-3">
          <Text className="text-sky-400 text-[13px] font-black">#{rank}</Text>
        </View>
      )}

      <View className="flex-1 mr-2">
        <View className="flex-row items-center mb-0.5" style={{ gap: 6 }}>
          <Text className="text-slate-100 text-[13px] font-bold flex-1" numberOfLines={1}>
            {stock.name}
          </Text>
          <View className="bg-slate-800 rounded-md px-1.5 py-0.5">
            <Text className="text-slate-500 text-[9px] font-semibold">{stock.symbol}</Text>
          </View>
        </View>
        <Text className="text-slate-500 text-[11px]" numberOfLines={1}>
          {stock.sector} · <Text className="text-sky-400">{stock.mf_count || 0} MFs</Text>
        </Text>
      </View>

      <View className="items-end">
        {stock.price && (
          <Text className="text-slate-100 text-[13px] font-bold" style={{ fontVariant: ['tabular-nums'] }}>
            ₹{stock.price.toLocaleString('en-IN')}
          </Text>
        )}
        {stock.change_pct !== null && stock.change_pct !== undefined && (
          <Text
            className="text-[11px] font-semibold mt-0.5"
            style={{ color: isUp ? '#22C55E' : '#EF4444', fontVariant: ['tabular-nums'] }}
          >
            {isUp ? '+' : ''}{stock.change_pct?.toFixed(2)}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function StocksIQScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [topStocks, setTopStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/stocks/popular`)
      .then((r) => r.json())
      .then((d) => setTopStocks(d.stocks || []))
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/stocks/search?q=${encodeURIComponent(q)}`);
      const d = await res.json();
      setResults(d.stocks || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const goToStock = (symbol: string) => router.push(`/(app)/stocks-iq/${symbol}` as any);

  return (
    <View className="flex-1 bg-[#050816]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: isSmall ? 14 : 18,
          paddingTop: 12,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-5">
          <View className="bg-sky-500/10 border border-sky-500/30 rounded-full px-3 py-1 self-start mb-3">
            <Text className="text-sky-400 text-[10px] font-bold tracking-wider">STOCKS IQ</Text>
          </View>
          <Text
            className="text-slate-50 font-black mb-1.5"
            style={{ fontSize: isSmall ? 24 : 28, letterSpacing: -0.5 }}
          >
            Stock Explorer
          </Text>
          <Text className="text-slate-400 text-[13px] leading-5">
            How many mutual funds hold this stock? Pure data, not advice.
          </Text>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-[#0F172A] border border-slate-700/60 rounded-2xl px-4 py-3 mb-5">
          <Search size={16} color="#475569" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="HDFC Bank, Infosys, Reliance..."
            placeholderTextColor="#334155"
            className="flex-1 text-slate-100 text-[14px] ml-2.5"
            style={{ padding: 0 }}
          />
          {loading && <ActivityIndicator size="small" color="#38BDF8" />}
        </View>

        {/* Search results */}
        {results.length > 0 && (
          <View className="mb-2">
            {results.map((s, i) => (
              <StockRow key={i} stock={s} onPress={() => goToStock(s.symbol)} />
            ))}
          </View>
        )}

        {/* Popular stocks */}
        {!query && (
          <>
            <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase mb-3 px-1">
              Most held in Indian Mutual Funds
            </Text>
            {topStocks.length === 0 && (
              <ActivityIndicator size="small" color="#38BDF8" style={{ marginTop: 20 }} />
            )}
            {topStocks.map((s, i) => (
              <StockRow key={i} stock={s} rank={i + 1} onPress={() => goToStock(s.symbol)} />
            ))}
          </>
        )}

        <View className="flex-row items-start mt-4 px-2" style={{ gap: 6 }}>
          <Info size={11} color="#334155" style={{ marginTop: 2 }} />
          <Text className="text-slate-600 text-[10px] flex-1 leading-4">
            Price data delayed. MF data from AMFI. Not investment advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}