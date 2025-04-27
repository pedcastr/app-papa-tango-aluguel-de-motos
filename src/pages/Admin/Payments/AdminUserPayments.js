import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { db } from '../../../services/firebaseConfig';
import { collection, query, orderBy, getDocs, where, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';

import {
    Container,
    Header,
    BackButton,
    HeaderTitle,
    UserInfo,
    UserName,
    UserEmail,
    PaymentCard,
    PaymentHeader,
    PaymentTitle,
    StatusBadge,
    StatusText,
    PaymentAmount,
    PaymentInfo,
    PaymentInfoRow,
    PaymentInfoLabel,
    PaymentInfoValue,
    PaymentActions,
    ActionButton,
    ActionButtonText,
    EmptyContainer,
    EmptyText,
    LoadingContainer,
    AddButton,
    AddButtonText
} from './styles';

export default function AdminUserPayments() {
    const navigation = useNavigation();
    const route = useRoute();
    const { userEmail, userName } = route.params;
    
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [userContract, setUserContract] = useState(null);
    
    // Função para carregar os pagamentos do usuário
    const loadUserPayments = async () => {
        try {
            setLoading(true);
            
            // Buscar pagamentos do usuário
            const paymentsRef = collection(db, 'payments');
            const paymentsQuery = query(
                paymentsRef,
                where('userEmail', '==', userEmail),
                orderBy('dateCreated', 'desc')
            );
            
            const paymentsSnapshot = await getDocs(paymentsQuery);
            
            // Mapear documentos para o formato necessário
            const paymentsData = paymentsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    status: data.status || 'pending',
                    payment_type_id: data.paymentMethod || 'pix',
                    transaction_amount: data.amount || 0,
                    date_created: data.dateCreated || null,
                    date_approved: data.date_approved || null,
                    description: data.description || 'Pagamento',
                    createdAt: data.dateCreated || null,
                    userEmail: data.userEmail,
                    userName: data.userName
                };
            });
            
            setPayments(paymentsData);
            
            // Buscar contrato do usuário
            const contratosRef = collection(db, 'contratos');
            const contratoQuery = query(contratosRef, where('cliente', '==', userEmail));
            const contratoSnapshot = await getDocs(contratoQuery);
            
            if (!contratoSnapshot.empty) {
                const contratoData = contratoSnapshot.docs[0].data();
                tipoRecorrencia = contratoData.tipoRecorrenciaPagamento || 'mensal';
                
                // Buscar aluguel associado ao contrato
                let valorMensal = 0;
                let valorSemanal = 0;
                let tipoRecorrencia = 'mensal';

                if (contratoData.aluguelId) {
                    const aluguelRef = doc(db, 'alugueis', contratoData.aluguelId);
                    const aluguelSnapshot = await getDoc(aluguelRef);
                    
                    if (aluguelSnapshot.exists()) {
                        const aluguelData = aluguelSnapshot.data();
                        valorMensal = aluguelData.valorMensal || 0;
                        valorSemanal = aluguelData.valorSemanal || 0;
                        
                        // Buscar moto associada ao aluguel
                        let motoModelo = 'N/A';
                        let motoPlaca = 'N/A';
                        
                        if (contratoData.motoId) {
                            const motoRef = doc(db, 'motos', contratoData.motoId);
                            const motoSnapshot = await getDoc(motoRef);
                            
                            if (motoSnapshot.exists()) {
                                const motoData = motoSnapshot.data();
                                motoModelo = motoData.modelo || 'N/A';
                                motoPlaca = motoData.placa || 'N/A';
                            }
                        }
                        
                        setUserContract({
                            dataInicio: contratoData.dataInicio,
                            dataFim: null,
                            valorMensal: aluguelData.valorMensal || 0,
                            valorSemanal: aluguelData.valorSemanal || 0,
                            tipoRecorrencia,
                            modeloMoto: motoModelo,
                            placaMoto: motoPlaca
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao carregar pagamentos do usuário:', error);
            Alert.alert('Erro', 'Não foi possível carregar os pagamentos deste usuário.');
        } finally {
            setLoading(false);
        }
    };
    
    // Carregar pagamentos ao montar o componente
    useEffect(() => {
        loadUserPayments();
    }, [userEmail]);
    
    // Função para formatar data
    const formatDate = (date) => {
        if (!date) return 'N/A';
        
        // Verificar se date é um objeto Date
        if (!(date instanceof Date)) {
            console.warn('formatDate recebeu um valor que não é Date:', date);
            return 'Data inválida';
        }
        
        try {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
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
            default:
                return type || 'N/A';
        }
    };
    
    // Função para ver detalhes de um pagamento
    const viewPaymentDetails = (payment) => {
        navigation.navigate('AdminPaymentDetails', { paymentInfo: payment });
    };
    
    // Função para enviar lembrete de pagamento
    const sendPaymentReminder = async () => {
        try {
            if (!userContract) {
                Alert.alert('Erro', 'Não foi possível encontrar um contrato ativo para este usuário.');
                return;
            }
            
            // Criar solicitação de notificação
            const notificationRef = collection(db, 'notificationRequests');
            await addDoc(notificationRef, {
                userEmail: userEmail,
                title: 'Lembrete de Pagamento',
                body: `Seu pagamento de R$ ${userContract.valorMensal.toFixed(2)} está pendente. Clique para efetuar o pagamento.`,
                data: {
                    screen: 'Financeiro',
                    type: 'payment_reminder'
                },
                status: 'pending',
                createdAt: Timestamp.now()
            });
            
            Alert.alert('Sucesso', 'Lembrete de pagamento enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar lembrete:', error);
            Alert.alert('Erro', 'Não foi possível enviar o lembrete de pagamento.');
        }
    };
    
    // Função para registrar pagamento manual
    const registerManualPayment = () => {
        if (!userContract) {
            Alert.alert('Erro', 'Não foi possível encontrar um contrato ativo para este usuário.');
            return;
        }

        // Determinar qual valor usar baseado no tipo de recorrência
        const valorPagamento = userContract.tipoRecorrencia === 'semanal' 
        ? userContract.valorSemanal 
        : userContract.valorMensal;
        
        Alert.alert(
            'Registrar Pagamento',
            `Deseja registrar um pagamento manual de ${formatCurrency(valorPagamento)} para ${userName}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            // Adicionar pagamento ao Firestore
                            const paymentsRef = collection(db, 'payments');
                            const now = new Date();
                            
                            await addDoc(paymentsRef, {
                                userEmail: userEmail,
                                userName: userName,
                                status: 'approved',
                                paymentMethod: 'manual',
                                amount: valorPagamento,
                                description: `Pagamento ${userContract.tipoRecorrencia} registrado manualmente`,
                                dateCreated: Timestamp.fromDate(now),
                                date_approved: Timestamp.fromDate(now),
                                registeredBy: 'admin'
                            });
                            
                            // Enviar notificação ao usuário
                            const notificationRef = collection(db, 'notificationRequests');
                            await addDoc(notificationRef, {
                                userEmail: userEmail,
                                title: 'Pagamento Registrado',
                                body: `Um pagamento de R$ ${userContract.valorMensal.toFixed(2)} foi registrado em sua conta.`,
                                data: {
                                    screen: 'Financeiro',
                                    type: 'payment_registered'
                                },
                                status: 'pending',
                                createdAt: Timestamp.now()
                            });
                            
                            Alert.alert('Sucesso', 'Pagamento registrado com sucesso!');
                            loadUserPayments(); // Recarregar pagamentos
                        } catch (error) {
                            console.error('Erro ao registrar pagamento:', error);
                            Alert.alert('Erro', 'Não foi possível registrar o pagamento.');
                        }
                    }
                }
            ]
        );
    };
    
    // Renderizar item da lista
    const renderPaymentItem = ({ item }) => (
        <PaymentCard>
            <PaymentHeader>
                <PaymentTitle>{item.description || 'Pagamento'}</PaymentTitle>
                <StatusBadge style={{ backgroundColor: getStatusColor(item.status) }}>
                    <StatusText>{formatStatus(item.status)}</StatusText>
                </StatusBadge>
            </PaymentHeader>
            
            <PaymentAmount>{formatCurrency(item.transaction_amount)}</PaymentAmount>
            
            <PaymentInfo>
                <PaymentInfoRow>
                    <PaymentInfoLabel>Data:</PaymentInfoLabel>
                    <PaymentInfoValue>{formatDate(item.createdAt)}</PaymentInfoValue>
                </PaymentInfoRow>
                
                <PaymentInfoRow>
                    <PaymentInfoLabel>Método:</PaymentInfoLabel>
                    <PaymentInfoValue>{formatPaymentType(item.payment_type_id)}</PaymentInfoValue>
                </PaymentInfoRow>
                
                {item.status === 'approved' && item.date_approved && (
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Aprovado em:</PaymentInfoLabel>
                        <PaymentInfoValue>{formatDate(item.date_approved)}</PaymentInfoValue>
                    </PaymentInfoRow>
                )}
                
                <PaymentInfoRow>
                    <PaymentInfoLabel>ID:</PaymentInfoLabel>
                    <PaymentInfoValue>{item.id.substring(0, 10)}...</PaymentInfoValue>
                </PaymentInfoRow>
            </PaymentInfo>
            
            <PaymentActions>
                <ActionButton 
                    onPress={() => viewPaymentDetails(item)}
                    style={{ backgroundColor: '#007bff' }}
                >
                    <Feather name="eye" size={16} color="#FFF" />
                    <ActionButtonText>Ver Detalhes</ActionButtonText>
                </ActionButton>
            </PaymentActions>
        </PaymentCard>
    );
    
    // Renderizar conteúdo vazio
    const renderEmptyContent = () => (
        <EmptyContainer>
            <Feather name="dollar-sign" size={50} color="#CCC" />
            <EmptyText>Nenhum pagamento encontrado para este usuário.</EmptyText>
        </EmptyContainer>
    );
    
    return (
        <Container>
            <Header>
                <BackButton onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </BackButton>
                <HeaderTitle>Histórico de Pagamentos</HeaderTitle>
                <View style={{ width: 40 }} />
            </Header>
            
            <UserInfo>
                <UserName>{userName}</UserName>
                <UserEmail>{userEmail}</UserEmail>
                
                {userContract && (
                    <View style={{ marginTop: 10 }}>
                        <PaymentInfoRow>
                            <PaymentInfoLabel>Contrato:</PaymentInfoLabel>
                            <PaymentInfoValue>
                                {formatDate(userContract.dataInicio?.toDate())} - {userContract.dataFim ? formatDate(userContract.dataFim.toDate()) : 'Atual'}
                            </PaymentInfoValue>
                        </PaymentInfoRow>
                        
                        <PaymentInfoRow>
                            <PaymentInfoLabel>Recorrência:</PaymentInfoLabel>
                            <PaymentInfoValue>
                                {userContract.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'}
                            </PaymentInfoValue>
                        </PaymentInfoRow>
                        
                        <PaymentInfoRow>
                            <PaymentInfoLabel>
                                Valor {userContract.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'}:
                            </PaymentInfoLabel>
                            <PaymentInfoValue>
                                {formatCurrency(userContract.tipoRecorrencia === 'semanal' ? userContract.valorSemanal : userContract.valorMensal)}
                            </PaymentInfoValue>
                        </PaymentInfoRow>
                        
                        <PaymentInfoRow>
                            <PaymentInfoLabel>Moto:</PaymentInfoLabel>
                            <PaymentInfoValue>{userContract.modeloMoto || 'N/A'} ({userContract.placaMoto || 'N/A'})</PaymentInfoValue>
                        </PaymentInfoRow>
                    </View>
                )}
                
                <View style={{ flexDirection: 'row', marginTop: 16 }}>
                    <ActionButton 
                        onPress={sendPaymentReminder}
                        style={{ backgroundColor: '#ffc107', flex: 1, marginRight: 8 }}
                    >
                        <Feather name="bell" size={16} color="#FFF" />
                        <ActionButtonText>Enviar Lembrete</ActionButtonText>
                    </ActionButton>
                    
                    <ActionButton 
                        onPress={registerManualPayment}
                        style={{ backgroundColor: '#28a745', flex: 1, marginLeft: 8 }}
                    >
                        <Feather name="check-circle" size={16} color="#FFF" />
                        <ActionButtonText>Registrar Pagamento</ActionButtonText>
                    </ActionButton>
                </View>
            </UserInfo>
            
            {loading ? (
                <LoadingContainer>
                    <ActivityIndicator size="large" color="#CB2921" />
                </LoadingContainer>
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPaymentItem}
                    ListEmptyComponent={renderEmptyContent}
                    contentContainerStyle={{ 
                        flexGrow: 1,
                        paddingHorizontal: 16,
                        paddingBottom: 20
                    }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </Container>
    );
}
