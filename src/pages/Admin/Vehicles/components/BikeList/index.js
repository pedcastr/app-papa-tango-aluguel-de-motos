import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, ActivityIndicator, View, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { db, storage } from '../../../../../services/firebaseConfig';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import FilterPanel from '../../../../../components/FilterPanel';

import {
    Container,
    BikeCard,
    BikeImage,
    BikeInfo,
    BikeModel,
    InfoBike,
    TextInfo,
    BikeStatus,
    ActionButton,
    ActionButtonText,
    EmptyMessage
} from './styles';

/**
 * Componente para listar e gerenciar motos
 * @param {Object} navigation - Objeto de navegação
 * @param {Object} route - Objeto de rota com parâmetros
 */
export default function BikeList({ navigation, route }) {
    // Estados para gerenciar dados e UI
    const [bikes, setBikes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBikes, setFilteredBikes] = useState([]);
    const [rentedBikeIds, setRentedBikeIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0); // Estado para forçar re-renderização
   
    // Estados para controle de filtros
    const [statusFilter, setStatusFilter] = useState('todos'); // 'todos', 'alugadas', 'disponiveis'
    const [marcaFilter, setMarcaFilter] = useState('todas'); // 'todas' ou marca específica
    const [marcasDisponiveis, setMarcasDisponiveis] = useState([]); // Lista de marcas disponíveis
   
    // Refs para armazenar dados em cache e controlar atualizações
    const bikesCache = useRef(new Map());
    const usersCache = useRef(new Map());
    const isUpdating = useRef(false);
    const forceUpdate = useRef(false); // Flag para forçar atualização completa

    /// Verifica se estamos em um dispositivo web mobile ou desktop
    const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

    // Função para mostrar mensagem (Alerta) de sucesso/erro (Em todas as plataformas)
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    /**
     * Efeito para lidar com a exclusão de motos
     * Atualiza a lista quando uma moto é excluída em outra tela
     */
    useEffect(() => {
        if (route.params?.deletedBikeId) {
            console.log(`Detectada exclusão da moto: ${route.params.deletedBikeId}`);
           
            // Remova a moto do cache local
            const bikeId = route.params.deletedBikeId;
            if (bikesCache.current.has(bikeId)) {
                console.log(`Removendo moto ${bikeId} do cache após exclusão`);
                bikesCache.current.delete(bikeId);
            }
           
            // Força uma atualização completa dos dados
            forceUpdate.current = true;
           
            // Atualiza diretamente os estados para garantir que a UI seja atualizada
            setBikes(prevBikes => prevBikes.filter(bike => bike.id !== bikeId));
            setFilteredBikes(prevFiltered => prevFiltered.filter(bike => bike.id !== bikeId));
           
            // Incrementa refreshKey para forçar re-renderização
            setRefreshKey(prev => prev + 1);
           
            // Limpe o parâmetro para evitar repetição
            navigation.setParams({ deletedBikeId: undefined });
        }
    }, [route.params?.deletedBikeId]);

    /**
     * Carrega a imagem de uma moto, com cache para evitar downloads repetidos
     * @param {string} bikeId - ID da moto
     * @returns {Promise<string|null>} URL da imagem ou null
     */
    const loadBikeImage = async (bikeId) => {
        try {
            // Verifica se já temos a URL da imagem em cache
            if (bikesCache.current.has(bikeId) && bikesCache.current.get(bikeId).fotoUrl) {
                return bikesCache.current.get(bikeId).fotoUrl;
            }
           
            // Se não tiver em cache, busca do Storage
            const fotosRef = ref(storage, `motos/${bikeId}/fotos`);
            const fotosList = await listAll(fotosRef);
           
            const fotoUrl = fotosList.items.length > 0
                ? await getDownloadURL(fotosList.items[0])
                : null;
               
            // Atualiza o cache
            if (bikesCache.current.has(bikeId)) {
                const bikeData = bikesCache.current.get(bikeId);
                bikesCache.current.set(bikeId, { ...bikeData, fotoUrl });
            }
           
            return fotoUrl;
        } catch (error) {
            console.log(`Erro ao carregar foto da moto ${bikeId}:`, error);
            return null;
        }
    };

    /**
     * Atualiza o estado das motos com base nos dados em cache
     */
    const updateBikesState = async () => {
        if (isUpdating.current && !forceUpdate.current) return;
       
        try {
            isUpdating.current = true;
           
            // Converte o cache de motos para um array
            const bikesArray = Array.from(bikesCache.current.values());
           
            // Carrega imagens apenas para motos que ainda não têm
            const bikesPromises = bikesArray.map(async bike => {
                if (!bike.fotoUrl) {
                    const fotoUrl = await loadBikeImage(bike.id);
                    return { ...bike, fotoUrl };
                }
                return bike;
            });
           
            const bikesWithImages = await Promise.all(bikesPromises);
           
            // Extrai todas as marcas disponíveis
            const marcas = [...new Set(bikesWithImages
                .map(bike => bike.marca)
                .filter(marca => marca && marca.trim() !== '')
            )].sort();
           
            setMarcasDisponiveis(marcas);
           
            // Atualiza os estados
            setBikes(bikesWithImages);
           
            // Aplica os filtros atuais
            applyAllFilters(bikesWithImages);
           
            // Reseta a flag de forçar atualização
            forceUpdate.current = false;
        } catch (error) {
            console.log("Erro ao atualizar estado das motos:", error);
        } finally {
            isUpdating.current = false;
            setLoading(false);
        }
    };

    /**
     * Atualiza o status de aluguel das motos com base nos dados dos usuários
     */
    const updateRentedStatus = () => {
        // Limpa o status de aluguel de todas as motos
        const rentedIds = [];
       
        // Verifica cada usuário para encontrar motos alugadas
        usersCache.current.forEach(userData => {
            // Verifica ambas as possíveis grafias do campo
            const motoId = userData.motoAlugadaId || userData.motoalugadaId;
           
            // Verifica se motoAlugada é true (como booleano ou string "true")
            const isRented = userData.motoAlugada === true || userData.motoAlugada === "true";
           
            if (isRented && motoId) {
                const normalizedId = String(motoId).trim();
                rentedIds.push(normalizedId);
               
                // Atualiza o status da moto no cache
                if (bikesCache.current.has(normalizedId)) {
                    const bikeData = bikesCache.current.get(normalizedId);
                    bikesCache.current.set(normalizedId, { ...bikeData, alugada: true });
                }
            }
        });
       
        // Atualiza motos não alugadas
        bikesCache.current.forEach((bikeData, bikeId) => {
            if (!rentedIds.includes(bikeId)) {
                bikesCache.current.set(bikeId, { ...bikeData, alugada: false });
            }
        });
       
        // Atualiza o estado de IDs alugados
        setRentedBikeIds(rentedIds);
    };

    /**
     * Aplica todos os filtros atuais às motos
     * @param {Array} bikesData - Array de motos para filtrar
     */
    const applyAllFilters = (bikesData = bikes) => {
        let filtered = bikesData;
       
        // Filtrar por termo de busca
        if (searchTerm.trim()) {
            const searchTermLower = searchTerm.toLowerCase();
            filtered = filtered.filter(bike =>
                (bike.id && bike.id.toLowerCase().includes(searchTermLower)) ||
                (bike.modelo && bike.modelo.toLowerCase().includes(searchTermLower)) ||
                (bike.placa && bike.placa.toLowerCase().includes(searchTermLower))
            );
        }
       
        // Filtrar por status
        if (statusFilter !== 'todos') {
            filtered = filtered.filter(bike => {
                const isRented = rentedBikeIds.includes(String(bike.id).trim());
                return statusFilter === 'alugadas' ? isRented : !isRented;
            });
        }
       
        // Filtrar por marca
        if (marcaFilter !== 'todas') {
            filtered = filtered.filter(bike =>
                bike.marca && bike.marca.trim() === marcaFilter
            );
        }
       
        setFilteredBikes(filtered);
    };

    /**
     * Função para aplicar um filtro de status
     * @param {string} status - Status para filtrar ('todos', 'alugadas', 'disponiveis')
     */
    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        // Aplicamos o filtro imediatamente com o novo valor
        const newStatusFilter = status;
        
        let filtered = [...bikes];
        
        // Aplicar filtro de busca
        if (searchTerm.trim()) {
            const searchTermLower = searchTerm.toLowerCase();
            filtered = filtered.filter(bike =>
                (bike.id && bike.id.toLowerCase().includes(searchTermLower)) ||
                (bike.modelo && bike.modelo.toLowerCase().includes(searchTermLower)) ||
                (bike.placa && bike.placa.toLowerCase().includes(searchTermLower))
            );
        }
        
        // Aplicar filtro de status com o novo valor
        if (newStatusFilter !== 'todos') {
            filtered = filtered.filter(bike => {
                const isRented = rentedBikeIds.includes(String(bike.id).trim());
                return newStatusFilter === 'alugadas' ? isRented : !isRented;
            });
        }
        
        // Aplicar filtro de marca (mantendo o valor atual)
        if (marcaFilter !== 'todas') {
            filtered = filtered.filter(bike =>
                bike.marca && bike.marca.trim() === marcaFilter
            );
        }
        
        // Atualizar o estado filtrado
        setFilteredBikes(filtered);
    };

    /**
     * Função para aplicar um filtro de marca
     * @param {string} marca - Marca para filtrar ('todas' ou marca específica)
     */
    const handleMarcaFilter = (marca) => {
        setMarcaFilter(marca);
        // Aplicamos o filtro imediatamente com o novo valor
        const newMarcaFilter = marca;
        
        let filtered = [...bikes];
        
        // Aplicar filtro de busca
        if (searchTerm.trim()) {
            const searchTermLower = searchTerm.toLowerCase();
            filtered = filtered.filter(bike =>
                (bike.id && bike.id.toLowerCase().includes(searchTermLower)) ||
                (bike.modelo && bike.modelo.toLowerCase().includes(searchTermLower)) ||
                (bike.placa && bike.placa.toLowerCase().includes(searchTermLower))
            );
        }
        
        // Aplicar filtro de status (mantendo o valor atual)
        if (statusFilter !== 'todos') {
            filtered = filtered.filter(bike => {
                const isRented = rentedBikeIds.includes(String(bike.id).trim());
                return statusFilter === 'alugadas' ? isRented : !isRented;
            });
        }
        
        // Aplicar filtro de marca com o novo valor
        if (newMarcaFilter !== 'todas') {
            filtered = filtered.filter(bike =>
                bike.marca && bike.marca.trim() === newMarcaFilter
            );
        }
        
        // Atualizar o estado filtrado
        setFilteredBikes(filtered);
    };

    /**
     * Função para contar filtros ativos
     */
    const countActiveFilters = () => {
        return (statusFilter !== 'todos' ? 1 : 0) +
               (marcaFilter !== 'todas' ? 1 : 0);
    };

    /**
     * Função para preparar as seções de filtro
     */
    const getFilterSections = () => {
        const sections = [
            {
                title: "Status:",
                options: [
                    {
                        id: 'status-todos',
                        label: 'Todas as motos',
                        active: statusFilter === 'todos',
                        onSelect: () => handleStatusFilter('todos')
                    },
                    {
                        id: 'status-disponiveis',
                        label: 'Disponíveis',
                        active: statusFilter === 'disponiveis',
                        onSelect: () => handleStatusFilter('disponiveis')
                    },
                    {
                        id: 'status-alugadas',
                        label: 'Alugadas',
                        active: statusFilter === 'alugadas',
                        onSelect: () => handleStatusFilter('alugadas')
                    }
                ]
            }
        ];
        
        // Adiciona a seção de marcas apenas se houver marcas disponíveis
        if (marcasDisponiveis.length > 0) {
            sections.push({
                title: "Marca:",
                options: [
                    {
                        id: 'marca-todas',
                        label: 'Todas as marcas',
                        active: marcaFilter === 'todas',
                        onSelect: () => handleMarcaFilter('todas')
                    },
                    ...marcasDisponiveis.map(marca => ({
                        id: `marca-${marca}`,
                        label: marca,
                        active: marcaFilter === marca,
                        onSelect: () => handleMarcaFilter(marca)
                    }))
                ]
            });
        }
        
        return sections;
    };

    // Use useFocusEffect para configurar os listeners apenas quando a tela estiver em foco
    useFocusEffect(
        useCallback(() => {
            let bikesUnsubscribe = null;
            let usersUnsubscribe = null;
           
            const setupListeners = async () => {
                try {
                    setLoading(true);
                   
                    // Listener para mudanças na coleção de motos
                    bikesUnsubscribe = onSnapshot(collection(db, "motos"), (snapshot) => {
                        console.log("Mudança detectada na coleção de motos");
                       
                        // Processa as mudanças
                        snapshot.docChanges().forEach(change => {
                            const bikeData = change.doc.data();
                            const bikeId = change.doc.id;
                           
                            if (change.type === "added" || change.type === "modified") {
                                // Adiciona ou atualiza o cache
                                const currentData = bikesCache.current.get(bikeId) || {};
                                bikesCache.current.set(bikeId, {
                                    ...currentData,
                                    id: bikeId,
                                    ...bikeData,
                                    // Mantém o status de aluguel e a URL da foto se já existirem
                                    alugada: currentData.alugada !== undefined ? currentData.alugada : false,
                                    fotoUrl: currentData.fotoUrl
                                });
                            } else if (change.type === "removed") {
                                // Remove do cache
                                console.log(`Moto removida: ${bikeId}`);
                                bikesCache.current.delete(bikeId);
                               
                                // Atualiza diretamente os estados para garantir que a UI seja atualizada
                                setBikes(prevBikes => prevBikes.filter(bike => bike.id !== bikeId));
                                setFilteredBikes(prevFiltered => prevFiltered.filter(bike => bike.id !== bikeId));
                            }
                        });
                       
                        // Atualiza o status de aluguel
                        updateRentedStatus();
                       
                        // Atualiza o estado
                        updateBikesState();
                    }, (error) => {
                        console.log("Erro no listener de motos:", error);
                        setLoading(false);
                    });
                   
                    // Listener para mudanças na coleção de usuários
                    usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
                        console.log("Mudança detectada na coleção de usuários");
                       
                        // Processa as mudanças
                        snapshot.docChanges().forEach(change => {
                            const userData = change.doc.data();
                            const userId = change.doc.id;
                           
                            if (change.type === "added" || change.type === "modified") {
                                // Adiciona ou atualiza o cache
                                usersCache.current.set(userId, userData);
                            } else if (change.type === "removed") {
                                // Remove do cache
                                usersCache.current.delete(userId);
                            }
                        });
                       
                        // Atualiza o status de aluguel
                        updateRentedStatus();
                       
                        // Atualiza o estado
                        updateBikesState();
                    }, (error) => {
                        console.log("Erro no listener de usuários:", error);
                        setLoading(false);
                    });
                   
                    // Carrega os dados iniciais
                    const loadInitialData = async () => {
                        try {
                            // Carrega usuários
                            const usersSnapshot = await getDocs(collection(db, "users"));
                            usersSnapshot.docs.forEach(doc => {
                                usersCache.current.set(doc.id, doc.data());
                            });
                           
                            // Carrega motos
                            const bikesSnapshot = await getDocs(collection(db, "motos"));
                            bikesSnapshot.docs.forEach(doc => {
                                bikesCache.current.set(doc.id, {
                                    id: doc.id,
                                    ...doc.data(),
                                    alugada: false
                                });
                            });
                           
                            // Atualiza o status de aluguel
                            updateRentedStatus();
                           
                            // Atualiza o estado
                            await updateBikesState();
                        } catch (error) {
                            console.log("Erro ao carregar dados iniciais:", error);
                            setLoading(false);
                        }
                    };
                   
                    await loadInitialData();
                } catch (error) {
                    console.log("Erro ao configurar listeners:", error);
                    showMessage('Erro', 'Falha ao carregar dados');
                    setLoading(false);
                }
            };
           
            setupListeners();
           
            // Cleanup function - remove os listeners quando a tela perde o foco
            return () => {
                console.log("Removendo listeners");
                if (bikesUnsubscribe) bikesUnsubscribe();
                if (usersUnsubscribe) usersUnsubscribe();
            };
        }, [refreshKey]) // Adicionado refreshKey para forçar reexecução quando necessário
    );

    // Função para lidar com a mudança no termo de busca
    const handleSearchChange = (text) => {
        setSearchTerm(text);
        
        // Aplicar filtros imediatamente com o novo valor
        const newSearchTerm = text;
        
        let filtered = [...bikes];
        
        // Aplicar filtro de busca com o novo valor
        if (newSearchTerm.trim()) {
            const searchTermLower = newSearchTerm.toLowerCase();
            filtered = filtered.filter(bike =>
                (bike.id && bike.id.toLowerCase().includes(searchTermLower)) ||
                (bike.modelo && bike.modelo.toLowerCase().includes(searchTermLower)) ||
                (bike.placa && bike.placa.toLowerCase().includes(searchTermLower))
            );
        }
        
        // Aplicar filtro de status
        if (statusFilter !== 'todos') {
            filtered = filtered.filter(bike => {
                const isRented = rentedBikeIds.includes(String(bike.id).trim());
                return statusFilter === 'alugadas' ? isRented : !isRented;
            });
        }
        
        // Aplicar filtro de marca
        if (marcaFilter !== 'todas') {
            filtered = filtered.filter(bike =>
                bike.marca && bike.marca.trim() === marcaFilter
            );
        }
        
        setFilteredBikes(filtered);
    };

    // Renderiza um indicador de carregamento quando os dados estão sendo carregados
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E74C3C" />
            </View>
        );
    }

    return (
        <Container>
            <View style={{ marginBottom: 20 }}>
                <FilterPanel
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onSearch={() => applyAllFilters()}
                    filterSections={getFilterSections()}
                    activeFiltersCount={countActiveFilters()}
                    onAddButtonPress={() => navigation.navigate('BikeForm', { bikes })}
                    addButtonIcon="add"
                    searchPlaceholder="Buscar motos..."
                />
            </View>

            {/* Lista de motos ou mensagem de "nenhuma moto encontrada" */}
            {filteredBikes.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                    <EmptyMessage>Nenhuma moto encontrada</EmptyMessage>
                </View>
            ) : (
                filteredBikes.map(bike => {
                    // Verifica diretamente se a moto está na lista de alugadas
                    const isRented = rentedBikeIds.includes(String(bike.id).trim());
                   
                    return (
                        <BikeCard key={bike.id}>
                            {bike.fotoUrl && <BikeImage source={{ uri: bike.fotoUrl }} resizeMode={isWebDesktop ? 'contain' : 'cover'} />}
                            <BikeInfo>
                                <TextInfo>
                                    <BikeModel>ID: </BikeModel>
                                    <InfoBike>{bike.id || 'N/A'}</InfoBike>
                                </TextInfo>
                                <TextInfo>
                                    <BikeModel>Placa: </BikeModel>
                                    <InfoBike>{bike.placa || 'N/A'}</InfoBike>
                                </TextInfo>
                                <TextInfo>
                                    <BikeModel>Modelo: </BikeModel>
                                    <InfoBike>{bike.modelo || 'N/A'}</InfoBike>
                                </TextInfo>
                                <TextInfo>
                                    <BikeModel>Ano: </BikeModel>
                                    <InfoBike>{bike.anoModelo || 'N/A'}</InfoBike>
                                </TextInfo>
                                <TextInfo>
                                    <BikeModel>Marca: </BikeModel>
                                    <InfoBike>{bike.marca || 'N/A'}</InfoBike>
                                </TextInfo>
                                <TextInfo>
                                    <BikeModel>Chassi: </BikeModel>
                                    <InfoBike>{bike.chassi || 'N/A'}</InfoBike>
                                </TextInfo>
                                <TextInfo>
                                    <BikeModel>Renavam: </BikeModel>
                                    <InfoBike>{bike.renavam || 'N/A'}</InfoBike>
                                </TextInfo>
                                <BikeStatus available={!isRented}>
                                    {isRented ? 'Alugada' : 'Disponível'}
                                </BikeStatus>
                            </BikeInfo>
                            <ActionButton onPress={() => navigation.navigate('BikeEdit', {
                                bike: {
                                    ...bike,
                                    alugada: isRented
                                }
                            })}>
                                <ActionButtonText>Editar</ActionButtonText>
                            </ActionButton>
                        </BikeCard>
                    );
                })
            )}
        </Container>
    );
}
