import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Alert, Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { db } from '../../../services/firebaseConfig';
import { 
    collection, 
    query, 
    orderBy, 
    getDocs, 
    where, 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import NotificationBell from '../../../components/NotificationBell';
import {
    Container,
    Header,
    HeaderTitle,
    HeaderRight,
    FilterButton,
    PaymentCard,
    PaymentHeader,
    PaymentTitle,
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
    
    // Função para mostrar o Alert em dispositivos móveis e o window.alert no web
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };
    
    // Função para enviar notificação pelo Firestore
    const enviarNotificacaoPeloFirestore = async (userEmail, paymentInfo, title, body, data) => {
        try {
            // Gerar um ID único para a solicitação
            const requestId = `payment_reminder_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            
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
                
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia
                
                // Verificar se existe algum pagamento aprovado
                const ultimoPagamentoAprovado = paymentsSnapshot.docs.find(doc => {
                    const paymentData = doc.data();
                    return paymentData.status === 'approved';
                });
                
                let dataBase;
                let proximaData;
                let dataUltimoPagamento = null;
                
                // Se tiver pagamento aprovado, calcular a partir dele
                if (ultimoPagamentoAprovado) {
                    const ultimoPagamentoData = ultimoPagamentoAprovado.data().dateCreated?.toDate();
                    if (ultimoPagamentoData) {
                        dataBase = new Date(ultimoPagamentoData);
                        dataBase.setHours(0, 0, 0, 0); // Normalizar para início do dia
                        dataUltimoPagamento = new Date(dataBase);
                    } else {
                        dataBase = new Date(contratoData.dataInicio?.toDate() || hoje);
                        dataBase.setHours(0, 0, 0, 0);
                    }
                } else {
                    // Se não tiver pagamento aprovado, usar a data de início do contrato
                    dataBase = new Date(contratoData.dataInicio?.toDate() || hoje);
                    dataBase.setHours(0, 0, 0, 0);
                }
                
                // Calcular a próxima data de pagamento com base no tipo de recorrência
                proximaData = new Date(dataBase);
                
                // Calcular a data do próximo pagamento a partir da data base
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
                } else {
                    status = 'pending'; // Pendente
                }
                
                // Adicionar informação de pagamento
                paymentsData.push({
                    id: contratoDoc.id,
                    contratoId: contratoDoc.id,
                    userEmail: contratoData.cliente,
                    userName: userData.nomeCompleto || userData.nome || 'Usuário',
                    userPhoto: userData.photoURL || null,
                    valorMensal,
                    valorSemanal,
                    tipoRecorrencia,
                    proximaData,
                    diasRestantes,
                    status,
                    motoPlaca,
                    motoModelo,
                    ultimoPagamento: paymentsSnapshot.docs.length > 0 ? paymentsSnapshot.docs[0].data() : null,
                    dataUltimoPagamento
                });
            }
            
            setPayments(paymentsData);
            applyFilters(paymentsData, activeFilter, searchText);
        } catch (error) {
            console.error('Erro ao carregar pagamentos:', error);
            showMessage('Erro', 'Não foi possível carregar os pagamentos.');
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
            // Determinar qual valor usar baseado no tipo de recorrência
            const valorPagamento = item.tipoRecorrencia === 'semanal' 
                ? item.valorSemanal 
                : item.valorMensal;
            
            // Preparar dados para a notificação
            const title = 'Lembrete de Pagamento';
            let body;
            
            if (item.status === 'overdue') {
                body = `Seu pagamento de ${formatCurrency(valorPagamento)} está atrasado há ${Math.abs(item.diasRestantes)} dias. Clique para efetuar o pagamento.`;
            } else if (item.diasRestantes === 0) {
                body = `Seu pagamento de ${formatCurrency(valorPagamento)} vence hoje. Clique para efetuar o pagamento.`;
            } else {
                body = `Seu pagamento de ${formatCurrency(valorPagamento)} vence em ${item.diasRestantes} dias. Clique para efetuar o pagamento.`;
            }
            
            const data = {
                screen: 'Financeiro',
            };
            
            // Enviar notificação
            await enviarNotificacaoPeloFirestore(
                item.userEmail,
                {
                    transaction_amount: valorPagamento,
                    proximaData: item.proximaData
                },
                title,
                body,
                data
            );
            
            // Preparar e enviar email de lembrete
            const emailSubject = 'Lembrete de Pagamento - Papa Motos';
            
            let statusText;
            let statusColor;
            
            if (item.status === 'overdue') {
                statusText = `Atrasado há ${Math.abs(item.diasRestantes)} dias`;
                statusColor = '#dc3545';
            } else if (item.diasRestantes === 0) {
                statusText = 'Vence hoje';
                statusColor = '#ffc107';
            } else {
                statusText = `Vence em ${item.diasRestantes} dias`;
                statusColor = '#28a745';
            }
            
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                    </div>
                    <h2 style="color: #CB2921; text-align: center;">Lembrete de Pagamento</h2>
                    <p>Olá ${item.userName},</p>
                    <p>Este é um lembrete sobre o pagamento da locação:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Detalhes do Pagamento:</strong></p>
                        <p>Valor: ${formatCurrency(valorPagamento)}</p>
                        <p>Data de Vencimento: ${formatDate(item.proximaData)}</p>
                        <p>Status: <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
                        <p>Moto: ${item.motoModelo} (${item.motoPlaca})</p>
                    </div>
                    <p>Para sua comodidade, você pode efetuar o pagamento diretamente pelo aplicativo Papa Motos.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="papamotors://financeiro" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Abrir no Aplicativo
                        </a>
                    </div>
                    <p>Caso precise, entre em contato com a nossa equipe de atendimento através do WhatsApp (85)99268-4035</p>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                        Este é um email automático. Por favor, não responda a este email.
                    </p>
                </div>
            `;
            
            await enviarEmailPeloFirestore(
                item.userEmail,
                emailSubject,
                emailBody,
                {
                    amount: valorPagamento,
                    dueDate: item.proximaData,
                    status: item.status,
                    diasRestantes: item.diasRestantes
                }
            );
            
            // Registrar no Firestore que o lembrete foi enviado
            const reminderRef = doc(db, 'paymentReminders', `${item.userEmail}_${new Date().toISOString().split('T')[0]}`);
            await setDoc(reminderRef, {
                userEmail: item.userEmail,
                userName: item.userName,
                paymentAmount: valorPagamento,
                dueDate: item.proximaData,
                sentAt: serverTimestamp(),
                sentBy: 'admin'
            });
            
            showMessage('Sucesso', 'Lembrete de pagamento enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar lembrete:', error);
            showMessage('Erro', 'Não foi possível enviar o lembrete de pagamento.');
        }
    };
    
    // Renderizar item da lista
    const renderPaymentItem = ({ item }) => {
        // Determinar qual valor mostrar com base no tipo de recorrência
        const valorExibir = item.tipoRecorrencia === 'semanal' ? item.valorSemanal : item.valorMensal;
        
        return (
            <PaymentCard>
                <StatusBadge style={{ backgroundColor: getStatusColor(item.status) }}>
                    <StatusText>{getStatusText(item.status)}</StatusText>
                </StatusBadge>
                <PaymentHeader>
                    <PaymentTitle>{item.userEmail}</PaymentTitle>
                </PaymentHeader>
                <PaymentAmount>{formatCurrency(valorExibir)}</PaymentAmount>
                
                <PaymentInfo>
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Nome:</PaymentInfoLabel>
                        <PaymentInfoValue>{item.userName}</PaymentInfoValue>
                    </PaymentInfoRow>
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Recorrência:</PaymentInfoLabel>
                        <PaymentInfoValue>
                            {item.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'}
                        </PaymentInfoValue>
                    </PaymentInfoRow>
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>
                            {item.diasRestantes < 0 ? 'Data de vencimento:' : 'Próximo pagamento:'}
                        </PaymentInfoLabel>
                        <PaymentInfoValue
                            style={{
                                color: item.diasRestantes < 0 ? '#dc3545' :
                                    item.diasRestantes === 0 ? '#ffc107' : '#000'
                            }}
                        >
                            {formatDate(item.proximaData)}
                        </PaymentInfoValue>
                    </PaymentInfoRow>
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>
                            {item.status === 'paid' ? 'Status:' :
                            item.diasRestantes < 0 ? 'Dias atrasados:' :
                            item.diasRestantes === 0 ? 'Status:' : 'Dias restantes:'}
                        </PaymentInfoLabel>
                        <PaymentInfoValue
                            style={{
                                color: item.diasRestantes < 0 ? '#dc3545' :
                                    item.diasRestantes === 0 ? '#ffc107' : '#000'
                            }}
                        >
                            {item.status === 'paid' ? 'Pago' :
                            item.diasRestantes < 0 ? `${Math.abs(item.diasRestantes)} dias` :
                            item.diasRestantes > 0 ? `${Math.abs(item.diasRestantes)} dias` :
                            item.diasRestantes === 0 ? 'Hoje é o dia de pagamento' :
                            `${item.diasRestantes}`}
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
