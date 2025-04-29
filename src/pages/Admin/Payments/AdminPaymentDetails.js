import React, { useState } from 'react';
import { View, ScrollView, Alert, Platform, Share, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { db } from '../../../services/firebaseConfig';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
    Container,
    Header,
    BackButton,
    HeaderTitle,
    Card,
    CardTitle,
    CardSection,
    SectionTitle,
    DetailRow,
    DetailLabel,
    DetailValue,
    StatusBadge,
    StatusText,
    PaymentAmount,
    ActionButton,
    ActionButtonText,
    Divider,
    QRCodeContainer,
    QRCodeImage,
    CodeContainer,
    CodeText,
    CopyButton,
    CopyButtonText,
    LinkButton,
    LinkButtonText
} from './styles';

export default function AdminPaymentDetails() {
    const navigation = useNavigation();
    const route = useRoute();
    const { paymentInfo } = route.params;
    const [codeCopied, setCodeCopied] = useState(false);

    // Função para mostrar alerta em qualquer plataforma
    const showConfirmation = (title, message, onConfirm) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}\n\n${message}`)) {
                onConfirm();
            }
        } else {
            Alert.alert(title, message, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Confirmar', onPress: onConfirm }
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

    // Função para formatar data
    const formatDate = (date) => {
        if (!date) return 'N/A';
        
        try {
            // Se for um timestamp do Firestore
            if (date && typeof date.toDate === 'function') {
                date = date.toDate();
            }
            
            // Se for uma string de data
            if (typeof date === 'string') {
                date = new Date(date);
            }
            
            // Verificar se é um objeto Date válido
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                console.warn('Data inválida:', date);
                return 'Data inválida';
            }
            
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error, date);
            return 'Erro na data';
        }
    };

    // Função para formatar valor
    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return `R$ ${parseFloat(value).toFixed(2)}`;
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
            case 'manual':
                return 'Pagamento Manual';
            default:
                return type || 'N/A';
        }
    };

    // Função para copiar código para a área de transferência
    const copyToClipboard = (text) => {
        if (Platform.OS === 'web') {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 3000);
                })
                .catch(err => {
                    console.error('Erro ao copiar texto: ', err);
                    showMessage('Erro', 'Não foi possível copiar o código');
                });
        } else {
            Clipboard.setString(text);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 3000);
        }
    };

    // Função para compartilhar código
    const shareCode = async (code, type) => {
        try {
            const result = await Share.share({
                message: `Código ${type === 'pix' ? 'PIX' : 'de Boleto'} para pagamento: ${code}`,
                title: `Compartilhar código ${type === 'pix' ? 'PIX' : 'de Boleto'}`
            });
        } catch (error) {
            showMessage('Erro', 'Não foi possível compartilhar o código');
        }
    };

    // Função para enviar email com código PIX ou boleto
    const sendPaymentInfoByEmail = async () => {
        try {
            const isPix = paymentInfo.payment_type_id === 'pix';
            const isBoleto = ['ticket', 'boleto'].includes(paymentInfo.payment_type_id);
            
            if (!isPix && !isBoleto) {
                showMessage('Aviso', 'Esta função só está disponível para pagamentos PIX ou Boleto');
                return;
            }
            
            // Preparar dados para o email
            let emailSubject, emailBody, paymentData;
            
            if (isPix) {
                const qrCode = paymentInfo.paymentDetails?.point_of_interaction?.transaction_data?.qr_code || '';
                
                emailSubject = `Código PIX para pagamento - Papa Tango`;
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                        </div>
                        <h2 style="color: #CB2921; text-align: center;">Código PIX para Pagamento</h2>
                        <p>Olá, ${paymentInfo.userName || 'Cliente'},</p>
                        <p>Segue abaixo o código PIX para o pagamento de <strong>${formatCurrency(paymentInfo.transaction_amount)}</strong>:</p>
                        
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                            <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Copie o código PIX abaixo:</p>
                            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px dashed #ccc; font-family: monospace; font-size: 12px;">
                                ${qrCode}
                            </p>
                        </div>
                        
                        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                            Este é um email automático. Por favor, não responda a este email.
                        </p>
                    </div>
                `;
                
                paymentData = {
                    id: paymentInfo.id,
                    amount: paymentInfo.transaction_amount,
                    paymentMethod: 'pix',
                    qrCode: qrCode,
                };
            } else {
                // Boleto
                const barcodeContent = paymentInfo.paymentDetails?.transaction_details?.barcode?.content || '';
                const digitableLine = paymentInfo.paymentDetails?.transaction_details?.barcode?.content || '';
                const boletoUrl = paymentInfo.paymentDetails?.transaction_details?.external_resource_url || '';
                
                emailSubject = `Boleto para pagamento - Papa Tango`;
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                        </div>
                        <h2 style="color: #CB2921; text-align: center;">Boleto para Pagamento</h2>
                        <p>Olá ${paymentInfo.userName || 'Cliente'},</p>
                        <p>Segue abaixo o boleto para o pagamento de <strong>${formatCurrency(paymentInfo.transaction_amount)}</strong>:</p>
                        
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                            <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Linha digitável do boleto:</p>
                            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px dashed #ccc; font-family: monospace; font-size: 12px;">
                                ${digitableLine}
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${boletoUrl}" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Visualizar Boleto
                            </a>
                        </div>
                        
                        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                            Este é um email automático. Por favor, não responda a este email.
                        </p>
                    </div>
                `;
                
                paymentData = {
                    id: paymentInfo.id,
                    amount: paymentInfo.transaction_amount,
                    paymentMethod: 'boleto',
                    barcodeContent: barcodeContent,
                    digitableLine: digitableLine,
                    boletoUrl: boletoUrl
                };
            }
            
            // Criar solicitação de email no Firestore
            const requestId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            
            await setDoc(doc(db, 'emailRequests', requestId), {
                to: paymentInfo.userEmail,
                subject: emailSubject,
                html: emailBody,
                paymentInfo: paymentData,
                status: 'pending',
                createdAt: serverTimestamp(),
                sentBy: 'admin'
            });
            
            showMessage('Sucesso', 'Email enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            showMessage('Erro', 'Não foi possível enviar o email.');
        }
    };

    // Função para marcar pagamento como aprovado manualmente
    const approvePayment = async () => {
        if (paymentInfo.status === 'approved') {
            showMessage('Aviso', 'Este pagamento já está aprovado.');
            return;
        }
        
        showConfirmation(
            'Aprovar Pagamento',
            'Tem certeza que deseja aprovar este pagamento manualmente?',
            async () => {
                try {
                    const paymentRef = doc(db, 'payments', paymentInfo.id);
                    await updateDoc(paymentRef, {
                        status: 'approved',
                        date_approved: new Date(),
                        approvedBy: 'admin'
                    });
                    
                    showMessage('Sucesso', 'Pagamento aprovado com sucesso!');
                    navigation.goBack();
                } catch (error) {
                    console.error('Erro ao aprovar pagamento:', error);
                    showMessage('Erro', 'Não foi possível aprovar o pagamento.');
                }
            }
        );
    };

    // Função para cancelar pagamento
    const cancelPayment = async () => {
        if (['cancelled', 'rejected'].includes(paymentInfo.status)) {
            showMessage('Aviso', 'Este pagamento já está cancelado ou rejeitado.');
            return;
        }
        
        showConfirmation(
            'Cancelar Pagamento',
            'Tem certeza que deseja cancelar este pagamento?',
            async () => {
                try {
                    const paymentRef = doc(db, 'payments', paymentInfo.id);
                    await updateDoc(paymentRef, {
                        status: 'cancelled',
                        cancelledAt: new Date(),
                        cancelledBy: 'admin'
                    });
                    
                    showMessage('Sucesso', 'Pagamento cancelado com sucesso!');
                    navigation.goBack();
                } catch (error) {
                    console.error('Erro ao cancelar pagamento:', error);
                    showMessage('Erro', 'Não foi possível cancelar o pagamento.');
                }
            }
        );
    };

    // Verificar se o pagamento tem detalhes de PIX
    const hasPixDetails = () => {
        return (
            paymentInfo.payment_type_id === 'pix' && 
            paymentInfo.paymentDetails && 
            paymentInfo.paymentDetails.point_of_interaction && 
            paymentInfo.paymentDetails.point_of_interaction.transaction_data && 
            paymentInfo.paymentDetails.point_of_interaction.transaction_data.qr_code
        );
    };

    // Verificar se o pagamento tem detalhes de boleto
    const hasBoletoDetails = () => {
        return (
            ['ticket', 'boleto'].includes(paymentInfo.payment_type_id) && 
            paymentInfo.paymentDetails && 
            paymentInfo.paymentDetails.transaction_details && 
            paymentInfo.paymentDetails.transaction_details.barcode
        );
    };

    // Obter código PIX
    const getPixCode = () => {
        if (!hasPixDetails()) return '';
        return paymentInfo.paymentDetails.point_of_interaction.transaction_data.qr_code;
    };

    // Obter QR Code PIX em base64
    const getPixQRCodeBase64 = () => {
        if (!hasPixDetails()) return '';
        return paymentInfo.paymentDetails.point_of_interaction.transaction_data.qr_code_base64;
    };

    // Obter código de barras do boleto
    const getBoletoBarcode = () => {
        if (!hasBoletoDetails()) return '';
        return paymentInfo.paymentDetails.transaction_details.barcode.content;
    };

    // Obter linha digitável do boleto
    const getBoletoDigitableLine = () => {
        if (!hasBoletoDetails()) return '';
        return paymentInfo.paymentDetails.transaction_details.barcode.content;
    };

    // Obter URL do boleto
    const getBoletoUrl = () => {
        if (!hasBoletoDetails()) return '';
        return paymentInfo.paymentDetails.transaction_details.external_resource_url;
    };

    // Abrir URL do boleto
    const openBoletoUrl = () => {
        const url = getBoletoUrl();
        if (url) {
            Linking.openURL(url).catch(err => {
                console.error('Erro ao abrir URL do boleto:', err);
                showMessage('Erro', 'Não foi possível abrir o boleto');
            });
        }
    };

    // Renderizar seção de PIX
    const renderPixSection = () => {
        if (!hasPixDetails()) return null;
        
        const pixCode = getPixCode();
        const qrCodeBase64 = getPixQRCodeBase64();
        
        return (
            <>
                <Divider />
                <CardSection>
                    <SectionTitle>Informações do PIX</SectionTitle>
                    
                    {qrCodeBase64 && (
                        <QRCodeContainer>
                            <QRCodeImage 
                                source={{ uri: `data:image/png;base64,${qrCodeBase64}` }} 
                                style={{ width: 200, height: 200 }}
                                resizeMode="contain"
                            />
                        </QRCodeContainer>
                    )}
                    
                    <CodeContainer>
                        <DetailLabel>Código PIX:</DetailLabel>
                        <CodeText style={{textAlign: 'center'}} numberOfLines={3} ellipsizeMode="middle">
                            {pixCode}
                        </CodeText>
                    </CodeContainer>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                        <CopyButton 
                            onPress={() => copyToClipboard(pixCode)}
                            style={{ backgroundColor: codeCopied ? '#28a745' : '#007bff', flex: 1, marginRight: 8 }}
                        >
                            <Feather name={codeCopied ? "check" : "copy"} size={16} color="#FFF" />
                            <CopyButtonText>{codeCopied ? 'Copiado!' : 'Copiar Código'}</CopyButtonText>
                        </CopyButton>
                        
                        <LinkButton
                            onPress={() => sendPaymentInfoByEmail()}
                            style={{ backgroundColor: '#6c757d', flex: 1, marginLeft: 8 }}
                        >
                            <Feather name="mail" size={16} color="#FFF" />
                            <LinkButtonText>Enviar por Email</LinkButtonText>
                        </LinkButton>
                    </View>
                    
                    <View style={{ marginTop: 8 }}>
                        <LinkButton
                            onPress={() => shareCode(pixCode, 'pix')}
                            style={{ backgroundColor: '#17a2b8' }}
                        >
                            <Feather name="share-2" size={16} color="#FFF" />
                            <LinkButtonText>Compartilhar Código</LinkButtonText>
                        </LinkButton>
                    </View>
                </CardSection>
            </>
        );
    };

    // Renderizar seção de boleto
    const renderBoletoSection = () => {
        if (!hasBoletoDetails()) return null;
        
        const barcodeContent = getBoletoBarcode();
        const digitableLine = getBoletoDigitableLine();
        
        return (
            <>
                <Divider />
                <CardSection>
                    <SectionTitle>Informações do Boleto</SectionTitle>
                    
                    <CodeContainer>
                        <DetailLabel>Linha Digitável:</DetailLabel>
                        <CodeText style={{textAlign: 'center'}} numberOfLines={3} ellipsizeMode="middle">
                            {digitableLine}
                        </CodeText>
                    </CodeContainer>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                        <CopyButton 
                            onPress={() => copyToClipboard(digitableLine)}
                            style={{ backgroundColor: codeCopied ? '#28a745' : '#007bff', flex: 1, marginRight: 8 }}
                        >
                            <Feather name={codeCopied ? "check" : "copy"} size={16} color="#FFF" />
                            <CopyButtonText>{codeCopied ? 'Copiado!' : 'Copiar Código'}</CopyButtonText>
                        </CopyButton>
                        
                        <LinkButton
                            onPress={openBoletoUrl}
                            style={{ backgroundColor: '#6c757d', flex: 1, marginLeft: 8 }}
                        >
                            <Feather name="external-link" size={16} color="#FFF" />
                            <LinkButtonText>Abrir Boleto</LinkButtonText>
                        </LinkButton>
                    </View>
                    
                    <View style={{ marginTop: 8 }}>
                        <LinkButton
                            onPress={() => sendPaymentInfoByEmail()}
                            style={{ backgroundColor: '#17a2b8' }}
                        >
                            <Feather name="mail" size={16} color="#FFF" />
                            <LinkButtonText>Enviar por Email</LinkButtonText>
                        </LinkButton>
                    </View>
                </CardSection>
            </>
        );
    };

    return (
        <Container>
            <Header>
                <BackButton onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </BackButton>
                <HeaderTitle>Detalhes do Pagamento</HeaderTitle>
                <View style={{ width: 40 }} />
            </Header>
            
            <ScrollView
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
            >
                <Card>
                    <StatusBadge style={{ backgroundColor: getStatusColor(paymentInfo.status), alignSelf: 'center', width: '30%', height: 35, marginBottom: 30 }}>
                        <StatusText>{formatStatus(paymentInfo.status)}</StatusText>
                    </StatusBadge>
                    <Divider style={{ marginTop: -10 }} />
                    <CardTitle>{paymentInfo.description || 'Pagamento'}</CardTitle>
                    
                    <PaymentAmount>{formatCurrency(paymentInfo.transaction_amount)}</PaymentAmount>
                    
                    <CardSection>
                        <SectionTitle>Informações do Pagamento</SectionTitle>
                        
                        <DetailRow>
                            <DetailLabel>ID do Pagamento:</DetailLabel>
                            <DetailValue>{paymentInfo.id}</DetailValue>
                        </DetailRow>
                        
                        <DetailRow>
                            <DetailLabel>Data de Criação:</DetailLabel>
                            <DetailValue>{formatDate(paymentInfo.createdAt)}</DetailValue>
                        </DetailRow>
                        
                        {paymentInfo.status === 'approved' && paymentInfo.date_approved && (
                            <DetailRow>
                                <DetailLabel>Data de Aprovação:</DetailLabel>
                                <DetailValue>{formatDate(paymentInfo.date_approved)}</DetailValue>
                            </DetailRow>
                        )}
                        
                        <DetailRow>
                            <DetailLabel>Método de Pagamento:</DetailLabel>
                            <DetailValue>{formatPaymentType(paymentInfo.payment_type_id)}</DetailValue>
                        </DetailRow>
                        
                        {paymentInfo.payment_type_id === 'credit_card' && paymentInfo.card && (
                            <>
                                <DetailRow>
                                    <DetailLabel>Cartão:</DetailLabel>
                                    <DetailValue>
                                        {paymentInfo.card.first_six_digits}...{paymentInfo.card.last_four_digits}
                                    </DetailValue>
                                </DetailRow>
                                
                                <DetailRow>
                                    <DetailLabel>Bandeira:</DetailLabel>
                                    <DetailValue>{paymentInfo.card.payment_method.name}</DetailValue>
                                </DetailRow>
                            </>
                        )}
                        
                        {paymentInfo.registeredBy && (
                            <DetailRow>
                                <DetailLabel>Registrado por:</DetailLabel>
                                <DetailValue>{paymentInfo.registeredBy === 'admin' ? 'Administrador' : paymentInfo.registeredBy}</DetailValue>
                            </DetailRow>
                        )}
                    </CardSection>
                    
                    <Divider />
                    
                    <CardSection>
                        <SectionTitle>Informações do Cliente</SectionTitle>
                        
                        <DetailRow>
                            <DetailLabel>Nome:</DetailLabel>
                            <DetailValue>{paymentInfo.userName || 'N/A'}</DetailValue>
                        </DetailRow>
                        
                        <DetailRow>
                            <DetailLabel>Email:</DetailLabel>
                            <DetailValue>{paymentInfo.userEmail || 'N/A'}</DetailValue>
                        </DetailRow>
                    </CardSection>
                    
                    {/* Renderizar seção de PIX ou Boleto se aplicável */}
                    {hasPixDetails() && renderPixSection()}
                    {hasBoletoDetails() && renderBoletoSection()}
                    
                    <Divider />
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                        {paymentInfo.status !== 'approved' && (
                            <ActionButton
                                onPress={approvePayment}
                                style={{ backgroundColor: '#28a745', flex: 1, marginRight: 8 }}
                            >
                                <Feather name="check-circle" size={16} color="#FFF" />
                                <ActionButtonText>Aprovar</ActionButtonText>
                            </ActionButton>
                        )}
                        
                        {!['cancelled', 'rejected'].includes(paymentInfo.status) && (
                            <ActionButton
                                onPress={cancelPayment}
                                style={{ backgroundColor: '#dc3545', flex: 1, marginLeft: paymentInfo.status !== 'approved' ? 8 : 0 }}
                            >
                                <Feather name="x-circle" size={16} color="#FFF" />
                                <ActionButtonText>Cancelar</ActionButtonText>
                            </ActionButton>
                        )}
                    </View>
                </Card>
            </ScrollView>
        </Container>
    );
}
