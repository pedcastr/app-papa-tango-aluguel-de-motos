import React from 'react';
import { View, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { db } from '../../../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

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
    Divider
} from './styles';

export default function AdminPaymentDetails() {
    const navigation = useNavigation();
    const route = useRoute();
    const { paymentInfo } = route.params;
    
    // Função para formatar data
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
    
    // Função para marcar pagamento como aprovado manualmente
    const approvePayment = async () => {
        if (paymentInfo.status === 'approved') {
            Alert.alert('Aviso', 'Este pagamento já está aprovado.');
            return;
        }
        
        Alert.alert(
            'Aprovar Pagamento',
            'Tem certeza que deseja aprovar este pagamento manualmente?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Aprovar',
                    onPress: async () => {
                        try {
                            const paymentRef = doc(db, 'payments', paymentInfo.id);
                            await updateDoc(paymentRef, {
                                status: 'approved',
                                date_approved: new Date(),
                                approvedBy: 'admin'
                            });
                            
                            Alert.alert('Sucesso', 'Pagamento aprovado com sucesso!');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Erro ao aprovar pagamento:', error);
                            Alert.alert('Erro', 'Não foi possível aprovar o pagamento.');
                        }
                    }
                }
            ]
        );
    };
    
    // Função para cancelar pagamento
    const cancelPayment = async () => {
        if (['cancelled', 'rejected'].includes(paymentInfo.status)) {
            Alert.alert('Aviso', 'Este pagamento já está cancelado ou rejeitado.');
            return;
        }
        
        Alert.alert(
            'Cancelar Pagamento',
            'Tem certeza que deseja cancelar este pagamento?',
            [
                {
                    text: 'Não',
                    style: 'cancel'
                },
                {
                    text: 'Sim, Cancelar',
                    onPress: async () => {
                        try {
                            const paymentRef = doc(db, 'payments', paymentInfo.id);
                            await updateDoc(paymentRef, {
                                status: 'cancelled',
                                cancelledAt: new Date(),
                                cancelledBy: 'admin'
                            });
                            
                            Alert.alert('Sucesso', 'Pagamento cancelado com sucesso!');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Erro ao cancelar pagamento:', error);
                            Alert.alert('Erro', 'Não foi possível cancelar o pagamento.');
                        }
                    }
                }
            ]
        );
    };
    
    // Função para enviar comprovante por email
    const sendReceipt = async () => {
        if (paymentInfo.status !== 'approved') {
            Alert.alert('Aviso', 'Só é possível enviar comprovante para pagamentos aprovados.');
            return;
        }
        
        Alert.alert(
            'Enviar Comprovante',
            `Deseja enviar um comprovante deste pagamento para ${paymentInfo.userEmail}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Enviar',
                    onPress: async () => {
                        try {
                            // Aqui você implementaria a lógica para enviar o email
                            // Por exemplo, usando uma Cloud Function do Firebase
                            
                            Alert.alert('Sucesso', 'Comprovante enviado com sucesso!');
                        } catch (error) {
                            console.error('Erro ao enviar comprovante:', error);
                            Alert.alert('Erro', 'Não foi possível enviar o comprovante.');
                        }
                    }
                }
            ]
        );
    };
    
    return (
        <Container>
            <Header>
                <BackButton onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </BackButton>
                <HeaderTitle>Detalhes do Pagamento</HeaderTitle>
                <View style={{ width: 40 }} />
            </Header>
            
            <ScrollView 
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
            >
                <Card>
                    <CardTitle>{paymentInfo.description || 'Pagamento'}</CardTitle>
                    
                    <StatusBadge style={{ backgroundColor: getStatusColor(paymentInfo.status) }}>
                        <StatusText>{formatStatus(paymentInfo.status)}</StatusText>
                    </StatusBadge>
                    
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
                    
                    {paymentInfo.status === 'approved' && (
                        <ActionButton 
                            onPress={sendReceipt}
                            style={{ backgroundColor: '#007bff', marginTop: 12 }}
                        >
                            <Feather name="mail" size={16} color="#FFF" />
                            <ActionButtonText>Enviar Comprovante</ActionButtonText>
                        </ActionButton>
                    )}
                </Card>
            </ScrollView>
        </Container>
    );
}
