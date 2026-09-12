// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';

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

const svgGoogle = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
</svg>
`;

export default function AuthScreen() {
  const { width } = useWindowDimensions();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    loading: authLoading,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message || 'Google sign-in was cancelled or failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in error.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMessage(error.message || 'Invalid email or password.');
      }
    } else {
      const { error, user } = await signUp(name, email, password);
      if (error) {
        setErrorMessage(error.message || 'Failed to create account.');
      } else {
        if (user && !user.identities?.length) {
          setErrorMessage('An account with this email already exists.');
        } else {
          setSuccessMessage('Account created! Signing you in...');
        }
      }
    }

    setIsSubmitting(false);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#050816" />

      {/* Ambient background glows */}
      <View style={styles.topGlow} pointerEvents="none" />
      <View style={styles.bottomGlow} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.mainWrapper, { maxWidth: Math.min(width - 32, 420) }]}>
            {/* Header Brand */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <SvgXml xml={svgLogoMini} width={34} height={34} />
              </View>
              <Text style={styles.brandTitle}>
                Level<Text style={styles.brandAccent}>IQ</Text>
              </Text>
            </View>

            {/* Auth Card Container */}
            <View style={styles.card}>
              {/* GOOGLE SIGN IN BUTTON */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting || authLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.googleButtonContent}>
                    <SvgXml xml={svgGoogle} width={18} height={18} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Mode Switcher Tabs */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.tab, mode === 'signin' && styles.tabActive]}
                  onPress={() => {
                    setMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                >
                  <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.tab, mode === 'signup' && styles.tabActive]}
                  onPress={() => {
                    setMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                >
                  <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Alert */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Success Alert */}
              {successMessage && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {/* Name Field (Sign Up only) */}
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#475569"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.showPasswordText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.primaryButton,
                  (isSubmitting || authLoading) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting || authLoading || isGoogleLoading}
              >
                {isSubmitting || authLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {mode === 'signin' ? 'Sign In to LevelIQ' : 'Create Supabase Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050816',
  },
  topGlow: {
    position: 'absolute',
    top: -110,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#123D91',
    opacity: 0.28,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -130,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#0C4A6E',
    opacity: 0.22,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  mainWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 35, 78, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.28)',
    marginBottom: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  brandAccent: {
    color: '#38BDF8',
  },
  brandSubtitle: {
    marginTop: 4,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.16)',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  googleButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginHorizontal: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(11, 19, 38, 0.85)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.08)',
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    padding: 9,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    borderWidth: 1,
    padding: 9,
    borderRadius: 10,
    marginBottom: 12,
  },
  successText: {
    color: '#4ADE80',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 11,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  showPasswordText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(11, 19, 38, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  securityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  footerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
});
