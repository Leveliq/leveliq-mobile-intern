import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session, AuthError } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

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
    // 1. Fetch real session from Supabase, or fall back to cached session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
      } else {
        try {
          const cachedUser = await AsyncStorage.getItem('@leveliq_cached_user');
          const cachedSession = await AsyncStorage.getItem('@leveliq_cached_session');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
            if (cachedSession) setSession(JSON.parse(cachedSession));
          }
        } catch (e) {
          console.warn('Error reading cached user:', e);
        }
        setLoading(false);
      }
    }).catch(async (err) => {
      console.warn('Error fetching Supabase session:', err);
      try {
        const cachedUser = await AsyncStorage.getItem('@leveliq_cached_user');
        const cachedSession = await AsyncStorage.getItem('@leveliq_cached_session');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          if (cachedSession) setSession(JSON.parse(cachedSession));
        }
      } catch {}
      setLoading(false);
    });

    // 2. Subscribe to real auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
      }
    });

    // 3. Listen for deep link events when returning to the app
    const handleDeepLink = async (event: { url: string }) => {
      if (!event.url) return;
      try {
        const hashIndex = event.url.indexOf('#');
        const queryIndex = event.url.indexOf('?');
        let paramsString = '';

        if (hashIndex !== -1) {
          paramsString = event.url.substring(hashIndex + 1);
        } else if (queryIndex !== -1) {
          paramsString = event.url.substring(queryIndex + 1);
        }

        const params = new URLSearchParams(paramsString);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const code = params.get('code');

        if (accessToken && refreshToken) {
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (data?.session) {
            setSession(data.session);
            setUser(data.user);
          }
        } else if (code) {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (data?.session) {
            setSession(data.session);
            setUser(data.user);
          }
        }
      } catch (e) {
        console.warn('Error parsing incoming deep link:', e);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  // Real Email & Password Sign In against Supabase
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setLoading(false);
        return { error };
      }
      setSession(data.session);
      setUser(data.user);
      setLoading(false);
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  // Real Email & Password Sign Up against Supabase
  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
          },
        },
      });
      if (error) {
        setLoading(false);
        return { error };
      }
      setSession(data.session);
      setUser(data.user);
      setLoading(false);
      return { error: null, user: data.user };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  // Native System Google Sign-In (Opens the system account chooser)
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });
        if (error) {
          setLoading(false);
          return { error };
        }
        return { error: null };
      } else {
        // Mobile (Android / iOS) via WebBrowser - 100% stable in Expo Go
        const redirectUrl = Linking.createURL('/');
        console.log('📱 MOBILE AUTH REDIRECT URL:', redirectUrl);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              prompt: 'select_account',
              access_type: 'offline',
            },
          },
        });

        if (error || !data?.url) {
          setLoading(false);
          return { error: error || new Error('Could not initiate Google sign-in') };
        }

        // Opens system custom tab sheet with existing Google accounts on phone
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
          }
        );

        if (result.type === 'success' && result.url) {
          const hashIndex = result.url.indexOf('#');
          const queryIndex = result.url.indexOf('?');
          let paramsString = '';

          if (hashIndex !== -1) {
            paramsString = result.url.substring(hashIndex + 1);
          } else if (queryIndex !== -1) {
            paramsString = result.url.substring(queryIndex + 1);
          }

          const params = new URLSearchParams(paramsString);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const code = params.get('code');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              setLoading(false);
              return { error: sessionError };
            }
            setSession(sessionData.session);
            setUser(sessionData.user);
          } else if (code) {
            const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
            if (codeError) {
              setLoading(false);
              return { error: codeError };
            }
            setSession(codeData.session);
            setUser(codeData.user);
          }
        }

        setLoading(false);
        return { error: null };
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setLoading(false);
      return { error: err };
    }
  };

  // Instant Sign Out from Supabase & clear local state immediately
  const signOut = async () => {
    // 1. Immediately reset state so screen returns to AuthScreen with zero delay
    setUser(null);
    setSession(null);
    try {
      await AsyncStorage.removeItem('@leveliq_cached_user');
      await AsyncStorage.removeItem('@leveliq_cached_session');
    } catch (e) {}

    try {
      // 2. Perform local scope signOut without network hang
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  // Displays real user name from Supabase user metadata
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
