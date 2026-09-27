// src/app/(app)/market-brief.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Building2,
  Sparkles,
  Mail,
  BarChart3,
  Crown,
  LineChart,
  Clock,
  Info,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API = process.env.EXPO_PUBLIC_API_URL ;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = SCREEN_WIDTH < 340;

interface MarketData {
  nifty: { value: number; change: number; changePct: number };
  sensex: { value: number; change: number; changePct: number };
  bankNifty: { value: number; change: number; changePct: number };
  topGainers: { name: string; change: number }[];
  topLosers: { name: string; change: number }[];
  fii: { buy: number; sell: number; net: number };
  dii: { buy: number; sell: number; net: number };
  fiiDate: string;
  lastUpdated: string;
}

// ── Helpers ──────────────────────────────────────────────
const formatINR = (n: number) => n.toLocaleString('en-IN');
const formatCrore = (n: number) => {
  if (n === 0) return '₹0 Cr';
  const sign = n < 0 ? '-' : '';
  return `${sign}₹${Math.abs(n).toFixed(0)} Cr`;
};

// ── Spinning refresh icon ────────────────────────────────
function SpinningIcon({ spinning, size = 13, color = '#38BDF8' }: any) {
  const spin = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (spinning) {
      spin.setValue(0);
      loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
    } else {
      spin.setValue(0);
    }
    return () => loop?.stop();
  }, [spinning]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <RefreshCw size={size} color={color} />
    </Animated.View>
  );
}

// ── Index Card ───────────────────────────────────────────
function IndexCard({
  label,
  value,
  change,
  changePct,
}: {
  label: string;
  value: number;
  change: number;
  changePct: number;
}) {
  const isPositive = change >= 0;
  const color = isPositive ? '#22C55E' : '#EF4444';
  const bg = isPositive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
  const border = isPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';

  return (
    <View className="bg-[#0F172A] border border-slate-800/60 rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase">
          {label}
        </Text>
        <View
          className="rounded-md px-2 py-0.5"
          style={{ backgroundColor: bg, borderWidth: 1, borderColor: border }}
        >
          <View className="flex-row items-center" style={{ gap: 3 }}>
            {isPositive ? (
              <ArrowUpRight size={10} color={color} />
            ) : (
              <ArrowDownRight size={10} color={color} />
            )}
            <Text
              className="text-[10px] font-bold"
              style={{ color, fontVariant: ['tabular-nums'] }}
            >
              {isPositive ? '+' : ''}
              {changePct?.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      <Text
        className="text-slate-50 font-black"
        style={{
          fontSize: isSmall ? 22 : 26,
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.5,
        }}
      >
        {formatINR(value)}
      </Text>

      <View className="flex-row items-center mt-1.5" style={{ gap: 5 }}>
        {isPositive ? (
          <TrendingUp size={12} color={color} />
        ) : (
          <TrendingDown size={12} color={color} />
        )}
        <Text
          className="text-[12px] font-semibold"
          style={{ color, fontVariant: ['tabular-nums'] }}
        >
          {isPositive ? '+' : ''}
          {change?.toFixed(2)}
        </Text>
        <Text className="text-slate-600 text-[11px]">points</Text>
      </View>
    </View>
  );
}

// ── Gainer / Loser Row ──────────────────────────────────
function MoverRow({
  name,
  change,
  positive,
  isLast,
}: {
  name: string;
  change: number;
  positive: boolean;
  isLast: boolean;
}) {
  const color = positive ? '#22C55E' : '#EF4444';
  const bg = positive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';

  return (
    <View
      className={`flex-row items-center justify-between py-3 ${
        !isLast ? 'border-b border-slate-800/50' : ''
      }`}
    >
      <View className="flex-row items-center flex-1 mr-2" style={{ gap: 10 }}>
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{ backgroundColor: bg }}
        >
          {positive ? (
            <TrendingUp size={12} color={color} />
          ) : (
            <TrendingDown size={12} color={color} />
          )}
        </View>
        <Text
          className="text-slate-100 text-[12px] font-medium flex-1"
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
      <Text
        className="text-[12px] font-bold"
        style={{ color, fontVariant: ['tabular-nums'] }}
      >
        {positive ? '+' : ''}
        {change.toFixed(2)}%
      </Text>
    </View>
  );
}

// ── Movers Card (Gainers or Losers) ─────────────────────
function MoversCard({
  title,
  data,
  positive,
}: {
  title: string;
  data: { name: string; change: number }[];
  positive: boolean;
}) {
  const color = positive ? '#22C55E' : '#EF4444';
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <View className="bg-[#0F172A] border border-slate-800/60 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={14} color={color} />
        </View>
        <Text className="text-slate-100 text-[13px] font-bold">{title}</Text>
      </View>

      {data.length === 0 ? (
        <View className="py-4 items-center">
          <Text className="text-slate-600 text-[12px]">
            Market closed or data unavailable
          </Text>
        </View>
      ) : (
        data.slice(0, 5).map((s, i) => (
          <MoverRow
            key={i}
            name={s.name}
            change={s.change}
            positive={positive}
            isLast={i === Math.min(data.length, 5) - 1}
          />
        ))
      )}
    </View>
  );
}

// ── FII / DII Activity Card ─────────────────────────────
function ActivityCard({
  title,
  Icon,
  iconColor,
  activity,
  date,
}: {
  title: string;
  Icon: any;
  iconColor: string;
  activity: { buy: number; sell: number; net: number };
  date: string;
}) {
  const netPositive = activity.net >= 0;

  const items = [
    { label: 'Buy', value: activity.buy, color: '#22C55E' },
    { label: 'Sell', value: activity.sell, color: '#EF4444' },
    { label: 'Net', value: activity.net, color: netPositive ? '#22C55E' : '#EF4444' },
  ];

  return (
    <View className="bg-[#0F172A] border border-slate-800/60 rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View
            className="w-7 h-7 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon size={14} color={iconColor} />
          </View>
          <Text className="text-slate-100 text-[13px] font-bold">{title}</Text>
        </View>
        {date ? (
          <View className="bg-slate-800/60 rounded-full px-2 py-0.5">
            <Text className="text-slate-500 text-[9px] font-medium">{date}</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row" style={{ gap: 6 }}>
        {items.map((item) => (
          <View
            key={item.label}
            className="flex-1 bg-slate-800/30 rounded-xl py-2.5 items-center"
          >
            <Text
              className="font-bold mb-0.5"
              style={{
                color: item.color,
                fontSize: isSmall ? 12 : 13,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatCrore(item.value)}
            </Text>
            <Text className="text-slate-500 text-[10px] font-medium tracking-wider uppercase">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════

export default function MarketBriefScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchFIIDII = async () => {
    try {
      const res = await fetch(`${API}/api/market/fii-dii`);
      const d = await res.json();
      return {
        date: d.trade_date || '',
        fii: { buy: d.fii_buy || 0, sell: d.fii_sell || 0, net: d.fii_net || 0 },
        dii: { buy: d.dii_buy || 0, sell: d.dii_sell || 0, net: d.dii_net || 0 },
      };
    } catch {}
    return {
      date: '',
      fii: { buy: 0, sell: 0, net: 0 },
      dii: { buy: 0, sell: 0, net: 0 },
    };
  };

  const fetchMarketData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    try {
      const res = await fetch(`${API}/api/market/brief`);
      if (res.ok) {
        const d = await res.json();
        const fiiDii = await fetchFIIDII();
        setData({
          ...d,
          fii: fiiDii.fii,
          dii: fiiDii.dii,
          fiiDate: fiiDii.date,
        });
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(() => fetchMarketData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMarketData(true)}
            tintColor="#38BDF8"
            colors={['#38BDF8']}
            progressBackgroundColor="#0F172A"
          />
        }
      >
        {/* ── HEADER ── */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-1.5" style={{ gap: 8 }}>
                <View className="bg-sky-500/10 border border-sky-500/30 rounded-full px-3 py-1 flex-row items-center" style={{ gap: 5 }}>
                  <View className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <Text className="text-sky-400 text-[10px] font-bold tracking-wider">
                    LIVE
                  </Text>
                </View>
              </View>
              <Text
                className="text-slate-50 font-black"
                style={{ fontSize: isSmall ? 24 : 28, letterSpacing: -0.5 }}
              >
                Market Brief
              </Text>
              <View className="flex-row items-center mt-1" style={{ gap: 5 }}>
                <Clock size={11} color="#64748B" />
                <Text className="text-slate-500 text-[11px]">
                  {data?.lastUpdated ? `Updated ${data.lastUpdated}` : 'Live NSE data'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => fetchMarketData(true)}
              disabled={loading || refreshing}
              className="flex-row items-center bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-2"
              style={{ gap: 6 }}
            >
              <SpinningIcon spinning={loading || refreshing} />
              <Text className="text-sky-400 text-[11px] font-bold">
                {loading || refreshing ? 'Sync' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── LOADING STATE ── */}
        {loading && !data && (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text className="text-slate-400 text-[13px] mt-4">
              Fetching live market data…
            </Text>
            <Text className="text-slate-600 text-[11px] mt-1">
              Sourcing from NSE India
            </Text>
          </View>
        )}

        {/* ── ERROR STATE ── */}
        {error && !data && (
          <View className="bg-red-500/8 border border-red-500/25 rounded-2xl p-5 items-center">
            <View className="w-12 h-12 rounded-full bg-red-500/10 items-center justify-center mb-3">
              <AlertCircle size={22} color="#EF4444" />
            </View>
            <Text className="text-red-400 text-[14px] font-bold mb-1">
              Market data unavailable
            </Text>
            <Text className="text-slate-500 text-[12px] text-center leading-4 mb-4">
              Markets may be closed right now.{'\n'}Try again in a few minutes.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => fetchMarketData()}
              className="bg-sky-500 rounded-xl px-5 py-2.5"
            >
              <Text className="text-white text-[12px] font-bold">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── MAIN CONTENT ── */}
        {data && (
          <>
            {/* Section: Indices */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-slate-400 text-[11px] font-bold tracking-widest uppercase">
                  Market Indices
                </Text>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Text className="text-slate-500 text-[10px]">Real-time</Text>
                </View>
              </View>

              <IndexCard
                label="NIFTY 50"
                value={data.nifty.value}
                change={data.nifty.change}
                changePct={data.nifty.changePct}
              />
              <IndexCard
                label="NIFTY MIDCAP 100"
                value={data.sensex.value}
                change={data.sensex.change}
                changePct={data.sensex.changePct}
              />
              <IndexCard
                label="BANK NIFTY"
                value={data.bankNifty.value}
                change={data.bankNifty.change}
                changePct={data.bankNifty.changePct}
              />
            </View>

            {/* Section: Movers */}
            <View className="mt-4 mb-2">
              <Text className="text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-3 px-1">
                Top Movers
              </Text>

              <MoversCard
                title="Top Gainers"
                data={data.topGainers}
                positive={true}
              />
              <MoversCard
                title="Top Losers"
                data={data.topLosers}
                positive={false}
              />
            </View>

            {/* Section: Institutional Activity */}
            <View className="mt-4 mb-2">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-slate-400 text-[11px] font-bold tracking-widest uppercase">
                  Institutional Activity
                </Text>
              </View>

              <ActivityCard
                title="FII Activity"
                Icon={Globe}
                iconColor="#38BDF8"
                activity={data.fii}
                date={data.fiiDate}
              />
              <ActivityCard
                title="DII Activity"
                Icon={Building2}
                iconColor="#A78BFA"
                activity={data.dii}
                date={data.fiiDate}
              />

              {/* Info footer */}
              <View className="flex-row items-start px-2 mt-1" style={{ gap: 6 }}>
                <Info size={11} color="#475569" style={{ marginTop: 2 }} />
                <Text className="text-slate-600 text-[10px] flex-1 leading-4">
                  FII: Foreign Institutional Investors · DII: Domestic Institutional Investors. Values in ₹ Crore.
                </Text>
              </View>
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}