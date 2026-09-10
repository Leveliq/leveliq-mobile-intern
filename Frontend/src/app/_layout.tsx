// src/app/_layout.tsx
import React, { useState } from 'react';
import { Slot } from 'expo-router';
import SplashScreen from '../components/splash/SplashScreen';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  if (!isReady) {
    return <SplashScreen onAnimationComplete={() => setIsReady(true)} />;
  }

  return <Slot />;
}