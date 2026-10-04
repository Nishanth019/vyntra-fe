/**
 * App colors for light and dark mode, plus shared spacing and radius scales.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F6F7FB',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    primary: '#2563EB',
    primarySoft: '#EAF1FF',
    onPrimary: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    success: '#16A34A',
    successSoft: '#EAF8EF',
    warning: '#D97706',
    warningSoft: '#FFF6E5',
    accent: '#7C3AED',
    accentSoft: '#F3EEFF',
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    background: '#0B1120',
    surface: '#141B2D',
    border: '#253049',
    primary: '#3B82F6',
    primarySoft: '#172554',
    onPrimary: '#FFFFFF',
    danger: '#F87171',
    dangerSoft: '#2B1518',
    success: '#4ADE80',
    successSoft: '#12271B',
    warning: '#FBBF24',
    warningSoft: '#2A2110',
    accent: '#A78BFA',
    accentSoft: '#211A38',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const MaxFormWidth = 440;
