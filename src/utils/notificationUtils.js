import { db } from '../services/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Função para enviar notificação pelo Firestore
export const enviarNotificacaoPeloFirestore = async (userEmail, payment, title, body, data) => {
  try {
    // Gerar um ID único para a solicitação
    const requestId = `payment_${payment.id || 'admin'}_${Date.now()}`;
    
    // Criar um documento de solicitação de notificação no Firestore
    await setDoc(doc(db, 'notificationRequests', requestId), {
      userEmail: userEmail,
      title: title,
      body: body,
      data: data,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    console.log(`Solicitação de notificação criada: ${requestId}`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar solicitação de notificação: ${error.message}`);
    return false;
  }
};

// Função para enviar email pelo Firestore
export const enviarEmailPeloFirestore = async (userEmail, subject, body, paymentInfo) => {
  try {
    // Gerar um ID único para a solicitação
    const requestId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Criar um documento de solicitação de email no Firestore
    await setDoc(doc(db, 'emailRequests', requestId), {
      to: userEmail,
      subject: subject,
      html: body,
      paymentInfo: paymentInfo || null,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    
    console.log(`Solicitação de email criada: ${requestId}`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar solicitação de email: ${error.message}`);
    return false;
  }
};