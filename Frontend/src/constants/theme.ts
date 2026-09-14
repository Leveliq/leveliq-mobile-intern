/**
 * LevelIQ Design Tokens
 * Used by useTheme(), ThemedText, ThemedView.
 * Prefer NativeWind className for UI; use these for dynamic theme values.
 */

import { Platform } from 'react-native';

export const Brand = {
  // Core brand
  navy: '#050816',
  navyCard: '#0f172a',
  navyDeep: '#0b1326',
  navyPanel: '#0f234e',

  // Accents
  blue: '#2563EB',
  blueLight: '#60A5FA',
  cyan: '#38BDF8',

  // Glow blobs (splash / auth backgrounds)
  glowBlue: '#123D91',
  glowTeal: '#0C4A6E',

  // Status
  success: '#22C55E',
  successText: '#4ADE80',
  danger: '#EF4444',
  dangerText: '#F87171',

  // Text scale
  white: '#F8FAFC',
  slate: '#94A3B8',
  slateMuted: '#64748B',
  slateDim: '#475569',
} as const;

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    border: '#E2E8F0',
    primary: Brand.blue,
    primaryText: '#FFFFFF',
    accent: Brand.cyan,
    danger: Brand.danger,
    success: Brand.success,
    card: '#FFFFFF',
  },
  dark: {
    text: Brand.white,
    textSecondary: Brand.slate,
    background: Brand.navy,
    backgroundElement: Brand.navyDeep,
    backgroundSelected: '#1E293B',
    border: 'rgba(56, 189, 248, 0.16)',
    primary: Brand.blue,
    primaryText: '#FFFFFF',
    accent: Brand.cyan,
    danger: Brand.dangerText,
    success: Brand.successText,
    card: 'rgba(15, 23, 42, 0.88)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, serif',
    rounded: 'system-ui',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

/** Optional spacing scale if you ever need it outside Tailwind */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;