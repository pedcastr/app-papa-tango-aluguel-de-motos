import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Alert, Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { db, auth } from '../../../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, orderBy, getDocs, where, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
    StatusText,
    Divider,
} from './styles';

export default function AdminPayments() {
    const navigation = useNavigation();
    
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'overdue'

    // Função para funcionar a navegação da tela Dashboard para a tela de Pagamentos com filtro aplicado
    useEffect(() => {
        let isMounted = true;
        
        // Função para verificar e aplicar o filtro quando o componente recebe foco
        const checkFilterOnFocus = async () => {
            if (Platform.OS === 'web') return; // Apenas para mobile
            
            try {
                const filter = await AsyncStorage.getItem('paymentListFilter');
                const timestamp = await AsyncStorage.getItem('paymentListFilterTimestamp');
                
                // Verificar se temos um filtro e um timestamp
                if (filter && timestamp && isMounted) {
                    
                    // Mapear o valor do filtro para o formato esperado pela função applyFilters
                    let filterValue;
                    if (filter === 'atrasados') {
                        filterValue = 'overdue';
                        setActiveFilter('overdue');
                    } else if (filter === 'hoje') {
                        filterValue = 'today';
                        setActiveFilter('today');
                    } else {
                        filterValue = 'all';
                        setActiveFilter('all');
                    }
                    
                    // Aplicar os filtros aos dados
                    if (payments.length > 0) {
                        setTimeout(() => {
                            if (isMounted) {
                                applyFilters(payments, filterValue, searchText);
                            }
                        }, 300);
                    }
                    
                    // Limpar o filtro após aplicá-lo para permitir alterações futuras
                    await AsyncStorage.removeItem('paymentListFilter');
                    await AsyncStorage.removeItem('paymentListFilterTimestamp');
                }
            } catch (error) {
                console.error('Erro ao verificar filtro no foco:', error);
            }
        };
        
        // Configurar listener para o evento de foco
        const unsubscribe = navigation.addListener('focus', checkFilterOnFocus);
        
        // Verificar filtro ao montar o componente
        checkFilterOnFocus();
        
        // Cleanup
        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [navigation, payments, searchText]);
    
    // Adicione este useEffect para aplicar o filtro inicial
    useEffect(() => {
        let isMounted = true;
        
        // Função para aplicar filtro recebido
        const applyInitialFilter = async () => {
            try {
                // Verificar se há um filtro salvo
                let filterValue = null;
                
                // Tentar obter do AsyncStorage
                const asyncStorageFilter = await AsyncStorage.getItem('paymentListFilter');
                if (asyncStorageFilter) {
                    filterValue = asyncStorageFilter; // Usar o valor diretamente
                    // Limpar o filtro após usá-lo
                    await AsyncStorage.removeItem('paymentListFilter');
                }
                
                // Para web, verificar também o sessionStorage
                if (Platform.OS === 'web' && !filterValue) {
                    const sessionFilter = sessionStorage.getItem('paymentListFilter');
                    if (sessionFilter) {
                        filterValue = sessionFilter; // Usar o valor diretamente
                        // Limpar o filtro após usá-lo
                        sessionStorage.removeItem('paymentListFilter');
                    }
                }
                
                if (filterValue && isMounted) {
                    
                    // Mapear o valor do filtro para o formato esperado pela função applyFilters
                    let filterType;
                    if (filterValue === 'atrasados') {
                        filterType = 'overdue';
                        setActiveFilter('overdue');
                    } else if (filterValue === 'hoje') {
                        filterType = 'today';
                        setActiveFilter('today');
                    } else {
                        filterType = 'all';
                        setActiveFilter('all');
                    }
                    
                    // Garantir que os dados estejam carregados antes de aplicar o filtro
                    if (payments.length > 0) {
                        // Aplicar os filtros aos dados com um pequeno delay
                        setTimeout(() => {
                            if (isMounted) {
                                applyFilters(payments, filterType, searchText);
                            }
                        }, 300);
                    }
                }
            } catch (error) {
                console.error('Erro ao recuperar filtro de pagamentos:', error);
            }
        };
        
        // Executar ao montar o componente
        applyInitialFilter();
        
        // Configurar listener para eventos de filtro (web)
        const handleFilterEvent = (event) => {
            if (!isMounted) return;
            
            const { filter } = event.detail;
            
            // Mapear o valor do filtro para o formato esperado pela função applyFilters
            let filterType;
            if (filter === 'atrasados') {
                filterType = 'overdue';
                setActiveFilter('overdue');
            } else if (filter === 'hoje') {
                filterType = 'today';
                setActiveFilter('today');
            } else {
                filterType = 'all';
                setActiveFilter('all');
            }
            
            // Aplicar os filtros aos dados com um pequeno delay
            setTimeout(() => {
                if (isMounted && payments.length > 0) {
                    applyFilters(payments, filterType, searchText);
                }
            }, 300);
        };
        
        // Adicionar listener apenas no ambiente web
        if (Platform.OS === 'web') {
            document.addEventListener('applyPaymentFilter', handleFilterEvent);
        }
        
        // Cleanup
        return () => {
            isMounted = false;
            if (Platform.OS === 'web') {
                document.removeEventListener('applyPaymentFilter', handleFilterEvent);
            }
        };
        
    }, []);

    // UseEffect para reagir a mudanças nos dados
    useEffect(() => {
        // Verificar se temos um filtro ativo que não seja 'all'
        if (activeFilter !== 'all' && payments.length > 0) {
            // Aplicar o filtro aos dados atualizados
            applyFilters(payments, activeFilter, searchText);
        }
    }, [payments]);

    // useEffect para gerenciar autenticação e listener
    useEffect(() => {
        let contratosUnsubscribe = () => {};
        let paymentsUnsubscribe = () => {};
        let alugueisUnsubscribe = () => {};
        
        const authUnsubscribe = auth.onAuthStateChanged(async (user) => {
          // Limpar os listeners anteriores se existirem
          if (typeof contratosUnsubscribe === 'function') {
            contratosUnsubscribe();
          }
          if (typeof paymentsUnsubscribe === 'function') {
            paymentsUnsubscribe();
          }
          if (typeof alugueisUnsubscribe === 'function') {
            alugueisUnsubscribe();
          }
          
          if (user) {
            setLoading(true);
            
            try {
                // Configurar Listener para alugueis
                const alugueisRef = collection(db, 'alugueis');
                alugueisUnsubscribe = onSnapshot(alugueisRef, () => {
                // Buscar todos os contratos ativos
                const contratosRef = collection(db, 'contratos');
                const q = query(contratosRef, where('statusContrato', '==', true));
                
                // Configurar listener para contratos
                contratosUnsubscribe = onSnapshot(q, async (contratosSnapshot) => {
                    try {
                    // Armazenar os emails dos clientes para buscar seus pagamentos
                    const clientEmails = [];
                    const contratosData = [];
                    
                    // Processar contratos e coletar emails
                    for (const contratoDoc of contratosSnapshot.docs) {
                        const contratoData = contratoDoc.data();
                        
                        if (!contratoData.cliente) {
                        console.log('Contrato sem email de cliente:', contratoDoc.id);
                        continue;
                        }
                        
                        clientEmails.push(contratoData.cliente);
                        contratosData.push({
                        id: contratoDoc.id,
                        ...contratoData
                        });
                    }
                    
                    // Se não houver contratos, limpar os pagamentos e sair
                    if (clientEmails.length === 0) {
                        setPayments([]);
                        setFilteredPayments([]);
                        setLoading(false);
                        return;
                    }
                    
                    // Configurar listener para todos os pagamentos dos clientes com contratos ativos
                    const paymentsRef = collection(db, 'payments');
                    // Usar operador "in" para buscar pagamentos de todos os clientes
                    const paymentsQuery = query(
                        paymentsRef,
                        where('userEmail', 'in', clientEmails),
                        orderBy('dateCreated', 'desc')
                    );
                    
                    paymentsUnsubscribe = onSnapshot(paymentsQuery, async (paymentsSnapshot) => {
                        try {
                        // Agrupar pagamentos por email do usuário
                        const paymentsByUser = {};
                        
                        paymentsSnapshot.docs.forEach(doc => {
                            const paymentData = doc.data();
                            const userEmail = paymentData.userEmail;
                            
                            if (!paymentsByUser[userEmail]) {
                            paymentsByUser[userEmail] = [];
                            }
                            
                            paymentsByUser[userEmail].push({
                            id: doc.id,
                            ...paymentData
                            });
                        });
                        
                        // Agora processar os contratos com os pagamentos atualizados
                        const paymentsData = [];
                        
                        for (const contrato of contratosData) {
                            const userEmail = contrato.cliente;
                            
                            // Buscar informações do usuário
                            const userRef = doc(db, 'users', userEmail);
                            const userSnapshot = await getDoc(userRef);
                            
                            if (!userSnapshot.exists()) {
                            console.log('Usuário não encontrado:', userEmail);
                            continue;
                            }
                            
                            const userData = userSnapshot.data();
                            
                            // Buscar o aluguel associado ao contrato
                            let valorMensal = 0;
                            let valorSemanal = 0;
                            let tipoRecorrencia = 'mensal'; // Valor padrão
                            
                            if (contrato.aluguelId) {
                            const aluguelRef = doc(db, 'alugueis', contrato.aluguelId);
                            const aluguelSnapshot = await getDoc(aluguelRef);
                            
                            if (aluguelSnapshot.exists()) {
                                const aluguelData = aluguelSnapshot.data();
                                valorMensal = aluguelData.valorMensal || 0;
                                valorSemanal = aluguelData.valorSemanal || 0;
                            }
                            }
                            
                            // Obter o tipo de recorrência do contrato
                            tipoRecorrencia = contrato.tipoRecorrenciaPagamento || 'mensal';
                            
                            // Buscar informações da moto
                            let motoPlaca = 'N/A';
                            let motoModelo = 'N/A';
                            
                            if (contrato.motoId) {
                            const motoRef = doc(db, 'motos', contrato.motoId);
                            const motoSnapshot = await getDoc(motoRef);
                            
                            if (motoSnapshot.exists()) {
                                const motoData = motoSnapshot.data();
                                motoPlaca = motoData.placa || 'N/A';
                                motoModelo = motoData.modelo || 'N/A';
                            }
                            }
                            
                            // Obter pagamentos do usuário (já atualizados pelo listener)
                            const userPayments = paymentsByUser[userEmail] || [];
                            
                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia
                            
                            // Verificar se existe algum pagamento aprovado
                            const ultimoPagamentoAprovado = userPayments.find(payment => 
                            payment.status === 'approved'
                            );
                            
                            let dataBase;
                            let proximaData;
                            let dataUltimoPagamento = null;
                            
                            // Se tiver pagamento aprovado, calcular a partir dele
                            if (ultimoPagamentoAprovado) {
                            const ultimoPagamentoData = ultimoPagamentoAprovado.dateCreated?.toDate();
                            if (ultimoPagamentoData) {
                                dataBase = new Date(ultimoPagamentoData);
                                dataBase.setHours(0, 0, 0, 0); // Normalizar para início do dia
                                dataUltimoPagamento = new Date(dataBase);
                            } else {
                                dataBase = new Date(contrato.dataInicio?.toDate() || hoje);
                                dataBase.setHours(0, 0, 0, 0);
                            }
                            } else {
                            // Se não tiver pagamento aprovado, usar a data de início do contrato
                            dataBase = new Date(contrato.dataInicio?.toDate() || hoje);
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
                            
                            existePagamentoAtual = userPayments.some(payment => {
                                const paymentDate = payment.dateCreated?.toDate();
                                if (!paymentDate) return false;
                                
                                return paymentDate >= inicioSemanaAtual &&
                                    paymentDate < proximaData &&
                                    payment.status === 'approved';
                            });
                            } else {
                            // Para pagamento mensal, verificar se há pagamento no mês atual
                            const inicioMesAtual = new Date(proximaData);
                            inicioMesAtual.setMonth(inicioMesAtual.getMonth() - 1);
                            
                            existePagamentoAtual = userPayments.some(payment => {
                                const paymentDate = payment.dateCreated?.toDate();
                                if (!paymentDate) return false;
                                
                                return paymentDate >= inicioMesAtual &&
                                    paymentDate < proximaData &&
                                    payment.status === 'approved';
                            });
                            }
                            
                            // Calcular dias restantes (incluindo o dia de hoje)
                            const diasRestantes = Math.floor((proximaData - hoje) / (1000 * 60 * 60 * 24));
                            
                            // Determinar status
                            let status;
                            if (diasRestantes < 0) {
                                status = 'overdue'; // Atrasado
                            } else if (diasRestantes === 0) {
                                status = 'today'; // Hoje é o vencimento
                            } else {
                                status = 'pending'; // Pendente
                            }
                            
                            // Adicionar informação de pagamento
                            paymentsData.push({
                            id: contrato.id,
                            contratoId: contrato.id,
                            userEmail: userEmail,
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
                            ultimoPagamento: userPayments.length > 0 ? userPayments[0] : null,
                            dataUltimoPagamento
                            });
                        }
                        
                        setPayments(paymentsData);
                        applyFilters(paymentsData, activeFilter, searchText);
                        setLoading(false);
                        } catch (error) {
                        console.error('Erro ao processar pagamentos:', error);
                        setLoading(false);
                        }
                    }, (error) => {
                        console.error('Erro no listener de pagamentos:', error);
                        setLoading(false);
                    });
                } catch (error) {
                  console.error('Erro ao processar contratos:', error);
                  setLoading(false);
                }
              }, (error) => {
                console.error('Erro no listener de contratos:', error);
                setLoading(false);
              });  
            });
            } catch (error) {
              console.error('Erro ao configurar listener:', error);
              setLoading(false);
            }
          } else {
            setLoading(false);
            setPayments([]);
          }
        });
        
        return () => {
          authUnsubscribe();
          if (typeof contratosUnsubscribe === 'function') {
            contratosUnsubscribe();
          }
          if (typeof paymentsUnsubscribe === 'function') {
            paymentsUnsubscribe();
          }
          if (typeof alugueisUnsubscribe === 'function') {
            alugueisUnsubscribe();
          }
        };
      }, [activeFilter, searchText]);
      
  
    
    // Função para mostrar o Alert em dispositivos móveis e o window.alert no web
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };
    
    // Função para enviar notificação pelo Firestore
    const enviarNotificacaoPeloFirestore = async (userEmail, title, body, data) => {
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
            
            return true;
        } catch (error) {
            console.error(`Erro ao criar solicitação de email: ${error.message}`);
            return false;
        }
    };
    
    // Função para aplicar filtros
    const applyFilters = (data, filter, search) => {
        let result = [...data];
        
        // Aplicar filtro de status
        if (filter === 'today') {
            // Filtro para pagamentos de hoje
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            result = result.filter(item => {
                // Verificar se o pagamento é para hoje
                if (item.proximaData) {
                    const proximaDataObj = new Date(item.proximaData);
                    proximaDataObj.setHours(0, 0, 0, 0);
                    
                    // Comparar apenas as datas (ignorando as horas)
                    return proximaDataObj.getTime() === hoje.getTime();
                }
                return false;
            });
        } else if (filter !== 'all') {
            // Filtro normal por status (overdue, pending, etc.)
            result = result.filter(item => item.status === filter);
        }
        
        // Aplicar filtro de busca (mantém o código original)
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(item =>
                (item.userName && item.userName.toLowerCase().includes(searchLower)) ||
                (item.userEmail && item.userEmail.toLowerCase().includes(searchLower)) ||
                (item.motoPlaca && item.motoPlaca.toLowerCase().includes(searchLower)) ||
                (item.motoModelo && item.motoModelo.toLowerCase().includes(searchLower))
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
            case 'pending':
                return '#2ecc71';
            case 'overdue':
                return '#dc3545';
            case 'today':
                return '#f39c12';
            default:
                return '#6c757d';
        }
    };
    
    // Função para obter texto do status
    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Aberto';
            case 'overdue':
                return 'Atrasado';
            case 'today':
                return 'Hoje';
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
            let body = '';
            
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
                    <Divider style={{ marginTop: -5, marginBottom: 5 }} />

                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Recorrência:</PaymentInfoLabel>
                        <PaymentInfoValue>
                            {item.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'}
                        </PaymentInfoValue>
                    </PaymentInfoRow>
                    <Divider style={{ marginTop: -5, marginBottom: 5 }} />
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel
                        style={{
                                color: item.diasRestantes < 0 ? '#dc3545' : '#6C757D'
                            }}
                        >
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
                    <Divider style={{ marginTop: -5, marginBottom: 5 }} />
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel
                            style={{
                                color: item.diasRestantes < 0 ? '#dc3545' :
                                    item.diasRestantes === 0 ? '#ffc107' : 
                                    (item.diasRestantes > 0 && item.diasRestantes <= 3) ? '#242ef0' : '#06bd0f'
                            }}
                        >
                            {
                            item.diasRestantes < 0 ? 'Dias atrasados:' :
                            item.diasRestantes === 0 ? 'Status:' : 'Dias restantes:'
                            }
                        </PaymentInfoLabel>
                        <PaymentInfoValue
                            style={{
                                color: item.diasRestantes < 0 ? '#dc3545' :
                                    item.diasRestantes === 0 ? '#ffc107' : 
                                    (item.diasRestantes > 0 && item.diasRestantes <= 3) ? '#242ef0' : '#06bd0f'
                            }}
                        >
                            {
                            item.diasRestantes < 0 ? `${Math.abs(item.diasRestantes)} dias` :
                            item.diasRestantes > 0 ? `${Math.abs(item.diasRestantes)} dias` :
                            item.diasRestantes === 0 ? 'Hoje é o dia de pagamento' :
                            `${item.diasRestantes}`
                            }
                        </PaymentInfoValue> 
                    </PaymentInfoRow>
                    <Divider style={{ marginTop: -5, marginBottom: 5 }} />
                    
                    <PaymentInfoRow>
                        <PaymentInfoLabel>Moto:</PaymentInfoLabel>
                        <PaymentInfoValue>{item.motoModelo} ({item.motoPlaca})</PaymentInfoValue>
                    </PaymentInfoRow>
                    <Divider style={{ marginTop: -5, marginBottom: 5 }} />
                </PaymentInfo>
                
                <PaymentActions>
                    <ActionButton
                        onPress={() => viewUserPayments(item.userEmail, item.userName)}
                        style={{ backgroundColor: '#007bff' }}
                    >
                        <Feather name="eye" size={16} color="#FFF" />
                        <ActionButtonText>Ver Histórico</ActionButtonText>
                    </ActionButton>
                    
                    
                    <ActionButton
                        onPress={() => sendPaymentReminder(item)}
                        style={{ backgroundColor: 'rgb(43, 42, 42)' }}
>
                        <Feather name="bell" size={16} color="#FFF" />
                        <ActionButtonText>Lembrete</ActionButtonText>
                    </ActionButton>
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
                        <FilterOptionText active={activeFilter === 'pending'}>Aberto</FilterOptionText>
                    </FilterOption>

                    <FilterOption
                        active={activeFilter === 'today'}
                        onPress={() => setActiveFilter('today')}
                    >
                        <FilterOptionText active={activeFilter === 'today'}>Hoje</FilterOptionText>
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
                    <EmptyText style={{ marginTop: 10, color: '#666' }}>
                        Carregando pagamentos...
                    </EmptyText>
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
                />
            )}
        </Container>
    );
}
