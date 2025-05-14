import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { auth, db } from './firebaseConfig';
import { doc, updateDoc, serverTimestamp, collection, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuração inicial das notificações
export const configureNotifications = async () => {
  if (Platform.OS === 'web') return false;
  
  // Configurar como as notificações devem ser tratadas quando o app está em primeiro plano
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // Mostrar alerta mesmo com o app aberto
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
  
  // Configurar canais para Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Padrão',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#CB2921',
    });
    
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Lembretes',
      description: 'Lembretes para completar seu cadastro',
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#CB2921',
    });
    
    await Notifications.setNotificationChannelAsync('payments', {
      name: 'Pagamentos',
      description: 'Notificações sobre pagamentos',
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#CB2921',
    });
  }

  // Canal específico para notificações com imagens
  await Notifications.setNotificationChannelAsync('notifications_with_image', {
    name: 'Notificações com Imagem',
    description: 'Notificações que contêm imagens',
    importance: Notifications.AndroidImportance.HIGH,
    sound: true,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#CB2921',
    enableLights: true,
  });
  
  return true;
};

// Registrar o handler para notificações recebidas em segundo plano
export const registerBackgroundNotificationHandler = () => {
  if (Platform.OS === 'web') return;
  
  // Configurar o handler para notificações recebidas em segundo plano
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const hasImage = notification.request.content.data?.image || 
                       notification.request.content.attachments?.length > 0;
      
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        // Se tiver imagem, usar o canal específico para imagens no Android
        channelId: hasImage ? 'notifications_with_image' : 'default',
      };
    },
  });
};

// Solicitar permissões de notificação
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') return false;
  
  if (!Device.isDevice) {
    console.log('Notificações push não funcionam em emuladores/simuladores');
    return false;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// Registrar para notificações push e salvar o token FCM
export const registerForPushNotifications = async () => {
  try {
    if (Platform.OS === 'web') {
      console.log("Notificações push não são suportadas na web");
      return null;
    }
    
    if (!Device.isDevice) {
      console.log("Notificações push não funcionam em emuladores/simuladores");
      return null;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    
    
    // Verificar se estamos em um build standalone
    const isStandalone = !__DEV__ || Constants.appOwnership === 'standalone';
    console.log("Executando em modo standalone:", isStandalone);
    
    // Solicitar permissões
    let finalStatus;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;
    
      
      if (existingStatus !== 'granted') {
        console.log("Solicitando permissão para notificações...");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("Novo status de permissão:", finalStatus);
      }
    } catch (permError) {
      console.error("Erro ao verificar/solicitar permissões:", permError);
      finalStatus = 'error';
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permissão para notificações não concedida!');
      return null;
    }
    
    // Verificar o projectId
    let projectId;
    
    try {
      projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                  Constants.expoConfig?.extra?.projectId;
      
      // Fallback para o projectId hardcoded do seu app.config.js
      if (!projectId) {
        projectId = '2d93efbd-1062-4051-bf44-18c916565fb7';
      }
      
    } catch (projectIdError) {
      console.error("Erro ao obter projectId:", projectIdError);
      // Fallback para o projectId hardcoded
      projectId = '2d93efbd-1062-4051-bf44-18c916565fb7';
    }
    
    // Obter token do Expo
    let expoPushToken = null;
    let tokenSuccess = false;
    
    // Tentativa 1: Com projectId
    if (projectId) {
      try {
        expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        tokenSuccess = true;
      } catch (tokenError) {
        console.error("Erro ao obter token Expo com projectId:", tokenError);
        // Não falhar aqui, tentar próxima abordagem
      }
    }
    
    // Tentativa 2: Sem projectId
    if (!tokenSuccess) {
      try {
        expoPushToken = await Notifications.getExpoPushTokenAsync();
        tokenSuccess = true;
      } catch (fallbackError) {
        console.error("Erro ao obter token Expo sem projectId:", fallbackError);
        // Não falhar aqui, tentar próxima abordagem
      }
    }
    
    // Tentativa 3: Com opções explícitas
    if (!tokenSuccess) {
      try {
        expoPushToken = await Notifications.getExpoPushTokenAsync({
          experienceId: '@pedro_castro/papamotos',
        });
        tokenSuccess = true;
      } catch (explicitError) {
        console.error("Erro ao obter token com opções explícitas:", explicitError);
        // Última tentativa falhou
      }
    }
    
    // Se todas as tentativas falharam
    if (!tokenSuccess || !expoPushToken || !expoPushToken.data) {
      console.error("Todas as tentativas de obter token falharam");
      // Não lançar erro, apenas retornar null
      return null;
    }
    
    // Configurar canais para Android
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Padrão',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#CB2921',
        });
        
        // Adicionar um canal específico para notificações com imagens
        await Notifications.setNotificationChannelAsync('notifications_with_image', {
          name: 'Notificações com Imagem',
          description: 'Notificações que contêm imagens',
          importance: Notifications.AndroidImportance.HIGH,
          sound: true,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#CB2921',
          enableLights: true,
        });
      } catch (channelError) {
        console.error("Erro ao configurar canais de notificação:", channelError);
        // Continuar mesmo se falhar a configuração de canais
      }
    }
    
    // Salvar o token no Firestore
    try {
      const userRef = doc(db, 'users', currentUser.email);
      
      // Verificar se o documento do usuário existe
      const userDoc = await getDoc(userRef);
      
      const tokenData = {
        fcmToken: expoPushToken.data,
        tokenUpdatedAt: serverTimestamp(),
        tokenType: 'expo',
        platform: Platform.OS,
        deviceModel: Device.modelName || 'Unknown',
        appVersion: Constants.expoConfig?.version || 'Unknown'
      };
      
      if (userDoc.exists()) {
        // Atualizar o documento existente
        await updateDoc(userRef, tokenData);
      } else {
        // Criar um novo documento se não existir
        await setDoc(userRef, {
          email: currentUser.email,
          ...tokenData
        });
      }
      
    } catch (firestoreError) {
      console.error("Erro ao salvar token no Firestore:", firestoreError);
      // Continuar mesmo se falhar o salvamento no Firestore
    }
    
    return expoPushToken.data;
  } catch (error) {
    console.error("Erro ao registrar para notificações push:", error);
    // Registrar detalhes do erro para depuração
    if (error.code) {
      console.error("Código do erro:", error.code);
    }
    if (error.message) {
      console.error("Mensagem do erro:", error.message);
    }
    return null;
  }
}

// Verificar se o usuário está registrado
export const isUserRegistered = async () => {
  try {
    const userRegistered = await AsyncStorage.getItem('@PapaTango:userRegistered');
    return userRegistered === 'true';
  } catch (error) {
    console.error('Erro ao verificar se o usuário está registrado:', error);
    return false;
  }
};

// Marcar o usuário como registrado
export const markUserAsRegistered = async () => {
  try {
    await AsyncStorage.setItem('@PapaTango:userRegistered', 'true');
    
    // Cancelar notificações de lembrete quando o usuário se registrar
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar usuário como registrado:', error);
    return false;
  }
};

// Agendar notificações para usuários não registrados
export const scheduleNonRegisteredUserNotifications = async () => {
  try {
    // Verificar se estamos na web
    if (Platform.OS === 'web') {
      console.log('Notificações não são suportadas na web');
      return false;
    }
    
    // Verificar permissões
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Permissão de notificação não concedida');
      return false;
    }
    
    // Verificar se o usuário já está registrado
    const userRegistered = await isUserRegistered();
    if (userRegistered) {
      return false;
    }
    
    // Verificar se já configuramos as notificações recentemente
    const lastSetupTime = await AsyncStorage.getItem('@PapaTango:notificationsSetupTime');
    
    if (lastSetupTime) {
      const lastSetup = new Date(lastSetupTime);
      const now = new Date();
      const hoursSinceLastSetup = (now - lastSetup) / (1000 * 60 * 60);
      
      if (hoursSinceLastSetup < 24) {
        return true;
      }
    }
    
    // Marcar que configuramos as notificações e salvar o timestamp ANTES de agendar
    await AsyncStorage.setItem('@PapaTango:notificationsSet', 'true');
    await AsyncStorage.setItem('@PapaTango:notificationsSetupTime', new Date().toISOString());
    
    // Salvar as datas em que as notificações devem ser enviadas
    const now = new Date();
    
    const reminder24h = new Date(now);
    reminder24h.setHours(reminder24h.getHours() + 24);
    
    const reminderWeekly = new Date(now);
    reminderWeekly.setDate(reminderWeekly.getDate() + 7);
    reminderWeekly.setHours(10, 0, 0, 0);
    
    await AsyncStorage.setItem('@PapaTango:reminder24hDate', reminder24h.toISOString());
    await AsyncStorage.setItem('@PapaTango:reminderWeeklyDate', reminderWeekly.toISOString());
    
    // Limpar flags de notificações mostradas
    await AsyncStorage.removeItem('@PapaTango:reminder24hShown');
    await AsyncStorage.removeItem('@PapaTango:reminderWeeklyShown');
    
    return true;
  } catch (error) {
    console.error('Erro ao configurar lembretes para usuário não registrado:', error);
    return false;
  }
};

// checar e mostrar lembretes
export const checkAndShowReminders = async () => {
  try {
    // Verificar se o usuário está registrado
    const userRegistered = await isUserRegistered();
    if (userRegistered) {
      return;
    }
    
    const now = new Date();
    
    // Verificar lembrete de 24h
    const reminder24hDateStr = await AsyncStorage.getItem('@PapaTango:reminder24hDate');
    if (reminder24hDateStr) {
      const reminder24hDate = new Date(reminder24hDateStr);
      const reminder24hShown = await AsyncStorage.getItem('@PapaTango:reminder24hShown');
      
      if (!reminder24hShown && now >= reminder24hDate) {
        // Mostrar notificação de 24h
        await Notifications.presentNotificationAsync({
          title: '🏍️ Sua moto está esperando por você!',
          body: 'Falta pouco para você alugar sua moto dos sonhos. Complete seu cadastro agora!',
          data: { screen: 'Login' },
        });
        
        await AsyncStorage.setItem('@PapaTango:reminder24hShown', 'true');
      }
    }
    
    // Verificar lembrete semanal
    const reminderWeeklyDateStr = await AsyncStorage.getItem('@PapaTango:reminderWeeklyDate');
    if (reminderWeeklyDateStr) {
      const reminderWeeklyDate = new Date(reminderWeeklyDateStr);
      const reminderWeeklyShown = await AsyncStorage.getItem('@PapaTango:reminderWeeklyShown');
      
      if (!reminderWeeklyShown && now >= reminderWeeklyDate) {
        // Mostrar notificação semanal
        await Notifications.presentNotificationAsync({
          title: '🔥 Não perca mais tempo!',
          body: 'Vários usuários já estão aproveitando nossas motos. Venha você também!',
          data: { screen: 'Login' },
        });
        
        await AsyncStorage.setItem('@PapaTango:reminderWeeklyShown', 'true');
      }
    }
  } catch (error) {
    console.error('Erro ao verificar lembretes:', error);
  }
};




// Configurar o listener de notificações
export const setupNotificationListener = (navigationRef) => {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }
  
  // Listener para quando o usuário interage com uma notificação
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    
    const data = response.notification.request.content.data;
    
    // Navegar para a tela apropriada com base nos dados da notificação
    if (data.screen && navigationRef.isReady()) {

      // Tratando navegação aninhada
      if (data.params && data.params.screen) {
        navigationRef.navigate(data.screen, { screen: data.params.screen });
      } else {
        navigationRef.navigate(data.screen);
      }
      
      // Verificar se temos dados adicionais para passar
      if (data.screen === 'PaymentSuccess' && data.paymentId) {
        // Buscar os dados do pagamento
        getPaymentDetails(data.paymentId)
          .then(paymentInfo => {
            if (paymentInfo) {
              navigationRef.navigate(data.screen, { paymentInfo });
            } else {
              navigationRef.navigate(data.screen, { paymentId: data.paymentId });
            }
          })
          .catch(err => {
            console.error("Erro ao buscar detalhes do pagamento:", err);
            navigationRef.navigate(data.screen, { paymentId: data.paymentId });
          });
      } else if (data.screen === 'Financeiro') {
        navigationRef.navigate(data.screen);
      }
    }
  });

  return subscription;
};


// Função para buscar detalhes de um pagamento
const getPaymentDetails = async (paymentId) => {
  try {
    
    // Converter paymentId para número se for string
    const paymentIdNumber = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
    
    // Buscar na coleção payments do Firestore
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('paymentId', '==', paymentIdNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      
      // Tentar buscar como string caso a busca como número falhe
      if (typeof paymentId === 'string') {
        const qStr = query(paymentsRef, where('paymentId', '==', paymentId));
        const querySnapshotStr = await getDocs(qStr);
        
        if (!querySnapshotStr.empty) {
          const paymentDoc = querySnapshotStr.docs[0];
          const paymentData = paymentDoc.data();
          return {
            id: paymentData.paymentId,
            status: paymentData.status,
            payment_type_id: paymentData.paymentMethod,
            transaction_amount: paymentData.amount,
            date_created: paymentData.dateCreated?.toDate?.() || new Date(),
            description: paymentData.description || 'Pagamento Papa Motos'
          };
        }
      }
      
      return null;
    }
    
    // Obter o primeiro documento que corresponde à consulta
    const paymentDoc = querySnapshot.docs[0];
    const paymentData = paymentDoc.data();
    
    // Mapear os dados do Firestore para o formato esperado pela tela PaymentSuccess
    return {
      id: paymentData.paymentId,
      status: paymentData.status,
      payment_type_id: paymentData.paymentMethod,
      transaction_amount: paymentData.amount,
      date_created: paymentData.dateCreated?.toDate?.() || new Date(),
      description: paymentData.description || 'Pagamento Papa Motos'
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do pagamento:", error);
    return null;
  }
};

// Função para testar notificações diretamente via Firestore
export const testNotificationDirectly = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("Usuário não autenticado para testar notificação");
      return false;
    }
    
    // Obter o token atual do usuário para verificação
    const userRef = doc(db, 'users', currentUser.email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log("Documento do usuário não encontrado");
      return false;
    }
    
    const userData = userDoc.data();
    const token = userData.fcmToken;
    
    if (!token) {
      console.log("Token de notificação não encontrado para o usuário");
      return false;
    }
    
    console.log("Testando notificação para token:", token);
    
    // Criar solicitação de notificação no Firestore
    const requestId = `test_${Date.now()}`;
    await setDoc(doc(db, 'notificationRequests', requestId), {
      userEmail: currentUser.email,
      token: token,
      title: 'Teste de Notificação',
      body: 'Esta é uma notificação de teste enviada em ' + new Date().toLocaleTimeString(),
      data: { screen: 'Financeiro' },
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    console.log("Solicitação de notificação de teste criada com ID:", requestId);
    return true;
  } catch (error) {
    console.error("Erro ao testar notificação:", error);
    return false;
  }
};

// Função para testar notificações (apenas para desenvolvimento)
export const testNotifications = async () => {
  if (Platform.OS === 'web') return false;
  
  try {
    // Solicitar permissões
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;
    
    // Cancelar notificações existentes
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Enviar notificação imediata
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Teste Imediato',
        body: 'Esta é uma notificação de teste imediata',
        data: { screen: 'Login' },
      },
      trigger: null,
    });
    
    // Agendar notificação para 10 segundos no futuro
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Teste Agendado',
        body: `Esta notificação foi agendada para 10 segundos depois`,
        data: { screen: 'Login' },
      },
      trigger: { seconds: 10 },
    });
    
    // Testar notificação de pagamento
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Pagamento Aprovado',
        body: 'Seu pagamento de R$ 250,00 foi aprovado com sucesso!',
        data: { screen: 'Financeiro' },
        android: { channelId: 'payments' }
      },
      trigger: { seconds: 15 },
    });
    
    console.log('Notificações de teste enviadas com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao testar notificações:', error);
    return false;
  }
};

// Função para limpar o cache de notificações (para testes)
export const clearNotificationCache = async () => {
  try {
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    
    await AsyncStorage.removeItem('@PapaTango:userRegistered');
    await AsyncStorage.removeItem('@PapaTango:notificationsSet');
    await AsyncStorage.removeItem('@PapaTango:firstOpenDate');
    await AsyncStorage.removeItem('@PapaTango:weeklyNotificationsSet');
    
    // Definir explicitamente como false
    await AsyncStorage.setItem('@PapaTango:userRegistered', 'false');
    
    console.log('Cache de notificações limpo com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao limpar cache de notificações:', error);
    return false;
  }
};

export default {
  configureNotifications,
  requestNotificationPermissions,
  registerForPushNotifications,
  isUserRegistered,
  markUserAsRegistered,
  scheduleNonRegisteredUserNotifications,
  setupNotificationListener,
  testNotifications,
  clearNotificationCache,
  testNotificationDirectly
};
