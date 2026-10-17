/**
 * App colors for light and dark mode, plus shared spacing and radius scales.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#101828',
    textSecondary: '#667085',
    background: '#F4F6FB',
    surface: '#FFFFFF',
    border: '#E6EAF1',
    primary: '#2563EB',
    /** Where the primary gradient (buttons, hero) ends. */
    primaryEnd: '#5B5BF0',
    primarySoft: '#EBF1FF',
    onPrimary: '#FFFFFF',
    danger: '#E5383B',
    dangerSoft: '#FDEEEE',
    success: '#16A34A',
    successSoft: '#E8F7EE',
    warning: '#D98A06',
    warningSoft: '#FFF5DE',
    accent: '#7C3AED',
    accentSoft: '#F2ECFF',
    shadow: '#1D2B5C',
  },
  dark: {
    text: '#F2F4F8',
    textSecondary: '#98A2B3',
    background: '#0B1020',
    surface: '#161C2F',
    border: '#262E47',
    primary: '#4C7DF5',
    primaryEnd: '#7472F5',
    primarySoft: '#1B2752',
    onPrimary: '#FFFFFF',
    danger: '#F87171',
    dangerSoft: '#2B1518',
    success: '#4ADE80',
    successSoft: '#12271B',
    warning: '#FBBF24',
    warningSoft: '#2A2110',
    accent: '#A78BFA',
    accentSoft: '#211A38',
    shadow: '#000000',
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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  full: 999,
} as const;

/** The soft drop shadow under cards, the tab bar and primary buttons. */
export function shadow(color: string, strength = 1) {
  return {
    shadowColor: color,
    shadowOpacity: 0.07 * strength,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2 * strength,
  };
}

export const MaxFormWidth = 440;
