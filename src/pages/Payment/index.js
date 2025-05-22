import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc, collection, serverTimestamp, setDoc, query, where, getDocs } from 'firebase/firestore';

import {
  Container,
  PaymentContainer,
  Title,
  Subtitle,
  AmountText,
  Button,
  ButtonText,
  Divider,
  ErrorContainer,
  ErrorText,
  PaymentOption,
  PaymentOptionText,
  PaymentOptionIcon,
  PaymentMethodContainer,
  PaymentMethodTitle,
  PaymentMethodDescription
} from './styles';

const Payment = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Obter parâmetros da rota, com valores padrão caso não sejam fornecidos
  const {
    amount = '250.00',
    description = 'Pagamento de serviço',
    userEmail,
    userName,
    contratoId,
    aluguelId,
    proximoPagamento
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [userData, setUserData] = useState(null);
  const [motoData, setMotoData] = useState(null);

  // Estado para o modal de confirmação
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalOption, setConfirmModalOption] = useState(null);

  // Estado para armazenar os pagamentos pendentes
  const [pendingPayments, setPendingPayments] = useState({
    pix: null,
    boleto: null
  });

  // Função para mostrar alerta em qualquer plataforma
  const showConfirmation = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ok', onPress: onConfirm }
      ]);
    }
  };

  const getValoresCalculados = () => {
    // Verificar se já temos informações de multa nos parâmetros da rota
    if (route.params?.multa) {
      // Usar os valores exatos que foram passados da tela anterior
      return {
        diasAtraso: route.params.multa.diasAtraso || 0,
        valorMulta: route.params.multa.valorMulta || 0,
        valorOriginal: route.params.multa.valorOriginal || parseFloat(amount),
        valorTotal: route.params.multa.valorTotal ||
          (route.params.multa.valorOriginal + route.params.multa.valorMulta),
        boletoDesabilitado: (route.params.multa.diasAtraso || 0) > 3
      };
    }

    // Caso contrário, calcular com base no proximoPagamento
    const diasAtraso = proximoPagamento?.status === 'overdue' ? proximoPagamento.diasAtraso || 0 : 0;
    // Usar o valor do proximoPagamento como valor original se disponível
    const valorOriginal = proximoPagamento?.valor || parseFloat(amount);
    const percentualMulta = 2; // 2% de multa fixa
    const valorMultaFixa = (valorOriginal * percentualMulta) / 100;
    const valorMoraDiaria = 10 * diasAtraso; // R$10 por dia
    const valorMulta = diasAtraso > 0 ? valorMultaFixa + valorMoraDiaria : 0;
    const valorTotal = valorOriginal + valorMulta;

    return {
      diasAtraso,
      valorMulta,
      valorOriginal,
      valorTotal,
      boletoDesabilitado: diasAtraso > 3
    };
  };


  // Use a função quando precisar dos valores
  const { diasAtraso, valorMulta, valorOriginal, valorTotal, boletoDesabilitado } = getValoresCalculados();

  // Opções de pagamento - Pix e Boleto
  const paymentOptions = [
    {
      id: 'pix',
      name: 'PIX',
      type: 'bank_transfer',
      description: 'Pagamento instantâneo',
      icon: 'pix',
      enabled: true
    },
    {
      id: 'boleto',
      name: 'Boleto',
      type: 'ticket',
      description: boletoDesabilitado
        ? 'Indisponível para pagamentos com mais de 3 dias de atraso'
        : 'Prazo de compensação de 1 a 3 dias úteis',
      icon: 'file-text',
      enabled: !boletoDesabilitado
    }
  ];

  // Função para buscar dados da moto
  const fetchMotoData = async (motoId) => {
    try {
      if (!motoId) return null;

      const motoDoc = await getDoc(doc(db, 'motos', motoId));

      if (motoDoc.exists()) {
        const data = motoDoc.data();
        return {
          modelo: data.modelo || data.modeloMoto || 'N/A',
          placa: data.placa || data.placaMoto || 'N/A'
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar dados da moto:', error);
      return null;
    }
  };

  // Carregar dados do usuário ao montar o componente
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoadingUserData(true);

        // Verificar se temos o email do usuário dos parâmetros
        let email = userEmail;

        // Se não tiver, pegar do usuário autenticado
        if (!email) {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error('Usuário não autenticado');
          }
          email = currentUser.email;
        }

        // Buscar dados do usuário no Firestore
        const userDoc = await getDoc(doc(db, 'users', email));

        if (!userDoc.exists()) {
          throw new Error('Dados do usuário não encontrados');
        }

        const user = userDoc.data();
        setUserData(user);

        // Buscar dados da moto se o usuário tiver uma moto alugada
        if (user.motoAlugadaId) {
          const moto = await fetchMotoData(user.motoAlugadaId);
          if (moto) {
            setMotoData(moto);
          }
        } else if (user.contratoId) {
          // Se não tiver motoAlugadaId, mas tiver contratoId, buscar a moto pelo contrato
          try {
            const contratoDoc = await getDoc(doc(db, 'contratos', user.contratoId));
            if (contratoDoc.exists()) {
              const contrato = contratoDoc.data();
              if (contrato.motoId) {
                const moto = await fetchMotoData(contrato.motoId);
                if (moto) {
                  setMotoData(moto);
                }
              }
            }
          } catch (err) {
            console.error('Erro ao buscar contrato:', err);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
        setError('Não foi possível carregar seus dados. Por favor, tente novamente.');
      } finally {
        setLoadingUserData(false);
      }
    };

    loadUserData();
  }, [userEmail]);

  // Verifica pagamentos pendentes para usar os dados da rota
  useEffect(() => {
    const checkPendingPayments = async () => {
      try {
        // Verificar se já recebemos pagamentos pendentes da tela anterior
        if (route.params?.pendingPayments) {

          // Verificar se os pagamentos pendentes precisam ser atualizados com multa
          const pendingPaymentsWithMulta = verificarMultaEmPagamentosPendentes(route.params.pendingPayments);
          setPendingPayments(pendingPaymentsWithMulta);
          return;
        }

        // Se não, buscar do Firestore
        const email = userEmail || auth.currentUser?.email;
        if (!email) return;

        // Buscar pagamentos pendentes no Firestore
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('userEmail', '==', email),
          where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(paymentsQuery);

        // Objeto para armazenar pagamentos pendentes por tipo
        const pending = {
          pix: null,
          boleto: null
        };

        // Processar os resultados
        querySnapshot.forEach((doc) => {
          const payment = doc.data();

          // Verificar o método de pagamento
          if (payment.paymentMethod === 'pix' && !pending.pix) {
            pending.pix = {
              id: doc.id,
              ...payment,
              date_created: payment.dateCreated?.toDate?.().toISOString() || new Date().toISOString(),
              transaction_amount: payment.amount || 0,
              status: payment.status || 'pending',
              payment_type_id: payment.paymentMethod || 'pix'
            };
          } else if ((payment.paymentMethod === 'boleto' || payment.paymentMethod === 'ticket') && !pending.boleto) {
            pending.boleto = {
              id: doc.id,
              ...payment,
              date_created: payment.dateCreated?.toDate?.().toISOString() || new Date().toISOString(),
              transaction_amount: payment.amount || 0,
              status: payment.status || 'pending',
              payment_type_id: payment.paymentMethod || 'boleto'
            };
          }
        });

        // Verificar se os pagamentos pendentes precisam ser atualizados com multa
        const pendingWithMulta = verificarMultaEmPagamentosPendentes(pending);
        setPendingPayments(pendingWithMulta);
      } catch (error) {
        console.error('Erro ao verificar pagamentos pendentes:', error);
      }
    };

    // Executar a verificação quando a tela carregar
    checkPendingPayments();
  }, [route.params, userEmail]);


  useEffect(() => {
    const ensureUserEmail = async () => {
      try {
        // Verificar se já temos o email dos parâmetros da rota
        if (userEmail) {
          return;
        }

        // Verificar se o usuário está autenticado
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
          console.error('Usuário não autenticado ou sem email');

          // Tentar obter o email do AsyncStorage como último recurso
          const storedEmail = await AsyncStorage.getItem('userEmail');
          if (storedEmail) {
            // Não podemos modificar userEmail diretamente pois é uma prop, mas podemos usar no código
          } else {
            console.error('Não foi possível obter o email do usuário de nenhuma fonte');
          }
        } else {
          console.log('Email do usuário autenticado:', currentUser.email);
        }
      } catch (error) {
        console.error('Erro ao garantir email do usuário:', error);
      }
    };

    ensureUserEmail();
  }, [userEmail]);


  // Função para verificar se os pagamentos pendentes precisam ser atualizados com multa
  const verificarMultaEmPagamentosPendentes = (pendingPayments) => {
    try {
      // Verificar se pendingPayments é nulo ou indefinido
      if (!pendingPayments) return { pix: null, boleto: null };

      // Obter informações de multa dos parâmetros da rota
      const multaInfo = route.params?.multa;
      if (!multaInfo) return pendingPayments;

      // Clonar o objeto para não modificar o original
      const updatedPayments = { ...pendingPayments };

      // Verificar se o pagamento PIX precisa ser atualizado
      if (updatedPayments.pix) {
        try {
          const multaExistente = updatedPayments.pix.multa || {};
          if (Math.abs((multaExistente.valorMulta || 0) - multaInfo.valorMulta) > 0.01) {
            updatedPayments.pix.precisaAtualizar = true;
            updatedPayments.pix.multaAtual = multaInfo;
          }
        } catch (err) {
          console.error('Erro ao verificar multa no pagamento PIX:', err);
        }
      }

      // Verificar se o pagamento Boleto precisa ser atualizado
      if (updatedPayments.boleto) {
        try {
          const multaExistente = updatedPayments.boleto.multa || {};
          if (Math.abs((multaExistente.valorMulta || 0) - multaInfo.valorMulta) > 0.01) {
            updatedPayments.boleto.precisaAtualizar = true;
            updatedPayments.boleto.multaAtual = multaInfo;
          }
        } catch (err) {
          console.error('Erro ao verificar multa no pagamento Boleto:', err);
        }
      }

      return updatedPayments;
    } catch (error) {
      console.error('Erro ao verificar multa em pagamentos pendentes:', error);
      return pendingPayments || { pix: null, boleto: null };
    }
  };

  // Função para processar o pagamento
  const processPayment = async (paymentMethod) => {
    try {
      setLoading(true);
      setError(null);

      if (!userData) {
        throw new Error('Dados do usuário não disponíveis');
      }

      // Obter o email do usuário de todas as fontes possíveis
      let email = userEmail;

      // Se não tiver nos parâmetros, tentar do usuário autenticado
      if (!email && auth.currentUser) {
        email = auth.currentUser.email;
      }

      // Se ainda não tiver, tentar do AsyncStorage
      if (!email) {
        try {
          const storedEmail = await AsyncStorage.getItem('userEmail');
          if (storedEmail) {
            email = storedEmail;
          }
        } catch (e) {
          console.error('Erro ao recuperar email do AsyncStorage:', e);
        }
      }

      // Se ainda não tiver, usar um valor padrão
      if (!email) {
        email = 'usuario@semlogin.com';
        console.warn('Usando email padrão para o pagamento:', email);
      }

      // Obter o nome do usuário
      const name = userName || (userData && userData.nome) || 'Cliente';

      // Obter CPF do usuário
      const cpf = userData.cpf || '12345678909';

      // Obter endereço do usuário
      const endereco = userData.endereco || {};

      // Verificar se temos informações de multa
      const multaInfo = route.params?.multa;
      const motoInfo = route.params?.motoInfo;
      const periodoLocacao = route.params?.periodoLocacao;
      const tipoRecorrencia = route.params?.tipoRecorrencia;
      const descricaoDetalhada = route.params?.descricaoDetalhada;

      // Dados básicos do pagamento
      const paymentData = {
        paymentType: paymentMethod.type === 'ticket' ? 'boleto' :
          paymentMethod.type === 'bank_transfer' ? 'pix' : paymentMethod.type,
        transactionAmount: Number(valorOriginal), // Enviar APENAS o valor original sem multa
        description: description || 'Pagamento de serviço',
        externalReference: `user_${auth.currentUser?.uid || 'guest'}_${Date.now()}`,
        statementDescriptor: 'PAPA TANGO MOTOS',
        diasAtraso: diasAtraso || 0,
        contratoId: contratoId || userData?.contratoId || null,
        aluguelId: aluguelId || userData?.aluguelAtivoId || null,
        // Informações do item
        items: [
          {
            id: contratoId || `service_${Date.now()}`,
            title: 'Aluguel de Motocicleta',
            description: description || 'Pagamento de serviço Papa Tango',
            quantity: 1,
            unit_price: Number(amount)
          }
        ],
        payer: {
          email: email,
          first_name: name.split(' ')[0], // Primeiro nome
          last_name: name.split(' ').slice(1).join(' ') || 'PapaMotos', // Sobrenome ou "PapaMotos" se não tiver
          identification: {
            type: 'CPF',
            number: cpf.replace(/[^\d]/g, '') // Remover caracteres não numéricos
          }
        }
      };

      // Adicionar dados específicos para boleto
      if (paymentMethod.type === 'ticket') {
        // Adicionar dados adicionais necessários para boleto
        paymentData.payer = {
          ...paymentData.payer,
          address: {
            zip_code: endereco.cep?.replace(/[^\d]/g, '') || '60732645',
            street_name: endereco.logradouro || 'Rua Tapynaré',
            street_number: endereco.numero || '292',
            neighborhood: endereco.bairro || 'Siqueira',
            city: endereco.cidade || 'Fortaleza',
            federal_unit: endereco.estado || 'CE'
          }
        };
      }

      // Chamar a API
      const response = await axios.post(
        'https://processpayment-q3zrn7ctxq-uc.a.run.app',
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // Aumentar timeout para 10 segundos
        }
      );

      const result = response.data;

      if (result) {
        // Criar descrição detalhada se não foi fornecida
        let descricaoFinal = descricaoDetalhada;

        if (!descricaoFinal && periodoLocacao) {
          descricaoFinal = `Pagamento referente a ${tipoRecorrencia === 'mensal' ? 'mês' : 'semana'} [${periodoLocacao}] de locação.`;

          if (motoInfo) {
            descricaoFinal += ` Moto alugada: ${motoInfo.modelo} Placa ${motoInfo.placa}.`;
          }

          descricaoFinal += ` Caso precise, entre em contato através do WhatsApp (85991372994 / 85992684035).`;
        }

        // Salvar o pagamento no Firestore
        try {
          // Usar o paymentId como ID do documento
          const paymentId = result.id.toString(); // Garantir que seja string
          const paymentRef = doc(db, 'payments', paymentId);

          // Garantir que temos um email válido
          const userEmailToSave = email || auth.currentUser?.email;
          if (!userEmailToSave) {
            console.error('Email do usuário não disponível para salvar o pagamento');
            // Continuar mesmo sem email, mas logar o erro
          }

          // Criar um novo objeto para salvar no Firestore (não reutilizar paymentData)
          const paymentToSave = {
            userEmail: userEmailToSave || 'usuario@semlogin.com', // Garantir que sempre tenha um valor
            userName: name,
            amount: parseFloat(amount),
            description: description,
            status: result.status || 'pending',
            paymentMethod: paymentMethod.type === 'ticket' ? 'boleto' :
              paymentMethod.type === 'bank_transfer' ? 'pix' : paymentMethod.type,
            paymentId: result.id, // Manter o campo paymentId também
            dateCreated: serverTimestamp(),
            contratoId: contratoId || userData?.contratoId || null,
            aluguelId: aluguelId || userData?.aluguelAtivoId || null,
            externalReference: paymentData.externalReference,
            paymentDetails: result,
            updatedAt: serverTimestamp(),
            statusDetail: result.status_detail || 'pending_waiting_transfer'
          };

          // Data de vencimento para boletos
          if (result.date_of_expiration && paymentMethod.type === 'ticket') {
            paymentToSave.date_of_expiration = result.date_of_expiration;
          }

          // Configuração de multa para boletos
          if (result.fine_configuration && paymentMethod.type === 'ticket') {
            paymentToSave.fine_configuration = result.fine_configuration;
          }

          // Informações de multa se disponíveis
          if (result.multa) {
            paymentToSave.multa = result.multa;
          } else if (multaInfo) {
            paymentToSave.multa = multaInfo;
          }

          // Informações da moto se disponíveis
          if (motoInfo) {
            paymentToSave.motoInfo = motoInfo;
          }

          // Período de locação e tipo de recorrência
          if (periodoLocacao) {
            paymentToSave.periodoLocacao = periodoLocacao;
          }
          if (tipoRecorrencia) {
            paymentToSave.tipoRecorrencia = tipoRecorrencia;
          }

          // Descrição detalhada
          if (descricaoFinal) {
            paymentToSave.descricaoDetalhada = descricaoFinal;
          }

          // Código PIX se disponível
          if (result.point_of_interaction?.transaction_data?.qr_code) {
            paymentToSave.pixQrCode = result.point_of_interaction.transaction_data.qr_code;
          }

          // Controle de notificações
          paymentToSave.notificationsSent = {
            pending: false,
            approved: false,
            rejected: false
          };

          await setDoc(paymentRef, paymentToSave);
        } catch (err) {
          console.error('Erro ao salvar pagamento no Firestore:', err);
          // Não interromper o fluxo se falhar ao salvar no Firestore
        }

        // Registrar o momento em que o pagamento foi gerado
        await AsyncStorage.setItem('paymentGeneratedTime', Date.now().toString());

        // Preparar objeto de pagamento para a tela de sucesso
        const paymentInfo = {
          ...result,
          id: result.id?.toString(),
          transaction_amount: parseFloat(amount),
          date_created: new Date().toISOString(),
          payment_type_id: paymentData.paymentType,
          userEmail: email,
          userName: name,
          externalReference: paymentData.externalReference,
          status: result.status || 'pending',
          // Garantir que point_of_interaction esteja definido para evitar erros
          point_of_interaction: result.point_of_interaction || {},
          // Garantir que transaction_details esteja definido e inclua a linha digitável para boletos
          transaction_details: {
            ...result.transaction_details,
            // Adicionar a linha digitável do boleto se estiver disponível
            digitable_line: result.transaction_details?.digitable_line ||
              result.point_of_interaction?.transaction_data?.ticket?.digitable_line ||
              result.barcode ||
              result.digitable_line
          }
        };

        // Data de vencimento para boletos
        if (result.date_of_expiration && paymentMethod.type === 'ticket') {
          paymentInfo.date_of_expiration = result.date_of_expiration;
        }

        // Configuração de multa para boletos
        if (result.fine_configuration && paymentMethod.type === 'ticket') {
          paymentInfo.fine_configuration = result.fine_configuration;
        }

        // Informações de multa se disponíveis
        if (result.multa) {
          paymentInfo.multa = result.multa;
        } else if (multaInfo) {
          paymentInfo.multa = multaInfo;
        }

        // Informações da moto se disponíveis
        if (motoInfo) {
          paymentInfo.motoInfo = motoInfo;
        }

        // Período de locação e tipo de recorrência
        if (periodoLocacao) {
          paymentInfo.periodoLocacao = periodoLocacao;
        }

        if (tipoRecorrencia) {
          paymentInfo.tipoRecorrencia = tipoRecorrencia;
        }

        // Descrição detalhada
        if (descricaoFinal) {
          paymentInfo.descricaoDetalhada = descricaoFinal;
        }

        // Navegar para a tela de sucesso
        navigation.navigate('Detalhes do Pagamento', {
          paymentInfo
        });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      // Melhorar a mensagem de erro para ser mais informativa
      let errorMessage = 'Não foi possível processar o pagamento.';

      if (err.response) {
        // Erro de resposta da API
        console.log('Detalhes do erro:', err.response.data);
        errorMessage += ` Erro ${err.response.status}: ${err.response.data?.message || err.message}`;
      } else if (err.request) {
        // Erro de requisição (sem resposta)
        errorMessage += ' Não foi possível conectar ao servidor de pagamento.';
      } else {
        // Outros erros
        errorMessage += ` ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se já existe um pagamento pendente, caso não, mostrar o modal para criar um novo
  const confirmPaymentMethod = (option) => {
    // Verificar se já existe um pagamento pendente deste tipo
    const paymentType = option.id; // 'pix' ou 'boleto'
    const pendingPayment = pendingPayments[paymentType];

    if (pendingPayment) {
      // Verificar se é um boleto e se está vencido
      if (paymentType === 'boleto') {
        const vencimento = pendingPayment.date_of_expiration ||
          pendingPayment.paymentDetails?.date_of_expiration;

        if (vencimento) {
          const dataVencimento = new Date(vencimento);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia

          // Se a data de vencimento já passou, mostrar alerta
          if (dataVencimento < hoje) {
            showConfirmation(
              'Boleto Vencido',
              'Este boleto está vencido. Precisamos gerar um novo boleto com a data de vencimento atualizada.',
              async () => {
                try {
                  // Cancelar o boleto vencido
                  await setDoc(doc(db, 'payments', pendingPayment.id), {
                    status: 'cancelled',
                    dateCancelled: serverTimestamp(),
                    cancellationReason: 'Boleto vencido'
                  }, { merge: true });

                  // Mostrar o modal para criar um novo pagamento
                  setConfirmModalOption(option);
                  setConfirmModalVisible(true);
                } catch (error) {
                  console.error('Erro ao cancelar boleto vencido:', error);
                  setError('Erro ao cancelar boleto vencido. Por favor, tente novamente.');
                }
              }
            );
            return;
          }
        }

        // Se o boleto não estiver vencido, navegar para a tela de sucesso
        navigation.navigate('Detalhes do Pagamento', {
          paymentInfo: pendingPayment
        });
        return;
      }

      // Para PIX, verificar se precisa ser atualizado com multa
      if (paymentType === 'pix' && pendingPayment.precisaAtualizar) {
        // Se precisar atualizar, mostrar alerta
        showConfirmation(
          'Pagamento Desatualizado',
          'Este pagamento pendente está desatualizado devido a alterações na multa por atraso. Precisamos gerar um novo pagamento com o valor correto.',
          async () => {
            try {
              // Cancelar o pagamento pendente
              await setDoc(doc(db, 'payments', pendingPayment.id), {
                status: 'cancelled',
                dateCancelled: serverTimestamp(),
                cancellationReason: 'Valor atualizado devido a atraso'
              }, { merge: true });

              // Mostrar o modal para criar um novo pagamento
              setConfirmModalOption(option);
              setConfirmModalVisible(true);
            } catch (error) {
              console.error('Erro ao cancelar pagamento pendente:', error);
              setError('Erro ao cancelar pagamento pendente. Por favor, tente novamente.');
            }
          }
        );
      } else {
        // Se não precisar atualizar, navegar diretamente para a tela de sucesso
        console.log(`Pagamento ${paymentType} pendente encontrado:`, pendingPayment);

        // Garantir que todos os campos necessários estejam presentes
        const paymentInfo = {
          ...pendingPayment,
          id: pendingPayment.id?.toString(),
          transaction_amount: parseFloat(pendingPayment.transaction_amount || pendingPayment.amount || amount),
          date_created: pendingPayment.date_created || new Date().toISOString(),
          payment_type_id: pendingPayment.payment_type_id || paymentType,
          status: pendingPayment.status || 'pending',
          // Garantir que point_of_interaction esteja definido para evitar erros
          point_of_interaction: pendingPayment.point_of_interaction || {},
          // Garantir que transaction_details esteja definido
          transaction_details: pendingPayment.transaction_details || {}
        };

        navigation.navigate('Detalhes do Pagamento', {
          paymentInfo
        });
      }
    } else {
      // Se não existe, mostrar o modal de confirmação para criar um novo
      setConfirmModalOption(option);
      setConfirmModalVisible(true);
    }
  };


  // Função para cancelar um pagamento pendente
  const cancelarPagamentoPendente = async (paymentId) => {
    if (!paymentId) {
      console.error('ID de pagamento não fornecido para cancelamento');
      return false;
    }

    try {
      // Verificar se o documento existe antes de tentar atualizar
      const paymentRef = doc(db, 'payments', paymentId);
      const paymentDoc = await getDoc(paymentRef);

      if (!paymentDoc.exists()) {
        console.error('Pagamento não encontrado para cancelamento:', paymentId);
        return false;
      }

      // Atualizar o status do pagamento para 'cancelled' no Firestore
      await setDoc(paymentRef, {
        status: 'cancelled',
        dateCancelled: serverTimestamp(),
        cancellationReason: 'Valor atualizado devido a atraso'
      }, { merge: true });

      // Atualizar o estado local para remover o pagamento pendente
      setPendingPayments(prev => {
        // Verificar se prev existe antes de tentar acessar suas propriedades
        if (!prev) return { pix: null, boleto: null };

        return {
          ...prev,
          pix: prev.pix?.id === paymentId ? null : prev.pix,
          boleto: prev.boleto?.id === paymentId ? null : prev.boleto
        };
      });

      return true;
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      setError('Não foi possível cancelar o pagamento pendente. Tente novamente.');
      return false;
    }
  };

  // Função para processar o pagamento após confirmação
  const handleConfirmPayment = () => {
    if (confirmModalOption) {
      setSelectedMethod(confirmModalOption);
      setConfirmModalVisible(false);
      processPayment(confirmModalOption);
    }
  };

  // Componente para exibir informações sobre multa
  const InfoMulta = () => {
    const calculados = getValoresCalculados();
    if (!calculados.diasAtraso || calculados.diasAtraso <= 0) return null;

    return (
      <View style={{
        backgroundColor: '#FFF3F3',
        padding: 15,
        borderRadius: 8,
        marginVertical: 15,
        borderWidth: 1,
        borderColor: '#FFCDD2'
      }}>
        <Text style={{ fontWeight: 'bold', color: '#D32F2F', marginBottom: 10, fontSize: 16 }}>
          Pagamento em atraso
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: '#555' }}>Valor original:</Text>
          <Text style={{ fontWeight: 'bold' }}>R$ {calculados.valorOriginal.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: '#555' }}>
            Multa ({calculados.diasAtraso} {calculados.diasAtraso === 1 ? 'dia' : 'dias'} de atraso):
          </Text>
          <Text style={{ fontWeight: 'bold', color: '#D32F2F' }}>
            + R$ {calculados.valorMulta.toFixed(2)}
          </Text>
        </View>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 5,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#FFCDD2'
        }}>
          <Text style={{ color: '#555', fontWeight: 'bold' }}>Valor total:</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#D32F2F' }}>
            R$ {calculados.valorTotal.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };



  // Componente para exibir informações da moto
  const InfoMoto = () => {
    if (!motoData) return null;

    return (
      <View style={{
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0'
      }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 14 }}>
          Informações da Moto
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: '#555' }}>Modelo:</Text>
          <Text style={{ fontWeight: 'bold' }}>{motoData.modelo}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#555' }}>Placa:</Text>
          <Text style={{ fontWeight: 'bold' }}>{motoData.placa}</Text>
        </View>
      </View>
    );
  };

  return (
    <Container>
      {/* Modal de confirmação */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {`Confirmar pagamento via ${confirmModalOption?.name || ''}`}
            </Text>
            <Text style={styles.modalText}>
              {`Você está prestes a realizar um pagamento de R$ ${diasAtraso > 0 ? valorTotal.toFixed(2) : valorOriginal.toFixed(2)} via ${confirmModalOption?.name || ''}. Deseja continuar?`}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirmPayment}
              >
                <Text style={[styles.buttonText, styles.confirmButtonText]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <PaymentContainer>
          <Title>Pagamento</Title>

          {error && (
            <ErrorContainer>
              <ErrorText>{error}</ErrorText>
            </ErrorContainer>
          )}

          <Subtitle>Valor a pagar</Subtitle>
          <AmountText>R$ {diasAtraso > 0 ? valorTotal.toFixed(2) : valorOriginal.toFixed(2)}</AmountText>

          {loading || loadingUserData ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#CB2921" />
              <Text style={{ marginTop: 10 }}>
                {loading ? 'Processando pagamento...' : 'Carregando seus dados...'}
              </Text>
            </View>
          ) : (
            <>
              {/* Exibir informações da moto */}
              <InfoMoto />

              {/* Exibir informações sobre multa, se aplicável */}
              <InfoMulta />

              <PaymentMethodContainer>
                <PaymentMethodTitle>
                  Escolha uma forma de pagamento
                </PaymentMethodTitle>
                <PaymentMethodDescription>
                  Selecione o método que deseja utilizar para realizar o pagamento.
                </PaymentMethodDescription>
              </PaymentMethodContainer>

              {paymentOptions.map((option) => (
                <PaymentOption
                  key={option.id}
                  onPress={() => option.enabled ? confirmPaymentMethod(option) : null}
                  style={{
                    borderColor: !option.enabled ? '#E0E0E0' :
                      selectedMethod?.id === option.id ? '#CB2921' :
                        pendingPayments[option.id] ? '#FFC107' : '#E0E0E0',
                    backgroundColor: !option.enabled ? '#F5F5F5' :
                      selectedMethod?.id === option.id ? '#FFF5F5' :
                        pendingPayments[option.id] ? '#FFFBEB' : '#FFFFFF',
                    opacity: option.enabled ? 1 : 0.6
                  }}
                >
                  <PaymentOptionIcon>
                    {option.icon === 'file-text' ? (
                      <Feather name="file-text" size={24} color={
                        !option.enabled ? '#999' :
                          selectedMethod?.id === option.id ? '#CB2921' :
                            pendingPayments[option.id] ? '#FFC107' : '#666'
                      } />
                    ) : (
                      <MaterialIcons name={option.icon} size={24} color={
                        !option.enabled ? '#999' :
                          selectedMethod?.id === option.id ? '#CB2921' :
                            pendingPayments[option.id] ? '#FFC107' : '#666'
                      } />
                    )}
                  </PaymentOptionIcon>
                  <View style={{ flex: 1 }}>
                    <PaymentOptionText
                      style={{
                        fontWeight: 'bold',
                        color: !option.enabled ? '#999' :
                          selectedMethod?.id === option.id ? '#CB2921' :
                            pendingPayments[option.id] ? '#FFC107' : '#333'
                      }}
                    >
                      {option.name}
                    </PaymentOptionText>
                    <PaymentOptionText style={{
                      fontSize: 12,
                      color: !option.enabled ? '#999' :
                        pendingPayments[option.id] ? '#FFC107' : '#666'
                    }}>
                      {pendingPayments[option.id]
                        ? 'Pagamento pendente disponível'
                        : option.description}
                    </PaymentOptionText>
                  </View>
                  {!option.enabled && (
                    <View style={{
                      backgroundColor: '#999',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginLeft: 8
                    }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                        INDISPONÍVEL
                      </Text>
                    </View>
                  )}
                  {pendingPayments[option.id] && (
                    <View style={{
                      backgroundColor: '#FFC107',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginLeft: 8
                    }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                        PENDENTE
                      </Text>
                    </View>
                  )}
                </PaymentOption>
              ))}

              <Divider />

              <Button onPress={() => navigation.goBack()}>
                <ButtonText>Cancelar</ButtonText>
              </Button>
            </>
          )}
        </PaymentContainer>
      </ScrollView>
    </Container>
  );
};

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

// Estilos para o modal
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: Platform.OS === 'web' ? '80%' : '90%',
    maxWidth: 400
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: isWebDesktop ? 20 : 0,
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: isWebDesktop ? -30 : 0
  },
  confirmButton: {
    backgroundColor: '#CB2921',
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center'
  },
  confirmButtonText: {
    color: 'white'
  },
  cancelButtonText: {
    color: 'white'
  }
});

export default Payment;
