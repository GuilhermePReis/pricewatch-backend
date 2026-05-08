// PriceWatch — navigation/RootNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useAuthStore }  from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { colors }        from '../utils/theme';

// Telas de autenticação
import { LoginScreen }    from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

// Telas principais
import { DashboardScreen } from '../screens/DashboardScreen';
import { SearchScreen }    from '../screens/SearchScreen';
import { AlertsScreen }    from '../screens/AlertsScreen';
import { ProfileScreen }   from '../screens/ProfileScreen';
import { AssetDetailScreen } from '../screens/AssetDetailScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── Tabs principais (usuário autenticado) ─────────────────
function MainTabs() {
  const { isDark } = useThemeStore();
  const c = colors(isDark);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor:  c.border,
          borderTopWidth:  0.5,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Início:  '⊞',
            Buscar:  '◎',
            Alertas: '◇',
            Perfil:  '◉',
          };
          return (
            <Text style={{ fontSize: 18, color, marginBottom: -2 }}>
              {icons[route.name] || '·'}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Início"  component={DashboardScreen} />
      <Tab.Screen name="Buscar"  component={SearchScreen} />
      <Tab.Screen name="Alertas" component={AlertsScreen} />
      <Tab.Screen name="Perfil"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Stack de detalhes (sobre as tabs) ────────────────────
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"        component={MainTabs} />
      <Stack.Screen
        name="AssetDetail"
        component={AssetDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

// ─── Raiz: decide se mostra auth ou app ───────────────────
export function RootNavigator() {
  const { token } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!token ? (
        // Fluxo de autenticação
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        // App principal
        <Stack.Screen name="App" component={AppStack} />
      )}
    </Stack.Navigator>
  );
}
