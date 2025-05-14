import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Share, Alert, Linking, Image, ActivityIndicator, Platform, } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

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
  const [isLoading, setIsLoading] = useState(true);

  // Usar uma ref para controlar se o listener já foi configurado
  const listenerConfigured = useRef(false);

  // Função para mostrar mensagem de sucesso/erro
  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Processar os dados iniciais quando o componente montar
  useEffect(() => {
    if (!processedData) {
      const { paymentInfo } = route.params || {};

      // Processar e normalizar os dados
      const normalizedData = normalizePaymentData(paymentInfo);

      // Atualizar o estado apenas uma vez
      setPaymentData(normalizedData);
      setProcessedData(true);
      setIsLoading(false);
    }
  }, [route.params, processedData]);

  // Configurar o listener para atualizações de pagamento - apenas uma vez
  useFocusEffect(
    useCallback(() => {
      // Verificar se já temos os dados do pagamento
      if (!paymentData) return;

      // Verificar se o pagamento está em um estado que precisa ser monitorado
      const needsMonitoring = ['pending', 'in_process'].includes(paymentData.status);

      // Se o pagamento não precisa ser monitorado, não fazer nada
      if (!needsMonitoring) {
        return;
      }

      const paymentId = paymentData.id;
      if (paymentId === 'N/A') return;

      // Marcar que o listener está configurado
      listenerConfigured.current = true;

      // Configurar um intervalo para verificar o status do pagamento periodicamente
      const pollInterval = setInterval(async () => {
        try {
          // Verificar o status do pagamento
          const paymentRef = doc(db, 'payments', paymentId);
          const docSnap = await getDoc(paymentRef);

          if (docSnap.exists()) {
            const updatedPaymentData = docSnap.data();

            // Normalizar e atualizar os dados do pagamento
            const normalizedData = normalizePaymentData({
              ...updatedPaymentData,
              id: docSnap.id
            });

            // Atualizar o estado apenas se houver mudanças
            if (normalizedData.status !== paymentData.status) {
              setPaymentData(normalizedData);

              // Se o pagamento não está mais pendente, parar o polling
              if (!['pending', 'in_process'].includes(normalizedData.status)) {
                clearInterval(pollInterval);
                listenerConfigured.current = false;

                // Se o pagamento foi aprovado, mostrar uma notificação
                if (normalizedData.status === 'approved') {
                  showMessage('Pagamento Aprovado', 'Seu pagamento foi aprovado com sucesso!');
                } else if (normalizedData.status === 'rejected') {
                  showMessage('Pagamento Rejeitado', 'Seu pagamento foi rejeitado. Por favor, tente outro método de pagamento.');
                } else if (normalizedData.status === 'cancelled') {
                  showMessage('Pagamento Cancelado', 'Este pagamento foi cancelado.');
                }
              }
            }
          } else {
            console.log('Documento de pagamento não encontrado');
            // Se o documento não existe mais, parar o polling
            clearInterval(pollInterval);
            listenerConfigured.current = false;
          }
        } catch (error) {
          console.error('Erro ao verificar status do pagamento:', error);

          // Se o erro persistir após algumas tentativas, parar o polling
          if (error.code === 'permission-denied') {
            console.log('Erro de permissão persistente, parando verificações');
            clearInterval(pollInterval);
            listenerConfigured.current = false;
          }
        }
      }, 5000); // Verificar a cada 5 segundos

      // Função de limpeza que será chamada quando a tela perder o foco
      return () => {
        clearInterval(pollInterval);
        listenerConfigured.current = false;
      };
    }, [paymentData?.id, paymentData?.status]) // Dependências: apenas ID e status do pagamento
  );


  // Função para normalizar os dados do pagamento
  const normalizePaymentData = (rawData) => {
    if (!rawData) {
      return null;
    }

    try {
      // Extrair valores com segurança
      const normalizedData = {
        id: rawData.id || rawData.paymentId || 'N/A',
        status: rawData.status || 'pending',
        payment_type_id: rawData.payment_type_id || rawData.paymentMethod ||
          (rawData.payment_method && rawData.payment_method.id) || 'N/A',
        transaction_amount: 0, // Será definido abaixo
        date_created: new Date().toISOString(), // Valor padrão
        description: rawData.description || 'Pagamento',
        date_of_expiration: rawData.date_of_expiration || null,
        fine_configuration: rawData.fine_configuration || null,
        descricaoDetalhada: rawData.descricaoDetalhada || null,
        userName: rawData.userName || 'N/A',
        userEmail: rawData.userEmail || 'N/A',
        multa: rawData.multa || null,
        motoInfo: rawData.motoInfo || null,
        periodoLocacao: rawData.periodoLocacao || null,
        tipoRecorrencia: rawData.tipoRecorrencia || 'mensal',
        originalData: rawData
      };

      // Processar o valor da transação com segurança
      if (typeof rawData.transaction_amount === 'number') {
        normalizedData.transaction_amount = rawData.transaction_amount;
      } else if (typeof rawData.amount === 'number') {
        normalizedData.transaction_amount = rawData.amount;
      } else {
        // Tentar converter para número
        const parsedAmount = parseFloat(rawData.transaction_amount || rawData.amount || 0);
        normalizedData.transaction_amount = isNaN(parsedAmount) ? 0 : parsedAmount;
      }

      // Processar a data com segurança
      if (rawData.date_created) {
        normalizedData.date_created = rawData.date_created;
      } else if (rawData.dateCreated) {
        if (rawData.dateCreated.seconds) {
          // Timestamp do Firestore
          normalizedData.date_created = new Date(rawData.dateCreated.seconds * 1000).toISOString();
        } else if (rawData.dateCreated.toDate) {
          // Objeto Timestamp do Firestore com método toDate
          normalizedData.date_created = rawData.dateCreated.toDate().toISOString();
        } else if (rawData.dateCreated instanceof Date) {
          // Objeto Date
          normalizedData.date_created = rawData.dateCreated.toISOString();
        } else if (typeof rawData.dateCreated === 'string') {
          // String de data
          normalizedData.date_created = rawData.dateCreated;
        }
      }

      return normalizedData;
    } catch (error) {
      console.error('Erro ao normalizar dados do pagamento:', error);
      // Retornar um objeto mínimo para evitar erros de renderização
      return {
        id: rawData.id || 'error',
        status: 'error',
        payment_type_id: 'N/A',
        transaction_amount: 0,
        date_created: new Date().toISOString(),
        description: 'Erro ao processar pagamento',
        userName: 'N/A',
        userEmail: 'N/A',
        originalData: rawData
      };
    }
  };

  // Se ainda não temos os dados processados, mostrar carregamento
  if (isLoading || !paymentData) {
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
      let message = `
      Pagamento ${formatStatus(paymentData.status)}
      Valor: R$ ${paymentData.transaction_amount.toFixed(2)}
      Método: ${formatPaymentType(paymentData.payment_type_id)}
      Data: ${formatDate(paymentData.date_created)}
      ID: ${paymentData.id}
      ${paymentData.description ? `Descrição: ${paymentData.description}` : ''}
    `;

      // Adicionar informações de multa se existirem
      if (paymentData.multa) {
        message += `
      
      INFORMAÇÕES DE MULTA:
      Valor Original: R$ ${paymentData.multa.valorOriginal.toFixed(2)}
      Multa: R$ ${paymentData.multa.valorMulta.toFixed(2)}
      Dias de Atraso: ${paymentData.multa.diasAtraso}
      `;
      }

      // Adicionar informações da moto se existirem
      if (paymentData.motoInfo) {
        message += `
      
      DETALHES DA MOTO:
      Modelo: ${paymentData.motoInfo.modelo}
      Placa: ${paymentData.motoInfo.placa}
      `;
      }

      // Adicionar período de locação se existir
      if (paymentData.periodoLocacao) {
        message += `
      Período: ${paymentData.periodoLocacao}
      `;
      }

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

  const getPixQrCode = () => {
    const data = paymentData?.originalData || {};

    // Verificar se point_of_interaction existe antes de acessar suas propriedades
    if (data.point_of_interaction &&
      data.point_of_interaction.transaction_data &&
      data.point_of_interaction.transaction_data.qr_code_base64) {
      return data.point_of_interaction.transaction_data.qr_code_base64;
    }

    // Verificar o caminho alternativo com segurança
    if (data.paymentDetails &&
      data.paymentDetails.point_of_interaction &&
      data.paymentDetails.point_of_interaction.transaction_data &&
      data.paymentDetails.point_of_interaction.transaction_data.qr_code_base64) {
      return data.paymentDetails.point_of_interaction.transaction_data.qr_code_base64;
    }

    return null;
  };

  // Modifique a função getPixCode de forma similar
  const getPixCode = () => {
    const data = paymentData?.originalData || {};

    // Verificar com segurança
    if (data.point_of_interaction &&
      data.point_of_interaction.transaction_data &&
      data.point_of_interaction.transaction_data.qr_code) {
      return data.point_of_interaction.transaction_data.qr_code;
    }

    if (data.paymentDetails &&
      data.paymentDetails.point_of_interaction &&
      data.paymentDetails.point_of_interaction.transaction_data &&
      data.paymentDetails.point_of_interaction.transaction_data.qr_code) {
      return data.paymentDetails.point_of_interaction.transaction_data.qr_code;
    }

    return '';
  };

  // Modifique a função getBarcodeText
  const getBarcodeText = () => {
    const data = paymentData?.originalData || {};

    if (data.paymentDetails &&
      data.paymentDetails.transaction_details &&
      data.paymentDetails.transaction_details.digitable_line) {
      return data.paymentDetails.transaction_details.digitable_line;
    }

    return 'Código de barras disponível apenas no boleto';
  };

  // Modifique a função getBoletoUrl
  const getBoletoUrl = () => {
    const data = paymentData?.originalData || {};

    // Verificar cada caminho com segurança
    if (data.transaction_details &&
      data.transaction_details.external_resource_url) {
      return data.transaction_details.external_resource_url;
    }

    if (data.paymentDetails &&
      data.paymentDetails.transaction_details &&
      data.paymentDetails.transaction_details.external_resource_url) {
      return data.paymentDetails.transaction_details.external_resource_url;
    }

    if (data.point_of_interaction &&
      data.point_of_interaction.transaction_data &&
      data.point_of_interaction.transaction_data.ticket_url) {
      return data.point_of_interaction.transaction_data.ticket_url;
    }

    if (data.paymentDetails &&
      data.paymentDetails.point_of_interaction &&
      data.paymentDetails.point_of_interaction.transaction_data &&
      data.paymentDetails.point_of_interaction.transaction_data.ticket_url) {
      return data.paymentDetails.point_of_interaction.transaction_data.ticket_url;
    }

    return null;
  };

  // Função para copiar texto para a área de transferência
  const copyToClipboard = async (text) => {
    if (!text || text === 'Código de barras disponível apenas no boleto') {
      showMessage('Informação', 'O código completo está disponível apenas no boleto. Por favor, use a opção "Abrir Boleto".');
      return;
    }

    try {
      await Clipboard.setStringAsync(text);
      showMessage('Copiado!', 'Código copiado para a área de transferência.');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      showMessage('Erro', 'Não foi possível copiar o texto.');
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

          {paymentData.multa?.valorMulta && (
            <InfoRow>
              <InfoLabel style={{ color: 'red' }}>Multa:</InfoLabel>
              <InfoValue style={{ color: 'red' }}>R$ {paymentData.multa.valorMulta.toFixed(2)}</InfoValue>
            </InfoRow>
          )}

          {paymentData.multa?.diasAtraso && (
            <InfoRow>
              <InfoLabel style={{ color: 'red' }}>Dias de Atraso:</InfoLabel>
              <InfoValue style={{ color: 'red' }}>{paymentData.multa.diasAtraso}</InfoValue>
            </InfoRow>
          )}

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

          {paymentData.originalData?.date_of_expiration && isBoleto && (
            <InfoRow>
              <InfoLabel>Vencimento:</InfoLabel>
              <InfoValue>{formatDate(paymentData.originalData.date_of_expiration)}</InfoValue>
            </InfoRow>
          )}

          {paymentData.originalData?.fine_configuration && isBoleto && (
            <InfoRow>
              <InfoLabel>Multa após vencimento:</InfoLabel>
              <InfoValue>
                {paymentData.originalData.fine_configuration.percentage}% +
                R$ {paymentData.originalData.fine_configuration.daily_value.toFixed(2)}/dia
              </InfoValue>
            </InfoRow>
          )}

          {paymentData.userName !== 'N/A' && (
            <InfoRow>
              <InfoLabel>Nome:</InfoLabel>
              <InfoValue>{paymentData.userName}</InfoValue>
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
          onPress={() => navigation.navigate('Financeiro Screen')}
          style={{ marginTop: 20 }}
        >
          <ButtonText>Voltar para Financeiro</ButtonText>
        </Button>
      </ScrollView>
    </Container>
  );
};

export default PaymentSuccess;
