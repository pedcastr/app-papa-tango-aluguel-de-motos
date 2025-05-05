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
  Text,
  AppState,
  StyleSheet
} from 'react-native';

// Importar o serviço de notificações completo
import * as notificationService from './src/services/notificationService';
import { registerBackgroundNotificationHandler } from './src/services/notificationService';
import * as Notifications from 'expo-notifications';

// Componente para exibir erros
const ErrorDisplay = ({ error }) => (
  <SafeAreaView style={styles.errorContainer}>
    <StatusBar backgroundColor='#CB2921' barStyle='light-content' />
    <View style={styles.errorContent}>
      <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
      <Text style={styles.errorMessage}>{error.message || 'Erro desconhecido'}</Text>
      <Text style={styles.errorDetail}>
        Por favor, reinicie o aplicativo ou entre em contato com o suporte.
      </Text>
    </View>
  </SafeAreaView>
);

// Registrar o handler de notificações em segundo plano
try {
  registerBackgroundNotificationHandler();
} catch (error) {
  console.error('Erro ao registrar handler de notificações em segundo plano:', error);
}

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);
  const [permissionChecking, setPermissionChecking] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const navigationRef = useNavigationContainerRef();
  
  // Estado para controlar erros
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  // Configurar handler global de erros
  useEffect(() => {
    const errorHandler = (error, isFatal) => {
      console.error('Erro capturado pelo handler global:', error);
      setHasError(true);
      setError(error);
    };

    // Registrar handler global para erros não capturados
    if (global.ErrorUtils) {
      const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorHandler(error, isFatal);
        originalGlobalHandler(error, isFatal);
      });
    }

    return () => {
      // Limpar o handler se necessário
    };
  }, []);

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
      // Não definimos hasError aqui porque não queremos interromper o fluxo do app
    } finally {
      setPermissionChecking(false);
      setPermissionChecked(true);
    }
  };

  // Efeito para controlar a animação de splash
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        setSplashFinished(true);
        // Após o splash, inicializamos as notificações
        initializeNotifications();
      }, 3000);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Erro no efeito de splash:', error);
      setHasError(true);
      setError(error);
    }
  }, []);

  // Configurar listener de notificações quando navigationRef estiver pronto
  useEffect(() => {
    let foregroundSubscription;
    let responseSubscription;
    
    try {
      if (navigationRef && navigationRef.isReady()) {
        // Listener para notificações recebidas em primeiro plano
        foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
          console.log('NOTIFICAÇÃO RECEBIDA EM PRIMEIRO PLANO:', notification);
        });
        
        // Listener para quando o usuário interage com a notificação 
        responseSubscription = notificationService.setupNotificationListener(navigationRef);
        
        console.log('Listeners de notificação configurados com sucesso');
      }
    } catch (error) {
      console.error('Erro ao configurar listeners de notificação:', error);
      // Não definimos hasError aqui porque não queremos interromper o fluxo do app
    }
    
    return () => {
      try {
        if (foregroundSubscription) {
          foregroundSubscription.remove();
        }
        if (responseSubscription) {
          responseSubscription.remove();
        }
      } catch (error) {
        console.error('Erro ao remover listeners:', error);
      }
    };
  }, [navigationRef]);

  // Efeito para verificar lembretes quando o app volta para o primeiro plano
  useEffect(() => {
    try {
      const handleAppStateChange = (nextAppState) => {
        if (appState.match(/inactive|background/) && nextAppState === 'active') {
          // App voltou para o primeiro plano
          console.log('App voltou para o primeiro plano, verificando lembretes...');
          notificationService.checkAndShowReminders();
        }
        setAppState(nextAppState);
      };

      // Verificar lembretes na inicialização
      notificationService.checkAndShowReminders();
      
      // Configurar intervalo para verificar lembretes a cada 15 minutos
      const checkRemindersInterval = setInterval(() => {
        notificationService.checkAndShowReminders();
      }, 15 * 60 * 1000); // 15 minutos
      
      // Adicionar listener para mudanças de estado do app
      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        clearInterval(checkRemindersInterval);
        appStateSubscription.remove();
      };
    } catch (error) {
      console.error('Erro no efeito de verificação de lembretes:', error);
      // Não definimos hasError aqui porque não queremos interromper o fluxo do app
    }
  }, [appState]);

  // Se ocorreu um erro fatal, mostrar tela de erro
  if (hasError) {
    return <ErrorDisplay error={error} />;
  }

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
  try {
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
  } catch (error) {
    console.error('Erro ao renderizar o app:', error);
    return <ErrorDisplay error={error} />;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#CB2921',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  }
});
