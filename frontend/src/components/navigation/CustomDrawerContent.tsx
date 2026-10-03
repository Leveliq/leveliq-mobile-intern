// src/components/navigation/CustomDrawerContent.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  LayoutDashboard,
  Search,
  CreditCard,
  Upload,
  LogOut,
  Newspaper,
  GraduationCap,
  Calculator,
  LineChart,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const NAVIGATION_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, route: 'index' },
  { label: 'Analyze Portfolio', icon: Upload, route: 'analyze' },
  { label: 'Pre-SIP Check', icon: Search, route: 'sip-checker' },
  { label: 'Market Brief', icon: Newspaper, route: 'market-brief' },
];

const TOOLS_MENU = [
  { label: 'SIP Calculator', icon: Calculator, route: 'sip-calculator' },
  { label: 'Debt Check', icon: CreditCard, route: 'debt' },
  { label: 'Starter IQ', icon: GraduationCap, route: 'starter-iq' },
  { label: 'Stocks IQ', icon: LineChart, route: 'stocks-iq' },
];

interface CustomDrawerContentProps {
  drawerProps: any;
  onOpenChat: (sessionId?: string) => void;
}

export default function CustomDrawerContent({ drawerProps }: CustomDrawerContentProps) {
  const { signOut, isGuest } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const activeRoute = drawerProps.state?.routes?.[drawerProps.state.index]?.name;

  const handleNavigate = (route: string) => {
    drawerProps.navigation?.closeDrawer?.();
    if (route === 'index') {
      router.push('/(app)');
    } else {
      router.push(`/(app)/${route}` as any);
    }
  };

  return (
    <View className="flex-1 bg-[#050816]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => {
          drawerProps.navigation?.closeDrawer?.();
          router.push('/(app)/analyze');
        }}
        className="px-6 py-5 border-b border-sky-400/10 mb-2"
      >
        <Text className="text-slate-50 text-xl font-extrabold tracking-wide">
          Level<Text className="text-[#38BDF8]">IQ</Text>
        </Text>
      </TouchableOpacity>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 4, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Text className="text-slate-500 text-[10px] font-bold tracking-widest px-6 mb-2 mt-1">NAVIGATION</Text>
        {NAVIGATION_MENU.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.route || (item.route === 'index' && activeRoute === 'index');

          return (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.7}
              onPress={() => handleNavigate(item.route)}
              className={`flex-row items-center mx-3 mb-1 px-4 py-3 rounded-xl ${isActive ? 'bg-blue-600/15 border border-blue-500/20' : ''}`}
            >
              <Icon size={18} color={isActive ? '#38BDF8' : '#94A3B8'} />
              <Text className={`ml-3 text-[13px] font-bold tracking-wide ${isActive ? 'text-[#38BDF8]' : 'text-slate-300'}`}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}

        <View className="h-[1px] bg-slate-800/60 my-4 mx-6" />

        <Text className="text-slate-500 text-[10px] font-bold tracking-widest px-6 mb-2">TOOLS</Text>
        {TOOLS_MENU.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.route || (item.route === 'stocks-iq' && activeRoute?.startsWith('stocks-iq'));

          return (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.7}
              onPress={() => handleNavigate(item.route)}
              className={`flex-row items-center mx-3 mb-1 px-4 py-3 rounded-xl ${isActive ? 'bg-blue-600/15 border border-blue-500/20' : ''}`}
            >
              <Icon size={18} color={isActive ? '#38BDF8' : '#94A3B8'} />
              <Text className={`ml-3 text-[13px] font-bold tracking-wide ${isActive ? 'text-[#38BDF8]' : 'text-slate-300'}`}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Clean Bottom Footer with Only Sign Out Button */}
      <View className="border-t border-sky-400/10 p-4">
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={async () => { await signOut(); }} 
          className="flex-row items-center justify-center py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
        >
          <LogOut size={15} color="#F87171" />
          <Text className="text-red-400 text-xs font-bold ml-2">{isGuest ? 'Exit Guest Mode' : 'Sign Out'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}