// PriceWatch — utils/theme.js
// Paleta de cores inspirada em Nubank / Revolut

export const BRAND = '#6C47FF'; // roxo PriceWatch

export const colors = (isDark = false) => ({
  // Superfícies
  background: isDark ? '#0F0E14' : '#F5F4F9',
  surface:    isDark ? '#1A1825' : '#FFFFFF',
  surfaceAlt: isDark ? '#231F35' : '#F0EFF8',
  card:       isDark ? '#1E1B2E' : '#FFFFFF',

  // Marca
  primary:       BRAND,
  primaryLight:  isDark ? '#4A2FCB22' : '#EDE9FF',
  primaryDark:   '#4A2FCB',

  // Texto
  text:       isDark ? '#F2F0FF' : '#0D0B1E',
  textMuted:  isDark ? '#8B87A8' : '#6E6B85',
  textLight:  isDark ? '#5C5875' : '#9B98B3',

  // Semantic
  success:     '#22C55E',
  successBg:   isDark ? '#14371F' : '#DCFCE7',
  successText: isDark ? '#4ADE80' : '#15803D',
  danger:      '#EF4444',
  dangerBg:    isDark ? '#3B1111' : '#FEE2E2',
  dangerText:  isDark ? '#F87171' : '#B91C1C',
  warning:     '#EAB308',
  warningBg:   isDark ? '#3B2E00' : '#FEF9C3',
  warningText: isDark ? '#FACC15' : '#A16207',

  // Bordas
  border:      isDark ? '#2D2A45' : '#E8E6F0',
  borderLight: isDark ? '#201D33' : '#F0EEF8',

  // Gráfico
  chartLine:   BRAND,
  chartFillTop:'rgba(108, 71, 255, 0.25)',
  chartFillBot:'rgba(108, 71, 255, 0.02)',
});

// Estilos de texto compartilhados
export const typography = {
  h1: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' },
  h4: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label:   { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
};

// Sombra para cards (iOS + Android)
export const shadow = (isDark) => isDark
  ? {}
  : {
      shadowColor: '#6C47FF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    };
