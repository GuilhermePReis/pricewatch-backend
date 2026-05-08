// PriceWatch — screens/ProfileScreen.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Switch, ScrollView, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore }  from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { colors }        from '../utils/theme';
import i18n              from '../i18n';

// Idiomas com flags emoji
const LANGUAGES = [
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

export function ProfileScreen() {
  const { t }          = useTranslation();
  const insets         = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { isDark, toggleDark } = useThemeStore();
  const c = colors(isDark);

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const initials = user?.fullName
    ?.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'PW';

  const s = styles(c);

  const SettingsRow = ({ icon, label, right }) => (
    <View style={s.settingsRow}>
      <View style={[s.settingsIcon, { backgroundColor: c.primaryLight }]}>
        <Text style={{ fontSize: 15 }}>{icon}</Text>
      </View>
      <Text style={s.settingsLabel}>{label}</Text>
      <View>{right}</View>
    </View>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header com gradiente */}
      <LinearGradient
        colors={['#6C47FF', '#4A2FCB']}
        style={[s.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.userName}>{user?.fullName}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
        <Text style={s.userMeta}>
          {user?.nationality} · {user?.city} · {user?.age} anos
        </Text>
      </LinearGradient>

      {/* Configurações */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Preferências</Text>

        {/* Idioma */}
        <View style={s.settingsRow}>
          <View style={[s.settingsIcon, { backgroundColor: c.primaryLight }]}>
            <Text style={{ fontSize: 15 }}>🌐</Text>
          </View>
          <Text style={s.settingsLabel}>{t('language')}</Text>
          <View style={s.flagRow}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  s.flagBtn,
                  i18n.language === lang.code && s.flagBtnActive,
                ]}
                onPress={() => i18n.changeLanguage(lang.code)}
                accessibilityLabel={lang.label}
              >
                <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dark mode */}
        <View style={s.settingsRow}>
          <View style={[s.settingsIcon, { backgroundColor: '#FEF9C3' }]}>
            <Text style={{ fontSize: 15 }}>🌙</Text>
          </View>
          <Text style={s.settingsLabel}>{t('dark_mode')}</Text>
          <Switch
            value={isDark}
            onValueChange={toggleDark}
            trackColor={{ false: c.border, true: '#6C47FF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Conta</Text>

        <SettingsRow
          icon="✉️"
          label={t('email_verified')}
          right={
            <View style={s.verifiedBadge}>
              <Text style={s.verifiedText}>✓ {t('verified')}</Text>
            </View>
          }
        />

        <SettingsRow
          icon="🔔"
          label={t('push_enabled')}
          right={<Text style={{ fontSize: 12, color: c.textMuted }}>FCM ativo</Text>}
        />

        <SettingsRow
          icon="📊"
          label={t('data_source')}
          right={<Text style={{ fontSize: 12, color: c.textMuted }}>Yahoo Finance</Text>}
        />

        <SettingsRow
          icon="🔒"
          label={t('security')}
          right={<Text style={{ fontSize: 12, color: c.textMuted }}>JWT + bcrypt</Text>}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={s.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={s.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>

      <Text style={s.version}>PriceWatch v1.0.0</Text>
    </ScrollView>
  );
}

const styles = (c) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: c.background },
  header:      { alignItems: 'center', paddingBottom: 28, paddingHorizontal: 16 },
  avatar:      { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:  { fontSize: 24, fontWeight: '700', color: '#fff' },
  userName:    { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2 },
  userEmail:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  userMeta:    { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  section:     { backgroundColor: c.card, borderRadius: 16, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 16, borderWidth: 0.5, borderColor: c.border },
  sectionTitle:{ fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 0.8, paddingVertical: 12, borderBottomWidth: 0.5, borderColor: c.border },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 0.5, borderColor: c.borderLight },
  settingsIcon:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel:{ flex: 1, fontSize: 14, color: c.text, fontWeight: '500' },
  flagRow:     { flexDirection: 'row', gap: 6 },
  flagBtn:     { width: 34, height: 24, borderRadius: 6, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  flagBtnActive:{ borderColor: '#6C47FF' },
  verifiedBadge: { backgroundColor: c.successBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText:  { fontSize: 11, fontWeight: '600', color: c.successText },
  logoutBtn:   { margin: 16, marginTop: 24, backgroundColor: c.dangerBg, borderRadius: 14, padding: 15, alignItems: 'center' },
  logoutText:  { fontSize: 14, fontWeight: '600', color: c.dangerText },
  version:     { textAlign: 'center', fontSize: 11, color: c.textLight, marginBottom: 8 },
});
