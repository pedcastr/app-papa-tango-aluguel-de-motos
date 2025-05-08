import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  Platform,
  StyleSheet
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons'; 
import axios from 'axios';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';

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
    aluguelId
  } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Estado para o modal de confirmação
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalOption, setConfirmModalOption] = useState(null);

  // Estado para armazenar os pagamentos pendentes
  const [pendingPayments, setPendingPayments] = useState({
    pix: null,
    boleto: null
  });
  
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
      description: 'Prazo de compensação de 1 a 3 dias úteis',
      icon: 'file-text',
      enabled: true
    }
  ];
  
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
        
        console.log('Dados do usuário carregados:', user);
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
          console.log('Usando pagamentos pendentes recebidos da rota:', route.params.pendingPayments);
          setPendingPayments(route.params.pendingPayments);
          return;
        }
        
        // Se não, buscar do Firestore
        const email = userEmail || auth.currentUser?.email;
        if (!email) return;
        
        console.log('Verificando pagamentos pendentes para:', email);
        
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
        
        console.log('Pagamentos pendentes encontrados:', pending);
        setPendingPayments(pending);
      } catch (error) {
        console.error('Erro ao verificar pagamentos pendentes:', error);
      }
    };
    
    // Executar a verificação quando a tela carregar
    checkPendingPayments();
  }, [route.params, userEmail]);
  
  // Função para processar o pagamento
  const processPayment = async (paymentMethod) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userData) {
        throw new Error('Dados do usuário não disponíveis');
      }
      
      // Obter o email do usuário
      const email = userEmail || auth.currentUser?.email;
      if (!email) {
        throw new Error('Email do usuário não disponível');
      }
      
      // Obter o nome do usuário
      const name = userName || userData.nome || 'Cliente';
      
      // Obter CPF do usuário
      const cpf = userData.cpf || '12345678909';
      
      // Obter endereço do usuário
      const endereco = userData.endereco || {};
      
      // Dados básicos do pagamento
      const paymentData = {
        paymentType: paymentMethod.type === 'ticket' ? 'boleto' :
                    paymentMethod.type === 'bank_transfer' ? 'pix' : paymentMethod.type,
        transactionAmount: Number(amount), // Garante que é número
        description: description || 'Pagamento de serviço',
        externalReference: `user_${auth.currentUser?.uid || 'guest'}_${Date.now()}`,
        statementDescriptor: 'PAPA TANGO MOTOS',
        // Adicionar informações do item (recomendado)
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
      
      console.log('Enviando dados para API:', paymentData);
      
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
      console.log('Resposta da API:', result);
      
      if (result) {
        // Salvar o pagamento no Firestore
        try {
          // Usar o paymentId como ID do documento
          const paymentId = result.id.toString(); // Garantir que seja string
          const paymentRef = doc(db, 'payments', paymentId);
          
          await setDoc(paymentRef, {
            userEmail: email,
            userName: name,
            amount: parseFloat(amount),
            description: description,
            status: result.status || 'pending',
            paymentMethod: paymentData.paymentType,
            paymentId: result.id, // Manter o campo paymentId também
            dateCreated: serverTimestamp(),
            contratoId: contratoId || userData.contratoId || null,
            aluguelId: aluguelId || userData.aluguelAtivoId || null,
            externalReference: paymentData.externalReference,
            paymentDetails: result
          });
          
          console.log('Pagamento salvo no Firestore com ID igual ao paymentId:', paymentId);
        } catch (err) {
          console.error('Erro ao salvar pagamento no Firestore:', err);
          // Não interromper o fluxo se falhar ao salvar no Firestore
        }

        // Registrar o momento em que o pagamento foi gerado
        await AsyncStorage.setItem('paymentGeneratedTime', Date.now().toString());
        
        // Navegar para a tela de sucesso
        navigation.navigate('PaymentSuccess', {
          paymentInfo: {
            ...result,
            transaction_amount: parseFloat(amount),
            date_created: new Date().toISOString(),
            payment_type_id: paymentData.paymentType,
            userEmail: email,
            userName: name,
            externalReference: paymentData.externalReference
          }
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
  
  // Função para veriificar se já existe um pagamento pendente, caso não, mostrar o modal para criar um novo
  const confirmPaymentMethod = (option) => {
    // Verificar se já existe um pagamento pendente deste tipo
    const paymentType = option.id; // 'pix' ou 'boleto'
    const pendingPayment = pendingPayments[paymentType];
    
    if (pendingPayment) {
      // Se já existe um pagamento pendente deste tipo, navegar diretamente para a tela de sucesso
      console.log(`Pagamento ${paymentType} pendente encontrado:`, pendingPayment);
      navigation.navigate('PaymentSuccess', {
        paymentInfo: pendingPayment
      });
    } else {
      // Se não existe, mostrar o modal de confirmação para criar um novo
      setConfirmModalOption(option);
      setConfirmModalVisible(true);
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
              {`Você está prestes a realizar um pagamento de R$ ${parseFloat(amount).toFixed(2)} via ${confirmModalOption?.name || ''}. Deseja continuar?`}
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
          <AmountText>R$ {parseFloat(amount).toFixed(2)}</AmountText>
          
          {loading || loadingUserData ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#CB2921" />
              <Text style={{ marginTop: 10 }}>
                {loading ? 'Processando pagamento...' : 'Carregando seus dados...'}
              </Text>
            </View>
          ) : (
            <>
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
                  onPress={() => confirmPaymentMethod(option)}
                  style={{
                    borderColor: selectedMethod?.id === option.id ? '#CB2921' : 
                                pendingPayments[option.id] ? '#FFC107' : '#E0E0E0',
                    backgroundColor: selectedMethod?.id === option.id ? '#FFF5F5' : 
                                    pendingPayments[option.id] ? '#FFFBEB' : '#FFFFFF',
                  }}
                >
                  <PaymentOptionIcon>
                    {option.icon === 'file-text' ? (
                      <Feather name="file-text" size={24} color={
                        selectedMethod?.id === option.id ? '#CB2921' : 
                        pendingPayments[option.id] ? '#FFC107' : '#666'
                      } />
                    ) : (
                      <MaterialIcons name={option.icon} size={24} color={
                        selectedMethod?.id === option.id ? '#CB2921' : 
                        pendingPayments[option.id] ? '#FFC107' : '#666'
                      } />
                    )}
                  </PaymentOptionIcon>
                  <View style={{ flex: 1 }}>
                    <PaymentOptionText
                      style={{
                        fontWeight: 'bold',
                        color: selectedMethod?.id === option.id ? '#CB2921' : 
                              pendingPayments[option.id] ? '#FFC107' : '#333'
                      }}
                    >
                      {option.name}
                    </PaymentOptionText>
                    <PaymentOptionText style={{
                      fontSize: 12,
                      color: pendingPayments[option.id] ? '#FFC107' : '#666'
                    }}>
                      {pendingPayments[option.id] 
                        ? 'Pagamento pendente disponível' 
                        : option.description}
                    </PaymentOptionText>
                  </View>
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
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
    marginHorizontal: 10
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
