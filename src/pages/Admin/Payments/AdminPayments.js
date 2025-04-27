import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { db } from '../../../services/firebaseConfig';
import { collection, query, orderBy, getDocs, where, Timestamp, doc, getDoc, addDoc } from 'firebase/firestore';
import NotificationBell from '../../../components/NotificationBell';

import {
    Container,
    Header,
    HeaderTitle,
    HeaderRight,
    FilterButton,
    FilterButtonText,
    PaymentCard,
    PaymentHeader,
    PaymentTitle,
    PaymentStatus,
    PaymentStatusText,
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
    SearchContainer,
    SearchInput,
    FilterContainer,
    FilterOption,
    FilterOptionText,
    StatusBadge,
    StatusText
} from './styles';

export default function AdminPayments() {
    const navigation = useNavigation();
    
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'paid', 'overdue'
    
    // Função para carregar os pagamentos
    const loadPayments = async () => {
        try {
            setLoading(true);
            
            // Buscar todos os contratos
            const contratosRef = collection(db, 'contratos');
            // Filtrando contratos ativos
            const q = query(contratosRef, where('statusContrato', '==', true));
            const contratosSnapshot = await getDocs(q);
            
            const paymentsData = [];
            
            // Para cada contrato, buscar os pagamentos associados
            for (const contratoDoc of contratosSnapshot.docs) {
                const contratoData = contratoDoc.data();
                
                // Verificar se cliente (email) existe antes de usá-lo em uma consulta
                if (!contratoData.cliente) {
                    console.log('Contrato sem email de cliente:', contratoDoc.id);
                    continue; // Pular este contrato
                }
                
                // Buscar informações do usuário
                const userRef = doc(db, 'users', contratoData.cliente);
                const userSnapshot = await getDoc(userRef);
                
                if (!userSnapshot.exists()) {
                    console.log('Usuário não encontrado:', contratoData.cliente);
                    continue; // Pular este contrato se o usuário não existir
                }
                
                const userData = userSnapshot.data();
                
                // Buscar o aluguel associado ao contrato
                let valorMensal = 0;
                let valorSemanal = 0;
                let tipoRecorrencia = 'mensal'; // Valor padrão

                if (contratoData.aluguelId) {
                    const aluguelRef = doc(db, 'alugueis', contratoData.aluguelId);
                    const aluguelSnapshot = await getDoc(aluguelRef);
                    
                    if (aluguelSnapshot.exists()) {
                        const aluguelData = aluguelSnapshot.data();
                        valorMensal = aluguelData.valorMensal || 0;
                        valorSemanal = aluguelData.valorSemanal || 0;
                    }
                }

                // Obter o tipo de recorrência do contrato
                tipoRecorrencia = contratoData.tipoRecorrenciaPagamento || 'mensal';
                
                // Buscar informações da moto
                let motoPlaca = 'N/A';
                let motoModelo = 'N/A';
                
                if (contratoData.motoId) {
                    const motoRef = doc(db, 'motos', contratoData.motoId);
                    const motoSnapshot = await getDoc(motoRef);
                    
                    if (motoSnapshot.exists()) {
                        const motoData = motoSnapshot.data();
                        motoPlaca = motoData.placa || 'N/A';
                        motoModelo = motoData.modelo || 'N/A';
                    }
                }
                
                // Buscar pagamentos deste usuário
                const paymentsRef = collection(db, 'payments');
                const paymentsQuery = query(
                    paymentsRef,
                    where('userEmail', '==', contratoData.cliente),
                    orderBy('dateCreated', 'desc')
                );
                
                const paymentsSnapshot = await getDocs(paymentsQuery);
                
                // Calcular próximo pagamento
                const dataInicio = contratoData.dataInicio?.toDate() || new Date();
                const hoje = new Date();
                
                // Encontrar a próxima data de pagamento
                let proximaData = new Date(dataInicio);
                while (proximaData < hoje) {
                    proximaData.setMonth(proximaData.getMonth() + 1);
                }
                
                // Verificar se já existe um pagamento para este mês
                const existePagamentoMes = paymentsSnapshot.docs.some(doc => {
                    const paymentData = doc.data();
                    const paymentDate = paymentData.dateCreated?.toDate() || new Date();
                    return paymentDate.getMonth() === proximaData.getMonth() && 
                           paymentDate.getFullYear() === proximaData.getFullYear() &&
                           paymentData.status === 'approved';
                });
                
                // Calcular dias restantes
                const diasRestantes = Math.ceil((proximaData - hoje) / (1000 * 60 * 60 * 24));
                const status = existePagamentoMes ? 'paid' : (diasRestantes < 0 ? 'overdue' : 'pending');
                
                // Adicionar informação de pagamento
                paymentsData.push({
                    id: contratoDoc.id,
                    contratoId: contratoDoc.id,
                    userEmail: contratoData.cliente,
                    userName: userData.nome || userData.nomeCompleto || 'Usuário',
                    userPhoto: userData.photoURL || null,
                    valorMensal,
                    valorSemanal,
                    tipoRecorrencia,
                    proximaData,
                    diasRestantes,
                    status,
                    motoPlaca,
                    motoModelo,
                    ultimoPagamento: paymentsSnapshot.docs.length > 0 ? paymentsSnapshot.docs[0].data() : null
                });
            }
            
            setPayments(paymentsData);
            applyFilters(paymentsData, activeFilter, searchText);
        } catch (error) {
            console.error('Erro ao carregar pagamentos:', error);
            Alert.alert('Erro', 'Não foi possível carregar os pagamentos.');
        } finally {
            setLoading(false);
        }
    };
    
    // Carregar pagamentos ao montar o componente
    useEffect(() => {
        loadPayments();
    }, []);
    
    // Função para aplicar filtros
    const applyFilters = (data, filter, search) => {
        let result = [...data];
        
        // Aplicar filtro de status
        if (filter !== 'all') {
            result = result.filter(item => item.status === filter);
        }
        
        // Aplicar filtro de busca
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(item => 
                item.userName.toLowerCase().includes(searchLower) ||
                item.userEmail.toLowerCase().includes(searchLower) ||
                item.motoPlaca.toLowerCase().includes(searchLower) ||
                item.motoModelo.toLowerCase().includes(searchLower)
            );
        }
        
        setFilteredPayments(result);
    };
    
    // Atualizar filtros quando mudar o texto de busca
    useEffect(() => {
        applyFilters(payments, activeFilter, searchText);
    }, [searchText, activeFilter]);
    
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
        return `R$ ${parseFloat(value).toFixed(2)}`;
    };
    
    // Função para obter cor do status
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return '#28a745';
            case 'pending':
                return '#ffc107';
            case 'overdue':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };
    
    // Função para obter texto do status
    const getStatusText = (status) => {
        switch (status) {
            case 'paid':
                return 'Pago';
            case 'pending':
                return 'Pendente';
            case 'overdue':
                return 'Atrasado';
            default:
                return 'Desconhecido';
        }
    };
    
    // Função para ver detalhes de um usuário
    const viewUserPayments = (userEmail, userName) => {
        navigation.navigate('AdminUserPayments', { userEmail, userName });
    };
    
    // Função para enviar lembrete de pagamento
    const sendPaymentReminder = async (item) => {
        try {
            // Criar solicitação de notificação
            const notificationRef = collection(db, 'notificationRequests');
            await addDoc(notificationRef, {
                userEmail: item.userEmail,
                title: 'Lembrete de Pagamento',
                body: `Seu pagamento de R$ ${item.valorMensal.toFixed(2)} vence em ${item.diasRestantes} dias.`,
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
    
    // Renderizar item da lista
    const renderPaymentItem = ({ item }) => {
        // Determinar qual valor mostrar com base no tipo de recorrência
        const valorExibir = item.tipoRecorrencia === 'semanal' ? item.valorSemanal : item.valorMensal;
        
        return (
            <PaymentCard>
                <PaymentHeader>
                    <PaymentTitle>{item.userName}</PaymentTitle>
                    <StatusBadge style={{ backgroundColor: getStatusColor(item.status) }}>
                        <StatusText>{getStatusText(item.status)}</StatusText>
                    </StatusBadge>
                </PaymentHeader>
                
                <PaymentAmount>{formatCurrency(valorExibir)}</PaymentAmount>
                
                <PaymentInfo>
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Email:</PaymentInfoLabel>
                        <PaymentInfoValue>{item.userEmail}</PaymentInfoValue>
                    </PaymentInfoRow>
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Recorrência:</PaymentInfoLabel>
                        <PaymentInfoValue>
                            {item.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'}
                        </PaymentInfoValue>
                    </PaymentInfoRow>
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Próximo pagamento:</PaymentInfoLabel>
                        <PaymentInfoValue>{formatDate(item.proximaData)}</PaymentInfoValue>
                    </PaymentInfoRow>
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Dias restantes:</PaymentInfoLabel>
                        <PaymentInfoValue
                            style={{
                                color: item.diasRestantes < 0 ? '#dc3545' :
                                      item.diasRestantes <= 5 ? '#ffc107' : '#000'
                            }}
                        >
                            {item.status === 'paid' ? 'Pago' :
                             item.diasRestantes < 0 ? `${Math.abs(item.diasRestantes)} dias atrasado` :
                             `${item.diasRestantes} dias`}
                        </PaymentInfoValue>
                    </PaymentInfoRow>
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Moto:</PaymentInfoLabel>
                        <PaymentInfoValue>{item.motoModelo} ({item.motoPlaca})</PaymentInfoValue>
                    </PaymentInfoRow>
                </PaymentInfo>
                
                <PaymentActions>
                    <ActionButton
                        onPress={() => viewUserPayments(item.userEmail, item.userName)}
                        style={{ backgroundColor: '#007bff' }}
                    >
                        <Feather name="eye" size={16} color="#FFF" />
                        <ActionButtonText>Ver Histórico</ActionButtonText>
                    </ActionButton>
                    
                    {item.status !== 'paid' && (
                        <ActionButton
                            onPress={() => sendPaymentReminder(item)}
                            style={{ backgroundColor: '#ffc107' }}
                        >
                            <Feather name="bell" size={16} color="#FFF" />
                            <ActionButtonText>Lembrete</ActionButtonText>
                        </ActionButton>
                    )}
                </PaymentActions>
            </PaymentCard>
        );
    };
    
    // Renderizar conteúdo vazio
    const renderEmptyContent = () => (
        <EmptyContainer>
            <Feather name="dollar-sign" size={50} color="#CCC" />
            <EmptyText>Nenhum pagamento encontrado.</EmptyText>
        </EmptyContainer>
    );
    
    return (
        <Container>
            <Header>
                <HeaderTitle>Pagamentos</HeaderTitle>
                <HeaderRight>
                    <NotificationBell userType="admin" />
                    <FilterButton onPress={() => setShowFilters(!showFilters)}>
                        <Feather name="filter" size={22} color="#333" />
                    </FilterButton>
                </HeaderRight>
            </Header>
            
            <SearchContainer>
                <Feather name="search" size={20} color="#999" style={{ marginLeft: 10 }} />
                <SearchInput
                    placeholder="Buscar por nome, email, placa..."
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </SearchContainer>
            
            {showFilters && (
                <FilterContainer>
                    <FilterOption 
                        active={activeFilter === 'all'}
                        onPress={() => setActiveFilter('all')}
                    >
                        <FilterOptionText active={activeFilter === 'all'}>Todos</FilterOptionText>
                    </FilterOption>
                    
                    <FilterOption 
                        active={activeFilter === 'pending'}
                        onPress={() => setActiveFilter('pending')}
                    >
                        <FilterOptionText active={activeFilter === 'pending'}>Pendentes</FilterOptionText>
                    </FilterOption>
                    
                    <FilterOption 
                        active={activeFilter === 'paid'}
                        onPress={() => setActiveFilter('paid')}
                    >
                        <FilterOptionText active={activeFilter === 'paid'}>Pagos</FilterOptionText>
                    </FilterOption>
                    
                    <FilterOption 
                        active={activeFilter === 'overdue'}
                        onPress={() => setActiveFilter('overdue')}
                    >
                        <FilterOptionText active={activeFilter === 'overdue'}>Atrasados</FilterOptionText>
                    </FilterOption>
                </FilterContainer>
            )}
            
            {loading ? (
                <LoadingContainer>
                    <ActivityIndicator size="large" color="#CB2921" />
                </LoadingContainer>
            ) : (
                <FlatList
                    data={filteredPayments}
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
