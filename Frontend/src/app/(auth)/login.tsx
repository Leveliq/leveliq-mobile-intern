import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import AuthScreen from '../../screens/AuthScreen';

export default function LoginRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const initialMode = mode === 'signup' ? 'signup' : 'signin';
  return <AuthScreen initialMode={initialMode} />;
}