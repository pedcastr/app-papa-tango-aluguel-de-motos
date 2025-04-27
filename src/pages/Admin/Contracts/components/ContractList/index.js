import React, { useState, useEffect, useCallback } from 'react';
import { Alert, ActivityIndicator, View, Text, Platform } from 'react-native';
import { db } from '../../../../../services/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import FilterPanel from '../../../../../components/FilterPanel';
import PdfViewer from '../../../../../components/PdfViewerAdmin';

import {
    Container,
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
    EmptyMessage
} from './styles';

export default function ContractList({ navigation }) {
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
                Alert.alert('Erro', 'Falha ao monitorar contratos: ' + error.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);
    
    // Extrair opções únicas para filtros
    const extractFilterOptions = (contractsData) => {
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
    };

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
    
    // Aplicar filtros quando qualquer filtro mudar
    useEffect(() => {
        applyAllFilters();
    }, [applyAllFilters]);
    
    // Funções para manipular mudanças de filtro
    const handleSearchChange = (text) => {
        setSearchTerm(text);
    };
    
    const handleStatusFilter = (status) => {
        setStatusFilter(status);
    };
    
    const handleClienteFilter = (cliente) => {
        setClienteFilter(cliente);
    };
    
    const handleAluguelFilter = (aluguel) => {
        setAluguelFilter(aluguel);
    };
    
    const handleMotoFilter = (moto) => {
        setMotoFilter(moto);
    };
    
    // Contar filtros ativos
    const countActiveFilters = () => {
        return (statusFilter !== 'todos' ? 1 : 0) +
               (clienteFilter !== 'todos' ? 1 : 0) +
               (aluguelFilter !== 'todos' ? 1 : 0) +
               (motoFilter !== 'todos' ? 1 : 0);
    };
    
    // Preparar seções de filtro
    const getFilterSections = () => {
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
    };

    const formatDate = (timestamp) => {
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
    };

    // Renderiza um indicador de carregamento quando os dados estão sendo carregados
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#CB2921" />
            </View>
        );
    }

    return (
        <Container>
            <View style={{ marginBottom: 20 }}>
                <FilterPanel
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onSearch={applyAllFilters}
                    filterSections={getFilterSections()}
                    activeFiltersCount={countActiveFilters()}
                    onAddButtonPress={() => navigation.navigate('ContractForm')}
                    addButtonIcon="add"
                    searchPlaceholder="Buscar contratos..."
                />
            </View>
            {filteredContracts.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                    <EmptyMessage>Nenhum contrato encontrado</EmptyMessage>
                </View>
            ) : (
                filteredContracts.map(contract => (
                    <ContractCard key={contract.id}>
                        <ContractContainer>
                            <ContractNumber>Contrato: </ContractNumber>
                            <ContractId>{contract.contratoId}</ContractId>
                        </ContractContainer>
                        <ContractDetails>
                            <DetailRow>
                                <DetailLabel>Cliente:</DetailLabel>
                                <DetailValue>{contract.cliente}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>Aluguel:</DetailLabel>
                                <DetailValue>{contract.aluguelId}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>Moto:</DetailLabel>
                                <DetailValue>{contract.motoId}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>Data Início:</DetailLabel>
                                <DetailValue>{formatDate(contract.dataInicio)}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>Recorrência de Pagamento</DetailLabel>
                                <DetailValue>{contract.tipoRecorrenciaPagamento === 'semanal' ? 'Semanal' : 'Mensal'}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>MesesContratados:</DetailLabel>
                                <DetailValue>{contract.mesesContratados} meses</DetailValue>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabelStatus>Status:</DetailLabelStatus>
                                <DetailStatus aprovado={contract.statusContrato}>
                                    {contract.statusContrato ? 'Ativo' : 'Inativo'}
                                </DetailStatus>
                            </DetailRow>
                            
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
                ))
            )}
        </Container>
    );
}
