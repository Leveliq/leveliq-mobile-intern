import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import { User, Session, AuthError } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

// Required for web browser auth (Google/Apple)
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
    // 1. Initial Session Fetch (Supabase automatically reads from AsyncStorage here)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for Auth Changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 3. Handle Deep Links (For OAuth redirects coming back to the app)
    const handleDeepLink = async (event: { url: string }) => {
      if (!event.url) return;
      
      try {
        // Safely parse URL using Expo Linking
        const parsedUrl = Linking.parse(event.url);
        const params = new URLSearchParams(parsedUrl.fragment || parsedUrl.queryParams || '');

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const code = params.get('code');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch (e) {
        console.error('Error parsing incoming deep link:', e);
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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
      options: { data: { full_name: name.trim() } }, // Save name to metadata
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
    // 1. Generate mobile-compatible redirect URL
    const redirectUrl = Linking.createURL('/');
    console.log('🔗 AUTH REDIRECT URL:', redirectUrl);

    // 2. Request Google OAuth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Don't redirect native app, return URL to JS
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error || !data?.url) {
      setLoading(false);
      return { error: error || new Error('Could not initiate Google sign-in') };
    }

    // 3. Open system auth browser sheet
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    // 4. Handle browser result when user selects Google account
    if (result.type === 'success' && result.url) {
      // Extract tokens from URL (handles both hash # and query ?)
      let paramsString = '';
      if (result.url.includes('#')) {
        paramsString = result.url.split('#')[1];
      } else if (result.url.includes('?')) {
        paramsString = result.url.split('?')[1];
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
        if (sessionError) throw sessionError;
        setSession(sessionData.session);
        setUser(sessionData.user);
      } else if (code) {
        const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        if (codeError) throw codeError;
        setSession(codeData.session);
        setUser(codeData.user);
      }
    }

    setLoading(false);
    return { error: null };
  } catch (err: any) {
    console.error('Google Sign In Error:', err);
    setLoading(false);
    return { error: err };
  }
};

  const signOut = async () => {
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Investor';

  return (
    <AuthContext.Provider
      value={{ user, session, loading, userName, signIn, signUp, signInWithGoogle, signOut }}
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