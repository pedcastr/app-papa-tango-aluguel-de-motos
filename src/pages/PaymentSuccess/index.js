import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Share, Alert, Linking, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { db } from '../../services/firebaseConfig';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import {
  Container,
  SuccessIcon,
  Title,
  Subtitle,
  InfoCard,
  InfoRow,
  InfoLabel,
  InfoValue,
  Button,
  ButtonText,
  ShareButton,
  ShareButtonText,
  QRCodeContainer,
  Instructions,
  CodeContainer,
  CodeText
} from './styles';

const PaymentSuccess = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Estado para controlar se já processamos os dados
  const [processedData, setProcessedData] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(paymentInfo?.status || 'pending');
  
  // Processar os dados apenas uma vez quando o componente montar
  useEffect(() => {
    if (!processedData) {
      const { paymentInfo } = route.params || {};
      
      // Log apenas uma vez
      console.log('PaymentSuccess - Received paymentInfo:', paymentInfo);
      
      // Processar e normalizar os dados
      const normalizedData = normalizePaymentData(paymentInfo);
      
      // Atualizar o estado apenas uma vez
      setPaymentData(normalizedData);
      setProcessedData(true);
    }
  }, [route.params, processedData]);

  // Limpa o registro de tempo de geração do pagamento após o pagamento ser aprovado
  useEffect(() => {
    const handlePaymentStatus = async () => {
      // Se o pagamento foi aprovado, limpar o registro de tempo de geração
      if (paymentData && paymentData.status === 'approved') {
        try {
          await AsyncStorage.removeItem('paymentGeneratedTime');
          console.log('Registro de tempo de geração do pagamento removido');
        } catch (error) {
          console.error('Erro ao remover registro de tempo:', error);
        }
      }
    };
    
    if (paymentData) {
      handlePaymentStatus();
    }
  }, [paymentData]);

  // Remover o registro de tempo de geração do pagamento quando a tela receber foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Verificar novamente o status do pagamento quando a tela receber foco
      if (paymentData && paymentData.status === 'approved') {
        AsyncStorage.removeItem('paymentGeneratedTime')
          .then(() => console.log('Registro removido ao focar na tela'))
          .catch(err => console.error('Erro ao remover registro:', err));
      }
    });
  
    return unsubscribe;
  }, [navigation, paymentData]);

  // Verificar o status a cada 5 segundos se o pagamento estiver pendente
  useEffect(() => {
    // Verificar imediatamente ao montar o componente
    checkPaymentStatus();
    
    // Configurar verificação periódica apenas se o pagamento estiver pendente
    let interval;
    if (currentStatus === 'pending') {
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000); // Verificar a cada 5 segundos
    }
    
    // Limpar o intervalo ao desmontar
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkPaymentStatus, currentStatus]);

  // Função para verificar o status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    try {
      if (!paymentInfo?.paymentId) {
        console.log('ID de pagamento não disponível');
        return;
      }
      
      setRefreshing(true);
      
      // Verificar o status do pagamento usando a API
      const response = await axios.get(
        `https://checkpaymentstatus-q3zrn7ctxq-uc.a.run.app?paymentId=${paymentInfo.paymentId}`
      );
      
      const { status } = response.data;
      
      // Se o status mudou, atualizar o estado
      if (status !== currentStatus) {
        setCurrentStatus(status);
        
        // Se o pagamento foi aprovado, mostrar uma mensagem
        if (status === 'approved') {
          Alert.alert(
            'Pagamento Aprovado',
            'Seu pagamento foi processado com sucesso!',
            [{ text: 'OK' }]
          );
          
          // Atualizar o documento no Firestore
          const paymentRef = doc(db, 'payments', paymentInfo.id);
          await updateDoc(paymentRef, {
            status: 'approved',
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    } finally {
      setRefreshing(false);
    }
  }, [paymentInfo, currentStatus]);
    
  // Função para normalizar os dados do pagamento
  const normalizePaymentData = (rawData) => {
    if (!rawData) return null;
    
    // Extrair valores com segurança
    return {
      id: rawData.id || rawData.paymentId || 'N/A',
      status: rawData.status || 'pending',
      payment_type_id: rawData.payment_type_id || rawData.paymentMethod || 'N/A',
      transaction_amount: typeof rawData.transaction_amount === 'number'
        ? rawData.transaction_amount
        : typeof rawData.amount === 'number'
          ? rawData.amount
          : parseFloat(rawData.transaction_amount || rawData.amount || 0),
      date_created: rawData.date_created || 
                   (rawData.dateCreated && rawData.dateCreated.seconds 
                     ? new Date(rawData.dateCreated.seconds * 1000).toISOString() 
                     : new Date().toISOString()),
      description: rawData.description || 'Pagamento',
      userName: rawData.userName || 'N/A',
      userEmail: rawData.userEmail || 'N/A',
      // Preservar o objeto original para acesso direto
      originalData: rawData
    };
  };
  
  // Se ainda não temos os dados processados, mostrar carregamento
  if (!paymentData) {
    return (
      <Container>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#CB2921" />
          <Text style={{ marginTop: 10 }}>Carregando informações do pagamento...</Text>
        </View>
      </Container>
    );
  }
  
  // Função para formatar status do pagamento
  const formatStatus = (status) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'in_process': return 'Em processamento';
      case 'rejected': return 'Rejeitado';
      case 'cancelled': return 'Cancelado';
      default: return status || 'N/A';
    }
  };
  
  // Função para formatar tipo de pagamento
  const formatPaymentType = (type) => {
    switch (type) {
      case 'pix':
      case 'bank_transfer': return 'PIX';
      case 'ticket':
      case 'boleto': return 'Boleto';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      default: return type || 'N/A';
    }
  };
  
  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'N/A';
    }
  };
  
  // Função para compartilhar informações do pagamento
  const sharePaymentInfo = async () => {
    try {
      const message = `
        Pagamento ${formatStatus(paymentData.status)}
        Valor: R$ ${paymentData.transaction_amount.toFixed(2)}
        Método: ${formatPaymentType(paymentData.payment_type_id)}
        Data: ${formatDate(paymentData.date_created)}
        ID: ${paymentData.id}
        ${paymentData.description ? `Descrição: ${paymentData.description}` : ''}
      `;
      
      await Share.share({
        message,
        title: 'Informações do Pagamento'
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };
  
  // Verificar se é um pagamento PIX
  const isPix = paymentData.payment_type_id === 'pix' || 
                paymentData.payment_type_id === 'bank_transfer';
  
  // Verificar se é um boleto
  const isBoleto = paymentData.payment_type_id === 'ticket' || 
                  paymentData.payment_type_id === 'boleto';
  
  // Função para obter o QR code do PIX
  const getPixQrCode = () => {
    const data = paymentData.originalData;
    
    // Verificar em diferentes locais possíveis
    if (data.point_of_interaction?.transaction_data?.qr_code_base64) {
      return data.point_of_interaction.transaction_data.qr_code_base64;
    }
    
    if (data.paymentDetails?.point_of_interaction?.transaction_data?.qr_code_base64) {
      return data.paymentDetails.point_of_interaction.transaction_data.qr_code_base64;
    }
    
    return null;
  };
  
  // Função para obter o código PIX
  const getPixCode = () => {
    const data = paymentData.originalData;
    
    // Verificar em diferentes locais possíveis
    if (data.point_of_interaction?.transaction_data?.qr_code) {
      return data.point_of_interaction.transaction_data.qr_code;
    }
    
    if (data.paymentDetails?.point_of_interaction?.transaction_data?.qr_code) {
      return data.paymentDetails.point_of_interaction.transaction_data.qr_code;
    }
    
    return '';
  };
  
  // Função para extrair o código do boleto
  const getBarcodeText = () => {
    const data = paymentData.originalData;
    
    // Verificar em diferentes locais possíveis
    if (data.transaction_details?.barcode?.content) {
      return data.transaction_details.barcode.content;
    }
    
    if (data.paymentDetails?.transaction_details?.barcode?.content) {
      return data.paymentDetails.transaction_details.barcode.content;
    }
    
    return 'Código de barras disponível apenas no boleto';
  };
  
  // Função para obter a URL do boleto
  const getBoletoUrl = () => {
    const data = paymentData.originalData;
    
    // Verificar em diferentes locais possíveis
    if (data.transaction_details?.external_resource_url) {
      return data.transaction_details.external_resource_url;
    }
    
    if (data.paymentDetails?.transaction_details?.external_resource_url) {
      return data.paymentDetails.transaction_details.external_resource_url;
    }
    
    if (data.point_of_interaction?.transaction_data?.ticket_url) {
      return data.point_of_interaction.transaction_data.ticket_url;
    }
    
    if (data.paymentDetails?.point_of_interaction?.transaction_data?.ticket_url) {
      return data.paymentDetails.point_of_interaction.transaction_data.ticket_url;
    }
    
    return null;
  };
  
  // Função para copiar texto para a área de transferência
  const copyToClipboard = async (text) => {
    if (!text || text === 'Código de barras disponível apenas no boleto') {
      Alert.alert('Informação', 'O código completo está disponível apenas no boleto. Por favor, use a opção "Abrir Boleto".');
      return;
    }
    
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copiado!', 'Código copiado para a área de transferência.');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      Alert.alert('Erro', 'Não foi possível copiar o texto.');
    }
  };
  
  return (
    <Container>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          alignItems: 'center'
        }}
      >
        <SuccessIcon>
          {paymentData.status === 'approved' ? (
            <Feather name="check-circle" size={80} color="#28a745" />
          ) : paymentData.status === 'rejected' || paymentData.status === 'cancelled' ? (
            <Feather name="x-circle" size={80} color="#dc3545" />
          ) : (
            <Feather name="clock" size={80} color="#ffc107" />
          )}
        </SuccessIcon>
        
        <Title>
          {paymentData.status === 'approved'
            ? 'Pagamento Aprovado!'
            : paymentData.status === 'rejected'
            ? 'Pagamento Rejeitado'
            : paymentData.status === 'cancelled'
            ? 'Pagamento Cancelado'
            : 'Pagamento Pendente'}
        </Title>
        
        <Subtitle>
          {paymentData.status === 'approved'
            ? 'Seu pagamento foi processado com sucesso.'
            : paymentData.status === 'rejected'
            ? 'Seu pagamento foi rejeitado. Por favor, tente outro método de pagamento.'
            : paymentData.status === 'cancelled'
            ? 'Este pagamento foi cancelado.'
            : 'Seu pagamento está sendo processado.'}
        </Subtitle>
        
        <InfoCard>
          <InfoRow>
            <InfoLabel>Valor:</InfoLabel>
            <InfoValue>R$ {paymentData.transaction_amount.toFixed(2)}</InfoValue>
          </InfoRow>
          
          <InfoRow>
            <InfoLabel>Status:</InfoLabel>
            <InfoValue>{formatStatus(paymentData.status)}</InfoValue>
          </InfoRow>
          
          <InfoRow>
            <InfoLabel>Método:</InfoLabel>
            <InfoValue>{formatPaymentType(paymentData.payment_type_id)}</InfoValue>
          </InfoRow>
          
          <InfoRow>
            <InfoLabel>Data:</InfoLabel>
            <InfoValue>{formatDate(paymentData.date_created)}</InfoValue>
          </InfoRow>
          
          <InfoRow>
            <InfoLabel>Descrição:</InfoLabel>
            <InfoValue>{paymentData.description}</InfoValue>
          </InfoRow>
          
          <InfoRow>
            <InfoLabel>ID:</InfoLabel>
            <InfoValue>{paymentData.id}</InfoValue>
          </InfoRow>
          
          {paymentData.userName !== 'N/A' && (
            <InfoRow>
              <InfoLabel>Nome:</InfoLabel>
              <InfoValue>{paymentData.userName}</InfoValue>
            </InfoRow>
          )}
          
          {paymentData.userEmail !== 'N/A' && (
            <InfoRow>
              <InfoLabel>Email:</InfoLabel>
              <InfoValue>{paymentData.userEmail}</InfoValue>
            </InfoRow>
          )}
        </InfoCard>
        
        {/* Instruções específicas para PIX */}
        {isPix && paymentData.status !== 'approved' && (
          <>
            <Instructions>
              Para concluir o pagamento via PIX, escaneie o QR Code abaixo ou copie o código PIX.
            </Instructions>
            
            <QRCodeContainer>
              {getPixQrCode() ? (
                <Image
                  source={{
                    uri: `data:image/png;base64,${getPixQrCode()}`
                  }}
                  style={{ width: 200, height: 200 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ padding: 20, color: '#666' }}>QR Code não disponível</Text>
              )}
            </QRCodeContainer>
            
            {getPixCode() && (
              <CodeContainer>
                <CodeText numberOfLines={3}>
                  {getPixCode()}
                </CodeText>
                <Button
                  onPress={() => copyToClipboard(getPixCode())}
                  style={{ backgroundColor: '#4CAF50', marginTop: 10 }}
                >
                  <ButtonText>Copiar Código PIX</ButtonText>
                </Button>
              </CodeContainer>
            )}
          </>
        )}
        
        {/* Instruções específicas para Boleto */}
        {isBoleto && paymentData.status !== 'approved' && (
          <>
            <Instructions>
              Para concluir o pagamento via Boleto, utilize o código de barras abaixo ou abra o boleto.
            </Instructions>
            
            <CodeContainer>
              <CodeText numberOfLines={3}>
                {getBarcodeText()}
              </CodeText>
              <Button
                onPress={() => copyToClipboard(getBarcodeText())}
                style={{ backgroundColor: '#4CAF50', marginTop: 10 }}
              >
                <ButtonText>Copiar Código de Barras</ButtonText>
                </Button>
            </CodeContainer>
            
            {getBoletoUrl() && (
              <Button
                onPress={() => {
                  Linking.openURL(getBoletoUrl());
                }}
                style={{ backgroundColor: '#2196F3', marginTop: 10 }}
              >
                <ButtonText>Abrir Boleto</ButtonText>
              </Button>
            )}
          </>
        )}
        
        <ShareButton onPress={sharePaymentInfo}>
          <Feather name="share-2" size={16} color="#FFFFFF" />
          <ShareButtonText>Compartilhar</ShareButtonText>
        </ShareButton>
        
        <Button
          onPress={() => navigation.navigate('FinanceiroScreen')}
          style={{ marginTop: 20 }}
        >
          <ButtonText>Voltar para Financeiro</ButtonText>
        </Button>
      </ScrollView>
    </Container>
  );
};

export default PaymentSuccess;
