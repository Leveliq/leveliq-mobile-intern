// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Safe in-memory and persistent storage adapter for React Native & Web
let NativeAsyncStorage: any = null;
try {
  const mod = require('@react-native-async-storage/async-storage');
  NativeAsyncStorage = mod.default || mod;
} catch {
  // Gracefully handled by in-memory storage
}

const memoryStorage = new Map<string, string>();

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const cached = memoryStorage.get(key);
    if (cached !== undefined) return cached;

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val) memoryStorage.set(key, val);
          return val;
        }
      } catch {}
      return null;
    }

    try {
      if (NativeAsyncStorage && typeof NativeAsyncStorage.getItem === 'function') {
        const val = await NativeAsyncStorage.getItem(key);
        if (val) memoryStorage.set(key, val);
        return val;
      }
    } catch {}

    return null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage.set(key, value);

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch {}
      return;
    }

    try {
      if (NativeAsyncStorage && typeof NativeAsyncStorage.setItem === 'function') {
        await NativeAsyncStorage.setItem(key, value);
      }
    } catch {}
  },

  removeItem: async (key: string): Promise<void> => {
    memoryStorage.delete(key);

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch {}
      return;
    }

    try {
      if (NativeAsyncStorage && typeof NativeAsyncStorage.removeItem === 'function') {
        await NativeAsyncStorage.removeItem(key);
      }
    } catch {}
  },
};

// Exact variable names from root .env.local
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://zqzmxpvueicssktawfzz.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ETVH3wMUAnHjeyKkuMZ-dA_T-r0E01L';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
