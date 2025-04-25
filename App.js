import React, { useState, useEffect } from 'react';
import SplashAnimation from './src/animation/index';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigationContainerRef } from '@react-navigation/native';
import Routes from './src/routes';
import { AuthProvider } from './src/context/AuthContext';
import { AdminProvider } from './src/context/AdminContext';
import {
  SafeAreaView,
  StatusBar,
  View,
  ActivityIndicator,
  Text
} from 'react-native';

// Importar o serviço de notificações completo
import notificationService from './src/services/notificationService';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);
  const [permissionChecking, setPermissionChecking] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const navigationRef = useNavigationContainerRef();
  
  // Função para inicializar as notificações
  const initializeNotifications = async () => {
    try {
      setPermissionChecking(true);
      
      // Configurar notificações
      await notificationService.configureNotifications();
      
      // Verificar se o usuário está registrado
      const isRegistered = await notificationService.isUserRegistered();
      
      // Se não estiver registrado, agendar notificações
      if (!isRegistered) {
        await notificationService.scheduleNonRegisteredUserNotifications();
      }
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    } finally {
      setPermissionChecking(false);
      setPermissionChecked(true);
    }
  };

  // Efeito para controlar a animação de splash
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFinished(true);
      // Após o splash, inicializamos as notificações
      initializeNotifications();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Configurar listener de notificações quando navigationRef estiver pronto
  useEffect(() => {
    let foregroundSubscription;
    let responseSubscription;
    
    if (navigationRef && navigationRef.isReady()) {
      try {
        // Listener para notificações recebidas em primeiro plano
        foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
          console.log('NOTIFICAÇÃO RECEBIDA EM PRIMEIRO PLANO:', notification);
        });
        
        // Listener para quando o usuário interage com a notificação
        responseSubscription = notificationService.setupNotificationListener(navigationRef);
        
        console.log('Listeners de notificação configurados com sucesso');
      } catch (error) {
        console.error('Erro ao configurar listeners de notificação:', error);
      }
    }
    
    return () => {
      if (foregroundSubscription) {
        foregroundSubscription.remove();
      }
      if (responseSubscription) {
        responseSubscription.remove();
      }
    };
  }, [navigationRef]);

  // Mostrar a animação de splash
  if (!splashFinished) {
    return <SplashAnimation />;
  }

  // Mostrar indicador de carregamento enquanto verifica permissões
  if (permissionChecking) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#CB2921'}}>
        <StatusBar backgroundColor='#CB2921' barStyle='light-content' />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar o app normalmente após verificar permissões
  return (
    <AuthProvider>
      <AdminProvider>
        <SafeAreaView style={{flex: 1, backgroundColor: '#CB2921'}}>
          <StatusBar backgroundColor='#CB2921' barStyle='light-content' />
          <NavigationContainer ref={navigationRef}>
            <Routes />
          </NavigationContainer>
        </SafeAreaView>
      </AdminProvider>
    </AuthProvider>
  );
}
