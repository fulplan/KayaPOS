import { db } from './db';

export interface ThemePreset {
  key: string;
  label: string;
  primary: string;
  primaryDark: string;
  ring: string;
  ringDark: string;
  sidebarPrimary: string;
  sidebarPrimaryDark: string;
  chart1: string;
  swatch: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'emerald',
    label: 'Emerald',
    primary: '173 80% 20%',
    primaryDark: '173 80% 40%',
    ring: '173 80% 20%',
    ringDark: '173 80% 40%',
    sidebarPrimary: '173 80% 40%',
    sidebarPrimaryDark: '173 80% 40%',
    chart1: '173 80% 30%',
    swatch: '#0d6b5e',
  },
  {
    key: 'blue',
    label: 'Blue',
    primary: '221 83% 40%',
    primaryDark: '221 83% 53%',
    ring: '221 83% 40%',
    ringDark: '221 83% 53%',
    sidebarPrimary: '221 83% 53%',
    sidebarPrimaryDark: '221 83% 53%',
    chart1: '221 83% 45%',
    swatch: '#1d4ed8',
  },
  {
    key: 'indigo',
    label: 'Indigo',
    primary: '239 84% 47%',
    primaryDark: '239 84% 67%',
    ring: '239 84% 47%',
    ringDark: '239 84% 67%',
    sidebarPrimary: '239 84% 67%',
    sidebarPrimaryDark: '239 84% 67%',
    chart1: '239 84% 55%',
    swatch: '#4338ca',
  },
  {
    key: 'purple',
    label: 'Purple',
    primary: '271 76% 45%',
    primaryDark: '271 76% 60%',
    ring: '271 76% 45%',
    ringDark: '271 76% 60%',
    sidebarPrimary: '271 76% 60%',
    sidebarPrimaryDark: '271 76% 60%',
    chart1: '271 76% 50%',
    swatch: '#7c3aed',
  },
  {
    key: 'rose',
    label: 'Rose',
    primary: '347 77% 44%',
    primaryDark: '347 77% 60%',
    ring: '347 77% 44%',
    ringDark: '347 77% 60%',
    sidebarPrimary: '347 77% 60%',
    sidebarPrimaryDark: '347 77% 60%',
    chart1: '347 77% 50%',
    swatch: '#be185d',
  },
  {
    key: 'orange',
    label: 'Orange',
    primary: '25 95% 43%',
    primaryDark: '25 95% 53%',
    ring: '25 95% 43%',
    ringDark: '25 95% 53%',
    sidebarPrimary: '25 95% 53%',
    sidebarPrimaryDark: '25 95% 53%',
    chart1: '25 95% 48%',
    swatch: '#d97706',
  },
  {
    key: 'red',
    label: 'Red',
    primary: '0 72% 42%',
    primaryDark: '0 72% 55%',
    ring: '0 72% 42%',
    ringDark: '0 72% 55%',
    sidebarPrimary: '0 72% 55%',
    sidebarPrimaryDark: '0 72% 55%',
    chart1: '0 72% 48%',
    swatch: '#b91c1c',
  },
  {
    key: 'green',
    label: 'Green',
    primary: '142 71% 28%',
    primaryDark: '142 71% 45%',
    ring: '142 71% 28%',
    ringDark: '142 71% 45%',
    sidebarPrimary: '142 71% 45%',
    sidebarPrimaryDark: '142 71% 45%',
    chart1: '142 71% 35%',
    swatch: '#15803d',
  },
  {
    key: 'slate',
    label: 'Slate',
    primary: '215 25% 27%',
    primaryDark: '215 25% 50%',
    ring: '215 25% 27%',
    ringDark: '215 25% 50%',
    sidebarPrimary: '215 25% 50%',
    sidebarPrimaryDark: '215 25% 50%',
    chart1: '215 25% 35%',
    swatch: '#334155',
  },
  {
    key: 'cyan',
    label: 'Cyan',
    primary: '192 91% 29%',
    primaryDark: '192 91% 44%',
    ring: '192 91% 29%',
    ringDark: '192 91% 44%',
    sidebarPrimary: '192 91% 44%',
    sidebarPrimaryDark: '192 91% 44%',
    chart1: '192 91% 35%',
    swatch: '#0891b2',
  },
];

export function applyTheme(themeKey: string) {
  const preset = THEME_PRESETS.find(p => p.key === themeKey);
  if (!preset) return;

  const root = document.documentElement;

  root.style.setProperty('--primary', preset.primary);
  root.style.setProperty('--ring', preset.ring);
  root.style.setProperty('--sidebar-primary', preset.sidebarPrimary);
  root.style.setProperty('--sidebar-ring', preset.sidebarPrimary);
  root.style.setProperty('--chart-1', preset.chart1);

  const darkStyle = document.querySelector('.dark') as HTMLElement | null;
  if (darkStyle) {
    darkStyle.style.setProperty('--primary', preset.primaryDark);
    darkStyle.style.setProperty('--ring', preset.ringDark);
    darkStyle.style.setProperty('--sidebar-primary', preset.sidebarPrimaryDark);
    darkStyle.style.setProperty('--sidebar-ring', preset.sidebarPrimaryDark);
  }

  root.setAttribute('data-theme', themeKey);
}

export async function loadSavedTheme() {
  try {
    const settings = await db.businessSettings.toCollection().first();
    if (settings?.themeColor) {
      applyTheme(settings.themeColor);
    }
  } catch {
  }
}
