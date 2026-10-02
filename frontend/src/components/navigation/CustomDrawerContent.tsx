// src/components/navigation/CustomDrawerContent.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  LayoutDashboard,
  Search,
  CreditCard,
  Upload,
  LogOut,
  ChevronDown,
  Plus,
  MessageSquare,
  Newspaper,
  GraduationCap,
  Calculator,
  LineChart,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { loadSessions } from '../chat/chatApi';

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

export default function CustomDrawerContent({ drawerProps, onOpenChat }: CustomDrawerContentProps) {
  const { user, signOut, isGuest } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [visibleCount, setVisibleCount] = useState(2);

  const activeRoute = drawerProps.state?.routes?.[drawerProps.state.index]?.name;

  useEffect(() => {
    if (user && !isGuest) {
      setLoadingHistory(true);
      loadSessions(user.id).then((data) => {
        setSessions(data);
        setLoadingHistory(false);
      });
    }
  }, [user, isGuest]);

  const handleNavigate = (route: string) => {
    drawerProps.navigation?.closeDrawer?.();
    if (route === 'index') {
      router.push('/(app)');
    } else {
      router.push(`/(app)/${route}` as any);
    }
  };

  const handleChatAction = (sessionId?: string) => {
    drawerProps.navigation?.closeDrawer?.();
    setTimeout(() => onOpenChat(sessionId), 220);
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

        {!isGuest && (
          <>
            <View className="h-[1px] bg-slate-800/60 my-4 mx-6" />
            <Text className="text-slate-500 text-[10px] font-bold tracking-widest px-6 mb-2">INVESTIQ CHAT</Text>
            <View className="mx-3">
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => handleChatAction()} 
                className="flex-row items-center px-4 py-3 rounded-xl mb-1 bg-sky-400/5 border border-sky-400/10"
              >
                <Plus size={18} color="#38BDF8" />
                <Text className="ml-3 text-[13px] font-bold text-sky-400 tracking-wide">New Chat</Text>
              </TouchableOpacity>

              <View className="flex-row items-center justify-between px-4 mt-2 mb-1">
                <Text className="text-slate-400 text-[11px] font-medium tracking-wide">Recent Chats</Text>
              </View>

              {loadingHistory ? (
                <ActivityIndicator size="small" color="#38BDF8" style={{ marginTop: 10 }} />
              ) : (
                <>
                  {sessions.slice(0, visibleCount).map((session) => (
                    <TouchableOpacity 
                      key={session.session_id} 
                      activeOpacity={0.7} 
                      onPress={() => handleChatAction(session.session_id)} 
                      className="flex-row items-center px-4 py-3 rounded-xl"
                    >
                      <MessageSquare size={15} color="#94A3B8" />
                      <Text className="ml-3 text-[13px] text-slate-300 flex-1 font-medium" numberOfLines={1}>
                        {session.first_message}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {sessions.length > visibleCount && (
                    <TouchableOpacity 
                      activeOpacity={0.7} 
                      onPress={() => setVisibleCount((prev) => prev + 5)} 
                      className="flex-row items-center px-4 py-2 rounded-xl mt-1"
                    >
                      <ChevronDown size={14} color="#94A3B8" />
                      <Text className="ml-3 text-[12px] text-slate-400 font-medium">Show more</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </>
        )}
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