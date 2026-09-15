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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, route: 'index' },
  { label: 'Analyze Portfolio', icon: Upload, route: 'analyze' },
  { label: 'Pre-SIP Check', icon: Search, route: 'sip-checker' },
  { label: 'Goal Planner', icon: Target, route: 'goals' },
  { label: 'Debt Check', icon: CreditCard, route: 'debt' },
  { label: 'Health Score', icon: Activity, route: 'health' },
];

function CustomDrawerContent(props: any) {
  const { user, userName, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isUserExpanded, setIsUserExpanded] = useState(false);

  const displayName = userName || 'Investor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();
  const activeRoute = props.state?.routes?.[props.state.index]?.name;

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
        {MENU.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.route || (item.route === 'index' && activeRoute === 'index');

          return (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.7}
              onPress={() => {
                props.navigation?.closeDrawer?.();
                if (item.route === 'index') {
                  router.push('/(app)');
                }
                // other routes later: router.push(`/(app)/${item.route}`)
              }}
              className={`flex-row items-center mx-3 mb-1 px-4 py-3.5 rounded-xl ${
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
      </ScrollView>

      {/* Bottom: user icon only → expand for email + sign out */}
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
                props.navigation?.closeDrawer?.();
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

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
    </Drawer>
  );
}