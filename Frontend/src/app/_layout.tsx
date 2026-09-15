// src/app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../../global.css';

import SplashScreen from '../components/splash/SplashScreen';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!user && !inAuthGroup) {
      // Not logged in + trying to view secure page -> Login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Logged in + trying to view login -> Dashboard
      router.replace('/(app)');
    } else if (user && !inAppGroup && !inAuthGroup) {
      // Catch-all: Logged in but at root -> Dashboard
      router.replace('/(app)');
    }
  }, [user, loading, segments]);

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
  const [isReady, setIsReady] = useState(false);

  if (!isReady) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onAnimationComplete={() => setIsReady(true)} />
      </>
    );
  }

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