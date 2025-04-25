import axios from 'axios';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, doc, setDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

// URL base para a API do ViaCEP
const api = axios.create({
  baseURL: 'https://viacep.com.br/ws/'
});

// Funções individuais para o Firebase Cloud Run
export const processPayment = async (paymentData) => {
  try {
    // Adicionar o ID do usuário como referência externa se não estiver definido
    if (!paymentData.externalReference && auth.currentUser) {
      paymentData.externalReference = `user_${auth.currentUser.uid}`;
    }
    
    const response = await axios.post('https://processpayment-q3zrn7ctxq-uc.a.run.app', paymentData);
    
    // Salvar o pagamento no Firestore
    if (response.data && response.data.id) {
      await savePaymentToFirestore(response.data, paymentData);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    throw error;
  }
};

// Função para verificar status do pagamento
export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await axios.get(`https://checkpaymentstatus-q3zrn7ctxq-uc.a.run.app?paymentId=${paymentId}`);
    
    // Atualizar o status do pagamento no Firestore
    if (response.data && response.data.id) {
      await updatePaymentStatusInFirestore(response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    throw error;
  }
};

// Função para salvar o token FCM do usuário
export const saveUserFCMToken = async (fcmToken) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('Usuário não autenticado ao salvar token FCM');
      return;
    }
    
    await setDoc(doc(db, 'users', currentUser.uid), {
      fcmToken,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('Token FCM salvo para o usuário:', currentUser.uid);
  } catch (error) {
    console.error('Erro ao salvar token FCM:', error);
  }
};

// Função para obter notificações do usuário
export const getUserNotifications = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('Usuário não autenticado ao buscar notificações');
      return [];
    }
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(notificationsQuery);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
};

// Função para marcar notificação como lida
export const markNotificationAsRead = async (notificationId) => {
  try {
    await setDoc(doc(db, 'notifications', notificationId), {
      read: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('Notificação marcada como lida:', notificationId);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
  }
};

// Função para salvar o pagamento no Firestore
const savePaymentToFirestore = async (paymentResponse, paymentRequest) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('Usuário não autenticado ao salvar pagamento');
      return;
    }
    
    // Criar um documento na coleção payments
    const paymentData = {
      paymentId: paymentResponse.id,
      status: paymentResponse.status,
      statusDetail: paymentResponse.status_detail,
      amount: paymentRequest.transactionAmount,
      description: paymentRequest.description,
      paymentMethod: paymentRequest.paymentType,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      dateCreated: serverTimestamp(),
      externalReference: paymentRequest.externalReference || `user_${currentUser.uid}`,
      pointOfInteraction: paymentResponse.point_of_interaction || null
    };
    
    // Usar o ID do pagamento como ID do documento
    await setDoc(doc(db, 'payments', paymentResponse.id), paymentData);
    
    console.log('Pagamento salvo no Firestore:', paymentResponse.id);
  } catch (error) {
    console.error('Erro ao salvar pagamento no Firestore:', error);
  }
};

// Função para atualizar o status do pagamento no Firestore
const updatePaymentStatusInFirestore = async (paymentData) => {
  try {
    // Atualizar o documento na coleção payments
    await setDoc(doc(db, 'payments', paymentData.id), {
      status: paymentData.status,
      statusDetail: paymentData.status_detail,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('Status do pagamento atualizado no Firestore:', paymentData.id);
  } catch (error) {
    console.error('Erro ao atualizar status do pagamento no Firestore:', error);
  }
};

export default api;
