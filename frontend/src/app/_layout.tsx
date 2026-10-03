// app/_layout.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../../global.css'; 
import { AuthProvider, useAuth } from '../context/AuthContext';

function AuthGuard() {
  const { user, loading, isGuest } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const isAuthCallback = segments[0] === 'auth';

    if (isAuthCallback) return;

    const hasAccess = !!user || isGuest;

    if (!hasAccess && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (hasAccess && inAuthGroup) {
      router.replace('/(app)/analyze');
    }
  }, [user, loading, isGuest, segments]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#050816] items-center justify-center">
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: '#050816' }}>
          <AuthGuard />
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}