// app/index.tsx
import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function IndexRedirect() {
  const { user, loading } = useAuth();

  // Show a clean loading indicator while determining auth status
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050816', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // Redirect to the correct directory cleanly
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)" />;
}