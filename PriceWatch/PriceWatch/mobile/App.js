// PriceWatch — App.js
import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore }  from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import './src/i18n'; // inicializa i18next

// Configuração de como exibir notificações quando app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export default function App() {
  const systemScheme = useColorScheme();
  const { darkMode, setSystemScheme } = useThemeStore();
  const { rehydrate } = useAuthStore();

  useEffect(() => {
    // Restaura sessão salva no SecureStore
    rehydrate();
    setSystemScheme(systemScheme);
  }, []);

  const isDark = darkMode ?? systemScheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
