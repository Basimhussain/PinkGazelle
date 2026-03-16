export const colors = {
  bg:              '#ffffff',
  bgSubtle:        '#f9fafb',
  bgMuted:         '#f3f4f6',
  border:          '#e5e7eb',
  borderSubtle:    '#f0f0f0',
  textPrimary:     '#111827',
  textSecondary:   '#4b5563',
  textTertiary:    '#9ca3af',
  accent:          '#6366f1',
  accentHover:     '#4f46e5',
  accentSubtle:    '#eef2ff',
  success:         '#10b981',
  successSubtle:   '#ecfdf5',
  warning:         '#f59e0b',
  warningSubtle:   '#fffbeb',
  danger:          '#ef4444',
  dangerSubtle:    '#fef2f2',
  todo:            '#db2777',
  todoBg:          '#fdf2f8',
  inProgress:      '#3b82f6',
  inProgressBg:    '#eff6ff',
  done:            '#10b981',
  doneBg:          '#ecfdf5',
} as const;

export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
} as const;

export const shadow = {
  xs:  '0 1px 2px rgba(0,0,0,0.04)',
  sm:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md:  '0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04)',
  lg:  '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.04)',
  xl:  '0 20px 25px rgba(0,0,0,0.07), 0 8px 10px rgba(0,0,0,0.04)',
} as const;

export const font = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export const sidebarWidth = 240;
export const topbarHeight = 56;
