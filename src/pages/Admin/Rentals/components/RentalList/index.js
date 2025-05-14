import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, Platform } from 'react-native';
import { db } from '../../../../../services/firebaseConfig';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import FilterPanel from '../../../../../components/FilterPanel';
import {
    Container,
    RentalCard,
    RentalHeader,
    RentalStatus,
    StatusText,
    RentalInfo,
    InfoRow,
    InfoLabel,
    InfoValue,
    EditButton,
    EditButtonText,
    LoadingContainer,
    EmptyListContainer,
    EmptyListText,
    RentalsList
} from './styles';

export default function RentalList({ navigation }) {
    const [rentals, setRentals] = useState([]);
    const [filteredRentals, setFilteredRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para filtros
    const [filterByStatus, setFilterByStatus] = useState('todos');
    const [filterByValorMensal, setFilterByValorMensal] = useState('todos');

    useEffect(() => {
        // Usar onSnapshot para atualizações em tempo real
        const rentalsRef = collection(db, "alugueis");

        const unsubscribe = onSnapshot(rentalsRef, async (querySnapshot) => {
            try {
                // Buscar todas as motos de uma vez para evitar múltiplas consultas
                const motosSnapshot = await getDocs(collection(db, "motos"));
                const motosMap = {};

                motosSnapshot.docs.forEach(doc => {
                    motosMap[doc.id] = doc.data();
                });

                const rentalsData = querySnapshot.docs.map(doc => {
                    const rentalData = {
                        id: doc.id,
                        ...doc.data(),
                        status: doc.data().ativo === false ? 'inativo' : 'ativo'
                    };

                    // Adicionar informações da moto
                    if (rentalData.motoId && motosMap[rentalData.motoId]) {
                        const motoData = motosMap[rentalData.motoId];
                        rentalData.motoModelo = `${motoData.marca} ${motoData.modelo}`;
                        rentalData.motoPlaca = motoData.placa || 'N/A';
                    } else {
                        rentalData.motoModelo = "Moto não encontrada";
                        rentalData.motoPlaca = "N/A";
                    }

                    return rentalData;
                });

                setRentals(rentalsData);
                // Aplicar filtros iniciais
                applyFilters(rentalsData);
            } catch (error) {
                console.error("Erro ao carregar aluguéis:", error);
                showMessage('Erro', 'Falha ao carregar aluguéis');
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error("Erro na assinatura do Firestore:", error);
            showMessage("Erro", "Falha ao monitorar atualizações de aluguéis");
            setLoading(false);
        });

        // Limpar a assinatura quando o componente for desmontado
        return () => unsubscribe();
    }, []);

    // Efeito para aplicar filtros quando os filtros mudarem
    useEffect(() => {
        applyFilters(rentals);
    }, [searchTerm, filterByStatus, filterByValorMensal]);

    // Função para aplicar filtros
    const applyFilters = (data = rentals) => {
        let result = [...data];

        // Aplicar filtro de busca
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(rental =>
                rental.id.toLowerCase().includes(searchLower) ||
                (rental.motoModelo && rental.motoModelo.toLowerCase().includes(searchLower)) ||
                (rental.motoPlaca && rental.motoPlaca.toLowerCase().includes(searchLower))
            );
        }

        // Aplicar filtro de status
        if (filterByStatus !== 'todos') {
            result = result.filter(rental => rental.status === filterByStatus);
        }

        // Aplicar filtro de valor mensal
        if (filterByValorMensal !== 'todos') {
            switch (filterByValorMensal) {
                case 'ate500':
                    result = result.filter(rental => rental.valorMensal <= 500);
                    break;
                case '500a1000':
                    result = result.filter(rental => rental.valorMensal > 500 && rental.valorMensal <= 1000);
                    break;
                case 'acima1000':
                    result = result.filter(rental => rental.valorMensal > 1000);
                    break;
            }
        }

        setFilteredRentals(result);
    };

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Configuração das seções de filtro
    const filterSections = [
        {
            title: "Status",
            options: [
                {
                    id: "status-todos",
                    label: "Todos",
                    active: filterByStatus === 'todos',
                    onSelect: () => setFilterByStatus('todos')
                },
                {
                    id: "status-ativo",
                    label: "Ativo",
                    active: filterByStatus === 'ativo',
                    onSelect: () => setFilterByStatus('ativo')
                },
                {
                    id: "status-inativo",
                    label: "Inativo",
                    active: filterByStatus === 'inativo',
                    onSelect: () => setFilterByStatus('inativo')
                }
            ]
        },
        {
            title: "Valor Mensal",
            options: [
                {
                    id: "valor-todos",
                    label: "Todos",
                    active: filterByValorMensal === 'todos',
                    onSelect: () => setFilterByValorMensal('todos')
                },
                {
                    id: "valor-ate500",
                    label: "Até R$ 500",
                    active: filterByValorMensal === 'ate500',
                    onSelect: () => setFilterByValorMensal('ate500')
                },
                {
                    id: "valor-500a1000",
                    label: "R$ 500 a R$ 1000",
                    active: filterByValorMensal === '500a1000',
                    onSelect: () => setFilterByValorMensal('500a1000')
                },
                {
                    id: "valor-acima1000",
                    label: "Acima de R$ 1000",
                    active: filterByValorMensal === 'acima1000',
                    onSelect: () => setFilterByValorMensal('acima1000')
                }
            ]
        }
    ];

    // Contagem de filtros ativos
    const getActiveFiltersCount = () => {
        let count = 0;
        if (filterByStatus !== 'todos') count++;
        if (filterByValorMensal !== 'todos') count++;
        return count;
    };

    // Função para navegar para o formulário de criação
    const handleAddRental = () => {
        navigation.navigate('RentalForm');
    };

    // Função para navegar para a tela de edição
    const handleEditRental = (rental) => {
        navigation.navigate('RentalEdit', { rental });
    };

    // Formatação de valores monetários
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Renderização do componente
    return (
        <Container>
            <FilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearch={() => applyFilters()}
                filterSections={filterSections}
                activeFiltersCount={getActiveFiltersCount()}
                onAddButtonPress={handleAddRental}
                addButtonIcon="add"
                searchPlaceholder="Buscar aluguel, modelo ou placa..."
            />

            {loading ? (
                <LoadingContainer>
                    <ActivityIndicator size="large" color="#CB2921" />
                </LoadingContainer>
            ) : filteredRentals.length === 0 ? (
                <EmptyListContainer>
                    <MaterialIcons name="search-off" size={64} color="#999" />
                    <EmptyListText>Nenhum aluguel encontrado</EmptyListText>
                </EmptyListContainer>
            ) : (
                <RentalsList>
                    {filteredRentals.map(rental => (
                        <RentalCard key={rental.id}>
                            <RentalHeader>
                                <RentalStatus status={rental.status}>
                                    <StatusText>{rental.id}</StatusText>
                                </RentalStatus>
                            </RentalHeader>
                            <RentalInfo>
                                <InfoRow>
                                    <InfoLabel>Modelo:</InfoLabel>
                                    <InfoValue>{rental.motoModelo}</InfoValue>
                                </InfoRow>
                                <InfoRow>
                                    <InfoLabel>Placa:</InfoLabel>
                                    <InfoValue>{rental.motoPlaca}</InfoValue>
                                </InfoRow>
                                <InfoRow>
                                    <InfoLabel>Valor Caução:</InfoLabel>
                                    <InfoValue>{formatCurrency(rental.valorCaucao)}</InfoValue>
                                </InfoRow>
                                <InfoRow>
                                    <InfoLabel>Valor Semanal:</InfoLabel>
                                    <InfoValue>{formatCurrency(rental.valorSemanal)}</InfoValue>
                                </InfoRow>
                                <InfoRow>
                                    <InfoLabel>Valor Mensal:</InfoLabel>
                                    <InfoValue>{formatCurrency(rental.valorMensal)}</InfoValue>
                                </InfoRow>
                                <EditButton onPress={() => handleEditRental(rental)}>
                                    <EditButtonText>Editar</EditButtonText>
                                </EditButton>
                            </RentalInfo>
                        </RentalCard>
                    ))}
                </RentalsList>
            )}
        </Container>
    );
}
