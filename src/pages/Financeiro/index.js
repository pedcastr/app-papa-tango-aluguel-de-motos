import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../../services/firebaseConfig';
import { registerForPushNotifications } from '../../services/notificationService';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, orderBy, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
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
  CountdownText,
  Divider
} from './styles';

const Financeiro = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [loadingButtonPagamento, setLoadingButtonPagamento] = useState(false);
  const [loadingButtonDetalhes, setLoadingButtonDetalhes] = useState(false);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [proximoPagamento, setProximoPagamento] = useState(null);
  const [contratoAtivo, setContratoAtivo] = useState(false);
  const [contratoCarregado, setContratoCarregado] = useState(false);

  // useEffect principal que gerencia autenticação e carregamento inicial
  useEffect(() => {
    let unsubscribe = () => { };

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

  // useEffect de listener para pagamentos em tempo real
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
          // Verificar se o erro é de permissão e se o usuário ainda está logado
          if (error.code === 'permission-denied' && !auth.currentUser) {
            setLoading(false);
            return;
          }

          console.error('Erro ao carregar pagamentos:', error);
          setError('Não foi possível carregar seus pagamentos. Tente novamente mais tarde.');
          setLoading(false);
        });
      } catch (err) {
        // Verificar se o usuário ainda está logado antes de definir o erro
        if (auth.currentUser) {
          console.error('Erro ao carregar pagamentos:', err);
          setError('Não foi possível carregar seus pagamentos. Tente novamente mais tarde.');
        } else {
          console.log('Usuário deslogado, ignorando erro');
        }
        setLoading(false);
      }
    };

    // Configurar o listener apenas se o usuário estiver autenticado
    if (auth.currentUser) {
      loadPayments();
    } else {
      setLoading(false);
    }

    const setupPaymentsListener = () => {
      return loadPayments();
    };

    // Adicionar um listener para mudanças de autenticação
    const authListener = auth.onAuthStateChanged((user) => {
      if (user) {
        setupPaymentsListener();
      } else {
        // Limpar dados quando o usuário desloga
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
        setPayments([]);
        setLoading(false);
      }
    });

    // Limpar o listener quando o componente for desmontado
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      authListener();
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

  // Função para cancelar um pagamento pendente
  const cancelarPagamentoPendente = async (paymentId) => {
    try {
      const paymentRef = doc(db, 'payments', paymentId);
      await setDoc(paymentRef, {
        status: 'cancelled',
        dateCancelled: serverTimestamp(),
        cancellationReason: 'Cancelado pelo usuário'
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      return false;
    }
  };

  // Função para carregar os pagamentos do usuário
  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      setContratoCarregado(false); // Resetar o estado de contrato carregado

      // Buscar pagamentos do usuário atual
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setLoading(false);
        return () => { }; // Retorna uma função vazia se não houver usuário
      }

      // Carregar dados do usuário
      const user = await loadUserData();

      let isContratoAtivo = false;

      // Verificar se o usuário tem um contratoId
      if (user && user.contratoId) {

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
                  if (diasRestantes < 0) {
                    status = 'overdue'; // Atrasado
                  } else if (diasRestantes === 0) {
                    status = 'today'; // Vence hoje
                  } else if (diasRestantes > 0) {
                    status = 'pending'; // Em Aberto
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

      // Marcar que o contrato foi verificado, independentemente do resultado
      setContratoCarregado(true);

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
          // Verificar se o erro é de permissão e se o usuário ainda está logado
          if (error.code === 'permission-denied' && !auth.currentUser) {
            setLoading(false);
            return;
          }

          console.error("Erro ao observar pagamentos:", error);
          setError('Erro ao carregar pagamentos. Tente novamente.');
          setLoading(false);
        }
      );

      // Limpar o listener quando o componente for desmontado
      return () => unsubscribe();
    } catch (err) {
      // Verificar se o usuário ainda está logado antes de definir o erro
      if (auth.currentUser) {
        console.error('Erro ao carregar pagamentos:', err);
        setError('Não foi possível carregar seus pagamentos. Tente novamente mais tarde.');
      } else {
        console.log('Usuário deslogado, ignorando erro');
      }
      setContratoCarregado(true); // Garantir que o estado seja atualizado mesmo em caso de erro
      setLoading(false);
      return () => { }; // Retorna uma função vazia em caso de erro
    }
  };

  // Função para mostrar alerta em qualquer plataforma
  const showConfirmation = (title, message, onConfirm, onCancel = () => { }) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      } else {
        onCancel();
      }
    } else {
      Alert.alert(title, message, [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Ok',
          onPress: onConfirm
        }
      ]);
    }
  };

  // Função para mostrar mensagem de sucesso/erro
  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
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

  // Função para direcionar usuários para a tela de detalhes do pagamento ou para a tela de pagamento dependendo do status
  const startNewPayment = async () => {
    try {
      setLoadingButtonPagamento(true);
      // Verificar se existem pagamentos pendentes
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Verificar se o pagamento está atrasado e calcular multa se necessário
      let multa = null;
      let motoInfo = null;
      let periodoLocacao = null;
      let tipoRecorrencia = null;
      let valorTotal = proximoPagamento ? proximoPagamento.valor : 250.00;

      // Se o pagamento estiver atrasado, calcular a multa (apenas para PIX)
      if (proximoPagamento && proximoPagamento.status === 'overdue') {
        const diasAtraso = proximoPagamento.diasAtraso || 0;

        // Calcular multa (2% + 0.5% ao dia)
        const percentualMulta = 2; // 2% de multa fixa

        const valorOriginal = proximoPagamento.valor;
        const valorMultaFixa = (valorOriginal * percentualMulta) / 100;
        const valorMoraDiaria = 10 * diasAtraso;
        const valorMultaTotal = valorMultaFixa + valorMoraDiaria;

        // Arredondar para 2 casas decimais
        const valorMultaArredondado = Math.round(valorMultaTotal * 100) / 100;

        // Valor total com multa
        valorTotal = valorOriginal + valorMultaArredondado;

        // Criar objeto de multa
        multa = {
          diasAtraso: diasAtraso,
          percentualMulta: percentualMulta,
          valorMultaFixa: valorMultaFixa,
          valorMoraDiaria: valorMoraDiaria,
          valorMulta: valorMultaArredondado,
          valorOriginal: valorOriginal,
          valorTotal: valorTotal
        };
      }

      // Buscar informações da moto
      if (userData && userData.motoAlugadaId) {
        try {
          const motoDoc = await getDoc(doc(db, 'motos', userData.motoAlugadaId));
          if (motoDoc.exists()) {
            const motoData = motoDoc.data();
            motoInfo = {
              modelo: motoData.modelo || motoData.modeloMoto || 'N/A',
              placa: motoData.placa || motoData.placaMoto || 'N/A',
              marca: motoData.marca || 'N/A',
              ano: motoData.ano || ''
            };
          }
        } catch (error) {
          console.error('Erro ao buscar dados da moto:', error);
        }
      }

      // Obter período de locação e tipo de recorrência
      if (proximoPagamento) {
        // Formatar a data para DD/MM/YYYY
        const data = proximoPagamento.data;
        periodoLocacao = data.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        tipoRecorrencia = proximoPagamento.tipoRecorrencia || 'mensal';
      }

      // Buscar pagamentos pendentes no Firestore
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userEmail', '==', currentUser.email),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(paymentsQuery);

      // Objeto para armazenar pagamentos pendentes por tipo
      const pendingPayments = {
        pix: null,
        boleto: null
      };

      // Processar os resultados
      querySnapshot.forEach((doc) => {
        const payment = doc.data();

        // Verificar o método de pagamento
        if (payment.paymentMethod === 'pix' && !pendingPayments.pix) {
          pendingPayments.pix = {
            id: doc.id,
            ...payment,
            date_created: payment.dateCreated?.toDate?.().toISOString() || new Date().toISOString(),
            transaction_amount: payment.amount || 0,
            status: payment.status || 'pending',
            payment_type_id: payment.paymentMethod || 'pix'
          };
        } else if ((payment.paymentMethod === 'boleto' || payment.paymentMethod === 'ticket') && !pendingPayments.boleto) {
          pendingPayments.boleto = {
            id: doc.id,
            ...payment,
            date_created: payment.dateCreated?.toDate?.().toISOString() || new Date().toISOString(),
            transaction_amount: payment.amount || 0,
            status: payment.status || 'pending',
            payment_type_id: payment.paymentMethod || 'boleto'
          };
        }
      });

      // Verificar se boletos pendentes estão vencidos
      if (pendingPayments.boleto) {
        const vencimento = pendingPayments.boleto.date_of_expiration ||
          pendingPayments.boleto.paymentDetails?.date_of_expiration;

        if (vencimento) {
          const dataVencimento = new Date(vencimento);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia

          // Se a data de vencimento já passou, marcar para cancelar
          if (dataVencimento < hoje) {

            // Cancelar o boleto vencido
            try {
              await setDoc(doc(db, 'payments', pendingPayments.boleto.id), {
                status: 'cancelled',
                dateCancelled: serverTimestamp(),
                cancellationReason: 'Boleto vencido'
              }, { merge: true });

              // Remover do objeto de pagamentos pendentes
              pendingPayments.boleto = null;
            } catch (error) {
              console.error('Erro ao cancelar boleto vencido:', error);
            }
          }
        }
      }

      // Verificar se pagamentos PIX pendentes precisam ser atualizados devido à multa
      if (pendingPayments.pix && multa) {
        const multaExistente = pendingPayments.pix.multa || {};
        const pagamentoDesatualizado = Math.abs((multaExistente.valorMulta || 0) - multa.valorMulta) > 0.01;

        if (pagamentoDesatualizado) {

          // Cancelar o PIX desatualizado
          try {
            await setDoc(doc(db, 'payments', pendingPayments.pix.id), {
              status: 'cancelled',
              dateCancelled: serverTimestamp(),
              cancellationReason: 'Valor atualizado devido a atraso'
            }, { merge: true });

            // Remover do objeto de pagamentos pendentes
            pendingPayments.pix = null;
          } catch (error) {
            console.error('Erro ao cancelar PIX desatualizado:', error);
          }
        }
      }

      // Criar descrição detalhada
      let descricaoDetalhada = `Pagamento referente a ${tipoRecorrencia === 'mensal' ? 'mês' : 'semana'} [${periodoLocacao}] de locação.`;
      if (motoInfo) {
        descricaoDetalhada += ` Moto alugada: ${motoInfo.modelo} Placa ${motoInfo.placa}.`;
      }
      descricaoDetalhada += ` Caso precise, entre em contato através do WhatsApp 
    (85991372994 / 85992684035). Após pagar, enviar o comprovante para algum dos números acima. O pagamento até o vencimento garante 
    a permanência da locação da moto.`;

      // Se tiver apenas um tipo de pagamento pendente e for o único método disponível, ir direto para a tela de sucesso
      const hasPendingPix = pendingPayments.pix !== null;
      const hasPendingBoleto = pendingPayments.boleto !== null;

      if (hasPendingPix && hasPendingBoleto) {
        // Se tiver os dois tipos pendentes, ir para a tela de pagamento para escolher
        const paymentData = {
          amount: valorTotal.toFixed(2),
          description: proximoPagamento
            ? `Pagamento ${proximoPagamento.tipoRecorrencia === 'mensal' ? 'Mensal' : 'Semanal'}`
            : 'Pagamento Papa Tango',
          userEmail: auth.currentUser?.email || 'cliente@exemplo.com',
          userName: userData?.nomeCompleto || 'Cliente',
          pendingPayments: pendingPayments,
          multa: multa,
          motoInfo: motoInfo,
          periodoLocacao: periodoLocacao,
          tipoRecorrencia: tipoRecorrencia,
          contratoId: userData?.contratoId,
          aluguelId: userData?.aluguelAtivoId,
          descricaoDetalhada: descricaoDetalhada
        };

        navigation.navigate('Pagamento', paymentData);
      } else if (hasPendingPix) {
        // Se tiver apenas PIX pendente, ir direto para a tela de sucesso com esse pagamento
        navigation.navigate('Detalhes do Pagamento', {
          paymentInfo: pendingPayments.pix
        });
      } else if (hasPendingBoleto) {
        // Se tiver apenas boleto pendente, ir direto para a tela de sucesso com esse pagamento
        navigation.navigate('Detalhes do Pagamento', {
          paymentInfo: pendingPayments.boleto
        });
      } else {
        // Se não tiver nenhum pagamento pendente, ir para a tela de pagamento normal
        const paymentData = {
          amount: valorTotal.toFixed(2),
          description: proximoPagamento
            ? `Pagamento ${proximoPagamento.tipoRecorrencia === 'mensal' ? 'Mensal' : 'Semanal'}`
            : 'Pagamento Papa Tango',
          userEmail: auth.currentUser?.email || 'cliente@exemplo.com',
          userName: userData?.nomeCompleto || 'Cliente',
          multa: multa,
          motoInfo: motoInfo,
          periodoLocacao: periodoLocacao,
          tipoRecorrencia: tipoRecorrencia,
          contratoId: userData?.contratoId,
          aluguelId: userData?.aluguelAtivoId,
          descricaoDetalhada: descricaoDetalhada
        };

        navigation.navigate('Pagamento', paymentData);
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos pendentes:', error);

      // Em caso de erro, seguir com o fluxo normal
      const paymentData = {
        amount: proximoPagamento ? proximoPagamento.valor.toFixed(2) : '250.00',
        description: proximoPagamento
          ? `Pagamento ${proximoPagamento.tipoRecorrencia === 'mensal' ? 'Mensal' : 'Semanal'}`
          : 'Pagamento Papa Tango',
        userEmail: auth.currentUser?.email || 'cliente@exemplo.com',
        userName: userData?.nomeCompleto || 'Cliente'
      };

      navigation.navigate('Pagamento', paymentData);
    } finally {
      setLoadingButtonPagamento(false);
    }
  };

  // Função para ver detalhes de um pagamento
  const viewPaymentDetails = async (payment) => {
    try {
      setLoadingButtonDetalhes(true);
      // Verificar se é um boleto
      const isBoleto = payment.payment_type_id === 'boleto' || payment.payment_type_id === 'ticket';

      // Se for boleto, verificar se passou da data de vencimento
      if (isBoleto && payment.status === 'pending') {
        // Verificar se o boleto tem data de vencimento
        const vencimento = payment.date_of_expiration ||
          payment.originalData?.date_of_expiration ||
          payment.paymentDetails?.date_of_expiration;

        if (vencimento) {
          // Converter para data
          const dataVencimento = new Date(vencimento);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia

          // Se a data de vencimento já passou, mostrar alerta
          if (dataVencimento < hoje) {
            showConfirmation(
              'Boleto Vencido',
              'Este boleto está vencido. Recomendamos gerar um novo boleto para evitar problemas com o pagamento.',
              () => {
                // Cancelar o boleto vencido
                cancelarPagamentoPendente(payment.id).then(success => {
                  if (success) {
                    // Redirecionar para tela de pagamento para gerar novo boleto
                    startNewPayment();
                  } else {
                    // Se falhar, mostrar os detalhes do pagamento atual
                    navigation.navigate('Detalhes do Pagamento', { paymentInfo: payment });
                    setLoadingButtonDetalhes(false);
                  }
                });
              },
              // Callback de cancelamento
              () => {
                setLoadingButtonDetalhes(false);
              }
            );
            return;
          }
        }

        // Se não passou da data de vencimento ou não tem data, mostrar normalmente
        navigation.navigate('Detalhes do Pagamento', { paymentInfo: payment });
        setLoadingButtonDetalhes(false);
        return;
      }

      // Para PIX, manter a lógica atual de verificar se está em atraso
      if (payment.status === 'pending' && proximoPagamento && proximoPagamento.status === 'overdue' &&
        (payment.payment_type_id === 'pix' || payment.payment_type_id === 'bank_transfer')) {
        // Verificar se o pagamento tem multa ou se a multa está desatualizada
        let multa = null;
        let motoInfo = null;
        let periodoLocacao = null;
        let tipoRecorrencia = null;
        let valorTotal = proximoPagamento ? proximoPagamento.valor : 250.00;

        // Calcular a multa atual
        const diasAtraso = proximoPagamento.diasAtraso || 0;
        // Calcular multa (2% + R$10 ao dia)
        const percentualMulta = 2; // 2% de multa fixa
        const valorOriginal = proximoPagamento.valor;
        const valorMultaFixa = (valorOriginal * percentualMulta) / 100;
        const valorMoraDiaria = 10 * diasAtraso; // R$10 por dia de atraso
        const valorMultaTotal = valorMultaFixa + valorMoraDiaria;
        // Arredondar para 2 casas decimais
        const valorMultaArredondado = Math.round(valorMultaTotal * 100) / 100;
        // Valor total com multa
        valorTotal = valorOriginal + valorMultaArredondado;

        // Criar objeto de multa
        multa = {
          diasAtraso: diasAtraso,
          percentualMulta: percentualMulta,
          valorMulta: valorMultaArredondado,
          valorOriginal: valorOriginal
        };

        // Buscar informações da moto
        if (userData && userData.motoAlugadaId) {
          try {
            const motoDoc = await getDoc(doc(db, 'motos', userData.motoAlugadaId));
            if (motoDoc.exists()) {
              const motoData = motoDoc.data();
              motoInfo = {
                modelo: motoData.modelo || motoData.modeloMoto || 'N/A',
                placa: motoData.placa || motoData.placaMoto || 'N/A',
                marca: motoData.marca || 'N/A',
                ano: motoData.ano || ''
              };
            }
          } catch (error) {
            console.error('Erro ao buscar dados da moto:', error);
          }
        }

        // Obter período de locação e tipo de recorrência
        if (proximoPagamento) {
          // Formatar a data para DD/MM/YYYY
          const data = proximoPagamento.data;
          periodoLocacao = data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          tipoRecorrencia = proximoPagamento.tipoRecorrencia || 'mensal';
        }

        // Verificar se a multa no pagamento está desatualizada
        const multaExistente = payment.multa || {};
        const pagamentoDesatualizado = Math.abs((multaExistente.valorMulta || 0) - multa.valorMulta) > 0.01;

        if (pagamentoDesatualizado) {
          showConfirmation(
            'Pagamento Desatualizado',
            'Este pagamento está desatualizado devido a alterações na multa por atraso. Precisamos gerar um novo pagamento com os valores corretos.',
            async () => {
              try {
                // Cancelar pagamento pendente
                const batch = writeBatch(db);
                const paymentRef = doc(db, 'payments', payment.id);
                batch.update(paymentRef, {
                  status: 'cancelled',
                  dateCancelled: serverTimestamp(),
                  cancellationReason: 'Valor atualizado devido a atraso'
                });

                // Executar o batch
                await batch.commit();

                // Criar descrição detalhada
                let descricaoDetalhada = `Pagamento referente a ${tipoRecorrencia === 'mensal' ? 'mês' : 'semana'} [${periodoLocacao}] de locação.`;
                if (motoInfo) {
                  descricaoDetalhada += ` Moto alugada: ${motoInfo.modelo} Placa ${motoInfo.placa}.`;
                }
                descricaoDetalhada += ` Caso precise, entre em contato através do WhatsApp 
                (85991372994 / 85992684035). O pagamento até o vencimento garante 
                a permanência da locação da moto.`;

                // Ir para a tela de pagamento com os novos valores
                const paymentData = {
                  amount: valorTotal.toFixed(2),
                  description: proximoPagamento
                    ? `Pagamento ${proximoPagamento.tipoRecorrencia === 'mensal' ? 'Mensal' : 'Semanal'}`
                    : 'Pagamento Papa Tango',
                  userEmail: auth.currentUser?.email || 'cliente@exemplo.com',
                  userName: userData?.nomeCompleto || 'Cliente',
                  multa: multa,
                  motoInfo: motoInfo,
                  periodoLocacao: periodoLocacao,
                  tipoRecorrencia: tipoRecorrencia,
                  contratoId: userData?.contratoId,
                  aluguelId: userData?.aluguelAtivoId,
                  descricaoDetalhada: descricaoDetalhada,
                  // Adicionar o método de pagamento original para manter a consistência
                  paymentMethod: payment.payment_type_id
                };

                navigation.navigate('Pagamento', paymentData);
                setLoadingButtonDetalhes(false);
              } catch (error) {
                console.error('Erro ao processar cancelamento e criação de pagamento:', error);
                showMessage(
                  'Erro',
                  'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.'
                );
                // Em caso de erro, mostrar os detalhes do pagamento atual
                navigation.navigate('Detalhes do Pagamento', { paymentInfo: payment });
                setLoadingButtonDetalhes(false);
              }
            },
            // Callback de cancelamento
            () => {
              setLoadingButtonDetalhes(false);
            }
          );
        } else {
          // Se não estiver desatualizado, apenas mostrar os detalhes
          navigation.navigate('Detalhes do Pagamento', { paymentInfo: payment });
          setLoadingButtonDetalhes(false);
        }
      } else {
        // Se não estiver em atraso ou não for pendente, apenas mostrar os detalhes
        navigation.navigate('Detalhes do Pagamento', { paymentInfo: payment });
        setLoadingButtonDetalhes(false);
      }
    } catch (error) {
      console.error('Erro ao verificar detalhes do pagamento:', error);
      // Em caso de erro, apenas mostrar os detalhes do pagamento
      navigation.navigate('Detalhes do Pagamento', { paymentInfo: payment });
      setLoadingButtonDetalhes(false);
    }
  };

  // Função para abrir WhatsApp
  const handleWhatsapp = useCallback(() => {
    if (loadingSupport) return;

    setLoadingSupport(true);
    const telefone = '5585992684035';
    const mensagem = 'Olá! Estou logado no app da Papa Tango e quero alugar uma moto novamente! Já fui cliente de vocês :)';
    const urlWhatsapp = `whatsapp://send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;

    Linking.canOpenURL(urlWhatsapp)
      .then(suportado => {
        if (suportado) {
          return Linking.openURL(urlWhatsapp);
        } else {
          showMessage('WhatsApp não está instalado\nSe o App está instalado e o problema persistir, entre em contato por WhatsApp com o suporte no número (85) 99268-4035 ou envie um e-mail para papatangoalugueldemotos@gmail.com');
        }
      })
      .catch(erro => {
        console.error('Erro ao abrir WhatsApp:', erro);
        showMessage('Não foi possível abrir o WhatsApp\nSe o problema persistir, entre em contato por WhatsApp com o suporte no número (85) 99268-4035 ou envie um e-mail para papatangoalugueldemotos@gmail.com');
      })
      .finally(() => {
        setLoadingSupport(false);
      });
  }, [loadingSupport]);

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
        disabled={loadingButtonDetalhes}
      >
        {loadingButtonDetalhes ? (
          <ActivityIndicator color="#667" style={{ marginRight: 5 }} />
        ) : (
          <>
            <Feather name="eye" size={16} color="#667" />
            <Text style={{ marginLeft: 5, color: '#666' }}>Ver detalhes</Text>
          </>
        )}
      </TouchableOpacity>
    </Card>
  );

  // Renderizar informações do próximo pagamento 
  const renderProximoPagamento = () => {
    if (!proximoPagamento) return null;

    // Determinar a cor e o texto com base no status
    let statusColor, statusText;

    switch (proximoPagamento.status) {
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

        <Button onPress={startNewPayment} style={{ marginTop: 5 }} disabled={loadingButtonPagamento}>
          {loadingButtonPagamento ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ButtonText>Realizar Pagamento</ButtonText>
          )}
        </Button>
      </PaymentInfoContainer>
    );
  };

  {/* Renderizar conteúdo quando não há pagamentos */ }
  const renderEmptyContent = () => {
    if (!contratoAtivo && !contratoCarregado) {
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

    // Caso de contrato inativo mas com histórico de pagamentos
    if (!contratoAtivo && payments.length === 0) {
      return (
        <EmptyContainer>
          <Feather name="credit-card" size={50} color="#CCC" />
          <EmptyText>Você não possui pagamentos registrados.</EmptyText>
        </EmptyContainer>
      );
    }

    // Caso padrão para usuário sem pagamentos
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

  // Componente para exibir a mensagem de contrato inativo
  const renderContratoInativoMessage = () => {
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
        }}>Contrato Inativo</PaymentInfoTitle>

        <EmptyText style={{
          textAlign: 'center',
          marginVertical: 15,
          color: '#6c757d',
          lineHeight: 22
        }}>
          Você não possui mais um contrato ativo no momento, mas pode visualizar seu histórico de pagamentos abaixo.
        </EmptyText>

        <Button onPress={handleWhatsapp} style={{ marginTop: 5 }}>
          {loadingSupport ? (
            <ButtonText>Abrindo WhatsApp...</ButtonText>
          ): (
            <ButtonText>Alugar uma Moto Novamente</ButtonText>
          )}
        </Button>
      </PaymentInfoContainer>
    );
  };

  {/* Renderizar conteúdo de erro */ }
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

      {loading || !contratoCarregado ? (
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
              {/* Verificar se o usuário tem contrato ativo ou se tem histórico de pagamentos */}
              {contratoAtivo ? (
                <>
                  {/* Mostrar próximo pagamento apenas se o contrato estiver ativo */}
                  {renderProximoPagamento()}

                  <Divider />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <Title style={{ fontSize: 18 }}>Histórico de Pagamentos</Title>
                    <TouchableOpacity onPress={() => {
                      setLoading(true);
                      loadPayments();
                    }}>
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
              ) : payments.length > 0 ? (
                // Contrato inativo mas com histórico de pagamentos
                <>
                  {/* Mostrar mensagem de contrato inativo */}
                  {renderContratoInativoMessage()}

                  <Divider />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <Title style={{ fontSize: 18 }}>Histórico de Pagamentos</Title>
                    <TouchableOpacity onPress={() => {
                      setLoading(true);
                      loadPayments();
                    }}>
                      <Feather name="refresh-cw" size={20} color="#CB2921" />
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPaymentItem}
                    contentContainerStyle={{
                      flexGrow: 1,
                      paddingBottom: 20
                    }}
                  />
                </>
              ) : (
                // Sem contrato ativo e sem histórico de pagamentos
                <EmptyContainer>
                  <Feather name="alert-circle" size={50} color="#FF3B30" />
                  <EmptyText>Você não possui um contrato ativo no momento.</EmptyText>
                  <EmptyText style={{ marginTop: 10, fontSize: 14, color: '#666', textAlign: 'center' }}>
                    Entre em contato com a Papa Tango para mais informações sobre como alugar uma moto.
                  </EmptyText>
                  <Button onPress={() => navigation.navigate('Home')} style={{ marginTop: 20 }}>
                    <ButtonText>Alugar uma Moto</ButtonText>
                  </Button>
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



