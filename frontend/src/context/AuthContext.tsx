// src/context/AuthContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { User, Session, AuthError } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthResult = { error: AuthError | Error | null };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  hasAccess: boolean;
  userName: string;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult & { user?: User | null; session?: Session | null }>;
  signInWithGoogle: () => Promise<AuthResult>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseParams(str: string): Record<string, string> {
  const out: Record<string, string> = {};
  str.split('&').forEach((pair) => {
    if (!pair) return;
    const [key, value = ''] = pair.split('=');
    out[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  });
  return out;
}

function parseAuthUrl(rawUrl: string) {
  const [beforeHash, hash = ''] = rawUrl.split('#');
  const query = beforeHash.split('?')[1] ?? '';
  const params = { ...parseParams(query), ...parseParams(hash) };
  return {
    accessToken: params.access_token ?? null,
    refreshToken: params.refresh_token ?? null,
    code: params.code ?? null,
    errorDescription: params.error_description ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const inFlight = useRef(new Map<string, Promise<AuthResult | null>>());

  const createSessionFromUrl = useCallback((url: string) => {
    const existing = inFlight.current.get(url);
    if (existing) return existing;

    const promise = (async (): Promise<AuthResult | null> => {
      const { accessToken, refreshToken, code, errorDescription } = parseAuthUrl(url);
      if (errorDescription) return { error: new Error(errorDescription) };

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        return { error };
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return { error };
      }

      return null;
    })();

    inFlight.current.set(url, promise);
    return promise;
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      })
      .catch((err) => console.error('Error restoring session:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      if (nextSession) setIsGuest(false);
    });

    const logRedirectError = (result: AuthResult | null) => {
      if (result?.error) console.error('OAuth redirect error:', result.error.message);
    };

    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      createSessionFromUrl(url).then(logRedirectError).catch((e) =>
        console.error('OAuth redirect failed:', e instanceof Error ? e.message : e)
      );
    });

    Linking.getInitialURL()
      .then((url) => (url ? createSessionFromUrl(url) : null))
      .then(logRedirectError)
      .catch((e) => console.error('OAuth redirect failed:', e instanceof Error ? e.message : e));

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, [createSessionFromUrl]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    return { error, user: data?.user ?? null, session: data?.session ?? null };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      if (Platform.OS === 'android') {
        await WebBrowser.warmUpAsync();
      }

      const redirectTo = Linking.createURL('auth/callback', { scheme: 'leveliq' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });

      if (error || !data?.url) {
        return { error: error ?? new Error('Could not start Google sign-in.') };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const outcome = await createSessionFromUrl(result.url);
        if (!outcome) {
          return { error: new Error('Google sign-in did not return a session. Please try again.') };
        }
        return outcome;
      }

      await Promise.allSettled(Array.from(inFlight.current.values()));
      const { data: current } = await supabase.auth.getSession();
      if (current.session) return { error: null };

      return { error: new Error('Google sign-in was cancelled.') };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Google sign-in failed.') };
    } finally {
      if (Platform.OS === 'android') {
        await WebBrowser.coolDownAsync();
      }
    }
  }, [createSessionFromUrl]);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
  }, []);

  const signOut = useCallback(async () => {
    setIsGuest(false);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out failed:', error.message);
  }, []);

  const userName = isGuest
    ? 'Guest'
    : user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Investor';

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      isGuest,
      hasAccess: !!user || isGuest,
      userName,
      signIn,
      signUp,
      signInWithGoogle,
      continueAsGuest,
      signOut,
    }),
    [user, session, loading, isGuest, userName, signIn, signUp, signInWithGoogle, continueAsGuest, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}