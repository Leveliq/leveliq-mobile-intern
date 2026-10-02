// app/(app)/_layout.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import InvestIQChat from '../../components/chat/InvestIQChat';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import GuestPromptModal from '../../components/modals/GuestPromptModal';

export default function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState<string | undefined>();
  const [guestModalVisible, setGuestModalVisible] = useState(false);

  const { user, userName, signOut, isGuest } = useAuth();
  const router = useRouter();

  const displayName = userName || 'Investor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!isGuest) {
      setGuestModalVisible(false);
      return;
    }

    const intervalId = setInterval(() => {
      setGuestModalVisible(true);
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isGuest]);

  const handleOpenChat = (sessionId?: string) => {
    setTargetSessionId(sessionId);
    setChatOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent drawerProps={props} onOpenChat={handleOpenChat} />}
        backBehavior="history"
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#050816', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(56,189,248,0.1)' },
          headerTintColor: '#F8FAFC',
          headerTitle: () => (
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(app)/analyze')}>
              <Text className="text-slate-50 text-lg font-extrabold tracking-wide">
                Level<Text className="text-[#38BDF8]">IQ</Text>
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex-row items-center gap-3" style={{ marginRight: 16 }}>
              {/* Chatbot Icon Trigger Button next to Profile Photo */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOpenChat()}
                className="w-9 h-9 rounded-full bg-blue-600/20 border border-sky-400/30 items-center justify-center"
              >
                <Sparkles size={16} color="#38BDF8" />
              </TouchableOpacity>

              {/* Profile Avatar / Placeholder */}
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={async () => { await signOut(); }}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="w-8 h-8 rounded-full bg-slate-800" />
                ) : (
                  <View className="w-8 h-8 rounded-full bg-blue-600/25 border border-[#38BDF8] items-center justify-center">
                    <Text className="text-[#38BDF8] text-xs font-bold">{initial}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ),
          drawerType: 'front',
          drawerStyle: { backgroundColor: '#050816', width: 290 },
          overlayColor: 'rgba(5, 8, 22, 0.75)',
          sceneStyle: { backgroundColor: '#050816' },
        }}
      >
        <Drawer.Screen name="index" options={{ title: 'Dashboard', drawerLabel: 'Dashboard' }} />
        <Drawer.Screen name="analyze" options={{ title: 'Analyze Portfolio', drawerLabel: 'Analyze Portfolio' }} />
        <Drawer.Screen name="sip-checker" options={{ title: 'Pre-SIP Check', drawerLabel: 'Pre-SIP Check' }} />
        <Drawer.Screen name="market-brief" options={{ title: 'Market Brief', drawerLabel: 'Market Brief' }} />
        <Drawer.Screen name="sip-calculator" options={{ title: 'SIP Calculator', drawerLabel: 'SIP Calculator' }} />
        <Drawer.Screen name="debt" options={{ title: 'Debt Check', drawerLabel: 'Debt Check' }} />
        <Drawer.Screen name="starter-iq" options={{ title: 'Starter IQ', drawerLabel: 'Starter IQ' }} />
        <Drawer.Screen name="stocks-iq/index" options={{ title: 'Stocks IQ', drawerLabel: 'Stocks IQ' }} />
        <Drawer.Screen name="stocks-iq/[symbol]" options={{ drawerItemStyle: { display: 'none' }, title: 'Stock Detail' }} />
        <Drawer.Screen name="report/[token]" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      </Drawer>

      <GuestPromptModal
        visible={guestModalVisible}
        onClose={() => setGuestModalVisible(false)}
        onSignOut={async () => {
          setGuestModalVisible(false);
          await signOut();
        }}
      />

      <InvestIQChat
        visible={chatOpen}
        onClose={() => { setChatOpen(false); setTargetSessionId(undefined); }}
        targetSessionId={targetSessionId}
      />
    </View>
  );
}