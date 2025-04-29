import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications } from '../../services/notificationService';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, onSnapshot, setDoc, orderBy } from 'firebase/firestore';
import {
  Container,
  Header,
  Title,
  Card,
  CardTitle,
  CardContent,
  CardText,
  CardAmount,
  Button,
  ButtonText,
  EmptyContainer,
  EmptyText,
  LoadingContainer,
  StatusBadge,
  StatusText,
  PaymentInfoContainer,
  PaymentInfoTitle,
  PaymentInfoRow,
  PaymentInfoLabel,
  PaymentInfoValue,
  CountdownContainer,
  CountdownText
} from './styles';

const Financeiro = () => {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [proximoPagamento, setProximoPagamento] = useState(null);
  const [contratoAtivo, setContratoAtivo] = useState(false);
  const [notificationSent, setNotificationSent] = useState({});
  
  // Referência para armazenar o ID do intervalo de verificação de pagamentos pendentes
  const pendingPaymentsIntervalRef = useRef(null);
  // Referência para armazenar o ID do intervalo de verificação de lembretes de pagamento
  const paymentReminderIntervalRef = useRef(null);

  // useEffect principal que gerencia autenticação e carregamento inicial
  useEffect(() => {
    let unsubscribe = () => {};
    
    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      // Limpar o listener anterior se existir
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      
      if (user) {
        setLoading(true);
        // Registrar para notificações push
        registerForPushNotifications();
        // Carregar pagamentos
        unsubscribe = loadPayments();
      } else {
        setLoading(false);
        setPayments([]);
        setUserData(null);
        setProximoPagamento(null);
        setContratoAtivo(false);
        
        // Limpar intervalos
        if (pendingPaymentsIntervalRef.current) {
          clearInterval(pendingPaymentsIntervalRef.current);
          pendingPaymentsIntervalRef.current = null;
        }
        if (paymentReminderIntervalRef.current) {
          clearInterval(paymentReminderIntervalRef.current);
          paymentReminderIntervalRef.current = null;
        }
      }
    });
    
    return () => {
      authUnsubscribe();
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // useEffect para verificação de token de autenticação
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const checkAuthToken = async () => {
      try {
        const token = await currentUser.getIdToken(true);
        console.log("Token renovado com sucesso");
      } catch (error) {
        console.error("Erro ao renovar token:", error);
      }
    };
    
    // Verificar imediatamente
    checkAuthToken();
    
    // Configurar verificação periódica
    const interval = setInterval(checkAuthToken, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // useEffect para verificar pagamentos pendentes
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !payments.length) return;
    
    // Verificar imediatamente
    checkPendingPayments();
    
    // Limpar intervalo anterior se existir
    if (pendingPaymentsIntervalRef.current) {
      clearInterval(pendingPaymentsIntervalRef.current);
    }
    
    // Configurar verificação periódica
    pendingPaymentsIntervalRef.current = setInterval(checkPendingPayments, 10 * 60 * 1000);
    
    return () => {
      if (pendingPaymentsIntervalRef.current) {
        clearInterval(pendingPaymentsIntervalRef.current);
      }
    };
  }, [payments, notificationSent, userData]);

  // useEffect para verificar lembretes de pagamento
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !proximoPagamento || !userData) return;
    
    // Verificar imediatamente
    checkPaymentReminder();
    
    // Limpar intervalo anterior se existir
    if (paymentReminderIntervalRef.current) {
      clearInterval(paymentReminderIntervalRef.current);
    }
    
    // Configurar verificação periódica
    paymentReminderIntervalRef.current = setInterval(checkPaymentReminder, 60 * 60 * 1000);
    
    return () => {
      if (paymentReminderIntervalRef.current) {
        clearInterval(paymentReminderIntervalRef.current);
      }
    };
  }, [proximoPagamento, userData]);

  useEffect(() => {
    let unsubscribe;
    
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar se o usuário está autenticado
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError('Usuário não autenticado');
          setLoading(false);
          return;
        }
        
        console.log('Usuário logado:', currentUser.email);
        
        // Configurar um listener em tempo real para a coleção de pagamentos
        const q = query(
          collection(db, 'payments'),
          where('userEmail', '==', currentUser.email),
          orderBy('dateCreated', 'desc')
        );
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const paymentsData = [];
          querySnapshot.forEach((doc) => {
            paymentsData.push({
              id: doc.id,
              ...doc.data(),
              date_created: doc.data().dateCreated?.toDate?.().toISOString() || new Date().toISOString(),
              transaction_amount: doc.data().amount || 0,
              status: doc.data().status || 'pending',
              payment_type_id: doc.data().paymentMethod || 'unknown'
            });
          });
          
          setPayments(paymentsData);
          setLoading(false);
        }, (error) => {
          console.error('Erro ao carregar pagamentos:', error);
          setError('Não foi possível carregar seus pagamentos. Tente novamente mais tarde.');
          setLoading(false);
        });
      } catch (err) {
        console.error('Erro ao carregar pagamentos:', err);
        setError('Não foi possível carregar seus pagamentos. Tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    loadPayments();
    
    // Limpar o listener quando o componente for desmontado
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
  
  // Função para carregar os dados do usuário
  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }
      
      // Buscar o documento do usuário usando o email como ID
      const userDoc = await getDoc(doc(db, 'users', currentUser.email));
      
      if (!userDoc.exists()) {
        throw new Error('Dados do usuário não encontrados');
      }
      
      const userData = userDoc.data();
      setUserData(userData);
      
      return userData;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      throw error;
    }
  };
  
  // Função para carregar os pagamentos do usuário
  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar dados do usuário
      const user = await loadUserData();
      
      // Buscar pagamentos do usuário atual
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setLoading(false);
        return () => {}; // Retorna uma função vazia se não houver usuário
      }
      
      console.log("Usuário logado:", currentUser.email);
      
      let foundProximoPagamento = false;
      let isContratoAtivo = false;
      
      // Verificar se o usuário tem um contratoId
      if (user && user.contratoId) {
        console.log("Buscando contrato com ID:", user.contratoId);
        
        // Buscar o contrato diretamente pelo ID
        const contratoDoc = await getDoc(doc(db, 'contratos', user.contratoId));
        
        if (contratoDoc.exists()) {
          const contrato = contratoDoc.data();
          
          // Verificar se o contrato está ativo usando o campo statusContrato (boolean)
          isContratoAtivo = contrato.statusContrato === true;
          setContratoAtivo(isContratoAtivo);
          
          // Se o contrato estiver ativo, calcular o próximo pagamento
          if (isContratoAtivo && contrato.dataInicio) {
            // Verificar se o usuário tem um aluguelAtivoId
            let aluguelId = user.aluguelAtivoId;
            
            // Se não tiver, tentar buscar pelo motoId do contrato
            if (!aluguelId && contrato.motoId) {
              console.log("Buscando aluguel pela motoId:", contrato.motoId);
              
              const alugueisQuery = query(
                collection(db, 'alugueis'),
                where('motoId', '==', contrato.motoId),
                where('ativo', '==', true)
              );
              
              const alugueisSnapshot = await getDocs(alugueisQuery);
              
              if (!alugueisSnapshot.empty) {
                aluguelId = alugueisSnapshot.docs[0].id;
              }
            }
            
            if (aluguelId) {
              console.log("Buscando aluguel com ID:", aluguelId);
              
              const aluguelDoc = await getDoc(doc(db, 'alugueis', aluguelId));
              
              if (aluguelDoc.exists()) {
                const aluguel = aluguelDoc.data();
                
                // Calcular próximo pagamento
                try {
                  // Determinar se é pagamento semanal ou mensal
                  const tipoRecorrencia = contrato.tipoRecorrenciaPagamento || 'mensal';
                  const valorMensal = aluguel.valorMensal || 250;
                  const valorSemanal = aluguel.valorSemanal || 70;
                  const valor = tipoRecorrencia === 'semanal' ? valorSemanal : valorMensal;
                  
                  // Buscar pagamentos do usuário
                  const paymentsQuery = query(
                    collection(db, 'payments'),
                    where('userEmail', '==', currentUser.email),
                    orderBy('dateCreated', 'desc')
                  );
                  
                  const paymentsSnapshot = await getDocs(paymentsQuery);
                  
                  // Verificar se existe algum pagamento aprovado
                  const ultimoPagamentoAprovado = paymentsSnapshot.docs.find(doc => {
                    const paymentData = doc.data();
                    return paymentData.status === 'approved';
                  });
                  
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia
                  
                  let dataBase;
                  let proximaData;
                  
                  // Se tiver pagamento aprovado, calcular a partir dele
                  if (ultimoPagamentoAprovado) {
                    const ultimoPagamentoData = ultimoPagamentoAprovado.data().dateCreated?.toDate();
                    if (ultimoPagamentoData) {
                      dataBase = new Date(ultimoPagamentoData);
                      dataBase.setHours(0, 0, 0, 0); // Normalizar para início do dia
                    } else {
                      dataBase = new Date(contrato.dataInicio.toDate());
                      dataBase.setHours(0, 0, 0, 0);
                    }
                  } else {
                    // Se não tiver pagamento aprovado, usar a data de início do contrato
                    dataBase = new Date(contrato.dataInicio.toDate());
                    dataBase.setHours(0, 0, 0, 0);
                  }
                  
                  // Calcular a próxima data de pagamento com base no tipo de recorrência
                  proximaData = new Date(dataBase);
                  
                  if (tipoRecorrencia === 'semanal') {
                    // Para pagamento semanal
                    proximaData.setDate(proximaData.getDate() + 7);
                    
                    // Se não houver pagamento aprovado e a data de início for anterior à data atual,
                    // precisamos encontrar a data de pagamento mais próxima (que pode estar no passado)
                    if (!ultimoPagamentoAprovado) {
                      // Ajustar para encontrar a data de pagamento correta
                      proximaData = new Date(dataBase);
                      
                      // Avançar de 7 em 7 dias até encontrar a primeira data após a data base
                      while (proximaData <= dataBase) {
                        proximaData.setDate(proximaData.getDate() + 7);
                      }
                      
                      // Se essa data já passou, é um pagamento atrasado
                      if (proximaData < hoje) {
                        // Não avançamos para a próxima data, pois queremos mostrar o atraso
                      }
                    }
                  } else {
                    // Para pagamento mensal
                    proximaData.setMonth(proximaData.getMonth() + 1);
                    
                    // Se não houver pagamento aprovado e a data de início for anterior à data atual,
                    // precisamos encontrar a data de pagamento mais próxima (que pode estar no passado)
                    if (!ultimoPagamentoAprovado) {
                      // Ajustar para encontrar a data de pagamento correta
                      proximaData = new Date(dataBase);
                      
                      // Avançar de mês em mês até encontrar a primeira data após a data base
                      while (proximaData <= dataBase) {
                        proximaData.setMonth(proximaData.getMonth() + 1);
                      }
                      
                      // Se essa data já passou, é um pagamento atrasado
                      if (proximaData < hoje) {
                        // Não avançamos para a próxima data, pois queremos mostrar o atraso
                      }
                    }
                  }
                  
                  // Verificar se já existe um pagamento aprovado para o período atual
                  let existePagamentoAtual = false;
                  
                  if (tipoRecorrencia === 'semanal') {
                    // Para pagamento semanal, verificar se há pagamento na semana atual
                    const inicioSemanaAtual = new Date(proximaData);
                    inicioSemanaAtual.setDate(inicioSemanaAtual.getDate() - 7);
                    
                    existePagamentoAtual = paymentsSnapshot.docs.some(doc => {
                      const paymentData = doc.data();
                      const paymentDate = paymentData.dateCreated?.toDate();
                      if (!paymentDate) return false;
                      
                      return paymentDate >= inicioSemanaAtual && 
                             paymentDate < proximaData && 
                             paymentData.status === 'approved';
                    });
                  } else {
                    // Para pagamento mensal, verificar se há pagamento no mês atual
                    const inicioMesAtual = new Date(proximaData);
                    inicioMesAtual.setMonth(inicioMesAtual.getMonth() - 1);
                    
                    existePagamentoAtual = paymentsSnapshot.docs.some(doc => {
                      const paymentData = doc.data();
                      const paymentDate = paymentData.dateCreated?.toDate();
                      if (!paymentDate) return false;
                      
                      return paymentDate >= inicioMesAtual && 
                             paymentDate < proximaData && 
                             paymentData.status === 'approved';
                    });
                  }
                  
                  // Calcular dias restantes (incluindo o dia de hoje)
                  const diasRestantes = Math.floor((proximaData - hoje) / (1000 * 60 * 60 * 24));
                  
                  // Determinar status
                  let status;
                  if (existePagamentoAtual) {
                    status = 'paid';
                  } else if (diasRestantes < 0) {
                    status = 'overdue'; // Atrasado
                  } else if (diasRestantes === 0) {
                    status = 'today'; // Vence hoje
                  } else {
                    status = 'pending'; // Pendente
                  }

                  setProximoPagamento({
                    valor,
                    data: proximaData,
                    tipoRecorrencia,
                    diasRestantes,
                    diasAtraso: diasRestantes < 0 ? Math.abs(diasRestantes) : 0,
                    status
                  });
                  
                  foundProximoPagamento = true;
                } catch (err) {
                  console.error("Erro ao calcular próximo pagamento:", err);
                }
              } else {
                console.log("Aluguel não encontrado");
              }
            } else {
              console.log("ID de aluguel não encontrado");
            }
          } else {
            console.log("Contrato inativo ou não possui data de início");
          }
        } else {
          console.log("Contrato não encontrado");
        }
      } else {
        console.log("Usuário não possui contratoId");
      }
      
      // Configurar listener para pagamentos em tempo real
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'payments'),
          where('userEmail', '==', currentUser.email),
          orderBy('dateCreated', 'desc')
        ),
        (snapshot) => {
          if (!snapshot.empty) {
            const paymentsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              status: doc.data().status,
              payment_type_id: doc.data().paymentMethod,
              transaction_amount: doc.data().amount,
              date_created: doc.data().dateCreated?.toDate()?.toISOString(),
              description: doc.data().description
            }));
            
            setPayments(paymentsList);
          } else {
            setPayments([]);
          }
          
          setLoading(false);
        },
        (error) => {
          console.error("Erro ao observar pagamentos:", error);
          setError('Erro ao carregar pagamentos. Tente novamente.');
          setLoading(false);
        }
      );
      
      // Limpar o listener quando o componente for desmontado
      return () => unsubscribe();
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      setError('Não foi possível carregar seus pagamentos. Tente novamente mais tarde.');
      setLoading(false);
      return () => {}; // Retorna uma função vazia em caso de erro
    }
  };

  // função para testar o lembrete de pagamento
  const testPaymentReminder = async () => {
    try {
      if (!proximoPagamento || !userData) {
        Alert.alert("Erro", "Não há informações de próximo pagamento disponíveis");
        return;
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }
      
      const userEmail = currentUser.email;
      
      // Determinar o tipo de mensagem com base no status do pagamento
      let title, body, emailSubject, emailContent;
      
      if (proximoPagamento.status === 'overdue') {
        title = 'Pagamento em Atraso (Teste)';
        body = `Seu pagamento de R$ ${proximoPagamento.valor.toFixed(2)} está atrasado há ${proximoPagamento.diasAtraso} ${proximoPagamento.diasAtraso === 1 ? 'dia' : 'dias'}. Clique para regularizar.`;
        emailSubject = 'Pagamento em Atraso (Teste) - Papa Tango';
        emailContent = `
          <p>Olá ${userData?.nomeCompleto || 'Cliente'},</p>
          <p>Este é um email de teste para o lembrete de pagamento em atraso.</p>
          <p>Notamos que seu pagamento no valor de <strong>R$ ${proximoPagamento.valor.toFixed(2)}</strong> está atrasado há ${proximoPagamento.diasAtraso} ${proximoPagamento.diasAtraso === 1 ? 'dia' : 'dias'}.</p>
          <p>Para regularizar sua situação, você pode realizar o pagamento diretamente pelo aplicativo PapaMotos.</p>
        `;
      } else if (proximoPagamento.status === 'today') {
        title = 'Lembrete de Pagamento (Teste)';
        body = `Seu pagamento de R$ ${proximoPagamento.valor.toFixed(2)} vence hoje. Clique para pagar agora.`;
        emailSubject = 'Lembrete de Pagamento (Teste) - Papa Tango';
        emailContent = `
          <p>Olá ${userData?.nomeCompleto || 'Cliente'},</p>
          <p>Este é um email de teste para o lembrete de pagamento.</p>
          <p>Gostaríamos de lembrá-lo que seu pagamento no valor de <strong>R$ ${proximoPagamento.valor.toFixed(2)}</strong> vence hoje.</p>
          <p>Para sua comodidade, você pode realizar o pagamento diretamente pelo aplicativo PapaMotos.</p>
        `;
      } else {
        title = 'Lembrete de Pagamento (Teste)';
        body = `Seu pagamento de R$ ${proximoPagamento.valor.toFixed(2)} vence em ${proximoPagamento.diasRestantes} dias. Clique para pagar agora.`;
        emailSubject = 'Lembrete de Pagamento (Teste) - Papa Tango';
        emailContent = `
          <p>Olá ${userData?.nomeCompleto || 'Cliente'},</p>
          <p>Este é um email de teste para o lembrete de pagamento.</p>
          <p>Seu próximo pagamento no valor de <strong>R$ ${proximoPagamento.valor.toFixed(2)}</strong> vence em ${proximoPagamento.diasRestantes} dias.</p>
          <p>Para sua comodidade, você pode realizar o pagamento diretamente pelo aplicativo PapaMotos.</p>
        `;
      }
      
      const data = {
        screen: 'Financeiro'
      };
      
      // Criar um objeto de pagamento fictício para a função de notificação
      const paymentInfo = {
        id: `reminder_test_${Date.now()}`,
        transaction_amount: proximoPagamento.valor
      };
      
      // Enviar notificação push
      const pushSuccess = await enviarNotificacaoPeloFirestore(userEmail, paymentInfo, title, body, data);
      
      // Preparar e enviar email de teste
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px">
          </div>
          <h2 style="color: #CB2921; text-align: center;">${emailSubject}</h2>
          ${emailContent}
          <div style="text-align: center; margin: 30px 0;">
            <a href="papamotors://financeiro" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Abrir no Aplicativo
            </a>
          </div>
          <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
            Este é um email de teste. Por favor, não responda a este email.
          </p>
        </div>
      `;
      
      const emailSuccess = await enviarEmailPeloFirestore(userEmail, emailSubject, emailBody);
      
      if (pushSuccess && emailSuccess) {
        Alert.alert(
          "Teste de Lembrete",
          "Notificação push e email de lembrete de pagamento enviados com sucesso!"
        );
      } else if (pushSuccess) {
        Alert.alert(
          "Teste Parcial",
          "Notificação push enviada com sucesso, mas houve um problema ao enviar o email."
        );
      } else if (emailSuccess) {
        Alert.alert(
          "Teste Parcial",
          "Email enviado com sucesso, mas houve um problema ao enviar a notificação push."
        );
      } else {
        Alert.alert(
          "Erro",
          "Não foi possível enviar a notificação push nem o email de lembrete de pagamento."
        );
      }
    } catch (error) {
      console.error("Erro ao testar lembrete de pagamento:", error);
      Alert.alert("Erro", "Ocorreu um erro ao testar o lembrete: " + error.message);
    }
  };
  

  // Função para enviar notificação pelo Firestore
  const enviarNotificacaoPeloFirestore = async (userEmail, payment, title, body, data) => {
    try {
      // Gerar um ID único para a solicitação
      const requestId = `payment_${payment.id}_${Date.now()}`;
      
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
  const enviarEmailPeloFirestore = async (userEmail, subject, body, paymentInfo) => {
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

  // Função para verificar pagamentos pendentes
  const checkPendingPayments = async () => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        // Silenciosamente retorna sem tentar acessar o Firestore
        return;
      }
    
      // Verificar se o usuário está realmente autenticado antes de continuar
      const idToken = await currentUser.getIdToken(true);
      if (!idToken) {
        console.log("Token de autenticação inválido");
        return;
      }
      
      const userEmail = currentUser.email;
      console.log("Verificando pagamentos pendentes como:", userEmail);
      
      // Verificar apenas pagamentos PIX pendentes
      const pendingPixPayments = payments.filter(
        payment => payment.status === 'pending' && payment.payment_type_id === 'pix'
      );
      
      console.log(`Encontrados ${pendingPixPayments.length} pagamentos PIX pendentes`);
      
      // Se não houver pagamentos pendentes, retornar
      if (pendingPixPayments.length === 0) {
        return;
      }
      
      // Verificar se já enviamos alguma notificação recentemente (para evitar spam)
      const lastNotificationTime = await AsyncStorage.getItem('lastNotificationTime');
      const now = new Date();
      
      if (lastNotificationTime) {
        const timeSinceLastNotification = now - new Date(parseInt(lastNotificationTime));
        // Se a última notificação foi enviada há menos de 5 minutos, não enviar outra
        if (timeSinceLastNotification < 5 * 60 * 1000) {
          console.log("Notificação recente já enviada, aguardando intervalo mínimo");
          return;
        }
      }
      
      // Processar apenas um pagamento pendente por vez (o mais recente)
      const sortedPayments = [...pendingPixPayments].sort((a, b) => 
        new Date(b.date_created) - new Date(a.date_created)
      );
      
      // Pegar o pagamento mais recente
      const payment = sortedPayments[0];
      
      // Verificar se já enviamos notificação para este pagamento específico
      const paymentRef = doc(db, 'payments', payment.id);
      const paymentDoc = await getDoc(paymentRef);
      
      // Se o documento já tem notificationSent como true, não enviar novamente
      if (paymentDoc.exists() && paymentDoc.data().notificationSent === true) {
        console.log(`Notificação já enviada para o pagamento ${payment.id}, pulando`);
        return;
      }
      
      const paymentDate = new Date(payment.date_created);
      const timeDiff = now - paymentDate; // diferença em milissegundos
      const minutesPassed = Math.floor(timeDiff / (1000 * 60));
      
      // Se passaram mais de 20 minutos e a notificação ainda não foi enviada
      if (minutesPassed > 20 && !notificationSent[payment.id]) {
        console.log(`Enviando notificação para pagamento pendente: ${payment.id} (${minutesPassed} minutos passados)`);
        
        try {
          // Preparar dados para a notificação
          const title = 'Pagamento pendente';
          const body = `Você tem um pagamento PIX de R$ ${payment.transaction_amount.toFixed(2)} pendente. Clique para concluir.`;
          const data = {
            screen: 'PaymentSuccess',
            paymentId: payment.id
          };
          
          // Usar o método alternativo baseado em Firestore
          const success = await enviarNotificacaoPeloFirestore(userEmail, payment, title, body, data);
          
          if (!success) {
            throw new Error("Falha ao criar solicitação de notificação");
          }
          
          // Marcar como enviada localmente
          setNotificationSent(prev => ({
            ...prev,
            [payment.id]: true
          }));
          
          // Atualizar o documento do pagamento para indicar que uma notificação foi enviada
          await updateDoc(paymentRef, {
            notificationSent: true,
            notificationSentAt: serverTimestamp()
          });
          
          // Registrar o timestamp da última notificação enviada
          await AsyncStorage.setItem('lastNotificationTime', now.getTime().toString());
          
          console.log(`Notificação para pagamento ${payment.id} processada com sucesso`);
          
          // Enviar também um email de lembrete
          const emailSubject = 'Lembrete de Pagamento Pendente - Papa Tango';
          const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
              </div>
              <h2 style="color: #CB2921; text-align: center;">Pagamento Pendente</h2>
              <p>Olá ${userData?.nomeCompleto || 'Cliente'},</p>
              <p>Notamos que você iniciou um pagamento via PIX no valor de <strong>R$ ${payment.transaction_amount.toFixed(2)}</strong>, mas ainda não o concluiu.</p>
              <p>Para sua comodidade, você pode finalizar o pagamento diretamente pelo aplicativo ou utilizando o código PIX abaixo:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Copie o código PIX abaixo:</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px dashed #ccc; font-family: monospace; font-size: 12px;">
                  ${payment.paymentDetails?.point_of_interaction?.transaction_data?.qr_code || 'Código PIX não disponível'}
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="papamotors://payment/${payment.id}" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Abrir no Aplicativo
                </a>
              </div>
              <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                Este é um email automático. Por favor, não responda a este email.
              </p>
            </div>
          `;
          
          await enviarEmailPeloFirestore(userEmail, emailSubject, emailBody, {
            id: payment.id,
            amount: payment.transaction_amount,
            paymentMethod: payment.payment_type_id,
            qrCode: payment.paymentDetails?.point_of_interaction?.transaction_data?.qr_code
          });
          
        } catch (error) {
          console.error(`Erro ao enviar notificação para pagamento ${payment.id}:`, error.message);
          
          // Tentar registrar o erro no Firestore para análise posterior
          try {
            await setDoc(doc(db, 'notificationErrors', `${payment.id}_${Date.now()}`), {
              paymentId: payment.id,
              userEmail: userEmail,
              error: error.message,
              timestamp: serverTimestamp()
            });
          } catch (e) {
            console.error("Erro ao registrar falha de notificação:", e);
          }
        }
      }
    } catch (error) {
      // Verificar se é um erro de permissão e silenciá-lo
      if (error.code === 'permission-denied') {
        console.log("Permissão negada ao verificar pagamentos. Usuário pode ter deslogado.");
        return;
      }
      console.error('Erro ao verificar pagamentos pendentes:', error);
    }
  };

  // Função para verificar se é necessário enviar lembrete de pagamento
  const checkPaymentReminder = async () => {
    try {
      if (!proximoPagamento || !userData) return;
      
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const userEmail = currentUser.email;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia
      
      // Verificar se já enviamos uma notificação hoje
      const reminderRef = doc(db, 'paymentReminders', `${userEmail}_${hoje.toISOString().split('T')[0]}`);
      const reminderDoc = await getDoc(reminderRef);
      
      if (reminderDoc.exists()) {
        console.log("Já enviamos um lembrete hoje, pulando");
        return;
      }
      
      // Verificar se hoje é o dia do pagamento
      const diaProximoPagamento = proximoPagamento.data.getDate();
      const mesProximoPagamento = proximoPagamento.data.getMonth();
      const anoProximoPagamento = proximoPagamento.data.getFullYear();
      
      const diaHoje = hoje.getDate();
      const mesHoje = hoje.getMonth();
      const anoHoje = hoje.getFullYear();
      
      const ehDiaDePagamento = diaHoje === diaProximoPagamento &&
                              mesHoje === mesProximoPagamento &&
                              anoHoje === anoProximoPagamento;
      
      // Verificar se o pagamento está atrasado
      const diasAtraso = proximoPagamento.diasRestantes < 0 ? Math.abs(proximoPagamento.diasRestantes) : 0;
      const pagamentoAtrasado = diasAtraso > 0;
      
      // Só enviar notificação se for o dia do pagamento ou se estiver atrasado até 3 dias
      const deveEnviarNotificacao = ehDiaDePagamento || (pagamentoAtrasado && diasAtraso <= 3);
      
      // Verificar se é aproximadamente 10h da manhã (entre 9:30 e 10:30)
      const horaAtual = new Date().getHours();
      const minutoAtual = new Date().getMinutes();
      const ehHoraDeLembrete = (horaAtual === 9 && minutoAtual >= 30) ||
                              (horaAtual === 10 && minutoAtual <= 30);
      
      // Para ambiente de desenvolvimento, podemos usar uma flag para testes
      const isDevelopment = __DEV__;
      const ehHoraDeTesteLembrete = isDevelopment;
      
      if (deveEnviarNotificacao && (ehHoraDeLembrete || ehHoraDeTesteLembrete)) {
        console.log(`Enviando lembrete de pagamento. Dia do pagamento: ${ehDiaDePagamento}, Dias em atraso: ${diasAtraso}`);
        
        // Preparar mensagem apropriada
        let title, body;
        
        if (ehDiaDePagamento) {
          title = 'Lembrete de Pagamento';
          body = `Seu pagamento de R$ ${proximoPagamento.valor.toFixed(2)} vence hoje. Clique para pagar agora.`;
        } else {
          title = 'Pagamento em Atraso';
          body = `Seu pagamento de R$ ${proximoPagamento.valor.toFixed(2)} está atrasado há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}. Clique para regularizar.`;
        }
        
        const data = {
          screen: 'Financeiro'
        };
        
        // Criar um objeto de pagamento fictício para a função de notificação
        const paymentInfo = {
          id: `reminder_${Date.now()}`,
          transaction_amount: proximoPagamento.valor
        };
        
        // Enviar notificação
        await enviarNotificacaoPeloFirestore(userEmail, paymentInfo, title, body, data);
        
        // Enviar email de lembrete com mensagem apropriada
        const emailSubject = ehDiaDePagamento ? 'Lembrete de Pagamento - Papa Tango' : 'Pagamento em Atraso - Papa Tango';
        
        let emailContent;
        if (ehDiaDePagamento) {
          emailContent = `
            <p>Olá, ${userData.nomeCompleto || 'Cliente'},</p>
            <p>Gostaríamos de lembrá-lo que seu pagamento no valor de <strong>R$ ${proximoPagamento.valor.toFixed(2)}</strong> vence hoje.</p>
            <p>Para sua comodidade, você pode realizar o pagamento diretamente pelo aplicativo Papa Tango.</p>
          `;
        } else {
          emailContent = `
            <p>Olá, ${userData.nomeCompleto || 'Cliente'},</p>
            <p>Notamos que seu pagamento no valor de <strong>R$ ${proximoPagamento.valor.toFixed(2)}</strong> está atrasado há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}.</p>
            <p>Para regularizar sua situação, você pode realizar o pagamento diretamente pelo aplicativo Papa Tango.</p>
          `;
        }
        
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
            </div>
            <h2 style="color: #CB2921; text-align: center;">${emailSubject}</h2>
            ${emailContent}
            <div style="text-align: center; margin: 30px 0;">
              <a href="papamotors://financeiro" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Abrir no Aplicativo
              </a>
            </div>
            <p>Caso prefira, você também pode entrar em contato com nosso suporte para mais informações.</p>
            <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
              Este é um email automático. Por favor, não responda a este email.
            </p>
          </div>
        `;
        
        await enviarEmailPeloFirestore(userEmail, emailSubject, emailBody);
        
        // Registrar no Firestore que o lembrete foi enviado hoje
        await setDoc(reminderRef, {
          userEmail: userEmail,
          paymentDate: proximoPagamento.data,
          paymentAmount: proximoPagamento.valor,
          diasAtraso: diasAtraso,
          sentAt: serverTimestamp()
        });
        
        console.log("Lembrete de pagamento enviado com sucesso");
      }
    } catch (error) {
      console.error('Erro ao verificar lembrete de pagamento:', error);
    }
  };

  
  
  // Função para formatar status do pagamento
  const formatStatus = (status) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'in_process':
        return 'Em processamento';
      case 'rejected':
        return 'Rejeitado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status || 'N/A';
    }
  };
  
  // Função para formatar tipo de pagamento
  const formatPaymentType = (type) => {
    switch (type) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'debit_card':
        return 'Cartão de Débito';
      case 'pix':
        return 'PIX';
      case 'ticket':
      case 'boleto':
        return 'Boleto';
      default:
        return type || 'N/A';
    }
  };
  
  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Função para obter cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#28a745';
      case 'pending':
      case 'in_process':
        return '#ffc107';
      case 'rejected':
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };
  
  // Função para iniciar um novo pagamento
  const startNewPayment = () => {
    const paymentData = {
      amount: proximoPagamento ? proximoPagamento.valor.toFixed(2) : '250.00',
      description: proximoPagamento 
        ? `Pagamento ${proximoPagamento.tipoRecorrencia === 'mensal' ? 'Mensal' : 'Semanal'}`
        : 'Pagamento Papa Tango',
      userEmail: auth.currentUser?.email || 'cliente@exemplo.com',
      userName: userData?.nomeCompleto || 'Cliente'
    };
    
    navigation.navigate('Payment', paymentData);
  };
  
  // Função para ver detalhes de um pagamento 
  const viewPaymentDetails = (payment) => {
    navigation.navigate('PaymentSuccess', { paymentInfo: payment });
  };
  
  // Renderizar item da lista de pagamentos 
  const renderPaymentItem = ({ item }) => (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CardTitle>{item.description}</CardTitle>
        <StatusBadge style={{
          backgroundColor: getStatusColor(item.status),
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 12
        }}>
          <StatusText style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
            {formatStatus(item.status)}
          </StatusText>
        </StatusBadge>
      </View>
      
      <CardAmount>R$ {item.transaction_amount.toFixed(2)}</CardAmount>
      
      <CardContent>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
          <CardText>Método:</CardText>
          <CardText>{formatPaymentType(item.payment_type_id)}</CardText>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
          <CardText>Data:</CardText>
          <CardText>{formatDate(item.date_created)}</CardText>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
          <CardText>ID:</CardText>
          <CardText>{item.id}</CardText>
        </View>
      </CardContent>
      
      <TouchableOpacity
        onPress={() => viewPaymentDetails(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 10,
          padding: 8,
          backgroundColor: '#f5f5f5',
          borderRadius: 8
        }}
      >
        <Feather name="eye" size={16} color="#666" />
        <Text style={{ marginLeft: 5, color: '#666' }}>Ver detalhes</Text>
      </TouchableOpacity>
    </Card>
  );
  
  // Renderizar informações do próximo pagamento 
  const renderProximoPagamento = () => {
    if (!proximoPagamento) return null;
    
    // Determinar a cor e o texto com base no status
    let statusColor, statusText;
    
    switch (proximoPagamento.status) {
      case 'paid':
        statusColor = '#28a745'; // Verde
        statusText = 'Pagamento em dia';
        break;
      case 'today':
        statusColor = '#fd7e14'; // Laranja
        statusText = 'Vence hoje';
        break;
      case 'overdue':
        statusColor = '#dc3545'; // Vermelho
        const diasAtraso = proximoPagamento.diasAtraso;
        statusText = `Atrasado há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}`;
        break;
      default:
        statusColor = '#17a2b8'; // Azul
        statusText = `Faltam ${proximoPagamento.diasRestantes} dias para o vencimento`;
    }
    
    return (
      <PaymentInfoContainer style={{
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e9ecef'
      }}>
        <PaymentInfoTitle style={{
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 10,
          color: '#343a40'
        }}>Próximo Pagamento</PaymentInfoTitle>
        
        <PaymentInfoRow style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <PaymentInfoLabel style={{ color: '#6c757d' }}>Valor:</PaymentInfoLabel>
          <PaymentInfoValue style={{ fontWeight: 'bold' }}>
            R$ {proximoPagamento.valor.toFixed(2)}
          </PaymentInfoValue>
        </PaymentInfoRow>
        
        <PaymentInfoRow style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <PaymentInfoLabel style={{ color: '#6c757d' }}>Data:</PaymentInfoLabel>
          <PaymentInfoValue style={{ fontWeight: 'bold' }}>
            {proximoPagamento.data.toLocaleDateString('pt-BR')}
          </PaymentInfoValue>
        </PaymentInfoRow>
        
        <PaymentInfoRow style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <PaymentInfoLabel style={{ color: '#6c757d' }}>Recorrência:</PaymentInfoLabel>
          <PaymentInfoValue style={{ fontWeight: 'bold' }}>
            {proximoPagamento.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'}
          </PaymentInfoValue>
        </PaymentInfoRow>
        
        <CountdownContainer style={{
          backgroundColor: proximoPagamento.status === 'overdue' ? '#f8d7da' : 
                           proximoPagamento.status === 'today' ? '#fff3cd' : '#d1e7dd',
          padding: 10,
          borderRadius: 8,
          marginTop: 10,
          marginBottom: 15
        }}>
          <CountdownText style={{
            textAlign: 'center',
            color: statusColor,
            fontWeight: 'bold'
          }}>
            {statusText}
          </CountdownText>
        </CountdownContainer>
        
        <Button onPress={startNewPayment} style={{ marginTop: 5 }}>
          <ButtonText>Realizar Pagamento</ButtonText>
        </Button>
        {__DEV__ && (
          <Button
            onPress={testPaymentReminder}
            style={{ marginTop: 10, backgroundColor: '#9C27B0' }}
          >
            <ButtonText>Testar Lembrete de Pagamento</ButtonText>
          </Button>
        )}
      </PaymentInfoContainer>
    );
  };
  
   {/* Renderizar conteúdo quando não há pagamentos */}
  const renderEmptyContent = () => {
    if (!contratoAtivo) {
      return (
        <EmptyContainer>
          <Feather name="alert-circle" size={50} color="#FF3B30" />
          <EmptyText>Você não possui um contrato ativo no momento.</EmptyText>
          <EmptyText style={{ marginTop: 10, fontSize: 14, color: '#666' }}>
            Entre em contato com a Papa Tango para mais informações.
          </EmptyText>
        </EmptyContainer>
      );
    }
    
    return (
      <EmptyContainer>
        <Feather name="credit-card" size={50} color="#CCC" />
        <EmptyText>Você ainda não possui pagamentos registrados.</EmptyText>
        {proximoPagamento && (
          <Button onPress={startNewPayment} style={{ marginTop: 20 }}>
            <ButtonText>Fazer um Pagamento</ButtonText>
          </Button>
        )}
      </EmptyContainer>
    );
  };
  
  {/* Renderizar conteúdo de erro */}
  const renderErrorContent = () => (
    <EmptyContainer>
      <Feather name="alert-circle" size={50} color="#FF3B30" />
      <EmptyText style={{ color: '#FF3B30' }}>{error}</EmptyText>
      <Button onPress={loadPayments} style={{ marginTop: 20 }}>
        <ButtonText>Tentar Novamente</ButtonText>
      </Button>
    </EmptyContainer>
  );
  
  return (
    <Container>
      <Header>
        <Title>Financeiro</Title>
      </Header>
      
      {loading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color="#CB2921" />
          <Text style={{ marginTop: 10 }}>Carregando informações financeiras...</Text>
        </LoadingContainer>
      ) : (
        <>
          {error ? (
            renderErrorContent()
          ) : (
            <>
              {contratoAtivo ? (
                <>
                  {/* Mostrar próximo pagamento apenas se o contrato estiver ativo */}
                  {renderProximoPagamento()}
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                    <Title style={{ fontSize: 18 }}>Histórico de Pagamentos</Title>
                    <TouchableOpacity onPress={loadPayments}>
                      <Feather name="refresh-cw" size={20} color="#CB2921" />
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPaymentItem}
                    ListEmptyComponent={renderEmptyContent}
                    contentContainerStyle={{
                      flexGrow: 1,
                      paddingBottom: 20
                    }}
                  />
                </>
              ) : (
                <EmptyContainer>
                  <Feather name="alert-circle" size={50} color="#FF3B30" />
                  <EmptyText>Você não possui um contrato ativo no momento.</EmptyText>
                  <EmptyText style={{ marginTop: 10, fontSize: 14, color: '#666', textAlign: 'center' }}>
                    Entre em contato com a PapaMotos para mais informações sobre como alugar uma moto.
                  </EmptyText>
                </EmptyContainer>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default Financeiro;

