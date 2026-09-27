import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import {
  LayoutDashboard,
  Search,
  CreditCard,
  Upload,
  LogOut,
  ChevronUp,
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
import InvestIQChat from '../../components/chat/InvestIQChat';
import { loadSessions } from '../../components/chat/chatApi';

// 1. NAVIGATION SECTION MENU
const NAVIGATION_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, route: 'index' },
  { label: 'Analyze Portfolio', icon: Upload, route: 'analyze' },
  { label: 'Pre-SIP Check', icon: Search, route: 'sip-checker' },
  { label: 'Market Brief', icon: Newspaper, route: 'market-brief' },
];

// 2. TOOLS SECTION MENU
const TOOLS_MENU = [
  { label: 'SIP Calculator', icon: Calculator, route: 'sip-calculator' },
  { label: 'Debt Check', icon: CreditCard, route: 'debt' },
  { label: 'Starter IQ', icon: GraduationCap, route: 'starter-iq' },
  { label: 'Stocks IQ', icon: LineChart, route: 'stocks-iq' },
];

interface DrawerContentProps {
  drawerProps: any;
  onOpenChat: (sessionId?: string) => void;
}

function CustomDrawerContent({ drawerProps, onOpenChat }: DrawerContentProps) {
  const { user, userName, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isUserExpanded, setIsUserExpanded] = useState(false);
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [visibleCount, setVisibleCount] = useState(2);

  const displayName = userName || 'Investor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();
  const activeRoute = drawerProps.state?.routes?.[drawerProps.state.index]?.name;

  useEffect(() => {
    if (user) {
      setLoadingHistory(true);
      loadSessions(user.id).then((data) => {
        setSessions(data);
        setLoadingHistory(false);
      });
    }
  }, [user]);

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
      {/* Header Logo */}
      <View className="px-6 py-5 border-b border-sky-400/10 mb-2">
        <Text className="text-slate-50 text-xl font-extrabold tracking-wide">
          Level<Text className="text-[#38BDF8]">IQ</Text>
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 4, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        
        {/* ================= NAVIGATION SECTION ================= */}
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

        {/* Separator */}
        <View className="h-[1px] bg-slate-800/60 my-4 mx-6" />

        {/* ================= TOOLS SECTION ================= */}
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

        {/* Separator */}
        <View className="h-[1px] bg-slate-800/60 my-4 mx-6" />

        {/* ================= CHAT SECTION ================= */}
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
      </ScrollView>

      {/* User Session Footer */}
      <View className="border-t border-sky-400/10 p-4">
        <TouchableOpacity activeOpacity={0.8} onPress={() => setIsUserExpanded(!isUserExpanded)} className="flex-row items-center bg-[#0f172a] border border-sky-400/15 p-3 rounded-2xl">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-10 h-10 rounded-full bg-slate-800" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-blue-600/25 border border-[#38BDF8] items-center justify-center">
              <Text className="text-[#38BDF8] text-base font-bold">{initial}</Text>
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-slate-50 text-sm font-bold" numberOfLines={1}>{displayName}</Text>
          </View>
          {isUserExpanded ? <ChevronDown size={18} color="#94A3B8" /> : <ChevronUp size={18} color="#94A3B8" />}
        </TouchableOpacity>

        {isUserExpanded && (
          <View className="mt-3 px-2">
            <Text className="text-slate-400 text-xs mb-3 text-center" numberOfLines={1}>{user?.email}</Text>
            <TouchableOpacity onPress={async () => { drawerProps.navigation?.closeDrawer?.(); await signOut(); }} className="flex-row items-center justify-center py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <LogOut size={14} color="#F87171" />
              <Text className="text-red-400 text-xs font-bold ml-2">Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState<string | undefined>();

  const handleOpenChat = (sessionId?: string) => {
    setTargetSessionId(sessionId);
    setChatOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent drawerProps={props} onOpenChat={handleOpenChat} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#050816', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(56,189,248,0.1)' },
          headerTintColor: '#F8FAFC',
          headerTitle: () => (
            <Text className="text-slate-50 text-lg font-extrabold tracking-wide">Level<Text className="text-[#38BDF8]">IQ</Text></Text>
          ),
          drawerType: 'front',
          drawerStyle: { backgroundColor: '#050816', width: 290 },
          overlayColor: 'rgba(5, 8, 22, 0.75)',
          sceneStyle: { backgroundColor: '#050816' },
        }}
      >
        {/* Navigation Screen Stack */}
        <Drawer.Screen name="index" options={{ title: 'Dashboard', drawerLabel: 'Dashboard' }} />
        <Drawer.Screen name="analyze" options={{ title: 'Analyze Portfolio', drawerLabel: 'Analyze Portfolio' }} />
        <Drawer.Screen name="sip-checker" options={{ title: 'Pre-SIP Check', drawerLabel: 'Pre-SIP Check' }} />
        <Drawer.Screen name="market-brief" options={{ title: 'Market Brief', drawerLabel: 'Market Brief' }} />

        {/* Tools Screen Stack */}
        <Drawer.Screen name="sip-calculator" options={{ title: 'SIP Calculator', drawerLabel: 'SIP Calculator' }} />
        <Drawer.Screen name="debt" options={{ title: 'Debt Check', drawerLabel: 'Debt Check' }} />
        <Drawer.Screen name="starter-iq" options={{ title: 'Starter IQ', drawerLabel: 'Starter IQ' }} />
        <Drawer.Screen name="stocks-iq/index" options={{ title: 'Stocks IQ', drawerLabel: 'Stocks IQ' }} />
        
        {/* Hidden sub/nested routes config */}
        <Drawer.Screen name="stocks-iq/[symbol]" options={{ drawerItemStyle: { display: 'none' }, title: 'Stock Detail' }} />
        <Drawer.Screen name="report/[token]" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      </Drawer>

      <InvestIQChat
        visible={chatOpen}
        onClose={() => { setChatOpen(false); setTargetSessionId(undefined); }}
        targetSessionId={targetSessionId}
      />
    </View>
  );
}