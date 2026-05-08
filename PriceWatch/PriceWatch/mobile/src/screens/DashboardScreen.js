// PriceWatch — screens/DashboardScreen.js
import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, StatusBar,
} from 'react-native';
import { useTranslation }  from 'react-i18next';
import { LinearGradient }  from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlertStore }   from '../store/alertStore';
import { useAuthStore }    from '../store/authStore';
import { useThemeStore }   from '../store/themeStore';
import { colors, shadow }  from '../utils/theme';
import { formatPrice }     from '../utils/format';

// ─── Componente de linha de ativo ─────────────────────────
function AssetRow({ item, onPress, c }) {
  const isTriggered = item.triggeredAt != null;
  const isActive    = item.active && !isTriggered;

  return (
    <TouchableOpacity
      style={[styles(c).assetRow, shadow(false)]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {/* Ícone com iniciais */}
      <View style={[styles(c).assetIcon, { backgroundColor: item.asset?.color || '#EDE9FF' }]}>
        <Text style={[styles(c).assetIconText, { color: '#6C47FF' }]}>
          {item.asset?.ticker?.slice(0, 3) || '---'}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles(c).assetTicker}>
          {item.asset?.ticker} {item.asset?.isFavorite ? '★' : ''}
        </Text>
        <Text style={styles(c).assetName}>
          {item.asset?.name} · {item.asset?.exchange}
        </Text>
      </View>

      {/* Preço + status */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles(c).assetPrice}>
          {formatPrice(item.asset?.currentPrice, item.asset?.currency)}
        </Text>
        <View style={[
          styles(c).badge,
          isTriggered ? styles(c).badgeTriggered
            : isActive ? styles(c).badgeActive
            : styles(c).badgeWaiting,
        ]}>
          <Text style={styles(c).badgeText}>
            {isTriggered ? '✓ Disparou' : isActive ? '● Ativo' : '⏳ Espera'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────
export function DashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { alerts, fetchAlerts, loading } = useAlertStore();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const c = colors(isDark);

  useEffect(() => { fetchAlerts(); }, []);

  const onRefresh = useCallback(() => { fetchAlerts(); }, []);

  const greetingKey = () => {
    const h = new Date().getHours();
    if (h < 12) return 'greeting_morning';
    if (h < 18) return 'greeting_afternoon';
    return 'greeting_evening';
  };

  const activeCount    = alerts.filter(a => a.active && !a.triggeredAt).length;
  const triggeredCount = alerts.filter(a => a.triggeredAt).length;

  return (
    <View style={[styles(c).container, { paddingTop: insets.top }]}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={['#6C47FF', '#4A2FCB']}
        style={styles(c).header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View>
          <Text style={styles(c).greeting}>{t(greetingKey())},</Text>
          <Text style={styles(c).userName}>
            {user?.fullName?.split(' ')[0]} 👋
          </Text>
        </View>

        {/* Botão de notificações */}
        <TouchableOpacity
          style={styles(c).notifBtn}
          onPress={() => navigation.navigate('Alertas')}
        >
          <Text style={{ fontSize: 18 }}>🔔</Text>
          {triggeredCount > 0 && (
            <View style={styles(c).badge2}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                {triggeredCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Card de resumo */}
      <View style={[styles(c).summaryCard, shadow(isDark)]}>
        <Text style={styles(c).summaryLabel}>{t('monitored_assets')}</Text>
        <Text style={styles(c).summaryValue}>{alerts.length}</Text>
        <Text style={styles(c).summaryChange}>
          {activeCount} alertas ativos · {triggeredCount} disparados
        </Text>
        <View style={styles(c).chips}>
          {activeCount > 0 && (
            <View style={[styles(c).chip, styles(c).chipGreen]}>
              <Text style={styles(c).chipGreenText}>{activeCount} ativo(s)</Text>
            </View>
          )}
          <View style={[styles(c).chip, styles(c).chipGray]}>
            <Text style={styles(c).chipGrayText}>
              {alerts.length - activeCount - triggeredCount} em espera
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de ativos */}
      <View style={styles(c).listHeader}>
        <Text style={styles(c).listTitle}>{t('my_assets')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Buscar')}>
          <Text style={styles(c).addBtn}>{t('add_asset')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AssetRow
            item={item}
            c={c}
            onPress={() => navigation.navigate('AssetDetail', { alert: item })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor="#6C47FF"
          />
        }
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 10 }}>📊</Text>
            <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center' }}>
              Nenhum ativo monitorado.{'\n'}Toque em "+ Adicionar" para começar.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { padding: 20, paddingBottom: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  userName:  { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 2 },
  notifBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  badge2: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  summaryCard: { backgroundColor: c.card, borderRadius: 20, marginHorizontal: 16, marginTop: -40, padding: 18, zIndex: 2, borderWidth: 0.5, borderColor: c.border },
  summaryLabel:  { fontSize: 11, color: c.textMuted, fontWeight: '500', letterSpacing: 0.5 },
  summaryValue:  { fontSize: 28, fontWeight: '700', color: c.text, marginVertical: 2 },
  summaryChange: { fontSize: 13, color: '#22C55E' },
  chips:         { flexDirection: 'row', gap: 6, marginTop: 10 },
  chip:          { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipGreen:     { backgroundColor: c.successBg },
  chipGreenText: { fontSize: 11, fontWeight: '500', color: c.successText },
  chipGray:      { backgroundColor: c.surfaceAlt },
  chipGrayText:  { fontSize: 11, fontWeight: '500', color: c.textMuted },
  listHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  listTitle:     { fontSize: 15, fontWeight: '600', color: c.text },
  addBtn:        { fontSize: 13, color: '#6C47FF', fontWeight: '500' },
  assetRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 0.5, borderColor: c.border },
  assetIcon:     { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  assetIconText: { fontSize: 11, fontWeight: '700' },
  assetTicker:   { fontSize: 14, fontWeight: '600', color: c.text },
  assetName:     { fontSize: 12, color: c.textMuted, marginTop: 1 },
  assetPrice:    { fontSize: 14, fontWeight: '600', color: c.text },
  badge:         { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, marginTop: 3 },
  badgeText:     { fontSize: 10, fontWeight: '500' },
  badgeActive:   { backgroundColor: '#EDE9FF' },
  badgeWaiting:  { backgroundColor: c.warningBg },
  badgeTriggered:{ backgroundColor: c.successBg },
});
