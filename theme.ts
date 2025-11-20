import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// Palette
const palette = {
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  indigo: {
    500: '#6366f1',
    600: '#4f46e5',
  },
  red: {
    500: '#ef4444',
  },
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  s: 4,
  m: 8,
  l: 12,
  xl: 16,
  round: 9999,
};

export const Typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  fontSize: {
    xs: 12,
    s: 14,
    m: 16,
    l: 20,
    xl: 24,
    xxl: 32,
  },
};

export const LightTheme = {
  ...NavigationDefaultTheme,
  dark: false,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: palette.indigo[600],
    secondary: palette.slate[500],
    background: palette.zinc[50],
    background2: '#FFFFFF', // Cards, Lists
    background3: palette.zinc[100], // Modals, secondary backgrounds
    text: palette.slate[900],
    textSecondary: palette.slate[500],
    border: palette.zinc[200],
    error: palette.red[500],
    switchThumb: '#FFFFFF',
    switchFalse: palette.zinc[300],
    card: '#FFFFFF',
  },
  spacing: Spacing,
  borderRadius: BorderRadius,
  typography: Typography,
};

export const DarkTheme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: palette.indigo[500],
    secondary: palette.slate[400],
    background: palette.zinc[950],
    background2: palette.zinc[900], // Cards, Lists
    background3: palette.zinc[800], // Modals
    text: palette.zinc[50],
    textSecondary: palette.zinc[400],
    border: palette.zinc[800],
    error: palette.red[500],
    switchThumb: palette.zinc[200],
    switchFalse: palette.zinc[700],
    card: palette.zinc[900],
  },
  spacing: Spacing,
  borderRadius: BorderRadius,
  typography: Typography,
};
