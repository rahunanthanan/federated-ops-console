import React from 'react';
import { tokens } from './tokens';

export function Card({ children, style }: React.PropsWithChildren<{ style?: React.CSSProperties }>) {
  return (
    <div
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius,
        padding: tokens.spacing(4),
        ...style
      }}
    >
      {children}
    </div>
  );
}
