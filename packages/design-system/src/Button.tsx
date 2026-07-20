import React from 'react';
import { tokens } from './tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ variant = 'primary', style, ...rest }: ButtonProps) {
  const palette: Record<string, React.CSSProperties> = {
    primary: { background: tokens.color.primary, color: '#fff', border: 'none' },
    secondary: { background: tokens.color.surface, color: tokens.color.primary, border: `1px solid ${tokens.color.border}` },
    danger: { background: tokens.color.danger, color: '#fff', border: 'none' }
  };
  return (
    <button
      {...rest}
      style={{
        padding: `${tokens.spacing(2)} ${tokens.spacing(4)}`,
        borderRadius: tokens.radius,
        fontWeight: 600,
        cursor: 'pointer',
        ...palette[variant],
        ...style
      }}
    />
  );
}
