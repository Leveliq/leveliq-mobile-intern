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
  const { signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();

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
      if (error) setErrorMessage(error.message || 'Google sign-in was cancelled or failed.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in error.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) return setErrorMessage('Please provide both email and password.');
    if (mode === 'signup' && !name.trim()) return setErrorMessage('Please enter your full name.');
    if (password.length < 6) return setErrorMessage('Password must be at least 6 characters long.');

    setIsSubmitting(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setErrorMessage(error.message || 'Invalid email or password.');
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
    <View className="flex-1 bg-[#050816]">
      <StatusBar barStyle="light-content" backgroundColor="#050816" />

      {/* Ambient background glows */}
      <View className="absolute top-[-110px] self-center w-[320px] h-[320px] rounded-full bg-[#123D91] opacity-[0.28]" pointerEvents="none" />
      <View className="absolute bottom-[-130px] self-center w-[320px] h-[320px] rounded-full bg-[#0C4A6E] opacity-[0.22]" pointerEvents="none" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View className="w-full max-w-[420px] items-center">
            
            {/* Header Brand */}
            <View className="items-center w-full mb-4">
              <View 
                className="w-14 h-14 rounded-2xl items-center justify-center bg-[#0f234e]/75 border border-blue-400/30 mb-2.5"
                style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 8 }}
              >
                <SvgXml xml={svgLogoMini} width={34} height={34} />
              </View>
              <Text className="text-[#F8FAFC] text-2xl font-extrabold tracking-[1.5px] text-center">
                Level<Text className="text-[#38BDF8]">IQ</Text>
              </Text>
            </View>

            {/* Auth Card Container */}
            <View 
              className="w-full bg-[#0f172a]/85 rounded-[20px] border border-sky-400/15 p-[18px]"
              style={{ shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 10 }}
            >
              
              {/* GOOGLE SIGN IN BUTTON */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting || authLoading}
                className="bg-[#0F172A] rounded-xl py-3 items-center justify-center border border-sky-400/30"
                style={{ shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 }}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center justify-center">
                    <SvgXml xml={svgGoogle} width={18} height={18} />
                    <Text className="text-[#F8FAFC] text-sm font-bold ml-2.5 tracking-[0.2px]">Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-3.5">
                <View className="flex-1 h-[1px] bg-slate-400/15" />
                <Text className="text-slate-500 text-[9px] font-bold tracking-[1.1px] mx-2.5">OR SIGN IN WITH EMAIL</Text>
                <View className="flex-1 h-[1px] bg-slate-400/15" />
              </View>

              {/* Mode Switcher Tabs */}
              <View className="flex-row bg-[#0b1326]/85 rounded-xl p-[3px] border border-slate-400/10 mb-3.5">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
                  className={`flex-1 py-2 rounded-[9px] items-center justify-center ${mode === 'signin' ? 'bg-blue-600' : ''}`}
                  style={mode === 'signin' ? { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6 } : {}}
                >
                  <Text className={`text-xs tracking-[0.3px] ${mode === 'signin' ? 'text-white font-bold' : 'text-slate-400 font-semibold'}`}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { setMode('signup'); setErrorMessage(null); setSuccessMessage(null); }}
                  className={`flex-1 py-2 rounded-[9px] items-center justify-center ${mode === 'signup' ? 'bg-blue-600' : ''}`}
                  style={mode === 'signup' ? { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6 } : {}}
                >
                  <Text className={`text-xs tracking-[0.3px] ${mode === 'signup' ? 'text-white font-bold' : 'text-slate-400 font-semibold'}`}>Create Account</Text>
                </TouchableOpacity>
              </View>

              {/* Error Alert */}
              {errorMessage && (
                <View className="bg-red-500/15 border border-red-500/35 p-[9px] rounded-[10px] mb-3">
                  <Text className="text-red-400 text-xs text-center font-medium leading-4">{errorMessage}</Text>
                </View>
              )}

              {/* Success Alert */}
              {successMessage && (
                <View className="bg-green-500/15 border border-green-500/35 p-[9px] rounded-[10px] mb-3">
                  <Text className="text-green-400 text-xs text-center font-medium leading-4">{successMessage}</Text>
                </View>
              )}

              {/* Name Field (Sign Up only) */}
              {mode === 'signup' && (
                <View className="w-full mb-[11px]">
                  <Text className="text-slate-400 text-[10px] font-bold tracking-[1px] mb-[5px]">FULL NAME</Text>
                  <TextInput
                    className="w-full bg-[#0b1326]/95 border border-slate-400/15 rounded-xl px-[13px] py-2.5 text-slate-50 text-[13px]"
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
              <View className="w-full mb-[11px]">
                <Text className="text-slate-400 text-[10px] font-bold tracking-[1px] mb-[5px]">EMAIL ADDRESS</Text>
                <TextInput
                  className="w-full bg-[#0b1326]/95 border border-slate-400/15 rounded-xl px-[13px] py-2.5 text-slate-50 text-[13px]"
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
              <View className="w-full mb-[11px]">
                <View className="flex-row justify-between items-center mb-[5px]">
                  <Text className="text-slate-400 text-[10px] font-bold tracking-[1px]">PASSWORD</Text>
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text className="text-[#38BDF8] text-[11px] font-semibold">{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  className="w-full bg-[#0b1326]/95 border border-slate-400/15 rounded-xl px-[13px] py-2.5 text-slate-50 text-[13px]"
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
                onPress={handleSubmit}
                disabled={isSubmitting || authLoading || isGoogleLoading}
                className={`bg-blue-600 rounded-xl py-3 items-center justify-center mt-1 ${(isSubmitting || authLoading) ? 'opacity-65' : ''}`}
                style={{ shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}
              >
                {isSubmitting || authLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-[13px] font-bold tracking-[0.4px]">
                    {mode === 'signin' ? 'Sign In to LevelIQ' : 'Create Account'}
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