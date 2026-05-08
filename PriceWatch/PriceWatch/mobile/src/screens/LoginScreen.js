// PriceWatch — screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore }   from '../store/authStore';
import { useThemeStore }  from '../store/themeStore';
import { colors, typography } from '../utils/theme';

export function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { login, loading, error } = useAuthStore();
  const { isDark } = useThemeStore();
  const c = colors(isDark);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    const ok = await login(email.trim(), password);
    // Se ok, RootNavigator muda automaticamente para App
  };

  const s = styles(c);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#6C47FF', '#4A2FCB', '#1E0F8C']}
        style={s.gradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      >
        {/* Logo + headline */}
        <View style={s.hero}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>▲</Text>
          </View>
          <Text style={s.appName}>PriceWatch</Text>
          <Text style={s.heroTitle}>{t('login_title')}</Text>
          <Text style={s.heroSub}>{t('login_sub')}</Text>
        </View>

        {/* Card de login */}
        <ScrollView
          style={s.card}
          contentContainerStyle={s.cardContent}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Text style={s.fieldLabel}>{t('email').toUpperCase()}</Text>
          <TextInput
            style={s.input}
            placeholder="seu@email.com"
            placeholderTextColor={c.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={s.fieldLabel}>{t('password').toUpperCase()}</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••"
              placeholderTextColor={c.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoComplete="password"
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPass(v => !v)}
            >
              <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryText}>{t('btn_login')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnGhost}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={s.btnGhostText}>{t('btn_register')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={[typography.caption, { color: c.textMuted }]}>
              {t('forgot_password')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = (c) => StyleSheet.create({
  gradient: { flex: 1 },
  hero: { padding: 28, paddingTop: 60, paddingBottom: 0 },
  logoBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoText:  { fontSize: 24, color: '#fff' },
  appName:   { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  heroTitle: { fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 18, marginBottom: 24 },
  card: {
    flex: 1, backgroundColor: c.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  cardContent: { padding: 24, paddingBottom: 40 },
  errorBox: {
    backgroundColor: c.dangerBg, borderRadius: 10,
    padding: 12, marginBottom: 16,
  },
  errorText: { color: c.dangerText, fontSize: 13 },
  fieldLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 1,
    color: c.textMuted, marginBottom: 6, marginTop: 4,
  },
  input: {
    backgroundColor: c.surfaceAlt,
    borderRadius: 12, padding: 13, fontSize: 14,
    color: c.text, marginBottom: 14,
    borderWidth: 0.5, borderColor: c.border,
  },
  passwordRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  eyeBtn:       { padding: 10 },
  btnPrimary: {
    backgroundColor: '#6C47FF', borderRadius: 14,
    padding: 15, alignItems: 'center', marginTop: 6,
  },
  btnDisabled:     { opacity: 0.7 },
  btnPrimaryText:  { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnGhost: {
    borderWidth: 1, borderColor: '#6C47FF',
    borderRadius: 14, padding: 13,
    alignItems: 'center', marginTop: 10,
  },
  btnGhostText: { color: '#6C47FF', fontSize: 14, fontWeight: '500' },
});
