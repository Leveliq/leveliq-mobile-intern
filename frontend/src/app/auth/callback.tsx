// src/app/auth/callback.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        if (params.code) {
          console.log('🔄 [AuthCallback] Exchanging code for session...');
          await supabase.auth.exchangeCodeForSession(params.code);
        } else if (params.access_token && params.refresh_token) {
          console.log('🔄 [AuthCallback] Setting session from hash tokens...');
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
      } catch (e) {
        console.error('❌ [AuthCallback] Error exchanging auth code/session:', e);
      } finally {
        if (isMounted) {
          router.replace('/(app)');
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [params.code, params.access_token, params.refresh_token]);

  return (
    <View style={{ flex: 1, backgroundColor: '#050816', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#38BDF8" />
      <Text style={{ color: '#94A3B8', marginTop: 14, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>
        Completing sign in...
      </Text>
    </View>
  );
}
