import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// MUST point to root global.css (from src/app/ go up twice)
import '../../global.css';

import SplashScreen from '../components/splash/SplashScreen';
import { AuthProvider } from '../context/AuthContext';

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
    <AuthProvider>
      <StatusBar style="light" />
      {/* Fallback bg so you never get a white flash even if CSS hiccups */}
      <View style={{ flex: 1, backgroundColor: '#050816' }}>
        <Slot />
      </View>
    </AuthProvider>
  );
}