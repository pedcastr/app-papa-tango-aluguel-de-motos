import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ActivityIndicator, Dimensions, Platform, Alert, Text, TouchableOpacity, Modal, Linking } from 'react-native';
import { db, auth } from '../../../../../services/firebaseConfig';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import NotificationBell from '../../../../../components/NotificationBell';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

// Componente memoizado para StatCard
const MemoizedStatCard = React.memo(({ color, icon, title, number, onPress, style }) => (
    <StatCardTouchable onPress={onPress} style={style}>
        <StatCard color={color}>
            <StatIconContainer>
                {icon}
            </StatIconContainer>
            <StatContent>
                <StatTitle>{title}</StatTitle>
                <StatNumber>{number}</StatNumber>
            </StatContent>
        </StatCard>
    </StatCardTouchable>
));

// Componente memoizado para FinancialCard
const MemoizedFinancialCard = React.memo(({ icon, title, value, subtitle, trend, style, negative }) => {
    // Verificar se o valor é negativo (para lucro líquido)
    const isNegative = value.includes('-');

    return (
        <FinancialCard style={style}>
            <FinancialCardHeader>
                {icon}
                <FinancialCardTitle>{title}</FinancialCardTitle>
            </FinancialCardHeader>
            <FinancialCardValue style={isNegative || negative ? { color: '#e74c3c' } : {}}>
                {value}
            </FinancialCardValue>
            <FinancialCardSubtitle>{subtitle}</FinancialCardSubtitle>
            {trend}
        </FinancialCard>
    );
});

// Componente memoizado para ChartLegendItem
const MemoizedChartLegendItem = React.memo(({ color, text }) => (
    <ChartLegendItem>
        <ChartLegendColor color={color} />
        <ChartLegendText>{text}</ChartLegendText>
    </ChartLegendItem>
));

export default function DashboardScreen() {
    const navigation = useNavigation();
    const screenWidth = Dimensions.get('window').width;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const isMobile = useMemo(() => Platform.OS !== 'web' || screenWidth < 768, [screenWidth]);

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

    // Estados para dados de custos
    const [costsStats, setCostsStats] = useState({
        totalCosts: 0,
        monthlyCosts: 0,
        weeklyCosts: 0,
        costsByClient: [],
        costsByCategory: []
    });

    // Estado para lucro líquido
    const [netProfit, setNetProfit] = useState({
        total: 0,
        monthly: 0,
        weekly: 0
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
        ],
        costsByCategory: [],
        costsByClientLabels: [],
        costsByClientValues: []
    });

    // Estados para exportação de dados
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportData, setExportData] = useState([]);
    const [exportFileName, setExportFileName] = useState('');
    const [exportType, setExportType] = useState('');
    const [exportLoading, setExportLoading] = useState(false);

    // Função para calcular o lucro líquido
    const calculateNetProfit = useCallback(() => {
        // Calcular lucro líquido com base nos dados mais recentes
        setNetProfit({
            total: financialStats.totalRevenue - costsStats.totalCosts,
            monthly: financialStats.monthlyRevenue - costsStats.monthlyCosts,
            weekly: financialStats.weeklyRevenue - costsStats.weeklyCosts
        });
    }, [financialStats, costsStats]);

    // Recalcula o lucro líquido sempre que os dados financeiros ou de custos mudarem
    useEffect(() => {
        calculateNetProfit();
    }, [financialStats, costsStats, calculateNetProfit]);

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Função para atualizar os dados
    const refreshData = useCallback(() => {
        setRefreshing(true);
        fetchAllData();
    }, []);

    // Efeito para carregar dados quando a tela recebe foco
    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            if (isMounted) {
                fetchAllData();
            }
            return () => {
                isMounted = false;
            };
        }, [])
    );

    // Função para buscar todos os dados
    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);

            // Configurar listeners para estatísticas básicas
            setupBasicStatsListeners();

            // Buscar dados financeiros e custos
            await Promise.all([
                fetchFinancialData(),
                fetchCostsData()
            ]);

        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Configurar listeners para estatísticas básicas
    const setupBasicStatsListeners = useCallback(() => {
        // Unsubscribe functions
        let unsubscribeUsers = () => { };
        let unsubscribeBikes = () => { };
        let unsubscribeContracts = () => { };
        let unsubscribeRentals = () => { };

        // Users listener
        unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
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

        // Bikes listener
        unsubscribeBikes = onSnapshot(collection(db, "motos"), (snapshot) => {
            setStats(prev => ({
                ...prev,
                totalBikes: snapshot.size
            }));
        });

        // Contracts listener
        unsubscribeContracts = onSnapshot(
            query(collection(db, "contratos"), where("statusContrato", "==", true)),
            (snapshot) => {
                setStats(prev => ({
                    ...prev,
                    activeContracts: snapshot.size
                }));
            }
        );

        // Rentals listener
        unsubscribeRentals = onSnapshot(collection(db, "alugueis"), (snapshot) => {
            setStats(prev => ({
                ...prev,
                totalRentals: snapshot.size
            }));
        });

        // Return cleanup function
        return () => {
            unsubscribeUsers();
            unsubscribeBikes();
            unsubscribeContracts();
            unsubscribeRentals();
        };
    }, []);

    // Função para buscar dados financeiros 
    const fetchFinancialData = useCallback(async () => {
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
            const processContractPromises = contratosSnapshot.docs.map(async (contratoDoc) => {
                const contratoData = contratoDoc.data();

                if (!contratoData.cliente) return null;

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

                // Retornar o status do pagamento
                return diasRestantes < 0 ? 'overdue' : diasRestantes === 0 ? 'today' : 'ontime';
            });

            // Aguardar todas as promessas e contar os resultados
            const paymentStatuses = await Promise.all(processContractPromises);

            // Filtrar valores nulos e contar os status
            paymentStatuses.filter(status => status !== null).forEach(status => {
                if (status === 'overdue') overduePayments++;
                else if (status === 'today') dueTodayPayments++;
                else if (status === 'ontime') onTimePayments++;
            });

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
    }, []);

    // Função para buscar dados de custos
    const fetchCostsData = useCallback(async () => {
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

            // Buscar todos os custos
            const costsRef = collection(db, "costs");
            const costsSnapshot = await getDocs(costsRef);

            // Calcular custos
            let totalCosts = 0;
            let monthlyCosts = 0;
            let weeklyCosts = 0;

            // Mapas para agrupar custos por cliente e categoria
            const clientsMap = new Map();
            const categoriesMap = new Map();

            // Processar custos
            costsSnapshot.forEach(doc => {
                const cost = doc.data();
                const costValue = cost.value || 0;
                const costDate = cost.date?.toDate ? cost.date.toDate() :
                    (cost.date instanceof Date ? cost.date : null);

                if (costDate && costValue) {
                    // Custo total
                    totalCosts += costValue;

                    // Custo do mês atual
                    if (costDate >= startOfMonth) {
                        monthlyCosts += costValue;
                    }

                    // Custo da semana atual
                    if (costDate >= startOfWeek) {
                        weeklyCosts += costValue;
                    }

                    // Agrupar por cliente
                    if (cost.clientId) {
                        const clientKey = cost.clientId;
                        const clientName = cost.clientName || "Cliente sem nome";

                        if (!clientsMap.has(clientKey)) {
                            clientsMap.set(clientKey, {
                                id: clientKey,
                                name: clientName,
                                value: 0
                            });
                        }

                        clientsMap.get(clientKey).value += costValue;
                    }

                    // Agrupar por categoria
                    const categoryKey = cost.category || "Sem categoria";

                    if (!categoriesMap.has(categoryKey)) {
                        categoriesMap.set(categoryKey, {
                            name: categoryKey,
                            value: 0
                        });
                    }

                    categoriesMap.get(categoryKey).value += costValue;
                }
            });

            // Converter mapas para arrays e ordenar por valor
            const costsByClient = Array.from(clientsMap.values())
                .sort((a, b) => b.value - a.value)
                .slice(0, 5); // Top 5 clientes com mais custos

            const costsByCategory = Array.from(categoriesMap.values())
                .sort((a, b) => b.value - a.value);

            // Atualizar estado com dados de custos
            setCostsStats({
                totalCosts,
                monthlyCosts,
                weeklyCosts,
                costsByClient,
                costsByCategory
            });

            // Preparar dados para gráficos de custos
            const costsByCategoryChart = costsByCategory.map((category, index) => {
                const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
                return {
                    name: category.name,
                    population: category.value,
                    color: colors[index % colors.length],
                    legendFontColor: '#7F7F7F',
                    legendFontSize: 12
                };
            });

            // Preparar dados para gráfico de barras de custos por cliente
            const costsByClientLabels = costsByClient.map(client =>
                client.name.length > 10 ? client.name.substring(0, 10) + '...' : client.name
            );

            const costsByClientValues = costsByClient.map(client => client.value);

            setChartData(prev => ({
                ...prev,
                costsByCategory: costsByCategoryChart,
                costsByClientLabels,
                costsByClientValues
            }));

        } catch (error) {
            console.error('Erro ao buscar dados de custos:', error);
        }
    }, [financialStats]);

    // Função para formatar valores monetários
    const formatCurrency = useCallback((value) => {
        return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }, []);

    // Função para fazer logout
    const handleLogout = useCallback(async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }, []);

    // Função para navegar para a tela de mensagens em massa
    const handleBulkMessages = useCallback(() => {
        navigation.navigate('BulkMessages');
    }, [navigation]);

    // Função para navegar para a tela de custos
    const handleCost = useCallback(() => {
        navigation.navigate('Costs');
    }, [navigation]);

    // Função para navegar para a tela de Usuários com filtro aplicado
    const navigateToUsers = useCallback((filter = 'todos') => {
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
    }, [navigation]);

    // Função para navegar para a tela de pagamentos com o filtro aplicado
    const navigateToPayments = useCallback((filter = 'todos') => {
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
    }, [navigation]);

    // Função para navegar para a tela de contratos com o filtro aplicado
    const navigateToContracts = useCallback((filter = 'todos') => {
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
    }, [navigation]);

    // Navegação para Motos (sem filtro específico)
    const navigateToBikes = useCallback(() => {
        navigation.navigate('Motos');
    }, [navigation]);

    // Navegação para Aluguéis (sem filtro específico)
    const navigateToRentals = useCallback(() => {
        navigation.navigate('Aluguéis');
    }, [navigation]);

    // Configuração do gráfico de linha
    const lineChartConfig = useMemo(() => ({
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
    }), []);

    // Dados para o gráfico de linha (receita mensal)
    const lineChartData = useMemo(() => ({
        labels: ['6 meses', '5 meses', '4 meses', '3 meses', '2 meses', 'Último mês'],
        datasets: [
            {
                data: chartData.monthlyRevenue.length > 0 ? chartData.monthlyRevenue : [0, 0, 0, 0, 0, 0],
                color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ['Receita Mensal']
    }), [chartData.monthlyRevenue]);

    // Dados para o gráfico de barras (custos por cliente)
    const barChartData = useMemo(() => ({
        labels: chartData.costsByClientLabels || [],
        datasets: [
            {
                data: chartData.costsByClientValues || [],
                color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ['Custos por Cliente']
    }), [chartData.costsByClientLabels, chartData.costsByClientValues]);

    // Memoizar componentes de tendência financeira
    const renderFinancialTrend = useMemo(() => {
        if (financialStats.revenueGrowth === 0) return null;

        return financialStats.revenueGrowth > 0 ? (
            <FinancialCardTrend>
                <FinancialCardTrendUp>
                    <MaterialIcons name="trending-up" size={16} color="#2ecc71" />
                    <FinancialCardTrendText positive>
                        {financialStats.revenueGrowth.toFixed(1)}% vs. mês anterior
                    </FinancialCardTrendText>
                </FinancialCardTrendUp>
            </FinancialCardTrend>
        ) : (
            <FinancialCardTrend>
                <FinancialCardTrendDown>
                    <MaterialIcons name="trending-down" size={16} color="#e74c3c" />
                    <FinancialCardTrendText>
                        {Math.abs(financialStats.revenueGrowth).toFixed(1)}% vs. mês anterior
                    </FinancialCardTrendText>
                </FinancialCardTrendDown>
            </FinancialCardTrend>
        );
    }, [financialStats.revenueGrowth]);

    // Função para exportar dados
    const handleExportData = useCallback((type) => {
        setExportType(type);

        let data = [];
        let fileName = '';

        switch (type) {
            case 'users':
                fileName = 'usuarios_papa_tango.csv';
                setExportLoading(true);
                getDocs(collection(db, "users"))
                    .then(snapshot => {
                        data = snapshot.docs.map(doc => {
                            const userData = doc.data();
                            // Formatação correta da data
                            let dataCadastro = '';
                            if (userData.dataCadastro) {
                                const date = userData.dataCadastro.toDate ?
                                    userData.dataCadastro.toDate() :
                                    new Date(userData.dataCadastro);
                                dataCadastro = date.toLocaleDateString('pt-BR');
                            }

                            return {
                                email: userData.email || '',
                                nome: userData.nome || '',
                                nomeCompleto: userData.nomeCompleto || '',
                                telefone: userData.telefone || '',
                                cpf: userData.cpf || '',
                                dataNascimento: userData.dataNascimento || '',
                                aprovado: userData.aprovado ? 'Sim' : 'Não',
                                motoAlugada: userData.motoAlugada ? 'Sim' : 'Não',
                                idMotoAlugada: userData.motoAlugadaId || '',
                                idAluguel: userData.aluguelAtivoId || '',
                                contratoId: userData.contratoId || '',
                                dataCadastro: userData.dataCadastro,
                                logradouro: userData.endereco?.logradouro || '',
                                numero: userData.endereco?.numero || '',
                                bairro: userData.endereco?.bairro || '',
                                cidade: userData.endereco?.cidade || '',
                                estado: userData.endereco?.estado || '',
                                cep: userData.endereco?.cep || '',
                                linkFotoPdfCnh: userData.cnh?.pdf ? userData.cnh.pdf.arquivoUrl : '',
                                linkFotoFrenteCnh: userData.cnh?.frente ? userData.cnh.frente.arquivoUrl : '',
                                linkFotoVersoCnh: userData.cnh?.verso ? userData.cnh.verso.arquivoUrl : '',
                                linkFotoComprovanteEndereco: userData.comprovanteEndereco?.arquivo ? userData.comprovanteEndereco.arquivo.arquivoUrl : '',
                                linkPdfComprovanteEndereco: userData.comprovanteEndereco?.pdf ? userData.comprovanteEndereco.pdf.arquivoUrl : '',
                                linkFotoSelfie: userData.selfie ? userData.selfie.arquivoUrl : '',
                                linkFotoAvatar: userData.photoURL ? userData.photoURL : '',
                                versaoApp: userData.appVersion ? userData.appVersion : '',
                                modeloDispositivo: userData.deviceModel ? userData.deviceModel : '',
                                sistemaOperacional: userData.platform ? userData.platform : '',
                                uid: userData.uid || '',
                                tokenNotificacao: userData.pushToken ? userData.pushToken : '',
                            };
                        });
                        setExportData(data);
                        setExportFileName(fileName);
                        setExportModalVisible(true);
                        setExportLoading(false);
                    })
                    .catch(error => {
                        console.error('Erro ao exportar usuários:', error);
                        setExportLoading(false);
                        showMessage('Erro', 'Não foi possível exportar os dados de usuários.');
                    });
                break;

            case 'payments':
                fileName = 'pagamentos_papa_tango.csv';
                setExportLoading(true);
                getDocs(collection(db, "payments"))
                    .then(snapshot => {
                        data = snapshot.docs.map(doc => {
                            const paymentData = doc.data();
                            // Formatação correta da data
                            let dataCriacao = '';
                            if (paymentData.dateCreated) {
                                const date = paymentData.dateCreated.toDate ?
                                    paymentData.dateCreated.toDate() :
                                    new Date(paymentData.dateCreated);
                                dataCriacao = date.toLocaleDateString('pt-BR');
                            }

                            return {
                                userEmail: paymentData.userEmail || '',
                                id: doc.id,
                                userName: paymentData.userName || '',
                                valor: paymentData.amount || paymentData.transaction_amount || 0,
                                status: paymentData.status || '',
                                detalhesStatus: paymentData.statusDetail || '',
                                dataCriacao: dataCriacao,
                                dataAprovacao: paymentData.dateApproved ? paymentData.dateApproved.toDate().toLocaleDateString('pt-BR') : '',
                                metodo: paymentData.paymentMethod || paymentData.payment_method_id || '',
                                descricao: paymentData.description || '',
                                externalReference: paymentData.externalReference || '',
                                aluguelId: paymentData.aluguelId ? paymentData.aluguelId : '',
                                contratoId: paymentData.contratoId ? paymentData.contratoId : '',
                                placaMoto: paymentData.motoInfo ? paymentData.motoInfo.placa : '',
                            };
                        });
                        setExportData(data);
                        setExportFileName(fileName);
                        setExportModalVisible(true);
                        setExportLoading(false);
                    })
                    .catch(error => {
                        console.error('Erro ao exportar pagamentos:', error);
                        setExportLoading(false);
                        showMessage('Erro', 'Não foi possível exportar os dados de pagamentos.');
                    });
                break;

            case 'costs':
                fileName = 'custos_papa_tango.csv';
                setExportLoading(true);
                getDocs(collection(db, "costs"))
                    .then(snapshot => {
                        data = snapshot.docs.map(doc => {
                            const costData = doc.data();
                            // Formatação correta da data
                            let dataFormatada = '';
                            if (costData.date) {
                                const date = costData.date.toDate ?
                                    costData.date.toDate() :
                                    new Date(costData.date);
                                dataFormatada = date.toLocaleDateString('pt-BR');
                            }

                            let dataCriacao = '';
                            if (costData.createdAt) {
                                const date = costData.createdAt.toDate ?
                                    costData.createdAt.toDate() :
                                    new Date(costData.createdAt);
                                dataCriacao = date.toLocaleDateString('pt-BR');
                            }

                            return {
                                clientEmail: costData.clientEmail || '',
                                id: doc.id,
                                clientName: costData.clientName || 'Sem cliente',
                                valor: costData.value || 0,
                                data: dataFormatada,
                                dataCriacao: dataCriacao,
                                categoria: costData.category || '',
                                descricao: costData.description || '',
                                tipoPagamento: costData.paymentType || '',
                                parcelas: costData.installments || 1,
                                valorParcela: costData.installmentValue || 0,
                                criadoPor: costData.createdBy || ''
                            };
                        });
                        setExportData(data);
                        setExportFileName(fileName);
                        setExportModalVisible(true);
                        setExportLoading(false);
                    })
                    .catch(error => {
                        console.error('Erro ao exportar custos:', error);
                        setExportLoading(false);
                        showMessage('Erro', 'Não foi possível exportar os dados de custos.');
                    });
                break;

            case 'bikes':
                fileName = 'motos_papa_tango.csv';
                setExportLoading(true);
                getDocs(collection(db, "motos"))
                    .then(snapshot => {
                        data = snapshot.docs.map(doc => {
                            const bikeData = doc.data();
                            let dataCadastroBikes = '';
                            if (bikeData.dataCadastro) {
                                const date = bikeData.dataCadastro.toDate ?
                                    bikeData.dataCadastro.toDate() :
                                    new Date(bikeData.dataCadastro);
                                dataCadastroBikes = date.toLocaleDateString('pt-BR');
                            }

                            return {
                                id: doc.id,
                                placa: bikeData.placa || '',
                                marca: bikeData.marca || '',
                                modelo: bikeData.modelo || '',
                                anoModelo: bikeData.anoModelo || '',
                                status: bikeData.status || '',
                                chassi: bikeData.chassi || '',
                                renavam: bikeData.renavam || '',
                                linkFoto: bikeData.fotoUrl || '',
                                dataCadastro: dataCadastroBikes,
                            };
                        });
                        setExportData(data);
                        setExportFileName(fileName);
                        setExportModalVisible(true);
                        setExportLoading(false);
                    })
                    .catch(error => {
                        console.error('Erro ao exportar motos:', error);
                        setExportLoading(false);
                        showMessage('Erro', 'Não foi possível exportar os dados de motos.');
                    });
                break;

            case 'contracts':
                fileName = 'contratos_papa_tango.csv';
                setExportLoading(true);
                getDocs(collection(db, "contratos"))
                    .then(snapshot => {
                        data = snapshot.docs.map(doc => {
                            const contractData = doc.data();
                            let dataCriacao = '';
                            if (contractData.dataCriacao) {
                                const date = contractData.dataCriacao.toDate ?
                                    contractData.dataCriacao.toDate() :
                                    new Date(contractData.dataCriacao);
                                dataCriacao = date.toLocaleDateString('pt-BR');
                            }

                            let dataInicio = '';
                            if (contractData.dataInicio) {
                                const date = contractData.dataInicio.toDate ?
                                    contractData.dataInicio.toDate() :
                                    new Date(contractData.dataInicio);
                                dataInicio = date.toLocaleDateString('pt-BR');
                            }

                            return {
                                cliente: contractData.cliente || '',
                                id: doc.id,
                                dataCriacao: dataCriacao,
                                dataInicio: dataInicio,
                                mesesContratados: contractData.mesesContratados || '',
                                motoId: contractData.motoId || '',
                                renovacaoAutomatica: contractData.renovacaoAutomatica ? 'Sim' : 'Não',
                                statusContrato: contractData.statusContrato ? 'Ativo' : 'Inativo',
                                tipoRecorrenciaPagamento: contractData.tipoRecorrenciaPagamento || '',
                                linkContrato: contractData.urlContrato || '',
                            };
                        });
                        setExportData(data);
                        setExportFileName(fileName);
                        setExportModalVisible(true);
                        setExportLoading(false);
                    })
                    .catch(error => {
                        console.error('Erro ao exportar contratos:', error);
                        setExportLoading(false);
                        showMessage('Erro', 'Não foi possível exportar os dados de contratos.');
                    });
                break;

            case 'rentals':
                fileName = 'locacoes_papa_tango.csv';
                setExportLoading(true);
                getDocs(collection(db, "alugueis"))
                    .then(snapshot => {
                        data = snapshot.docs.map(doc => {
                            const rentalData = doc.data();
                            let dataCriacaoRentals = '';
                            if (rentalData.dataCriacao) {
                                const date = rentalData.dataCriacao.toDate ?
                                    rentalData.dataCriacao.toDate() :
                                    new Date(rentalData.dataCriacao);
                                dataCriacaoRentals = date.toLocaleDateString('pt-BR');
                            }

                            let dataAtualizacaoRentals = '';
                            if (rentalData.dataAtualizacao) {
                                const date = rentalData.dataAtualizacao.toDate ?
                                    rentalData.dataAtualizacao.toDate() :
                                    new Date(rentalData.dataAtualizacao);
                                dataAtualizacaoRentals = date.toLocaleDateString('pt-BR');
                            }

                            return {
                                id: doc.id,
                                ativo: rentalData.ativo ? 'Sim' : 'Não',
                                motoId: rentalData.motoId || '',
                                valorCaucao: rentalData.valorCaucao || '',
                                valorMensal: rentalData.valorMensal || '',
                                valorSemanal: rentalData.valorSemanal || '',
                                dataCriacao: dataCriacaoRentals,
                                dataAtualizacao: dataAtualizacaoRentals,
                            };
                        });
                        setExportData(data);
                        setExportFileName(fileName);
                        setExportModalVisible(true);
                        setExportLoading(false);
                    })
                    .catch(error => {
                        console.error('Erro ao exportar locações:', error);
                        setExportLoading(false);
                        showMessage('Erro', 'Não foi possível exportar os dados de locações.');
                    });
                break;

            default:
                showMessage('Erro', 'Tipo de exportação inválido.');
                break;
        }
    }, []);


    // Função para converter dados para CSV
    const convertToCSV = useCallback((data) => {
        if (!data || data.length === 0) return '';

        const header = Object.keys(data[0]).join(',');
        const rows = data.map(item => {
            return Object.values(item).map(value => {
                // Tratar valores com vírgulas ou aspas
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        });

        return [header, ...rows].join('\n');
    }, []);

    // Função para exportar CSV na web
    const exportCSVWeb = useCallback((csvContent, fileName) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    // Função para exportar CSV no mobile
    const exportCSVMobile = useCallback(async (csvContent, fileName) => {
        try {
            const fileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

            // Verificar se o compartilhamento é suportado
            const isAvailable = await Sharing.isAvailableAsync();

            if (isAvailable) {
                await Sharing.shareAsync(fileUri);
            } else {
                // Oferecer alternativas se o compartilhamento não estiver disponível
                Alert.alert(
                    "Compartilhamento não disponível",
                    "Deseja enviar o arquivo por outro método?",
                    [
                        {
                            text: "WhatsApp",
                            onPress: () => openWhatsAppWithFile(fileUri, fileName)
                        },
                        {
                            text: "Email",
                            onPress: () => openEmailWithFile(fileUri, fileName)
                        },
                        {
                            text: "Cancelar",
                            style: "cancel"
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Erro ao exportar arquivo no mobile:', error);
            Alert.alert(
                'Erro',
                'Não foi possível exportar o arquivo. Deseja tentar outro método?',
                [
                    {
                        text: "WhatsApp",
                        onPress: () => openWhatsAppWithFile(null, fileName)
                    },
                    {
                        text: "Email",
                        onPress: () => openEmailWithFile(null, fileName)
                    },
                    {
                        text: "Cancelar",
                        style: "cancel"
                    }
                ]
            );
        }
    }, []);

    // Função para abrir WhatsApp com o arquivo
    const openWhatsAppWithFile = useCallback((fileUri, fileName) => {
        try {
            Linking.openURL('whatsapp://send?text=Dados exportados do Papa Motos');
        } catch (error) {
            console.error('Erro ao abrir WhatsApp:', error);
            Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
        }
    }, []);

    // Função para abrir Email com o arquivo
    const openEmailWithFile = useCallback((fileUri, fileName) => {
        try {
            Linking.openURL(`mailto:?subject=Dados exportados - Papa Motos&body=Segue em anexo os dados exportados: ${fileName}`);
        } catch (error) {
            console.error('Erro ao abrir Email:', error);
            Alert.alert('Erro', 'Não foi possível abrir o app de email');
        }
    }, []);

    // Função para confirmar exportação
    const confirmExport = useCallback(() => {
        const csvContent = convertToCSV(exportData);

        if (Platform.OS === 'web') {
            exportCSVWeb(csvContent, exportFileName);
        } else {
            exportCSVMobile(csvContent, exportFileName);
        }

        setExportModalVisible(false);
    }, [exportData, exportFileName, convertToCSV, exportCSVWeb, exportCSVMobile]);

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
                            <MemoizedStatCard
                                color="#3498db"
                                icon={<MaterialIcons name="people" size={24} color="#fff" />}
                                title="Total de Usuários"
                                number={stats.totalUsers}
                                onPress={() => navigateToUsers('todos')}
                            />

                            <MemoizedStatCard
                                color="#2ecc71"
                                icon={<MaterialIcons name="check-circle" size={24} color="#fff" />}
                                title="Usuários Aprovados"
                                number={stats.approvedUsers}
                                onPress={() => navigateToUsers('aprovados')}
                            />

                            <MemoizedStatCard
                                color="#e74c3c"
                                icon={<MaterialIcons name="pending" size={24} color="#fff" />}
                                title="Usuários Pendentes"
                                number={stats.notApprovedUsers}
                                onPress={() => navigateToUsers('pendentes')}
                            />

                            <MemoizedStatCard
                                color="#9b59b6"
                                icon={<FontAwesome5 name="motorcycle" size={24} color="#fff" />}
                                title="Total de Motos"
                                number={stats.totalBikes}
                                onPress={navigateToBikes}
                            />

                            <MemoizedStatCard
                                color="#f39c12"
                                icon={<MaterialIcons name="description" size={24} color="#fff" />}
                                title="Contratos Ativos"
                                number={stats.activeContracts}
                                onPress={() => navigateToContracts('ativos')}
                            />

                            <MemoizedStatCard
                                color="#16a085"
                                icon={<MaterialIcons name="attach-money" size={24} color="#fff" />}
                                title="Total de Aluguéis"
                                number={stats.totalRentals}
                                onPress={navigateToRentals}
                            />
                        </CardGrid>
                    ) : (
                        // Layout para web (três colunas)
                        <>
                            <CardRow>
                                <MemoizedStatCard
                                    color="#3498db"
                                    icon={<MaterialIcons name="people" size={24} color="#fff" />}
                                    title="Total de Usuários"
                                    number={stats.totalUsers}
                                    onPress={() => navigateToUsers('todos')}
                                />

                                <MemoizedStatCard
                                    color="#2ecc71"
                                    icon={<MaterialIcons name="check-circle" size={24} color="#fff" />}
                                    title="Usuários Aprovados"
                                    number={stats.approvedUsers}
                                    onPress={() => navigateToUsers('aprovados')}
                                />

                                <MemoizedStatCard
                                    color="#e74c3c"
                                    icon={<MaterialIcons name="pending" size={24} color="#fff" />}
                                    title="Usuários Pendentes"
                                    number={stats.notApprovedUsers}
                                    onPress={() => navigateToUsers('pendentes')}
                                />
                            </CardRow>

                            <CardRow>
                                <MemoizedStatCard
                                    color="#9b59b6"
                                    icon={<FontAwesome5 name="motorcycle" size={24} color="#fff" />}
                                    title="Total de Motos"
                                    number={stats.totalBikes}
                                    onPress={navigateToBikes}
                                />

                                <MemoizedStatCard
                                    color="#f39c12"
                                    icon={<MaterialIcons name="description" size={24} color="#fff" />}
                                    title="Contratos Ativos"
                                    number={stats.activeContracts}
                                    onPress={() => navigateToContracts('ativos')}
                                />

                                <MemoizedStatCard
                                    color="#16a085"
                                    icon={<MaterialIcons name="attach-money" size={24} color="#fff" />}
                                    title="Total de Aluguéis"
                                    number={stats.totalRentals}
                                    onPress={navigateToRentals}
                                />
                            </CardRow>
                        </>
                    )}
                </StatsContainer>

                {/* Seção Financeira */}
                <FinancialSection>
                    <FinancialSectionTitle>Financeiro</FinancialSectionTitle>
                    <FinancialSectionSubtitle>Visão geral das receitas, pagamentos e custos</FinancialSectionSubtitle>

                    {isMobile ? (
                        // Layout para dispositivos móveis (uma coluna)
                        <>
                            <View style={{ marginBottom: 10 }}>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="account-balance-wallet" size={24} color="#2ecc71" />}
                                    title="Receita Total"
                                    value={formatCurrency(financialStats.totalRevenue)}
                                    subtitle="Desde o início"
                                    style={{ width: '100%' }}
                                />
                            </View>

                            <View style={{ marginBottom: 10 }}>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="date-range" size={24} color="#3498db" />}
                                    title="Receita Mensal"
                                    value={formatCurrency(financialStats.monthlyRevenue)}
                                    subtitle="Mês atual"
                                    trend={renderFinancialTrend}
                                    style={{ width: '100%' }}
                                />
                            </View>

                            <View style={{ marginBottom: 10 }}>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="today" size={24} color="#9b59b6" />}
                                    title="Receita Semanal"
                                    value={formatCurrency(financialStats.weeklyRevenue)}
                                    subtitle="Semana atual"
                                    style={{ width: '100%' }}
                                />
                            </View>

                            {/* Seção de Custos */}
                            <View style={{ marginBottom: 10 }}>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="trending-down" size={24} color="#f39c12" />}
                                    title="Custos Mensais"
                                    value={formatCurrency(costsStats.monthlyCosts)}
                                    subtitle="Mês atual"
                                    style={{ width: '100%' }}
                                />
                            </View>

                            {/* Seção de Lucro Líquido */}
                            <View style={{ marginBottom: 10 }}>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="timeline" size={24} color="#2980b9" />}
                                    title="Lucro Líquido Mensal"
                                    value={formatCurrency(netProfit.monthly)}
                                    subtitle="Mês atual"
                                    style={{ width: '100%' }}
                                />
                            </View>

                            <MemoizedStatCard
                                color="#e74c3c"
                                icon={<MaterialIcons name="warning" size={24} color="#fff" />}
                                title="Pagamentos Atrasados"
                                number={financialStats.overduePayments}
                                onPress={() => navigateToPayments('atrasados')}
                                style={{ width: '100%', marginBottom: 10 }}
                            />

                            <MemoizedStatCard
                                color="#f39c12"
                                icon={<MaterialIcons name="event" size={24} color="#fff" />}
                                title="Pagamentos Hoje"
                                number={financialStats.dueTodayPayments}
                                onPress={() => navigateToPayments('hoje')}
                                style={{ width: '100%', marginBottom: 10 }}
                            />

                            <RefreshButton onPress={refreshData} style={{ width: '100%', marginTop: 10 }}>
                                <MaterialIcons name="refresh" size={20} color="#fff" />
                                <RefreshButtonText>Atualizar Dados</RefreshButtonText>
                            </RefreshButton>
                        </>
                    ) : (
                        // Layout para web 
                        <>
                            <CardRow>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="account-balance-wallet" size={24} color="#2ecc71" />}
                                    title="Receita Total"
                                    value={formatCurrency(financialStats.totalRevenue)}
                                    subtitle="Desde o início"
                                />

                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="money-off" size={24} color="#e74c3c" />}
                                    title="Custos Totais"
                                    value={formatCurrency(costsStats.totalCosts)}
                                    subtitle="Desde o início"
                                />
                            </CardRow>

                            <CardRow>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="date-range" size={24} color="#3498db" />}
                                    title="Receita Mensal"
                                    value={formatCurrency(financialStats.monthlyRevenue)}
                                    subtitle="Mês atual"
                                    trend={renderFinancialTrend}
                                />

                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="trending-down" size={24} color="#f39c12" />}
                                    title="Custos Mensais"
                                    value={formatCurrency(costsStats.monthlyCosts)}
                                    subtitle="Mês atual"
                                />
                            </CardRow>

                            <CardRow>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="today" size={24} color="#9b59b6" />}
                                    title="Receita Semanal"
                                    value={formatCurrency(financialStats.weeklyRevenue)}
                                    subtitle="Semana atual"
                                />

                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="attach-money" size={24} color="#8e44ad" />}
                                    title="Custos Semanais"
                                    value={formatCurrency(costsStats.weeklyCosts)}
                                    subtitle="Semana atual"
                                />
                            </CardRow>

                            <CardRow>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="show-chart" size={24} color="#27ae60" />}
                                    title="Lucro Líquido Total"
                                    value={formatCurrency(netProfit.total)}
                                    subtitle="Receita - Custos"
                                />

                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="timeline" size={24} color="#2980b9" />}
                                    title="Lucro Líquido Mensal"
                                    value={formatCurrency(netProfit.monthly)}
                                    subtitle="Mês atual"
                                />
                            </CardRow>

                            <CardRow>
                                <MemoizedFinancialCard
                                    icon={<MaterialIcons name="assessment" size={24} color="#16a085" />}
                                    title="Lucro Líquido Semanal"
                                    value={formatCurrency(netProfit.weekly)}
                                    subtitle="Semana atual"
                                />
                            </CardRow>

                            <CardRow>
                                <MemoizedStatCard
                                    color="#e74c3c"
                                    icon={<MaterialIcons name="warning" size={24} color="#fff" />}
                                    title="Pagamentos Atrasados"
                                    number={financialStats.overduePayments}
                                    onPress={() => navigateToPayments('atrasados')}
                                    style={{ width: '48%' }}
                                />

                                <MemoizedStatCard
                                    color="#f39c12"
                                    icon={<MaterialIcons name="event" size={24} color="#fff" />}
                                    title="Pagamentos Hoje"
                                    number={financialStats.dueTodayPayments}
                                    onPress={() => navigateToPayments('hoje')}
                                    style={{ width: '48%' }}
                                />
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
                            horizontalLabelRotation: Platform.OS !== 'web' ? -15 : 0,
                            propsForLabels: {
                                fontSize: Platform.OS !== 'web' ? 10 : 13,
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
                        center={Platform.OS === 'web' && window.innerWidth > 768 ? [320, 0] : [10, 0]}
                        absolute
                    />
                    <ChartLegend>
                        {chartData.userDistribution.map((item, index) => (
                            <MemoizedChartLegendItem
                                key={index}
                                color={item.color}
                                text={`${item.name}: ${item.population}`}
                            />
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
                        center={Platform.OS === 'web' && window.innerWidth > 768 ? [320, 0] : [10, 0]}
                        absolute
                    />
                    <ChartLegend>
                        {chartData.paymentStatus.map((item, index) => (
                            <MemoizedChartLegendItem
                                key={index}
                                color={item.color}
                                text={`${item.name}: ${item.population}`}
                            />
                        ))}
                    </ChartLegend>
                </ChartContainer>

                {/* Gráfico de Custos por Categoria */}
                {chartData.costsByCategory && chartData.costsByCategory.length > 0 && (
                    <ChartContainer>
                        <ChartTitle>Custos por Categoria</ChartTitle>
                        <PieChart
                            data={chartData.costsByCategory}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={lineChartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={Platform.OS === 'web' && window.innerWidth > 768 ? [320, 0] : [10, 0]}
                            absolute
                        />
                        <ChartLegend>
                            {chartData.costsByCategory.map((item, index) => (
                                <MemoizedChartLegendItem
                                    key={index}
                                    color={item.color}
                                    text={`${item.name}: ${formatCurrency(item.population)}`}
                                />
                            ))}
                        </ChartLegend>
                    </ChartContainer>
                )}

                {/* Gráfico de Custos por Cliente (Top 5) */}
                {chartData.costsByClientLabels && chartData.costsByClientLabels.length > 0 && (
                    <ChartContainer>
                        <ChartTitle>Top 5 Clientes com Mais Custos</ChartTitle>
                        <BarChart
                            data={barChartData}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={{
                                ...lineChartConfig,
                                color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                                horizontalLabelRotation: Platform.OS !== 'web' ? -45 : -30,
                                propsForLabels: {
                                    fontSize: Platform.OS !== 'web' ? 8 : 10,
                                }
                            }}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                            verticalLabelRotation={30}
                            fromZero={true}
                        />
                    </ChartContainer>
                )}

                {/* Seção de Exportação de Dados */}
                <SectionTitle>Exportação de Dados</SectionTitle>
                <ButtonsContainer>
                    <ActionButton onPress={() => handleExportData('users')}>
                        <MaterialIcons name="people" size={20} color="#FFFFFF" />
                        <ActionButtonText>Exportar Usuários</ActionButtonText>
                    </ActionButton>

                    <ActionButton onPress={() => handleExportData('payments')}>
                        <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                        <ActionButtonText>Exportar Pagamentos</ActionButtonText>
                    </ActionButton>

                    <ActionButton onPress={() => handleExportData('costs')}>
                        <MaterialIcons name="money-off" size={20} color="#FFFFFF" />
                        <ActionButtonText>Exportar Custos</ActionButtonText>
                    </ActionButton>

                    <ActionButton onPress={() => handleExportData('bikes')}>
                        <FontAwesome5 name="motorcycle" size={20} color="#FFFFFF" />
                        <ActionButtonText>Exportar Motos</ActionButtonText>
                    </ActionButton>

                    <ActionButton onPress={() => handleExportData('contracts')}>
                        <MaterialIcons name="description" size={20} color="#FFFFFF" />
                        <ActionButtonText>Exportar Contratos</ActionButtonText>
                    </ActionButton>

                    <ActionButton onPress={() => handleExportData('rentals')}>
                        <MaterialIcons name="assignment" size={20} color="#FFFFFF" />
                        <ActionButtonText>Exportar Aluguéis</ActionButtonText>
                    </ActionButton>

                </ButtonsContainer>

                {/* Botões de Ação */}
                <SectionTitle>Ações Rápidas</SectionTitle>
                <ButtonsContainer>
                    <ActionButton onPress={handleBulkMessages}>
                        <MaterialIcons name="send" size={20} color="#FFFFFF" />
                        <ActionButtonText>Enviar Mensagens em Massa</ActionButtonText>
                    </ActionButton>

                    <ActionButton onPress={handleCost}>
                        <MaterialIcons name="attach-money" size={20} color="#FFFFFF" />
                        <ActionButtonText>Gerenciar Custos</ActionButtonText>
                    </ActionButton>

                    <LogoutButton onPress={handleLogout}>
                        <MaterialIcons name="exit-to-app" size={20} color="#FFFFFF" />
                        <LogoutText>Sair da Conta</LogoutText>
                    </LogoutButton>
                </ButtonsContainer>
            </DashboardScrollView>

            {/* Modal de Exportação */}
            <Modal
                visible={exportModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setExportModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }}>
                    <View style={{
                        width: isMobile ? '90%' : '50%',
                        backgroundColor: 'white',
                        borderRadius: 10,
                        padding: 20,
                        alignItems: 'center',
                        elevation: 5
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
                            Exportar Dados
                        </Text>

                        {exportLoading ? (
                            <ActivityIndicator size="large" color="#CB2921" />
                        ) : (
                            <>
                                <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                                    Você está prestes a exportar {exportData.length} registros para o arquivo {exportFileName}.
                                </Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#CB2921',
                                            padding: 10,
                                            borderRadius: 5,
                                            width: '45%',
                                            alignItems: 'center'
                                        }}
                                        onPress={confirmExport}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirmar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#ccc',
                                            padding: 10,
                                            borderRadius: 5,
                                            width: '45%',
                                            alignItems: 'center'
                                        }}
                                        onPress={() => setExportModalVisible(false)}
                                    >
                                        <Text style={{ fontWeight: 'bold' }}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </Container>
    );
}

