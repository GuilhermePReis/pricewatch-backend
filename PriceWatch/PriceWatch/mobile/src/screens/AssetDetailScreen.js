// PriceWatch — screens/AssetDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VictoryLine, VictoryChart, VictoryArea, VictoryAxis } from 'victory-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore }  from '../store/themeStore';
import { useAlertStore }  from '../store/alertStore';
import { colors, shadow } from '../utils/theme';
import { formatPrice }    from '../utils/format';
import api from '../services/api';

const PERIODS = ['1D', '1S', '1M', '3M', '1A', 'Máx'];
const PERIOD_MAP = { '1D': '1d', '1S': '5d', '1M': '1mo', '3M': '3mo', '1A': '1y', 'Máx': '5y' };

export function AssetDetailScreen({ route, navigation }) {
  const { alert: alertItem } = route.params;
  const asset = alertItem.asset;

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const { createAlert, toggleAlert } = useAlertStore();
  const c = colors(isDark);

  const [period,      setPeriod]    = useState('1M');
  const [history,     setHistory]   = useState([]);
  const [loadingChart,setLoadingChart] = useState(true);
  const [targetPrice, setTargetPrice] = useState(String(alertItem.targetPrice || ''));
  const [direction,   setDirection] = useState(alertItem.direction || 'ABOVE');
  const [isFav,       setIsFav]     = useState(asset?.isFavorite || false);
  const [saving,      setSaving]    = useState(false);

  useEffect(() => {
    loadHistory();
  }, [period]);

  const loadHistory = async () => {
    setLoadingChart(true);
    try {
      const { data } = await api.get(
        `/assets/history/${asset.ticker}?period=${PERIOD_MAP[period]}`
      );
      setHistory(data.map((h, i) => ({ x: i, y: h.close })));
    } catch {
      // Usa dados mock se API falhar
      setHistory(Array.from({ length: 30 }, (_, i) => ({
        x: i, y: 100 + Math.random() * 40,
      })));
    } finally {
      setLoadingChart(false);
    }
  };

  const handleSaveAlert = async () => {
    if (!targetPrice || isNaN(parseFloat(targetPrice))) return;
    setSaving(true);
    await createAlert(asset.ticker, parseFloat(targetPrice), direction);
    setSaving(false);
  };

  const toggleFav = async () => {
    try {
      if (isFav) {
        await api.delete(`/assets/favorites/${asset.ticker}`);
      } else {
        await api.post(`/assets/favorites/${asset.ticker}`);
      }
      setIsFav(v => !v);
    } catch {}
  };

  const currentPrice = asset?.currentPrice || 0;
  const change       = asset?.changePct    || 0;
  const isPositive   = change >= 0;
  const s = styles(c);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: c.text }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.ticker}>{asset?.ticker}</Text>
          <Text style={s.exchange}>{asset?.name} · {asset?.exchange}</Text>
        </View>
        <TouchableOpacity onPress={toggleFav} style={{ padding: 6 }}>
          <Text style={{ fontSize: 22 }}>{isFav ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Preço */}
        <View style={s.priceRow}>
          <Text style={s.priceBig}>
            {formatPrice(currentPrice, asset?.currency)}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.changePct, { color: isPositive ? c.success : c.danger }]}>
              {isPositive ? '+' : ''}{change?.toFixed(2)}%
            </Text>
            <Text style={s.changeLabel}>hoje</Text>
          </View>
        </View>

        {/* Seletor de período */}
        <View style={s.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[s.periodTab, p === period && s.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[s.periodText, p === period && s.periodTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gráfico */}
        <View style={s.chartContainer}>
          {loadingChart ? (
            <ActivityIndicator color="#6C47FF" size="large" style={{ marginTop: 30 }} />
          ) : (
            <VictoryChart
              height={160}
              padding={{ top: 10, bottom: 20, left: 0, right: 0 }}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: 'transparent' },
                  tickLabels: { fill: 'transparent' },
                  grid: { stroke: 'transparent' },
                }}
              />
              <VictoryArea
                data={history}
                style={{
                  data: {
                    fill: 'rgba(108,71,255,0.15)',
                    stroke: '#6C47FF',
                    strokeWidth: 2,
                  },
                }}
                animate={{ duration: 400 }}
              />
            </VictoryChart>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          {[
            ['Máxima 52s', formatPrice(asset?.high52w, asset?.currency)],
            ['Mínima 52s',  formatPrice(asset?.low52w,  asset?.currency)],
            ['Volume',  asset?.volume ? `${(asset.volume/1e6).toFixed(1)}M` : '--'],
            ['P/L',     asset?.peRatio?.toFixed(1) || '--'],
          ].map(([label, value]) => (
            <View key={label} style={[s.statCell, shadow(isDark)]}>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={s.statValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Configurar alerta */}
        <View style={[s.alertCard, shadow(isDark)]}>
          <Text style={s.alertCardTitle}>{t('set_alert')}</Text>

          {/* Tipo de alerta */}
          <View style={s.dirRow}>
            <Text style={s.dirLabel}>{t('alert_type')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['ABOVE', 'BELOW'].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[s.dirBtn, d === direction && s.dirBtnActive]}
                  onPress={() => setDirection(d)}
                >
                  <Text style={[s.dirBtnText, d === direction && s.dirBtnTextActive]}>
                    {d === 'ABOVE' ? t('above') : t('below')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Input de preço-alvo */}
          <Text style={s.fieldLabel}>{t('target_price').toUpperCase()}</Text>
          <View style={s.targetRow}>
            <TextInput
              style={s.targetInput}
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={c.textLight}
            />
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveAlert}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.saveBtnText}>{t('save_alert')}</Text>
              }
            </TouchableOpacity>
          </View>
          <Text style={s.currentPriceHint}>
            {t('current_price')}: {formatPrice(currentPrice, asset?.currency)}
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: c.background },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 0.5, borderColor: c.border, backgroundColor: c.surface },
  backBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  ticker:       { fontSize: 17, fontWeight: '700', color: c.text },
  exchange:     { fontSize: 11, color: c.textMuted, marginTop: 1 },
  priceRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 16, paddingBottom: 8 },
  priceBig:     { fontSize: 30, fontWeight: '700', color: c.text },
  changePct:    { fontSize: 15, fontWeight: '600' },
  changeLabel:  { fontSize: 10, color: c.textMuted },
  periodRow:    { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 4, gap: 4 },
  periodTab:    { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: c.surfaceAlt },
  periodTabActive: { backgroundColor: '#6C47FF' },
  periodText:   { fontSize: 12, color: c.textMuted, fontWeight: '500' },
  periodTextActive: { color: '#fff' },
  chartContainer: { paddingHorizontal: 8, height: 160 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  statCell:     { flex: 1, minWidth: '45%', backgroundColor: c.card, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: c.border },
  statLabel:    { fontSize: 10, color: c.textMuted, fontWeight: '500', marginBottom: 3 },
  statValue:    { fontSize: 15, fontWeight: '700', color: c.text },
  alertCard:    { margin: 16, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: c.border },
  alertCardTitle: { fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 14 },
  dirRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dirLabel:     { fontSize: 13, color: c.textMuted },
  dirBtn:       { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: c.surfaceAlt },
  dirBtnActive: { backgroundColor: '#6C47FF' },
  dirBtnText:   { fontSize: 12, fontWeight: '600', color: c.textMuted },
  dirBtnTextActive: { color: '#fff' },
  fieldLabel:   { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, color: c.textMuted, marginBottom: 6 },
  targetRow:    { flexDirection: 'row', gap: 8 },
  targetInput:  { flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 10, padding: 12, fontSize: 15, fontWeight: '600', color: c.text, borderWidth: 0.5, borderColor: c.border },
  saveBtn:      { backgroundColor: '#6C47FF', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  saveBtnText:  { color: '#fff', fontWeight: '600', fontSize: 13 },
  currentPriceHint: { fontSize: 11, color: c.textMuted, marginTop: 8 },
});
