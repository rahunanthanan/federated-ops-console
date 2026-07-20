import React from 'react';
import { tokens } from './tokens';

export type BannerSeverity = 'success' | 'warning' | 'error' | 'info';

const PALETTE: Record<BannerSeverity, { bg: string; fg: string }> = {
  success: { bg: tokens.color.successSurface, fg: tokens.color.success },
  warning: { bg: tokens.color.warningSurface, fg: tokens.color.warning },
  error: { bg: tokens.color.dangerSurface, fg: tokens.color.danger },
  info: { bg: tokens.color.surfaceMuted, fg: tokens.color.textMuted }
};

export function Banner({ severity, children }: React.PropsWithChildren<{ severity: BannerSeverity }>) {
  const palette = PALETTE[severity];
  return (
    <div
      role={severity === 'error' ? 'alert' : 'status'}
      style={{
        background: palette.bg,
        color: palette.fg,
        borderRadius: tokens.radius,
        padding: tokens.spacing(3),
        fontSize: '14px'
      }}
    >
      {children}
    </div>
  );
}
