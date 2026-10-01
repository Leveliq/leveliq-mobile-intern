// app/_layout.tsx
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
    const isAuthCallback = segments[0] === 'auth';

    if (isAuthCallback) return;

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(app)');
    } else if (user && !inAppGroup && !inAuthGroup) {
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* AuthProvider is loaded immediately so session checking starts in parallel with the splash animation */}
      <AuthProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: '#050816' }}>
          {!isReady ? (
            <SplashScreen onAnimationComplete={() => setIsReady(true)} />
          ) : (
            <AuthGuard />
          )}
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}