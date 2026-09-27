// src/app/(app)/_layout.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import {
  LayoutDashboard,
  Search,
  Target,
  CreditCard,
  Activity,
  Upload,
  LogOut,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MessageSquare,
  History,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import InvestIQChat from '../../components/chat/InvestIQChat';
import FloatingChatButton from '../../components/chat/FloatingChatButton';

const MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, route: 'index' },
  { label: 'Analyze Portfolio', icon: Upload, route: 'analyze' },
  { label: 'Pre-SIP Check', icon: Search, route: 'sip-checker' },
  { label: 'Goal Planner', icon: Target, route: 'goals' },
  { label: 'Debt Check', icon: CreditCard, route: 'debt' },
  { label: 'Health Score', icon: Activity, route: 'health' },
];

// ══════════════════════════════════════════════════════════════
// DRAWER CONTENT
// ══════════════════════════════════════════════════════════════
interface DrawerContentProps {
  drawerProps: any;
  onOpenChat: (withHistory: boolean) => void;
}

function CustomDrawerContent({ drawerProps, onOpenChat }: DrawerContentProps) {
  const { user, userName, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isUserExpanded, setIsUserExpanded] = useState(false);

  const displayName = userName || 'Investor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();
  const activeRoute = drawerProps.state?.routes?.[drawerProps.state.index]?.name;

  const handleNavigate = (route: string) => {
    drawerProps.navigation?.closeDrawer?.();
    if (route === 'index') {
      router.push('/(app)');
    } else {
      router.push(`/(app)/${route}` as any);
    }
  };

  const handleChatAction = (withHistory: boolean) => {
    drawerProps.navigation?.closeDrawer?.();
    // Small delay so drawer closes smoothly before modal opens
    setTimeout(() => onOpenChat(withHistory), 220);
  };

  return (
    <View
      className="flex-1 bg-[#050816]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Brand */}
      <View className="px-6 py-5 border-b border-sky-400/10 mb-2">
        <Text className="text-slate-50 text-xl font-extrabold tracking-wide">
          Level<Text className="text-[#38BDF8]">IQ</Text>
        </Text>
      </View>

      {/* Menu */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Main Navigation ────────────────── */}
        <Text className="text-slate-500 text-[10px] font-bold tracking-widest px-6 mb-2 mt-1">
          NAVIGATION
        </Text>

        {MENU.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeRoute === item.route ||
            (item.route === 'index' && activeRoute === 'index');

          return (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.7}
              onPress={() => handleNavigate(item.route)}
              className={`flex-row items-center mx-3 mb-1 px-4 py-3 rounded-xl ${
                isActive ? 'bg-blue-600/15 border border-blue-500/20' : ''
              }`}
            >
              <Icon size={18} color={isActive ? '#38BDF8' : '#94A3B8'} />
              <Text
                className={`ml-3 text-[13px] font-bold tracking-wide ${
                  isActive ? 'text-[#38BDF8]' : 'text-slate-300'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* ─── AI Assistant Section ────────────────── */}
        <View className="mt-6 mx-3 mb-1">
          <View className="h-[1px] bg-sky-400/10 mb-4" />
          <Text className="text-slate-500 text-[10px] font-bold tracking-widest px-3 mb-3">
            AI ASSISTANT
          </Text>

          {/* InvestIQ Chat Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleChatAction(false)}
            className="bg-gradient-to-br from-blue-600/20 to-sky-500/10 border border-blue-500/30 rounded-2xl p-3.5 mb-2"
            style={{
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mr-3">
                <Sparkles size={18} color="#fff" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-slate-50 text-[13px] font-extrabold">InvestIQ™</Text>
                  <View className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2" />
                </View>
                <Text className="text-slate-400 text-[10.5px] mt-0.5">
                  AI-powered chat assistant
                </Text>
              </View>
              <MessageSquare size={15} color="#38BDF8" />
            </View>
          </TouchableOpacity>

          {/* Chat History */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleChatAction(true)}
            className="flex-row items-center px-4 py-3 rounded-xl"
          >
            <History size={16} color="#94A3B8" />
            <Text className="ml-3 text-[13px] font-bold tracking-wide text-slate-300">
              Chat History
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom user card */}
      <View className="border-t border-sky-400/10 p-4">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsUserExpanded(!isUserExpanded)}
          className="flex-row items-center bg-[#0f172a] border border-sky-400/15 p-3 rounded-2xl"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-10 h-10 rounded-full bg-slate-800" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-blue-600/25 border border-[#38BDF8] items-center justify-center">
              <Text className="text-[#38BDF8] text-base font-bold">{initial}</Text>
            </View>
          )}

          <View className="ml-3 flex-1">
            <Text className="text-slate-50 text-sm font-bold" numberOfLines={1}>
              {displayName}
            </Text>
          </View>

          {isUserExpanded ? (
            <ChevronDown size={18} color="#94A3B8" />
          ) : (
            <ChevronUp size={18} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {isUserExpanded && (
          <View className="mt-3 px-2">
            <Text className="text-slate-400 text-xs mb-3 text-center" numberOfLines={1}>
              {user?.email}
            </Text>

            <TouchableOpacity
              onPress={async () => {
                drawerProps.navigation?.closeDrawer?.();
                await signOut();
              }}
              className="flex-row items-center justify-center py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <LogOut size={14} color="#F87171" />
              <Text className="text-red-400 text-xs font-bold ml-2">Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN LAYOUT
// ══════════════════════════════════════════════════════════════
export default function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [openWithHistory, setOpenWithHistory] = useState(false);

  const handleOpenChat = (withHistory: boolean) => {
    setOpenWithHistory(withHistory);
    setChatOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => (
          <CustomDrawerContent drawerProps={props} onOpenChat={handleOpenChat} />
        )}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#050816',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(56,189,248,0.1)',
          },
          headerTintColor: '#F8FAFC',
          headerTitle: () => (
            <Text className="text-slate-50 text-lg font-extrabold tracking-wide">
              Level<Text className="text-[#38BDF8]">IQ</Text>
            </Text>
          ),
          drawerType: 'front',
          drawerStyle: {
            backgroundColor: '#050816',
            width: 290,
          },
          overlayColor: 'rgba(5, 8, 22, 0.75)',
          sceneStyle: { backgroundColor: '#050816' },
        }}
      >
        <Drawer.Screen name="index" options={{ title: 'Dashboard', drawerLabel: 'Dashboard' }} />
        <Drawer.Screen name="analyze" options={{ title: 'Analyze Portfolio', drawerLabel: 'Analyze Portfolio' }} />
        <Drawer.Screen name="sip-checker" options={{ title: 'Pre-SIP Check', drawerLabel: 'Pre-SIP Check' }} />
        <Drawer.Screen name="debt" options={{ title: 'Debt Check', drawerLabel: 'Debt Check' }} />
        <Drawer.Screen
          name="report/[token]"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />
      </Drawer>

      {/* Floating chat button — appears on every screen */}
      <FloatingChatButton />

      {/* Sidebar-triggered chat modal */}
      <InvestIQChat
        visible={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setOpenWithHistory(false);
        }}
        openWithHistory={openWithHistory}
      />
    </View>
  );
}