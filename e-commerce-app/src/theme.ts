export const theme = {
  colors: {
    background: '#F7F6F1',
    surface: '#FFFFFF',
    surfaceMuted: '#EEEEE7',
    ink: '#1C2822',
    muted: '#7D8580',
    line: '#E4E5DD',
    primary: '#315B43',
    primaryDark: '#244531',
    accent: '#D9A46C',
    danger: '#B5473C',
    success: '#35744B',
  },
  radius: {
    small: 12,
    medium: 18,
    large: 26,
    pill: 999,
  },
};

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}
