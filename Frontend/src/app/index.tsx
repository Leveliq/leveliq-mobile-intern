// src/app/index.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import AuthScreen from '../screens/AuthScreen';

const svgLogoMini = `
<svg width="40" height="40" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M38 35V85C38 90.5228 42.4772 95 48 95H92" stroke="url(#l-grad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M46 73L63 54L77 66L102 37" stroke="#38BDF8" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M88 37H102V51" stroke="#38BDF8" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="97" cy="90" r="6" fill="#38BDF8"/>
  <defs>
    <linearGradient id="l-grad" x1="38" y1="35" x2="92" y2="95" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60A5FA"/>
      <stop offset="1" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
</svg>
`;

export default function HomeScreen() {
  const { user, loading: authLoading, userName, signOut } = useAuth();

  // 1. Initializing auth check
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#050816" />
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Initializing LevelIQ...</Text>
      </View>
    );
  }

  // 2. FIRST WHEN SCREEN LOADS: DIRECT LOGIN SCREEN (No dashboard)
  if (!user) {
    return <AuthScreen />;
  }

  // 3. ONLY AFTER LOGIN: Show Welcome Back with user name and sign out (zero fluff)
  const displayName =
    userName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'Investor';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050816" />
      <View style={styles.container}>
        {/* Ambient background glow effects */}
        <View style={styles.topGlow} pointerEvents="none" />
        <View style={styles.bottomGlow} pointerEvents="none" />

        {/* Centered Welcome Card */}
        <View style={styles.centerWrapper}>
          {/* Brand Badge */}
          <View style={styles.logoBadge}>
            <SvgXml xml={svgLogoMini} width={38} height={38} />
          </View>

          <View style={styles.welcomeCard}>
            {/* User Avatar Initial */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            {/* Welcome Greeting */}
            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
            <Text style={styles.welcomeName} numberOfLines={2}>
              {displayName} 👋
            </Text>

            {/* Email Pill Badge */}
            <View style={styles.emailBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.emailText} numberOfLines={1}>
                {user.email}
              </Text>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={signOut}
              activeOpacity={0.8}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050816',
  },
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  topGlow: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#123D91',
    opacity: 0.26,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -120,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#0C4A6E',
    opacity: 0.22,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoBadge: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 35, 78, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    marginBottom: 22,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  avatarText: {
    color: '#38BDF8',
    fontSize: 30,
    fontWeight: '800',
  },
  welcomeLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  welcomeName: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 38, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    marginBottom: 24,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  emailText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  signOutButton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
