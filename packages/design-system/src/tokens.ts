/** Minimal design tokens - a real system would generate this from Figma / Style Dictionary. */
export const tokens = {
  color: {
    primary: '#0B3D91',
    primaryDark: '#082a66',
    surface: '#ffffff',
    surfaceMuted: '#f4f6f9',
    border: '#d9dfe7',
    text: '#1a2433',
    textMuted: '#5b6b82',
    danger: '#b3261e',
    dangerSurface: '#fdecea',
    warning: '#8a5a00',
    warningSurface: '#fff4dd',
    success: '#1e6b3d',
    successSurface: '#e8f5ec'
  },
  radius: '8px',
  spacing: (n: number) => `${n * 4}px`
};
