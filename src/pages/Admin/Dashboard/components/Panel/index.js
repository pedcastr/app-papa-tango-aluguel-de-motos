import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { db, auth } from '../../../../../services/firebaseConfig';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import NotificationBell from '../../../../../components/NotificationBell';

import {
    Container,
    Header,
    HeaderTitle,
    StatsContainer,
    StatCard,
    StatCardTouchable,
    StatIconContainer,
    StatContent,
    StatTitle,
    StatNumber,
    StatSubtitle,
    SectionTitle,
    ChartContainer,
    ChartTitle,
    ButtonsContainer,
    ActionButton,
    ActionButtonText,
    LogoutButton,
    LogoutText,
    LoadingContainer,
    DashboardScrollView,
    CardRow,
    FinancialCard,
    FinancialCardHeader,
    FinancialCardTitle,
    FinancialCardValue,
    FinancialCardSubtitle,
    FinancialCardTrend,
    FinancialCardTrendUp,
    FinancialCardTrendDown,
    FinancialCardTrendText,
    FinancialSection,
    FinancialSectionTitle,
    FinancialSectionSubtitle,
    ChartLegend,
    ChartLegendItem,
    ChartLegendColor,
    ChartLegendText,
    RefreshButton,
    RefreshButtonText,
    CardGrid,
    EmptyText
} from './styles';

export default function DashboardScreen() {
    const navigation = useNavigation();
    const screenWidth = Dimensions.get('window').width;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const isMobile = Platform.OS !== 'web' || screenWidth < 768;

    // Estados para estatísticas
    const [stats, setStats] = useState({
        totalUsers: 0,
        notApprovedUsers: 0,
        approvedUsers: 0,
        totalBikes: 0,
        activeContracts: 0,
        totalRentals: 0
    });

    // Estados para dados financeiros
    const [financialStats, setFinancialStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        overduePayments: 0,
        dueTodayPayments: 0,
        revenueGrowth: 0
    });

    // Estados para dados de gráficos
    const [chartData, setChartData] = useState({
        monthlyRevenue: [0, 0, 0, 0, 0, 0],
        userDistribution: [
            { name: 'Aprovados', population: 0, color: '#4CAF50', legendFontColor: '#7F7F7F', legendFontSize: 12 },
            { name: 'Não Aprovados', population: 0, color: '#F44336', legendFontColor: '#7F7F7F', legendFontSize: 12 }
        ],
        paymentStatus: [
            { name: 'Em Dia', population: 0, color: '#2196F3', legendFontColor: '#7F7F7F', legendFontSize: 12 },
            { name: 'Atrasados', population: 0, color: '#F44336', legendFontColor: '#7F7F7F', legendFontSize: 12 },
            { name: 'Hoje', population: 0, color: '#FF9800', legendFontColor: '#7F7F7F', legendFontSize: 12 }
        ]
    });

    // Função para atualizar os dados
    const refreshData = useCallback(() => {
        setRefreshing(true);
        fetchAllData();
    }, []);

    // Efeito para carregar dados quando a tela recebe foco
    useFocusEffect(
        useCallback(() => {
            fetchAllData();
            return () => { };
        }, [])
    );

    // Função para buscar todos os dados
    const fetchAllData = async () => {
        try {
            setLoading(true);

            // Configurar listeners para estatísticas básicas
            setupBasicStatsListeners();

            // Buscar dados financeiros
            await fetchFinancialData();

        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Configurar listeners para estatísticas básicas
    const setupBasicStatsListeners = () => {
        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const totalUsers = snapshot.size;
            const approvedUsers = snapshot.docs.filter(doc => doc.data().aprovado === true).length;
            const notApprovedUsers = snapshot.docs.filter(doc => doc.data().aprovado !== true).length;

            setStats(prev => ({
                ...prev,
                totalUsers,
                approvedUsers,
                notApprovedUsers
            }));

            // Atualizar dados do gráfico de distribuição de usuários
            setChartData(prev => ({
                ...prev,
                userDistribution: [
                    { name: 'Aprovados', population: approvedUsers, color: '#4CAF50', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                    { name: 'Não Aprovados', population: notApprovedUsers, color: '#F44336', legendFontColor: '#7F7F7F', legendFontSize: 12 }
                ]
            }));
        });

        const unsubscribeBikes = onSnapshot(collection(db, "motos"), (snapshot) => {
            setStats(prev => ({
                ...prev,
                totalBikes: snapshot.size
            }));
        });

        const unsubscribeContracts = onSnapshot(
            query(collection(db, "contratos"), where("statusContrato", "==", true)),
            (snapshot) => {
                setStats(prev => ({
                    ...prev,
                    activeContracts: snapshot.size
                }));
            }
        );

        const unsubscribeRentals = onSnapshot(collection(db, "alugueis"), (snapshot) => {
            setStats(prev => ({
                ...prev,
                totalRentals: snapshot.size
            }));
        });
    };

    // Função para buscar dados financeiros 
    const fetchFinancialData = async () => {
        try {
            // Obter data atual e datas de referência
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            today.setHours(0, 0, 0, 0);

            // Calcular o início da semana (segunda-feira)
            const startOfWeek = new Date(today);
            const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ...
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Se for domingo, voltar 6 dias, senão calcular dias até segunda
            startOfWeek.setDate(today.getDate() + diff);
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

            // Buscar todos os pagamentos
            const paymentsRef = collection(db, "payments");
            const paymentsSnapshot = await getDocs(paymentsRef);

            // Calcular receitas
            let totalRevenue = 0;
            let monthlyRevenue = 0;
            let weeklyRevenue = 0;
            let prevMonthRevenue = 0;

            // Dados para gráfico de receita mensal (últimos 6 meses)
            const monthlyRevenueData = Array(6).fill(0);

            // Processar pagamentos
            paymentsSnapshot.forEach(doc => {
                const payment = doc.data();

                // Considerar apenas pagamentos aprovados
                if (payment.status === 'approved') {
                    // Verificar se temos a data de criação e o valor
                    const paymentDate = payment.dateCreated?.toDate ? payment.dateCreated.toDate() :
                        (payment.dateCreated instanceof Date ? payment.dateCreated : null);

                    // Obter o valor do pagamento - verificar diferentes campos possíveis
                    const amount = payment.amount || payment.transaction_amount || 0;

                    if (paymentDate && amount) {
                        // Receita total
                        totalRevenue += amount;

                        // Receita do mês atual
                        if (paymentDate >= startOfMonth) {
                            monthlyRevenue += amount;
                        }

                        // Receita da semana atual (a partir de segunda-feira)
                        if (paymentDate >= startOfWeek) {
                            weeklyRevenue += amount;
                        }

                        // Receita do mês anterior
                        if (paymentDate >= startOfPrevMonth && paymentDate <= endOfPrevMonth) {
                            prevMonthRevenue += amount;
                        }

                        // Dados para gráfico de receita mensal
                        const monthDiff = today.getMonth() - paymentDate.getMonth() +
                            (today.getFullYear() - paymentDate.getFullYear()) * 12;
                        if (monthDiff >= 0 && monthDiff < 6) {
                            monthlyRevenueData[5 - monthDiff] += amount;
                        }
                    }
                }
            });

            // Calcular crescimento de receita (comparação com mês anterior)
            const revenueGrowth = prevMonthRevenue > 0
                ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
                : 0;

            // Buscar contratos ativos para verificar pagamentos atrasados e do dia
            let overduePayments = 0;
            let dueTodayPayments = 0;
            let onTimePayments = 0;

            // Buscar contratos ativos
            const contratosRef = collection(db, "contratos");
            const contratosQuery = query(contratosRef, where("statusContrato", "==", true));
            const contratosSnapshot = await getDocs(contratosQuery);

            // Processar contratos para verificar pagamentos
            for (const contratoDoc of contratosSnapshot.docs) {
                const contratoData = contratoDoc.data();

                if (!contratoData.cliente) continue;

                const userEmail = contratoData.cliente;

                // Buscar o aluguel associado ao contrato
                let valorMensal = 0;
                let valorSemanal = 0;
                let tipoRecorrencia = contratoData.tipoRecorrenciaPagamento || 'mensal';

                if (contratoData.aluguelId) {
                    const aluguelRef = doc(db, "alugueis", contratoData.aluguelId);
                    const aluguelSnapshot = await getDoc(aluguelRef);

                    if (aluguelSnapshot.exists()) {
                        const aluguelData = aluguelSnapshot.data();
                        valorMensal = aluguelData.valorMensal || 0;
                        valorSemanal = aluguelData.valorSemanal || 0;
                    }
                }

                // Buscar pagamentos do usuário
                const userPaymentsQuery = query(
                    collection(db, "payments"),
                    where("userEmail", "==", userEmail),
                    where("status", "==", "approved")
                );

                const userPaymentsSnapshot = await getDocs(userPaymentsQuery);
                const userPayments = userPaymentsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Ordenar pagamentos por data (mais recente primeiro)
                userPayments.sort((a, b) => {
                    const dateA = a.dateCreated?.toDate ? a.dateCreated.toDate() : new Date(0);
                    const dateB = b.dateCreated?.toDate ? b.dateCreated.toDate() : new Date(0);
                    return dateB - dateA;
                });

                // Verificar se existe algum pagamento aprovado
                const ultimoPagamentoAprovado = userPayments.length > 0 ? userPayments[0] : null;

                let dataBase;
                let proximaData;

                // Se tiver pagamento aprovado, calcular a partir dele
                if (ultimoPagamentoAprovado) {
                    const ultimoPagamentoData = ultimoPagamentoAprovado.dateCreated?.toDate();
                    if (ultimoPagamentoData) {
                        dataBase = new Date(ultimoPagamentoData);
                        dataBase.setHours(0, 0, 0, 0); // Normalizar para início do dia
                    } else {
                        dataBase = new Date(contratoData.dataInicio?.toDate() || today);
                        dataBase.setHours(0, 0, 0, 0);
                    }
                } else {
                    // Se não tiver pagamento aprovado, usar a data de início do contrato
                    dataBase = contratoData.dataInicio?.toDate ?
                        new Date(contratoData.dataInicio.toDate()) :
                        new Date();
                    dataBase.setHours(0, 0, 0, 0);
                }

                // Calcular a próxima data de pagamento com base no tipo de recorrência
                proximaData = new Date(dataBase);

                if (tipoRecorrencia.toLowerCase() === 'semanal') {
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
                    }
                }

                // Calcular dias restantes
                const diasRestantes = Math.floor((proximaData - today) / (1000 * 60 * 60 * 24));

                // Verificar status do pagamento
                if (diasRestantes < 0) {
                    overduePayments++;
                } else if (diasRestantes === 0) {
                    dueTodayPayments++;
                } else {
                    onTimePayments++;
                }
            }

            // Atualizar estado com dados financeiros
            setFinancialStats({
                totalRevenue,
                monthlyRevenue,
                weeklyRevenue,
                overduePayments,
                dueTodayPayments,
                revenueGrowth
            });

            // Atualizar dados para gráficos
            setChartData(prev => ({
                ...prev,
                monthlyRevenue: monthlyRevenueData,
                paymentStatus: [
                    { name: 'Em Dia', population: onTimePayments, color: '#2196F3', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                    { name: 'Atrasados', population: overduePayments, color: '#F44336', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                    { name: 'Hoje', population: dueTodayPayments, color: '#FF9800', legendFontColor: '#7F7F7F', legendFontSize: 12 }
                ]
            }));

        } catch (error) {
            console.error('Erro ao buscar dados financeiros:', error);
        }
    };


    // Função para formatar valores monetários
    const formatCurrency = (value) => {
        return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    };

    // Função para fazer logout
    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    // Função para navegar para a tela de mensagens em massa
    const handleBulkMessages = () => {
        navigation.navigate('BulkMessages');
    };

    // Função para navegar para a tela de Usuários com filtro aplicado
    const navigateToUsers = (filter = 'todos') => {
        const saveFilter = async () => {
            try {
                // No mobile, salvar com um timestamp para forçar a atualização
                if (Platform.OS !== 'web') {
                    await AsyncStorage.setItem('userListFilter', filter);
                    await AsyncStorage.setItem('userListFilterTimestamp', Date.now().toString());
                } else {
                    // Na web, continuar com a abordagem atual
                    sessionStorage.setItem('userListFilter', filter);

                    try {
                        const event = new CustomEvent('applyUserFilter', {
                            detail: { filter, timestamp: Date.now() }
                        });
                        document.dispatchEvent(event);
                    } catch (error) {
                        console.log('CustomEvent não suportado nesta plataforma');
                    }
                }

                // Navegar para a tab Usuários
                navigation.navigate('Usuários');
            } catch (error) {
                console.error('Erro ao salvar filtro de usuários:', error);
                navigation.navigate('Usuários');
            }
        };

        saveFilter();
    };

    // Função para navegar para a tela de pagamentos com o filtro aplicado
    const navigateToPayments = (filter = 'todos') => {
        const saveFilter = async () => {
            try {
                if (Platform.OS !== 'web') {
                    await AsyncStorage.setItem('paymentListFilter', filter);
                    await AsyncStorage.setItem('paymentListFilterTimestamp', Date.now().toString());
                } else {
                    sessionStorage.setItem('paymentListFilter', filter);

                    try {
                        const event = new CustomEvent('applyPaymentFilter', {
                            detail: { filter, timestamp: Date.now() }
                        });
                        document.dispatchEvent(event);
                    } catch (error) {
                        console.log('CustomEvent não suportado nesta plataforma');
                    }
                }

                navigation.navigate('Pagamentos');
            } catch (error) {
                console.error('Erro ao salvar filtro de pagamentos:', error);
                navigation.navigate('Pagamentos');
            }
        };

        saveFilter();
    };

    // Função para navegar para a tela de contratos com o filtro aplicado
    const navigateToContracts = (filter = 'todos') => {
        const saveFilter = async () => {
            try {
                if (Platform.OS !== 'web') {
                    await AsyncStorage.setItem('contractListFilter', filter);
                    await AsyncStorage.setItem('contractListFilterTimestamp', Date.now().toString());
                } else {
                    sessionStorage.setItem('contractListFilter', filter);

                    try {
                        const event = new CustomEvent('applyContractFilter', {
                            detail: { filter, timestamp: Date.now() }
                        });
                        document.dispatchEvent(event);
                    } catch (error) {
                        console.log('CustomEvent não suportado nesta plataforma');
                    }
                }

                navigation.navigate('Contratos');
            } catch (error) {
                console.error('Erro ao salvar filtro de contratos:', error);
                navigation.navigate('Contratos');
            }
        };

        saveFilter();
    };

    // Navegação para Motos (sem filtro específico)
    const navigateToBikes = () => {
        navigation.navigate('Motos');
    };

    // Navegação para Aluguéis (sem filtro específico)
    const navigateToRentals = () => {
        navigation.navigate('Aluguéis');
    };

    // Configuração do gráfico de linha
    const lineChartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#ffa726'
        }
    };

    // Dados para o gráfico de linha (receita mensal)
    const lineChartData = {
        labels: ['6 meses', '5 meses', '4 meses', '3 meses', '2 meses', 'Último mês'],
        datasets: [
            {
                data: chartData.monthlyRevenue.length > 0 ? chartData.monthlyRevenue : [0, 0, 0, 0, 0, 0],
                color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ['Receita Mensal']
    };

    // Renderizar tela de carregamento
    if (loading && !refreshing) {
        return (
            <LoadingContainer>
                <ActivityIndicator size="large" color="#CB2921" />
                <EmptyText>Carregando Dashboard...</EmptyText>
            </LoadingContainer>
        );
    }

    return (
        <Container>
            <Header>
                <HeaderTitle>Dashboard</HeaderTitle>
                <NotificationBell userType="admin" color="#FFFFFF" />
            </Header>
            <DashboardScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 30 }}
            >
                {/* Seção de Estatísticas Principais */}
                <SectionTitle>Visão Geral</SectionTitle>
                <StatsContainer>
                    {/* Layout adaptativo para mobile/web */}
                    {isMobile ? (
                        // Layout para dispositivos móveis (grid de 2 colunas)
                        <CardGrid>
                            <StatCardTouchable onPress={() => navigateToUsers('todos')}>
                                <StatCard color="#3498db">
                                    <StatIconContainer>
                                        <MaterialIcons name="people" size={24} color="#fff" />
                                    </StatIconContainer>
                                    <StatContent>
                                        <StatTitle>Total de Usuários</StatTitle>
                                        <StatNumber>{stats.totalUsers}</StatNumber>
                                    </StatContent>
                                </StatCard>
                            </StatCardTouchable>

                            <StatCardTouchable onPress={() => navigateToUsers('aprovados')}>
                                <StatCard color="#2ecc71">
                                    <StatIconContainer>
                                        <MaterialIcons name="check-circle" size={24} color="#fff" />
                                    </StatIconContainer>
                                    <StatContent>
                                        <StatTitle>Usuários Aprovados</StatTitle>
                                        <StatNumber>{stats.approvedUsers}</StatNumber>
                                    </StatContent>
                                </StatCard>
                            </StatCardTouchable>

                            <StatCardTouchable onPress={() => navigateToUsers('pendentes')}>
                                <StatCard color="#e74c3c">
                                    <StatIconContainer>
                                        <MaterialIcons name="pending" size={24} color="#fff" />
                                    </StatIconContainer>
                                    <StatContent>
                                        <StatTitle>Usuários Pendentes</StatTitle>
                                        <StatNumber>{stats.notApprovedUsers}</StatNumber>
                                    </StatContent>
                                </StatCard>
                            </StatCardTouchable>

                            <StatCardTouchable onPress={() => navigateToBikes()}>
                                <StatCard color="#9b59b6">
                                    <StatIconContainer>
                                        <FontAwesome5 name="motorcycle" size={24} color="#fff" />
                                    </StatIconContainer>
                                    <StatContent>
                                        <StatTitle>Total de Motos</StatTitle>
                                        <StatNumber>{stats.totalBikes}</StatNumber>
                                    </StatContent>
                                </StatCard>
                            </StatCardTouchable>

                            <StatCardTouchable onPress={() => navigateToContracts('ativos')}>
                                <StatCard color="#f39c12">
                                    <StatIconContainer>
                                        <MaterialIcons name="description" size={24} color="#fff" />
                                    </StatIconContainer>
                                    <StatContent>
                                        <StatTitle>Contratos Ativos</StatTitle>
                                        <StatNumber>{stats.activeContracts}</StatNumber>
                                    </StatContent>
                                </StatCard>
                            </StatCardTouchable>

                            <StatCardTouchable onPress={() => navigateToRentals()}>
                                <StatCard color="#16a085">
                                    <StatIconContainer>
                                        <MaterialIcons name="attach-money" size={24} color="#fff" />
                                    </StatIconContainer>
                                    <StatContent>
                                        <StatTitle>Total de Aluguéis</StatTitle>
                                        <StatNumber>{stats.totalRentals}</StatNumber>
                                    </StatContent>
                                </StatCard>
                            </StatCardTouchable>
                        </CardGrid>
                    ) : (
                        // Layout para web (três colunas)
                        <>
                            <CardRow>
                                <StatCardTouchable onPress={() => navigateToUsers('todos')}>
                                    <StatCard color="#3498db">
                                        <StatIconContainer>
                                            <MaterialIcons name="people" size={24} color="#fff" />
                                        </StatIconContainer>
                                        <StatContent>
                                            <StatTitle>Total de Usuários</StatTitle>
                                            <StatNumber>{stats.totalUsers}</StatNumber>
                                        </StatContent>
                                    </StatCard>
                                </StatCardTouchable>

                                <StatCardTouchable onPress={() => navigateToUsers('aprovados')}>
                                    <StatCard color="#2ecc71">
                                        <StatIconContainer>
                                            <MaterialIcons name="check-circle" size={24} color="#fff" />
                                        </StatIconContainer>
                                        <StatContent>
                                            <StatTitle>Usuários Aprovados</StatTitle>
                                            <StatNumber>{stats.approvedUsers}</StatNumber>
                                        </StatContent>
                                    </StatCard>
                                </StatCardTouchable>

                                <StatCardTouchable onPress={() => navigateToUsers('pendentes')}>
                                    <StatCard color="#e74c3c">
                                        <StatIconContainer>
                                            <MaterialIcons name="pending" size={24} color="#fff" />
                                        </StatIconContainer>
                                        <StatContent>
                                            <StatTitle>Usuários Pendentes</StatTitle>
                                            <StatNumber>{stats.notApprovedUsers}</StatNumber>
                                        </StatContent>
                                    </StatCard>
                                </StatCardTouchable>
                            </CardRow>

                            <CardRow>
                                <StatCardTouchable onPress={() => navigateToBikes()}>
                                    <StatCard color="#9b59b6">
                                        <StatIconContainer>
                                            <FontAwesome5 name="motorcycle" size={24} color="#fff" />
                                        </StatIconContainer>
                                        <StatContent>
                                            <StatTitle>Total de Motos</StatTitle>
                                            <StatNumber>{stats.totalBikes}</StatNumber>
                                        </StatContent>
                                    </StatCard>
                                </StatCardTouchable>

                                <StatCardTouchable onPress={() => navigateToContracts('ativos')}>
                                    <StatCard color="#f39c12">
                                        <StatIconContainer>
                                            <MaterialIcons name="description" size={24} color="#fff" />
                                        </StatIconContainer>
                                        <StatContent>
                                            <StatTitle>Contratos Ativos</StatTitle>
                                            <StatNumber>{stats.activeContracts}</StatNumber>
                                        </StatContent>
                                    </StatCard>
                                </StatCardTouchable>

                                <StatCardTouchable onPress={() => navigateToRentals()}>
                                    <StatCard color="#16a085">
                                        <StatIconContainer>
                                            <MaterialIcons name="attach-money" size={24} color="#fff" />
                                        </StatIconContainer>
                                        <StatContent>
                                            <StatTitle>Total de Aluguéis</StatTitle>
                                            <StatNumber>{stats.totalRentals}</StatNumber>
                                        </StatContent>
                                    </StatCard>
                                </StatCardTouchable>
                            </CardRow>
                        </>
                    )}
                </StatsContainer>

                {/* Seção Financeira */}
                <FinancialSection>
                    <FinancialSectionTitle>Financeiro</FinancialSectionTitle>
                    <FinancialSectionSubtitle>Visão geral das receitas e pagamentos</FinancialSectionSubtitle>

                    {isMobile ? (
                        // Layout para dispositivos móveis (uma coluna)
                        <>
                            <View style={{ marginBottom: 10 }}>
                                <FinancialCard style={{ width: '100%' }}>
                                    <FinancialCardHeader>
                                        <MaterialIcons name="account-balance-wallet" size={24} color="#2ecc71" />
                                        <FinancialCardTitle>Receita Total</FinancialCardTitle>
                                    </FinancialCardHeader>
                                    <FinancialCardValue>
                                        {formatCurrency(financialStats.totalRevenue)}
                                    </FinancialCardValue>
                                    <FinancialCardSubtitle>Desde o início</FinancialCardSubtitle>
                                </FinancialCard>
                            </View>

                            <View style={{ marginBottom: 10 }}>
                                <FinancialCard style={{ width: '100%' }}>
                                    <FinancialCardHeader>
                                        <MaterialIcons name="date-range" size={24} color="#3498db" />
                                        <FinancialCardTitle>Receita Mensal</FinancialCardTitle>
                                    </FinancialCardHeader>
                                    <FinancialCardValue>
                                        {formatCurrency(financialStats.monthlyRevenue)}
                                    </FinancialCardValue>
                                    <FinancialCardSubtitle>Mês atual</FinancialCardSubtitle>
                                    {financialStats.revenueGrowth !== 0 && (
                                        <FinancialCardTrend>
                                            {financialStats.revenueGrowth > 0 ? (
                                                <FinancialCardTrendUp>
                                                    <MaterialIcons name="trending-up" size={16} color="#2ecc71" />
                                                    <FinancialCardTrendText positive>
                                                        {financialStats.revenueGrowth.toFixed(1)}% vs. mês anterior
                                                    </FinancialCardTrendText>
                                                </FinancialCardTrendUp>
                                            ) : (
                                                <FinancialCardTrendDown>
                                                    <MaterialIcons name="trending-down" size={16} color="#e74c3c" />
                                                    <FinancialCardTrendText>
                                                        {Math.abs(financialStats.revenueGrowth).toFixed(1)}% vs. mês anterior
                                                    </FinancialCardTrendText>
                                                </FinancialCardTrendDown>
                                            )}
                                        </FinancialCardTrend>
                                    )}
                                </FinancialCard>
                            </View>

                            <View style={{ marginBottom: 10 }}>
                                <FinancialCard style={{ width: '100%' }}>
                                    <FinancialCardHeader>
                                        <MaterialIcons name="today" size={24} color="#9b59b6" />
                                        <FinancialCardTitle>Receita Semanal</FinancialCardTitle>
                                    </FinancialCardHeader>
                                    <FinancialCardValue>
                                        {formatCurrency(financialStats.weeklyRevenue)}
                                    </FinancialCardValue>
                                    <FinancialCardSubtitle>Semana atual</FinancialCardSubtitle>
                                </FinancialCard>
                            </View>

                            <StatCardTouchable onPress={() => navigateToPayments('atrasados')} style={{ width: '100%', marginBottom: 10 }}>
                                <StatCard color="#e74c3c" style={{ width: '100%' }}>
                                    <StatIconContainer>
                                        <MaterialIcons name="warning" size={24} color="#fff" />
                                    </StatIconContainer>
                                    <StatContent>
                                        <StatTitle>Pagamentos Atrasados</StatTitle>
                                        <StatNumber>{financialStats.overduePayments}</StatNumber>
                                    </StatContent>
                                </StatCard>
                            </StatCardTouchable>

                            <StatCardTouchable onPress={() => navigateToPayments('hoje')} style={{ width: '100%', marginBottom: 10 }}>
                                <StatCard color="#f39c12" style={{ width: '100%' }}>
                                    <StatIconContainer>
                                        <MaterialIcons name="event" size={24} color="#fff" />
                                    </StatIconContainer>
                                    <StatContent>
                                        <StatTitle>Pagamentos Hoje</StatTitle>
                                        <StatNumber>{financialStats.dueTodayPayments}</StatNumber>
                                    </StatContent>
                                </StatCard>
                            </StatCardTouchable>

                            <RefreshButton onPress={refreshData} style={{ width: '100%' }}>
                                <MaterialIcons name="refresh" size={20} color="#fff" />
                                <RefreshButtonText>Atualizar Dados</RefreshButtonText>
                            </RefreshButton>
                        </>
                    ) : (
                        // Layout para web 
                        <>
                            <CardRow>
                                <FinancialCard>
                                    <FinancialCardHeader>
                                        <MaterialIcons name="account-balance-wallet" size={24} color="#2ecc71" />
                                        <FinancialCardTitle>Receita Total</FinancialCardTitle>
                                    </FinancialCardHeader>
                                    <FinancialCardValue>
                                        {formatCurrency(financialStats.totalRevenue)}
                                    </FinancialCardValue>
                                    <FinancialCardSubtitle>Desde o início</FinancialCardSubtitle>
                                </FinancialCard>

                                <FinancialCard>
                                    <FinancialCardHeader>
                                        <MaterialIcons name="date-range" size={24} color="#3498db" />
                                        <FinancialCardTitle>Receita Mensal</FinancialCardTitle>
                                    </FinancialCardHeader>
                                    <FinancialCardValue>
                                        {formatCurrency(financialStats.monthlyRevenue)}
                                    </FinancialCardValue>
                                    <FinancialCardSubtitle>Mês atual</FinancialCardSubtitle>
                                    {financialStats.revenueGrowth !== 0 && (
                                        <FinancialCardTrend>
                                            {financialStats.revenueGrowth > 0 ? (
                                                <FinancialCardTrendUp>
                                                    <MaterialIcons name="trending-up" size={16} color="#2ecc71" />
                                                    <FinancialCardTrendText positive>
                                                        {financialStats.revenueGrowth.toFixed(1)}% vs. mês anterior
                                                    </FinancialCardTrendText>
                                                </FinancialCardTrendUp>
                                            ) : (
                                                <FinancialCardTrendDown>
                                                    <MaterialIcons name="trending-down" size={16} color="#e74c3c" />
                                                    <FinancialCardTrendText>
                                                        {Math.abs(financialStats.revenueGrowth).toFixed(1)}% vs. mês anterior
                                                    </FinancialCardTrendText>
                                                </FinancialCardTrendDown>
                                            )}
                                        </FinancialCardTrend>
                                    )}
                                </FinancialCard>
                            </CardRow>

                            <CardRow>
                                <FinancialCard>
                                    <FinancialCardHeader>
                                        <MaterialIcons name="today" size={24} color="#9b59b6" />
                                        <FinancialCardTitle>Receita Semanal</FinancialCardTitle>
                                    </FinancialCardHeader>
                                    <FinancialCardValue>
                                        {formatCurrency(financialStats.weeklyRevenue)}
                                    </FinancialCardValue>
                                    <FinancialCardSubtitle>Semana atual</FinancialCardSubtitle>
                                </FinancialCard>

                                <View style={{ width: '48%' }} />
                            </CardRow>

                            <CardRow>
                                <StatCardTouchable onPress={() => navigateToPayments('atrasados')}>
                                    <StatCard color="#e74c3c">
                                        <StatIconContainer>
                                            <MaterialIcons name="warning" size={24} color="#fff" />
                                        </StatIconContainer>
                                        <StatContent>
                                            <StatTitle>Pagamentos Atrasados</StatTitle>
                                            <StatNumber>{financialStats.overduePayments}</StatNumber>
                                        </StatContent>
                                    </StatCard>
                                </StatCardTouchable>

                                <StatCardTouchable onPress={() => navigateToPayments('hoje')}>
                                    <StatCard color="#f39c12">
                                        <StatIconContainer>
                                            <MaterialIcons name="event" size={24} color="#fff" />
                                        </StatIconContainer>
                                        <StatContent>
                                            <StatTitle>Pagamentos Hoje</StatTitle>
                                            <StatNumber>{financialStats.dueTodayPayments}</StatNumber>
                                        </StatContent>
                                    </StatCard>
                                </StatCardTouchable>
                            </CardRow>

                            <CardRow>
                                <RefreshButton onPress={refreshData} style={{ width: '100%' }}>
                                    <MaterialIcons name="refresh" size={20} color="#fff" />
                                    <RefreshButtonText>Atualizar Dados</RefreshButtonText>
                                </RefreshButton>
                            </CardRow>
                        </>
                    )}
                </FinancialSection>

                {/* Gráficos */}
                <SectionTitle>Análises</SectionTitle>

                {/* Gráfico de Receita Mensal */}
                <ChartContainer>
                    <ChartTitle>Receita dos Últimos 6 Meses</ChartTitle>
                    <LineChart
                        data={lineChartData}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={{
                            ...lineChartConfig,
                            // Adicione estas propriedades:
                            horizontalLabelRotation: Platform.OS !== 'web' ? -15 : 0, // Rotaciona os labels no mobile
                            propsForLabels: {
                                fontSize: Platform.OS !== 'web' ? 10 : 13, // Fonte menor no mobile
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                </ChartContainer>

                {/* Gráfico de Distribuição de Usuários */}
                <ChartContainer>
                    <ChartTitle>Distribuição de Usuários</ChartTitle>
                    <PieChart
                        data={chartData.userDistribution}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={lineChartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        // Ajustar o centro apenas na versão web para aproximar o gráfico
                        center={Platform.OS === 'web' && window.innerWidth > 768 ? [320, 0] : [10, 0]}
                        absolute
                    />
                    <ChartLegend>
                        {chartData.userDistribution.map((item, index) => (
                            <ChartLegendItem key={index}>
                                <ChartLegendColor color={item.color} />
                                <ChartLegendText>{item.name}: {item.population}</ChartLegendText>
                            </ChartLegendItem>
                        ))}
                    </ChartLegend>
                </ChartContainer>

                {/* Gráfico de Status de Pagamentos */}
                <ChartContainer>
                    <ChartTitle>Status de Pagamentos</ChartTitle>
                    <PieChart
                        data={chartData.paymentStatus}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={lineChartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        // Ajustar o centro apenas na versão web para aproximar o gráfico
                        center={Platform.OS === 'web' && window.innerWidth > 768 ? [320, 0] : [10, 0]}
                        absolute
                    />
                    <ChartLegend>
                        {chartData.paymentStatus.map((item, index) => (
                            <ChartLegendItem key={index}>
                                <ChartLegendColor color={item.color} />
                                <ChartLegendText>{item.name}: {item.population}</ChartLegendText>
                            </ChartLegendItem>
                        ))}
                    </ChartLegend>
                </ChartContainer>

                {/* Botões de Ação */}
                <ButtonsContainer>
                    <ActionButton onPress={handleBulkMessages}>
                        <MaterialIcons name="send" size={20} color="#FFFFFF" />
                        <ActionButtonText>Enviar Mensagens em Massa</ActionButtonText>
                    </ActionButton>

                    <LogoutButton onPress={handleLogout}>
                        <MaterialIcons name="exit-to-app" size={20} color="#FFFFFF" />
                        <LogoutText>Sair da Conta</LogoutText>
                    </LogoutButton>
                </ButtonsContainer>
            </DashboardScrollView>
        </Container>
    );
}
