import { Platform } from 'react-native';
import firebase from '@react-native-firebase/app';
import crashlytics from '@react-native-firebase/crashlytics';

// Inicializar Crashlytics
export const initCrashlytics = async () => {
  if (Platform.OS === 'web') return;
  
  try {
    // Verificar se o Firebase já está inicializado
    if (!firebase.apps.length) {
      // O Firebase já deve estar inicializado em firebaseConfig.js
      console.log('Firebase não inicializado. Crashlytics não será ativado.');
      return;
    }
    
    // Ativar coleta de logs
    await crashlytics().setCrashlyticsCollectionEnabled(true);
    
    console.log('Crashlytics inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Crashlytics:', error);
  }
};

// Registrar log no Crashlytics
export const logError = (error, extraData = {}) => {
  if (Platform.OS === 'web') return;
  
  try {
    // Registrar dados personalizados
    Object.entries(extraData).forEach(([key, value]) => {
      crashlytics().setAttribute(key, String(value));
    });
    
    // Registrar o erro
    if (error instanceof Error) {
      crashlytics().recordError(error);
    } else {
      crashlytics().recordError(new Error(String(error)));
    }
  } catch (e) {
    console.error('Erro ao registrar no Crashlytics:', e);
  }
};