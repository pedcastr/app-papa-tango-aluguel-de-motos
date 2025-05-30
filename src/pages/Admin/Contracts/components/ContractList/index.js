import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Alert, ActivityIndicator, View, Text, Platform } from 'react-native';
import { db } from '../../../../../services/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import FilterPanel from '../../../../../components/FilterPanel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PdfViewer from '../../../../../components/PdfViewerAdmin';

import {
    Container,
    ContractsList,
    ContractCard,
    ContractNumber,
    ContractDetails,
    ContractContainer,
    ContractId,
    DetailRow,
    DetailLabel,
    DetailValue,
    DetailStatus,
    DetailLabelStatus,
    PdfContainer,
    DocumentTitle,
    ActionButton,
    ActionButtonText,
    EmptyMessage,
    Divider,
    EmptyText,
} from './styles';

// Componente memoizado para a mensagem de carregamento
const LoadingIndicator = memo(() => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#CB2921" />
        <EmptyText>Carregando Contratos...</EmptyText>
    </View>
));

// Componente memoizado para a mensagem de lista vazia
const EmptyContractList = memo(() => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
        <EmptyMessage>Nenhum contrato encontrado</EmptyMessage>
    </View>
));

// Componente memoizado para o detalhe de linha
const DetailRowMemo = memo(({ label, value, isStatus = false, aprovado = false }) => (
    <>
        <DetailRow>
            {isStatus ? (
                <>
                    <DetailLabelStatus>{label}</DetailLabelStatus>
                    <DetailStatus aprovado={aprovado}>
                        {value}
                    </DetailStatus>
                </>
            ) : (
                <>
                    <DetailLabel>{label}</DetailLabel>
                    <DetailValue>{value}</DetailValue>
                </>
            )}
        </DetailRow>
        <Divider style={{ marginTop: 5, marginBottom: 0 }} />
    </>
));

// Componente memoizado para o card de contrato
const ContractCardMemo = memo(({ contract, formatDate, isWebDesktop, navigation }) => (
    <ContractCard>
        <ContractContainer>
            <ContractNumber>Contrato: </ContractNumber>
            <ContractId>{contract.contratoId}</ContractId>
        </ContractContainer>
        <ContractDetails>
            <DetailRowMemo label="Cliente:" value={contract.cliente} />
            <DetailRowMemo label="Aluguel:" value={contract.aluguelId} />
            <DetailRowMemo label="Moto:" value={contract.motoId} />
            <DetailRowMemo label="Data Início:" value={formatDate(contract.dataInicio)} />
            <DetailRowMemo
                label="Recorrência de Pagamento"
                value={contract.tipoRecorrenciaPagamento === 'semanal' ? 'Semanal' : 'Mensal'}
            />
            <DetailRowMemo
                label="MesesContratados:"
                value={`${contract.mesesContratados} meses`}
            />
            <DetailRowMemo
                label="Status:"
                value={contract.statusContrato ? 'Ativo' : 'Inativo'}
                isStatus={true}
                aprovado={contract.statusContrato}
            />

            {contract.urlContrato ? (
                <>
                    <DocumentTitle>
                        Contrato (PDF)
                    </DocumentTitle>
                    <PdfContainer>
                        <PdfViewer
                            uri={contract.urlContrato}
                            fileName={`Contrato-${contract.contratoId || contract.id}.pdf`}
                            height={isWebDesktop ? 600 : 300}
                        />
                    </PdfContainer>
                </>
            ) : (
                <View style={{ padding: 10 }}>
                    <Text>PDF do contrato não disponível</Text>
                </View>
            )}
        </ContractDetails>
        <ActionButton onPress={() => navigation.navigate('ContractEdit', { contract })}>
            <ActionButtonText>Editar</ActionButtonText>
        </ActionButton>
    </ContractCard>
));

export default function ContractList({ navigation }) {
    // Estados principais
    const [contracts, setContracts] = useState([]);
    const [filteredContracts, setFilteredContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [clienteFilter, setClienteFilter] = useState('todos');
    const [aluguelFilter, setAluguelFilter] = useState('todos');
    const [motoFilter, setMotoFilter] = useState('todos');

    // Listas de opções para filtros
    const [clientesDisponiveis, setClientesDisponiveis] = useState([]);
    const [alugueisDisponiveis, setAlugueisDisponiveis] = useState([]);
    const [motosDisponiveis, setMotosDisponiveis] = useState([]);

    // Verifica se o dispositivo é um desktop web
    const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = useCallback((title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    }, []);

    // Extrair opções únicas para filtros
    const extractFilterOptions = useCallback((contractsData) => {
        // Extrair clientes únicos
        const clientes = [...new Set(contractsData
            .map(contract => contract.cliente)
            .filter(cliente => cliente && cliente.trim() !== '')
        )].sort();

        // Extrair aluguéis únicos
        const alugueis = [...new Set(contractsData
            .map(contract => contract.aluguelId)
            .filter(aluguel => aluguel && aluguel.trim() !== '')
        )].sort();

        // Extrair motos únicas
        const motos = [...new Set(contractsData
            .map(contract => contract.motoId)
            .filter(moto => moto && moto.trim() !== '')
        )].sort();

        setClientesDisponiveis(clientes);
        setAlugueisDisponiveis(alugueis);
        setMotosDisponiveis(motos);
    }, []);

    // Aplicar todos os filtros
    const applyAllFilters = useCallback(() => {
        let filtered = [...contracts];

        // Filtrar por termo de busca
        if (searchTerm.trim()) {
            const searchTermLower = searchTerm.toLowerCase();
            filtered = filtered.filter(contract =>
                (contract.id && contract.id.toLowerCase().includes(searchTermLower)) ||
                (contract.cliente && contract.cliente.toLowerCase().includes(searchTermLower)) ||
                (contract.aluguelId && contract.aluguelId.toLowerCase().includes(searchTermLower)) ||
                (contract.motoId && contract.motoId.toLowerCase().includes(searchTermLower))
            );
        }

        // Filtrar por status
        if (statusFilter !== 'todos') {
            filtered = filtered.filter(contract => {
                const isActive = contract.statusContrato === true;
                return statusFilter === 'ativo' ? isActive : !isActive;
            });
        }

        // Filtrar por cliente
        if (clienteFilter !== 'todos') {
            filtered = filtered.filter(contract =>
                contract.cliente && contract.cliente === clienteFilter
            );
        }

        // Filtrar por aluguel
        if (aluguelFilter !== 'todos') {
            filtered = filtered.filter(contract =>
                contract.aluguelId && contract.aluguelId === aluguelFilter
            );
        }

        // Filtrar por moto
        if (motoFilter !== 'todos') {
            filtered = filtered.filter(contract =>
                contract.motoId && contract.motoId === motoFilter
            );
        }

        setFilteredContracts(filtered);
    }, [contracts, searchTerm, statusFilter, clienteFilter, aluguelFilter, motoFilter]);

    // Função para aplicar filtro inicial
    useEffect(() => {
        let isMounted = true;

        // Função para aplicar filtro recebido
        const applyInitialFilter = async () => {
            try {
                // Verificar se há um filtro salvo
                let filterValue = null;

                // Tentar obter do AsyncStorage
                const asyncStorageFilter = await AsyncStorage.getItem('contractListFilter');
                if (asyncStorageFilter) {
                    filterValue = asyncStorageFilter; // Usar o valor diretamente
                    // Limpar o filtro após usá-lo
                    await AsyncStorage.removeItem('contractListFilter');
                }

                // Para web, verificar também o sessionStorage
                if (Platform.OS === 'web' && !filterValue) {
                    const sessionFilter = sessionStorage.getItem('contractListFilter');
                    if (sessionFilter) {
                        filterValue = sessionFilter; // Usar o valor diretamente
                        // Limpar o filtro após usá-lo
                        sessionStorage.removeItem('contractListFilter');
                    }
                }

                if (filterValue && isMounted) {
                    // Aplicar o filtro salvo
                    if (filterValue === 'ativos') {
                        setStatusFilter('ativo');
                    } else {
                        setStatusFilter('todos');
                    }

                    // Garantir que os dados estejam carregados antes de aplicar o filtro
                    if (contracts.length > 0) {
                        // Aplicar os filtros aos dados com um pequeno delay
                        setTimeout(() => {
                            if (isMounted) {
                                applyAllFilters();
                            }
                        }, 300);
                    }
                }
            } catch (error) {
                console.error('Erro ao recuperar filtro de contratos:', error);
            }
        };

        // Executar ao montar o componente
        applyInitialFilter();

        // Configurar listener para eventos de filtro (web)
        const handleFilterEvent = (event) => {
            if (!isMounted) return;

            const { filter } = event.detail;

            if (filter === 'ativos') {
                setStatusFilter('ativo');
            } else {
                setStatusFilter('todos');
            }

            // Aplicar os filtros aos dados com um pequeno delay
            setTimeout(() => {
                if (isMounted && contracts.length > 0) {
                    applyAllFilters();
                }
            }, 300);
        };

        // Adicionar listener apenas no ambiente web
        if (Platform.OS === 'web') {
            document.addEventListener('applyContractFilter', handleFilterEvent);
        }

        // Cleanup
        return () => {
            isMounted = false;
            if (Platform.OS === 'web') {
                document.removeEventListener('applyContractFilter', handleFilterEvent);
            }
        };
    }, [contracts, applyAllFilters]);

    // UseEffect para verificar o filtro quando o componente recebe foco
    useEffect(() => {
        let isMounted = true;

        // Função para verificar e aplicar o filtro quando o componente recebe foco
        const checkFilterOnFocus = async () => {
            if (Platform.OS === 'web') return; // Apenas para mobile

            try {
                const filter = await AsyncStorage.getItem('contractListFilter');
                const timestamp = await AsyncStorage.getItem('contractListFilterTimestamp');

                // Verificar se temos um filtro e um timestamp
                if (filter && timestamp && isMounted) {
                    // Aplicar o filtro
                    if (filter === 'ativos') {
                        setStatusFilter('ativo');
                    } else {
                        setStatusFilter('todos');
                    }

                    // Aplicar os filtros aos dados
                    if (contracts.length > 0) {
                        setTimeout(() => {
                            if (isMounted) {
                                applyAllFilters();
                            }
                        }, 300);
                    }

                    // Limpar o filtro após aplicá-lo para permitir alterações futuras
                    await AsyncStorage.removeItem('contractListFilter');
                    await AsyncStorage.removeItem('contractListFilterTimestamp');
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
    }, [navigation, contracts, applyAllFilters]);

    // Carregar dados iniciais
    useEffect(() => {
        setLoading(true);

        const unsubscribe = onSnapshot(
            collection(db, "contratos"),
            (querySnapshot) => {
                const contractsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data
                    };
                });

                setContracts(contractsData);
                setFilteredContracts(contractsData);

                // Extrair listas únicas para filtros
                extractFilterOptions(contractsData);

                setLoading(false);
            },
            (error) => {
                showMessage('Erro', 'Falha ao monitorar contratos: ' + error.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [extractFilterOptions, showMessage]);

    // Aplicar filtros quando qualquer filtro mudar
    useEffect(() => {
        applyAllFilters();
    }, [applyAllFilters]);

    // Funções para manipular mudanças de filtro
    const handleSearchChange = useCallback((text) => {
        setSearchTerm(text);
    }, []);

    const handleStatusFilter = useCallback((status) => {
        setStatusFilter(status);
    }, []);

    const handleClienteFilter = useCallback((cliente) => {
        setClienteFilter(cliente);
    }, []);

    const handleAluguelFilter = useCallback((aluguel) => {
        setAluguelFilter(aluguel);
    }, []);

    const handleMotoFilter = useCallback((moto) => {
        setMotoFilter(moto);
    }, []);

    // Contar filtros ativos
    const countActiveFilters = useCallback(() => {
        return (statusFilter !== 'todos' ? 1 : 0) +
            (clienteFilter !== 'todos' ? 1 : 0) +
            (aluguelFilter !== 'todos' ? 1 : 0) +
            (motoFilter !== 'todos' ? 1 : 0);
    }, [statusFilter, clienteFilter, aluguelFilter, motoFilter]);

    // Preparar seções de filtro
    const getFilterSections = useMemo(() => {
        const sections = [
            {
                title: "Status:",
                options: [
                    {
                        id: 'status-todos',
                        label: 'Todos os contratos',
                        active: statusFilter === 'todos',
                        onSelect: () => handleStatusFilter('todos')
                    },
                    {
                        id: 'status-ativo',
                        label: 'Ativos',
                        active: statusFilter === 'ativo',
                        onSelect: () => handleStatusFilter('ativo')
                    },
                    {
                        id: 'status-inativo',
                        label: 'Inativos',
                        active: statusFilter === 'inativo',
                        onSelect: () => handleStatusFilter('inativo')
                    }
                ]
            }
        ];

        // Adicionar seção de clientes se houver clientes disponíveis
        if (clientesDisponiveis.length > 0) {
            sections.push({
                title: "Cliente:",
                options: [
                    {
                        id: 'cliente-todos',
                        label: 'Todos os clientes',
                        active: clienteFilter === 'todos',
                        onSelect: () => handleClienteFilter('todos')
                    },
                    ...clientesDisponiveis.map(cliente => ({
                        id: `cliente-${cliente}`,
                        label: cliente,
                        active: clienteFilter === cliente,
                        onSelect: () => handleClienteFilter(cliente)
                    }))
                ]
            });
        }

        // Adicionar seção de aluguéis se houver aluguéis disponíveis
        if (alugueisDisponiveis.length > 0) {
            sections.push({
                title: "Aluguel:",
                options: [
                    {
                        id: 'aluguel-todos',
                        label: 'Todos os aluguéis',
                        active: aluguelFilter === 'todos',
                        onSelect: () => handleAluguelFilter('todos')
                    },
                    ...alugueisDisponiveis.map(aluguel => ({
                        id: `aluguel-${aluguel}`,
                        label: aluguel,
                        active: aluguelFilter === aluguel,
                        onSelect: () => handleAluguelFilter(aluguel)
                    }))
                ]
            });
        }

        // Adicionar seção de motos se houver motos disponíveis
        if (motosDisponiveis.length > 0) {
            sections.push({
                title: "Moto:",
                options: [
                    {
                        id: 'moto-todos',
                        label: 'Todas as motos',
                        active: motoFilter === 'todos',
                        onSelect: () => handleMotoFilter('todos')
                    },
                    ...motosDisponiveis.map(moto => ({
                        id: `moto-${moto}`,
                        label: moto,
                        active: motoFilter === moto,
                        onSelect: () => handleMotoFilter(moto)
                    }))
                ]
            });
        }

        return sections;
    }, [
        statusFilter,
        clienteFilter,
        aluguelFilter,
        motoFilter,
        clientesDisponiveis,
        alugueisDisponiveis,
        motosDisponiveis,
        handleStatusFilter,
        handleClienteFilter,
        handleAluguelFilter,
        handleMotoFilter
    ]);

    // Função para formatar data - memoizada para evitar recálculos
    const formatDate = useCallback((timestamp) => {
        if (!timestamp) return 'Data não disponível';

        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            const date = timestamp.toDate();
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } else if (timestamp instanceof Date) {
            return timestamp.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } else {
            try {
                const date = new Date(timestamp);
                return date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (error) {
                return 'Formato de data inválido';
            }
        }
    }, []);

    // Handler para navegação para o formulário de contrato
    const handleAddContract = useCallback(() => {
        navigation.navigate('ContractForm');
    }, [navigation]);

    // Renderiza um indicador de carregamento quando os dados estão sendo carregados
    if (loading) {
        return <LoadingIndicator />;
    }

    return (
        <Container>
            <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onSearch={applyAllFilters}
                filterSections={getFilterSections}
                activeFiltersCount={countActiveFilters()}
                onAddButtonPress={handleAddContract}
                addButtonIcon="add"
                searchPlaceholder="Buscar contratos..."
            />

            {filteredContracts.length === 0 ? (
                <EmptyContractList />
            ) : (
                <ContractsList>
                    {filteredContracts.map(contract => (
                        <ContractCardMemo
                            key={contract.id}
                            contract={contract}
                            formatDate={formatDate}
                            isWebDesktop={isWebDesktop}
                            navigation={navigation}
                        />
                    ))}
                </ContractsList>
            )}
        </Container>
    );
}
