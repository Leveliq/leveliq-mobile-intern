// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import { User, Session, AuthError } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../lib/supabase';

// Required for web browser OAuth redirects
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userName: string;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: AuthError | Error | null; user?: User | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Fetch
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      })
      .catch((err) => {
        console.error('Error fetching Supabase session on startup:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // 3. Deep Link Listener for OAuth Redirects
    const handleDeepLink = async (event: { url: string }) => {
      if (!event.url) return;
      console.log('🔗 [OAuth] Incoming deep link:', event.url);
      try {
        const url = new URL(event.url);
        const fragmentParams = new URLSearchParams(url.hash.replace(/^#/, ''));

        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');
        const code = url.searchParams.get('code') || fragmentParams.get('code');

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data.session && isMounted) {
            setSession(data.session);
            setUser(data.user);
          }
        } else if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session && isMounted) {
            setSession(data.session);
            setUser(data.user);
          }
        }
      } catch (e) {
        console.error('Error parsing incoming deep link:', e);
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was cold-started by a deep link
    Linking.getInitialURL().then((url) => {
      if (url && isMounted) {
        handleDeepLink({ url });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (!error) {
      setSession(data.session);
      setUser(data.user);
    }
    setLoading(false);
    return { error };
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });
    if (!error) {
      setSession(data.session);
      setUser(data.user);
    }
    setLoading(false);
    return { error, user: data.user };
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'android') {
        await WebBrowser.warmUpAsync();
      }

      // Generate redirect URI that works for both Standalone/DevClient (leveliq://) and Expo Go
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'leveliq',
        path: 'auth/callback',
      });
      console.log('🔗 [OAuth] Redirect URL generated:', redirectUrl);
      console.warn('🔗 [OAuth] Redirect URL generated: ' + redirectUrl);

      // Alert the exact URL so you can verify it character-for-character against Supabase
      if (__DEV__) {
        Alert.alert(
          'OAuth Redirect URL',
          `Your app is sending this exact URL to Supabase:\n\n${redirectUrl}\n\nMake sure this EXACT string is in your Supabase Redirect URLs!`,
          [{ text: 'Proceed to Google' }]
        );
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error || !data?.url) {
        return { error: error || new Error('Could not initiate Google sign-in') };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const fragmentParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');
        const code = url.searchParams.get('code') || fragmentParams.get('code');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          setSession(sessionData.session);
          setUser(sessionData.user);
        } else if (code) {
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) throw sessionError;
          setSession(sessionData.session);
          setUser(sessionData.user);
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // If the OS opened the app via deep link, session might already be set or in progress
        const { data: currentSession } = await supabase.auth.getSession();
        if (currentSession?.session) {
          setSession(currentSession.session);
          setUser(currentSession.session.user);
          return { error: null };
        }
        return { error: new Error('Google sign-in was cancelled.') };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      if (Platform.OS === 'android') {
        await WebBrowser.coolDownAsync();
      }
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Investor';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userName,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}