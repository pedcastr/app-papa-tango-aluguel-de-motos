import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import { Alert } from 'react-native';
import { db } from '../../../../../services/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilterPanel from '../../../../../components/FilterPanel';

import {
    Container,
    UsersList,
    UserCard,
    UserInfo,
    TextContainer,
    TextInfo,
    TextUserData,
    TextUserDataMotoAlugada,
    UserEmail,
    UserStatus,
    TextInfoStatus,
    ActionButton,
    ActionButtonText,
    DestalhesButton,
    DestalhesButtonText,
    AreaButtons,
    TrocaOleoButton,
    TrocaOleoButtonText,
    EmptyMessage,
    EmptyText
} from './styles';

// Componente memoizado para a mensagem de carregamento
const LoadingIndicator = memo(() => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#CB2921" />
        <EmptyText>Carregando Usuários...</EmptyText>
    </View>
));

// Componente memoizado para o card de usuário
const UserCardMemo = memo(({ user, navigation }) => (
    <UserCard>
        <UserEmail>{user.email}</UserEmail>
        <UserInfo>
            <TextContainer>
                <TextInfo>Nome: </TextInfo>
                <TextUserData>{user.nomeCompleto || user.nome}</TextUserData>
            </TextContainer>

            <TextContainer>
                <TextInfo>Telefone: </TextInfo>
                <TextUserData>{user.telefone}</TextUserData>
            </TextContainer>

            <TextContainer>
                <TextInfo>Tem Moto Alugada?: </TextInfo>
                <TextUserDataMotoAlugada alugada={user.motoAlugada}>
                    {user.motoAlugada ? 'SIM' : 'NÃO'}
                </TextUserDataMotoAlugada>
            </TextContainer>

            <TextContainer>
                <TextInfo>Moto Alugada: </TextInfo>
                <TextUserData>{user.motoAlugadaId || 'N/A'}</TextUserData>
            </TextContainer>

            <TextContainer>
                <TextInfo>Aluguel: </TextInfo>
                <TextUserData>{user.aluguelAtivoId || 'N/A'}</TextUserData>
            </TextContainer>

            <TextContainer>
                <TextInfo>Contrato: </TextInfo>
                <TextUserData>{user.contratoId || 'N/A'}</TextUserData>
            </TextContainer>

            <TextContainer>
                <TextInfoStatus>Status: </TextInfoStatus>
                <UserStatus approved={user.aprovado}>
                    {user.aprovado ? 'Aprovado' : 'Pendente'}
                </UserStatus>
            </TextContainer>
        </UserInfo>

        <AreaButtons>
            <ActionButton
                onPress={() => navigation.navigate('UserEdit', { user })}
            >
                <ActionButtonText>Editar</ActionButtonText>
            </ActionButton>

            <TrocaOleoButton
                onPress={() => navigation.navigate('UserTrocaOleo', { user })}
            >
                <TrocaOleoButtonText>Trocas Óleo</TrocaOleoButtonText>
            </TrocaOleoButton>

            <DestalhesButton
                onPress={() => navigation.navigate('UserDetails', { user })}
            >
                <DestalhesButtonText>
                    Detalhes
                </DestalhesButtonText>
            </DestalhesButton>
        </AreaButtons>
    </UserCard>
));

// Componente memoizado para a mensagem vazia
const EmptyContent = memo(() => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <EmptyMessage>Nenhum usuário encontrado com os filtros selecionados</EmptyMessage>
    </View>
));

export default function UserList({ navigation }) {
    // Estados principais
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para controle de filtros
    const [approvalFilter, setApprovalFilter] = useState('todos'); // 'todos', 'aprovados', 'pendentes'
    const [motoAlugadaFilter, setMotoAlugadaFilter] = useState('todos'); // 'todos', específico ID, 'sem_moto'
    const [aluguelFilter, setAluguelFilter] = useState('todos'); // 'todos', específico ID, 'sem_aluguel'
    const [contratoFilter, setContratoFilter] = useState('todos'); // 'todos', específico ID, 'sem_contrato'

    // Listas de valores únicos para os filtros
    const [motosAlugadasUnicas, setMotosAlugadasUnicas] = useState([]);
    const [alugueisUnicos, setAlugueisUnicos] = useState([]);
    const [contratosUnicos, setContratosUnicos] = useState([]);

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = useCallback((title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    }, []);

    // Função para aplicar todos os filtros
    const applyAllFilters = useCallback(() => {
        let filtered = [...users];

        // Filtro por termo de busca
        if (searchTerm.trim()) {
            const searchTermLower = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                (user.nome && user.nome.toLowerCase().includes(searchTermLower)) ||
                (user.nomeCompleto && user.nomeCompleto.toLowerCase().includes(searchTermLower)) ||
                (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
                (user.telefone && user.telefone.includes(searchTerm))
            );
        }

        // Filtro por status de aprovação
        if (approvalFilter !== 'todos') {
            filtered = filtered.filter(user => {
                const isApproved = user.aprovado === true;
                return approvalFilter === 'aprovados' ? isApproved : !isApproved;
            });
        }

        // Filtro por ID específico de moto alugada
        if (motoAlugadaFilter !== 'todos') {
            filtered = filtered.filter(user => {
                if (motoAlugadaFilter === 'sem_moto') {
                    return !user.motoAlugada || !user.motoAlugadaId || user.motoAlugadaId.trim() === '';
                } else {
                    return user.motoAlugadaId === motoAlugadaFilter;
                }
            });
        }

        // Filtro por ID específico de aluguel
        if (aluguelFilter !== 'todos') {
            filtered = filtered.filter(user => {
                if (aluguelFilter === 'sem_aluguel') {
                    return !user.aluguelAtivoId || user.aluguelAtivoId.trim() === '';
                } else {
                    return user.aluguelAtivoId === aluguelFilter;
                }
            });
        }

        // Filtro por ID específico de contrato
        if (contratoFilter !== 'todos') {
            filtered = filtered.filter(user => {
                if (contratoFilter === 'sem_contrato') {
                    return !user.contratoId || user.contratoId.trim() === '';
                } else {
                    return user.contratoId === contratoFilter;
                }
            });
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, approvalFilter, motoAlugadaFilter, aluguelFilter, contratoFilter]);

    // Função para aplicar filtro inicial recebido de outra tela
    useEffect(() => {
        let isMounted = true;

        const applyInitialFilter = async () => {
            try {
                // Verificar se há um filtro salvo
                let filterValue = null;

                // Tentar obter do AsyncStorage
                const asyncStorageFilter = await AsyncStorage.getItem('userListFilter');
                if (asyncStorageFilter) {
                    filterValue = asyncStorageFilter;
                    await AsyncStorage.removeItem('userListFilter');
                }

                // Para web, verificar também o sessionStorage
                if (Platform.OS === 'web' && !filterValue) {
                    const sessionFilter = sessionStorage.getItem('userListFilter');
                    if (sessionFilter) {
                        filterValue = sessionFilter;
                        sessionStorage.removeItem('userListFilter');
                    }
                }

                if (filterValue && isMounted) {
                    // Aplicar o filtro salvo
                    if (filterValue === 'aprovados') {
                        setApprovalFilter('aprovados');
                    } else if (filterValue === 'pendentes') {
                        setApprovalFilter('pendentes');
                    } else {
                        setApprovalFilter('todos');
                    }
                }
            } catch (error) {
                console.error('Erro ao recuperar filtro de usuários:', error);
            }
        };

        applyInitialFilter();

        // Configurar listener para eventos de filtro (web)
        const handleFilterEvent = (event) => {
            if (!isMounted) return;

            const { filter } = event.detail;

            if (filter === 'aprovados') {
                setApprovalFilter('aprovados');
            } else if (filter === 'pendentes') {
                setApprovalFilter('pendentes');
            } else {
                setApprovalFilter('todos');
            }
        };

        if (Platform.OS === 'web') {
            document.addEventListener('applyUserFilter', handleFilterEvent);
        }

        return () => {
            isMounted = false;
            if (Platform.OS === 'web') {
                document.removeEventListener('applyUserFilter', handleFilterEvent);
            }
        };
    }, []);

    // Verificar filtro quando o componente recebe foco
    useEffect(() => {
        let isMounted = true;

        const checkFilterOnFocus = async () => {
            if (Platform.OS === 'web') return; // Apenas para mobile

            try {
                const filter = await AsyncStorage.getItem('userListFilter');
                const timestamp = await AsyncStorage.getItem('userListFilterTimestamp');

                if (filter && timestamp && isMounted) {
                    if (filter === 'aprovados') {
                        setApprovalFilter('aprovados');
                    } else if (filter === 'pendentes') {
                        setApprovalFilter('pendentes');
                    } else {
                        setApprovalFilter('todos');
                    }

                    await AsyncStorage.removeItem('userListFilter');
                    await AsyncStorage.removeItem('userListFilterTimestamp');
                }
            } catch (error) {
                console.error('Erro ao verificar filtro no foco:', error);
            }
        };

        const unsubscribe = navigation.addListener('focus', checkFilterOnFocus);
        checkFilterOnFocus();

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [navigation]);

    // Extrair valores únicos para os filtros
    useEffect(() => {
        if (users.length > 0) {
            // Extrair IDs únicos de motos alugadas
            const motosIds = [...new Set(users
                .filter(user => user.motoAlugadaId && user.motoAlugadaId.trim() !== '')
                .map(user => user.motoAlugadaId)
            )].sort();
            setMotosAlugadasUnicas(motosIds);

            // Extrair IDs únicos de aluguéis
            const alugueisIds = [...new Set(users
                .filter(user => user.aluguelAtivoId && user.aluguelAtivoId.trim() !== '')
                .map(user => user.aluguelAtivoId)
            )].sort();
            setAlugueisUnicos(alugueisIds);

            // Extrair IDs únicos de contratos
            const contratosIds = [...new Set(users
                .filter(user => user.contratoId && user.contratoId.trim() !== '')
                .map(user => user.contratoId)
            )].sort();
            setContratosUnicos(contratosIds);
        }
    }, [users]);

    // Aplicar filtros quando qualquer filtro mudar
    useEffect(() => {
        applyAllFilters();
    }, [applyAllFilters]);

    // Carregar dados do Firestore
    useEffect(() => {
        setLoading(true);

        const usersRef = collection(db, "users");

        const unsubscribe = onSnapshot(
            usersRef,
            (querySnapshot) => {
                try {
                    const usersList = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setUsers(usersList);
                    setFilteredUsers(usersList);
                    setLoading(false);
                } catch (error) {
                    console.error("Erro ao processar dados:", error);
                    showMessage('Erro', 'Falha ao atualizar lista de usuários');
                    setLoading(false);
                }
            },
            (error) => {
                console.error("Erro no listener:", error);
                showMessage('Erro', 'Falha na conexão com o banco de dados');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [showMessage]);

    // Funções para manipular mudanças de filtro
    const handleApprovalFilter = useCallback((status) => {
        setApprovalFilter(status);
    }, []);

    const handleMotoAlugadaFilter = useCallback((motoId) => {
        setMotoAlugadaFilter(motoId);
    }, []);

    const handleAluguelFilter = useCallback((aluguelId) => {
        setAluguelFilter(aluguelId);
    }, []);

    const handleContratoFilter = useCallback((contratoId) => {
        setContratoFilter(contratoId);
    }, []);

    // Handler para mudança de texto de busca
    const handleSearchChange = useCallback((text) => {
        setSearchTerm(text);
    }, []);

    // Handler para navegação para o formulário de usuário
    const handleAddUser = useCallback(() => {
        navigation.navigate('UserForm');
    }, [navigation]);

    // Contar filtros ativos
    const countActiveFilters = useCallback(() => {
        return (approvalFilter !== 'todos' ? 1 : 0) +
            (motoAlugadaFilter !== 'todos' ? 1 : 0) +
            (aluguelFilter !== 'todos' ? 1 : 0) +
            (contratoFilter !== 'todos' ? 1 : 0);
    }, [approvalFilter, motoAlugadaFilter, aluguelFilter, contratoFilter]);

    // Preparar seções de filtro
    const getFilterSections = useMemo(() => {
        return [
            {
                title: "Status de Aprovação:",
                options: [
                    {
                        id: 'approval-todos',
                        label: 'Todos os usuários',
                        active: approvalFilter === 'todos',
                        onSelect: () => handleApprovalFilter('todos')
                    },
                    {
                        id: 'approval-aprovados',
                        label: 'Aprovados',
                        active: approvalFilter === 'aprovados',
                        onSelect: () => handleApprovalFilter('aprovados')
                    },
                    {
                        id: 'approval-pendentes',
                        label: 'Pendentes',
                        active: approvalFilter === 'pendentes',
                        onSelect: () => handleApprovalFilter('pendentes')
                    }
                ]
            },
            {
                title: "Moto Alugada:",
                options: [
                    {
                        id: 'moto-todos',
                        label: 'Todas as motos',
                        active: motoAlugadaFilter === 'todos',
                        onSelect: () => handleMotoAlugadaFilter('todos')
                    },
                    {
                        id: 'moto-sem',
                        label: 'Sem moto alugada',
                        active: motoAlugadaFilter === 'sem_moto',
                        onSelect: () => handleMotoAlugadaFilter('sem_moto')
                    },
                    ...motosAlugadasUnicas.map(motoId => ({
                        id: `moto-${motoId}`,
                        label: `Moto: ${motoId}`,
                        active: motoAlugadaFilter === motoId,
                        onSelect: () => handleMotoAlugadaFilter(motoId)
                    }))
                ]
            },
            {
                title: "Aluguel:",
                options: [
                    {
                        id: 'aluguel-todos',
                        label: 'Todos os aluguéis',
                        active: aluguelFilter === 'todos',
                        onSelect: () => handleAluguelFilter('todos')
                    },
                    {
                        id: 'aluguel-sem',
                        label: 'Sem aluguel ativo',
                        active: aluguelFilter === 'sem_aluguel',
                        onSelect: () => handleAluguelFilter('sem_aluguel')
                    },
                    ...alugueisUnicos.map(aluguelId => ({
                        id: `aluguel-${aluguelId}`,
                        label: `Aluguel: ${aluguelId}`,
                        active: aluguelFilter === aluguelId,
                        onSelect: () => handleAluguelFilter(aluguelId)
                    }))
                ]
            },
            {
                title: "Contrato:",
                options: [
                    {
                        id: 'contrato-todos',
                        label: 'Todos os contratos',
                        active: contratoFilter === 'todos',
                        onSelect: () => handleContratoFilter('todos')
                    },
                    {
                        id: 'contrato-sem',
                        label: 'Sem contrato',
                        active: contratoFilter === 'sem_contrato',
                        onSelect: () => handleContratoFilter('sem_contrato')
                    },
                    ...contratosUnicos.map(contratoId => ({
                        id: `contrato-${contratoId}`,
                        label: `Contrato: ${contratoId}`,
                        active: contratoFilter === contratoId,
                        onSelect: () => handleContratoFilter(contratoId)
                    }))
                ]
            }
        ];
    }, [
        approvalFilter,
        motoAlugadaFilter,
        aluguelFilter,
        contratoFilter,
        motosAlugadasUnicas,
        alugueisUnicos,
        contratosUnicos,
        handleApprovalFilter,
        handleMotoAlugadaFilter,
        handleAluguelFilter,
        handleContratoFilter
    ]);

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
                onAddButtonPress={handleAddUser}
                addButtonIcon="person-add"
                searchPlaceholder="Buscar usuário"
            />

            {filteredUsers.length === 0 ? (
                <EmptyContent />
            ) : (
                <UsersList>
                    {filteredUsers.map(user => (
                        <UserCardMemo
                            key={user.id}
                            user={user}
                            navigation={navigation}
                        />
                    ))}
                </UsersList>
            )}
        </Container>
    );
}
