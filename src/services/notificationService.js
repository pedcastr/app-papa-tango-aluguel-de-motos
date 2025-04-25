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
  
  return true;
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
      console.log("Usuário não autenticado para registrar notificações");
      return null;
    }
    
    console.log("Iniciando registro para notificações push...");
    
    // Solicitar permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    console.log("Status atual de permissão:", existingStatus);
    
    if (existingStatus !== 'granted') {
      console.log("Solicitando permissão para notificações...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("Novo status de permissão:", finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permissão para notificações não concedida!');
      return null;
    }
    
    // Verificar o projectId
    let projectId;
    
    // Tentar obter o projectId de várias fontes
    if (Constants.expoConfig?.extra?.eas?.projectId) {
      projectId = Constants.expoConfig.extra.eas.projectId;
    } else if (Constants.manifest?.extra?.eas?.projectId) {
      projectId = Constants.manifest.extra.eas.projectId;
    } else if (Constants.expoConfig?.extra?.projectId) {
      projectId = Constants.expoConfig.extra.projectId;
    } else if (Constants.manifest?.extra?.projectId) {
      projectId = Constants.manifest.extra.projectId;
    }
    
    console.log("Project ID para token Expo:", projectId);
    
    if (!projectId) {
      console.warn("Project ID não encontrado! Tentando obter token sem projectId...");
    }
    
    // Obter token do Expo
    console.log("Obtendo token Expo...");
    let expoPushToken;
    
    try {
      // Tentar com projectId se disponível
      if (projectId) {
        expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
      } else {
        // Fallback para obter token sem projectId
        expoPushToken = await Notifications.getExpoPushTokenAsync();
      }
      
      console.log("Token Expo obtido:", expoPushToken.data);
    } catch (tokenError) {
      console.error("Erro ao obter token Expo:", tokenError);
      
      // Tentar novamente sem projectId se falhou com projectId
      if (projectId) {
        try {
          console.log("Tentando obter token sem projectId...");
          expoPushToken = await Notifications.getExpoPushTokenAsync();
          console.log("Token Expo obtido sem projectId:", expoPushToken.data);
        } catch (fallbackError) {
          console.error("Erro ao obter token Expo sem projectId:", fallbackError);
          throw fallbackError;
        }
      } else {
        throw tokenError;
      }
    }
    
    if (!expoPushToken || !expoPushToken.data) {
      throw new Error("Não foi possível obter token de notificação");
    }
    
    // Salvar o token no Firestore
    const userRef = doc(db, 'users', currentUser.email);
    
    // Verificar se o documento do usuário existe
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Atualizar o documento existente
      await updateDoc(userRef, {
        fcmToken: expoPushToken.data,
        tokenUpdatedAt: serverTimestamp(),
        tokenType: 'expo',
        platform: Platform.OS,
        deviceModel: Device.modelName || 'Unknown',
        appVersion: Constants.expoConfig?.version || 'Unknown'
      });
    } else {
      // Criar um novo documento se não existir
      await setDoc(userRef, {
        email: currentUser.email,
        fcmToken: expoPushToken.data,
        tokenUpdatedAt: serverTimestamp(),
        tokenType: 'expo',
        platform: Platform.OS,
        deviceModel: Device.modelName || 'Unknown',
        appVersion: Constants.expoConfig?.version || 'Unknown'
      });
    }
    
    console.log("Token FCM atualizado com sucesso para o usuário:", currentUser.email);
    
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
};

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
    
    console.log('Usuário marcado como registrado e notificações canceladas');
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
      console.log('Usuário já registrado, não agendando notificações');
      return false;
    }
    
    // Verificar se já configuramos as notificações
    const notificationsSet = await AsyncStorage.getItem('@PapaTango:notificationsSet');
    if (notificationsSet === 'true') {
      console.log('Notificações já configuradas anteriormente');
      
      // Verificar se as notificações ainda estão agendadas
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      if (scheduledNotifications.length > 0) {
        console.log('Notificações já agendadas:', scheduledNotifications.length);
        return true;
      }
      
      console.log('Notificações marcadas como configuradas, mas nenhuma encontrada. Reagendando...');
    }
    
    // Cancelar notificações existentes antes de agendar novas
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Salvar a data do primeiro acesso se ainda não existir
    let firstOpenDate = await AsyncStorage.getItem('@PapaTango:firstOpenDate');
    if (!firstOpenDate) {
      firstOpenDate = new Date().toISOString();
      await AsyncStorage.setItem('@PapaTango:firstOpenDate', firstOpenDate);
    }
    
    const firstOpenDateTime = new Date(firstOpenDate);
    
    // 1. Agendar notificação para 24 horas após o primeiro acesso
    const notification24h = new Date(firstOpenDateTime);
    notification24h.setHours(notification24h.getHours() + 24);
    
    // Verificar se a data já passou
    if (notification24h > new Date()) {
      const id24h = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏍️ Sua moto está esperando por você!',
          body: 'Falta pouco para você alugar sua moto dos sonhos. Complete seu cadastro agora!',
          data: { screen: 'SignIn' },
          android: { channelId: 'reminders' }
        },
        trigger: {
          date: notification24h
        },
      });
      
      console.log('Notificação de 24h agendada para', notification24h.toLocaleString(), 'com ID:', id24h);
    } else {
      console.log('Data de 24h já passou, não agendando esta notificação');
    }
    
    // 2. Agendar notificações semanais no mesmo dia da semana
    const dayOfWeek = firstOpenDateTime.getDay(); // 0-6 (Domingo-Sábado)
    const hours = 10; // 10:00 da manhã
    const minutes = 0;
    
    // Agendar notificação semanal
    const weeklyId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Não perca mais tempo!',
        body: 'Vários usuários já estão aproveitando nossas motos. Venha você também!',
        data: { screen: 'SignIn' },
        android: { channelId: 'reminders' }
      },
      trigger: {
        weekday: dayOfWeek,
        hour: hours,
        minute: minutes,
        repeats: true
      },
    });
    
    console.log('Notificação semanal agendada para toda',
      ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][dayOfWeek],
      `às ${hours}:${minutes < 10 ? '0' + minutes : minutes}`,
      'com ID:', weeklyId);
    
    // Marcar que configuramos as notificações
    await AsyncStorage.setItem('@PapaTango:notificationsSet', 'true');
    await AsyncStorage.setItem('@PapaTango:weeklyNotificationsSet', 'true');
    
    return true;
  } catch (error) {
    console.error('Erro ao agendar notificações para usuário não registrado:', error);
    return false;
  }
};

// Configurar o listener de notificações
export const setupNotificationListener = (navigationRef) => {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }
  
  // Listener para quando o usuário interage com uma notificação
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log("Notificação recebida e sendo processada pelo handler");
    
    const data = response.notification.request.content.data;
    console.log("Dados da notificação:", data);
    
    // Navegar para a tela apropriada com base nos dados da notificação
    if (data.screen && navigationRef.isReady()) {
      console.log('Navegando para a tela:', data.screen);
      
      // Verificar se temos dados adicionais para passar
      if (data.screen === 'PaymentSuccess' && data.paymentId) {
        // Buscar os dados do pagamento
        getPaymentDetails(data.paymentId).then(paymentInfo => {
          if (paymentInfo) {
            navigationRef.navigate(data.screen, { paymentInfo });
          } else {
            navigationRef.navigate(data.screen, { paymentId: data.paymentId });
          }
        }).catch(err => {
          console.error("Erro ao buscar detalhes do pagamento:", err);
          navigationRef.navigate(data.screen, { paymentId: data.paymentId });
        });
      } else if (data.screen === 'Financeiro') {
        navigationRef.navigate(data.screen);
      } else {
        navigationRef.navigate(data.screen);
      }
    }
  });
  
  return subscription;
};

// Função para buscar detalhes de um pagamento
const getPaymentDetails = async (paymentId) => {
  try {
    console.log("Buscando detalhes do pagamento:", paymentId);
    
    // Converter paymentId para número se for string
    const paymentIdNumber = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
    
    // Buscar na coleção payments do Firestore
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('paymentId', '==', paymentIdNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("Nenhum pagamento encontrado com ID:", paymentId);
      
      // Tentar buscar como string caso a busca como número falhe
      if (typeof paymentId === 'string') {
        const qStr = query(paymentsRef, where('paymentId', '==', paymentId));
        const querySnapshotStr = await getDocs(qStr);
        
        if (!querySnapshotStr.empty) {
          const paymentDoc = querySnapshotStr.docs[0];
          const paymentData = paymentDoc.data();
          console.log("Pagamento encontrado (como string):", paymentData);
          return {
            id: paymentData.paymentId,
            status: paymentData.status,
            payment_type_id: paymentData.paymentMethod,
            transaction_amount: paymentData.amount,
            date_created: paymentData.dateCreated?.toDate?.() || new Date(),
            description: paymentData.description || 'Pagamento PapaMotos'
          };
        }
      }
      
      return null;
    }
    
    // Obter o primeiro documento que corresponde à consulta
    const paymentDoc = querySnapshot.docs[0];
    const paymentData = paymentDoc.data();
    
    console.log("Pagamento encontrado:", paymentData);
    
    // Mapear os dados do Firestore para o formato esperado pela tela PaymentSuccess
    return {
      id: paymentData.paymentId,
      status: paymentData.status,
      payment_type_id: paymentData.paymentMethod,
      transaction_amount: paymentData.amount,
      date_created: paymentData.dateCreated?.toDate?.() || new Date(),
      description: paymentData.description || 'Pagamento PapaMotos'
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
        data: { screen: 'SignIn' },
      },
      trigger: null,
    });
    
    // Agendar notificação para 10 segundos no futuro
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Teste Agendado',
        body: `Esta notificação foi agendada para 10 segundos depois`,
        data: { screen: 'SignIn' },
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
