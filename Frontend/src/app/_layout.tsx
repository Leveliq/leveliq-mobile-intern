// src/app/_layout.tsx
import React, { useState } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import SplashScreen from '../components/splash/SplashScreen';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  if (!isReady) {
    return <SplashScreen onAnimationComplete={() => setIsReady(true)} />;
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Slot />
    </AuthProvider>
  );
}