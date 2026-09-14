// src/app/index.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import AuthScreen from '../screens/AuthScreen';

const svgLogoMini = `
<svg width="40" height="40" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M38 35V85C38 90.5228 42.4772 95 48 95H92" stroke="url(#l-grad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M46 73L63 54L77 66L102 37" stroke="#38BDF8" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M88 37H102V51" stroke="#38BDF8" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="97" cy="90" r="6" fill="#38BDF8"/>
  <defs>
    <linearGradient id="l-grad" x1="38" y1="35" x2="92" y2="95" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60A5FA"/>
      <stop offset="1" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
</svg>
`;

export default function HomeScreen() {
  const { user, loading: authLoading, userName, signOut } = useAuth();

  // 1. Auth still loading
  if (authLoading) {
    return (
      <View className="flex-1 bg-[#050816] items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="#050816" />
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text className="mt-3.5 text-slate-400 text-[13px] font-medium">
          Initializing LevelIQ...
        </Text>
      </View>
    );
  }

  // 2. Not logged in → Auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // 3. Logged in → Welcome
  const displayName =
    userName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'Investor';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-[#050816]">
      <StatusBar barStyle="light-content" backgroundColor="#050816" />

      <View className="flex-1 bg-[#050816]">
        {/* Ambient glows */}
        <View
          pointerEvents="none"
          className="absolute top-[-100px] right-[-50px] w-[280px] h-[280px] rounded-full bg-[#123D91] opacity-[0.26]"
        />
        <View
          pointerEvents="none"
          className="absolute bottom-[-120px] left-[-60px] w-[300px] h-[300px] rounded-full bg-[#0C4A6E] opacity-[0.22]"
        />

        {/* Center content */}
        <View className="flex-1 items-center justify-center px-5">
          {/* Logo badge */}
          <View
            className="w-[62px] h-[62px] rounded-[18px] items-center justify-center bg-[#0f234e]/80 border border-blue-400/30 mb-[22px]"
            style={{
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.45,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <SvgXml xml={svgLogoMini} width={38} height={38} />
          </View>

          {/* Welcome card */}
          <View
            className="w-full max-w-[380px] bg-[#0f172a]/90 rounded-3xl py-8 px-6 items-center border border-sky-400/20"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            {/* Avatar */}
            <View
              className="w-[72px] h-[72px] rounded-full bg-blue-600/25 border-2 border-[#38BDF8] items-center justify-center mb-4"
              style={{
                shadowColor: '#38BDF8',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
              }}
            >
              <Text className="text-[#38BDF8] text-3xl font-extrabold">{initial}</Text>
            </View>

            <Text className="text-slate-400 text-[11px] font-bold tracking-[2px] mb-1.5">
              WELCOME BACK
            </Text>

            <Text className="text-slate-50 text-2xl font-extrabold text-center mb-4" numberOfLines={2}>
              {displayName} 👋
            </Text>

            {/* Email pill */}
            <View className="flex-row items-center bg-[#0b1326]/85 rounded-full px-3 py-1.5 border border-slate-400/15 mb-6">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
              <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>
                {user.email}
              </Text>
            </View>

            {/* Sign out */}
            <TouchableOpacity
              onPress={signOut}
              activeOpacity={0.8}
              className="w-full py-[13px] rounded-xl bg-red-500/10 border border-red-500/30 items-center justify-center"
            >
              <Text className="text-red-400 text-sm font-bold tracking-[0.3px]">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}