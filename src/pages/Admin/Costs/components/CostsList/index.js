import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { db } from '../../../../../services/firebaseConfig';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';


import {
  Container,
  Header,
  HeaderTitle,
  BackButton,
  Content,
  SummaryCard,
  SummaryTitle,
  SummaryValue,
  ClientCard,
  ClientInfo,
  ClientName,
  ClientCostInfo,
  ClientCostValue,
  ClientCostCount,
  AddButton,
  AddButtonText,
  EmptyContainer,
  EmptyText,
  SearchContainer,
  SearchInput,
  FilterButton,
  SortButton,
  ButtonsRow,
  LoadingContainer,
  TotalContainer,
  TotalLabel,
  TotalValue,
  ClientCardHeader,
  ClientAvatar,
  ClientInitials,
  ClientCardContent,
  ClientCardFooter,
  ViewDetailsButton,
  ViewDetailsText
} from './styles';


export default function CostsList() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState([]);
  const [clientCosts, setClientCosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCosts, setTotalCosts] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' ou 'desc'
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'month', 'week'


  // Buscar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      fetchCosts();
    }, [sortOrder, filterPeriod])
  );

  // Função para mostrar mensagem de sucesso/erro
  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };


  // Função para buscar custos
  const fetchCosts = async () => {
    try {
      setLoading(true);


      // Definir filtro de período se necessário
      let costsQuery;
      if (filterPeriod === 'month') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        costsQuery = query(
          collection(db, "costs"),
          where("date", ">=", startOfMonth),
          orderBy("date", sortOrder)
        );
      } else if (filterPeriod === 'week') {
        const startOfWeek = new Date();
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para começar na segunda-feira
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        costsQuery = query(
          collection(db, "costs"),
          where("date", ">=", startOfWeek),
          orderBy("date", sortOrder)
        );
      } else {
        costsQuery = query(
          collection(db, "costs"),
          orderBy("date", sortOrder)
        );
      }


      const snapshot = await getDocs(costsQuery);


      const costsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      }));


      setCosts(costsData);


      // Calcular o total de custos
      const total = costsData.reduce((sum, cost) => sum + (cost.value || 0), 0);
      setTotalCosts(total);


      // Agrupar custos por cliente
      const clientsMap = new Map();


      costsData.forEach(cost => {
        if (!cost.clientId) return;


        if (!clientsMap.has(cost.clientId)) {
          clientsMap.set(cost.clientId, {
            clientId: cost.clientId,
            clientName: cost.clientName || "Cliente sem nome",
            clientEmail: cost.clientEmail || "",
            costs: [],
            totalValue: 0,
            count: 0,
            hasInstallments: false
          });
        }


        const clientData = clientsMap.get(cost.clientId);
        clientData.costs.push(cost);
        clientData.totalValue += (cost.value || 0);
        clientData.count += 1;


        // Verificar se algum custo é parcelado
        if (cost.paymentType === 'parcelado') {
          clientData.hasInstallments = true;
        }
      });


      // Converter o Map para array e ordenar por valor total
      const clientsArray = Array.from(clientsMap.values()).sort((a, b) =>
        sortOrder === 'desc' ? b.totalValue - a.totalValue : a.totalValue - b.totalValue
      );


      setClientCosts(clientsArray);
    } catch (error) {
      console.error("Erro ao buscar custos:", error);
      showMessage("Erro", "Não foi possível carregar os custos.");
    } finally {
      setLoading(false);
    }
  };


  // Função para alternar a ordem de classificação
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };


  // Função para alternar o filtro de período
  const toggleFilterPeriod = () => {
    setFilterPeriod(prev => {
      if (prev === 'all') return 'month';
      if (prev === 'month') return 'week';
      return 'all';
    });
  };


  // Função para filtrar clientes com base na busca
  const filteredClients = searchQuery.trim() === ''
    ? clientCosts
    : clientCosts.filter(client =>
      client.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );


  // Função para navegar para a tela de detalhes do cliente
  const navigateToClientDetails = (client) => {
    // Criar uma cópia do cliente sem referências a objetos Date
    const serializedClient = {
      ...client,
      // Remover a propriedade costs que contém objetos Date
      costs: undefined
    };


    navigation.navigate('ClientCostDetails', { client: serializedClient });
  };


  // Função para navegar para a tela de registro de custos
  const navigateToRegisterCost = () => {
    navigation.navigate('RegisterCost');
  };


  // Função para voltar ao Dashboard
  const navigateToDashboard = () => {
    navigation.navigate('DashboardScreen');
  };


  // Renderizar item da lista de clientes
  const renderClientItem = ({ item }) => (
    <ClientCard>
      <ClientCardHeader>
        <ClientAvatar>
          <ClientInitials>
            {item.clientName.charAt(0).toUpperCase()}
          </ClientInitials>
        </ClientAvatar>
        <ClientInfo>
          <ClientName>{item.clientName}</ClientName>
          <ClientCostInfo>
            <ClientCostCount>
              {item.count} {item.count === 1 ? 'custo' : 'custos'}
              {item.hasInstallments && ' (alguns parcelados)'}
            </ClientCostCount>
          </ClientCostInfo>
        </ClientInfo>
      </ClientCardHeader>


      <ClientCardContent>
        <ClientCostValue>
          R$ {item.totalValue.toFixed(2).replace('.', ',')}
        </ClientCostValue>
      </ClientCardContent>


      <ClientCardFooter>
        <ViewDetailsButton onPress={() => navigateToClientDetails(item)}>
          <MaterialIcons name="visibility" size={16} color="#CB2921" />
          <ViewDetailsText>Ver Detalhes</ViewDetailsText>
        </ViewDetailsButton>
      </ClientCardFooter>
    </ClientCard>
  );


  // Renderizar conteúdo vazio
  const renderEmptyContent = () => (
    <EmptyContainer>
      <MaterialIcons name="money-off" size={50} color="#CCCCCC" />
      <EmptyText>Nenhum custo registrado</EmptyText>
    </EmptyContainer>
  );


  // Renderizar tela de carregamento
  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#CB2921" />
      </LoadingContainer>
    );
  }


  return (
    <Container>
      <Header>
        <BackButton onPress={navigateToDashboard}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </BackButton>
        <HeaderTitle>Gerenciamento de Custos</HeaderTitle>
      </Header>


      <Content>
        <SummaryCard>
          <SummaryTitle>Total de Custos</SummaryTitle>
          <SummaryValue>R$ {totalCosts.toFixed(2).replace('.', ',')}</SummaryValue>
        </SummaryCard>


        <SearchContainer>
          <SearchInput
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />


          <ButtonsRow>
            <FilterButton onPress={toggleFilterPeriod}>
              <MaterialIcons
                name="filter-list"
                size={24}
                color="#333"
              />
              <AddButtonText style={{ color: '#333' }}>
                {filterPeriod === 'all' ? 'Todos' :
                  filterPeriod === 'month' ? 'Este Mês' : 'Esta Semana'}
              </AddButtonText>
            </FilterButton>


            <SortButton onPress={toggleSortOrder}>
              <MaterialIcons
                name={sortOrder === 'desc' ? 'arrow-downward' : 'arrow-upward'}
                size={24}
                color="#333"
              />
            </SortButton>
          </ButtonsRow>
        </SearchContainer>


        <FlatList
          data={filteredClients}
          keyExtractor={item => item.clientId}
          renderItem={renderClientItem}
          ListEmptyComponent={renderEmptyContent}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
            flexGrow: filteredClients.length === 0 ? 1 : undefined
          }}
        />


        <TotalContainer>
          <TotalLabel>Total: {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}</TotalLabel>
          <TotalValue>
            R$ {filteredClients.reduce((sum, client) => sum + client.totalValue, 0).toFixed(2).replace('.', ',')}
          </TotalValue>
        </TotalContainer>


        <AddButton onPress={navigateToRegisterCost}>
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
          <AddButtonText>Registrar Novo Custo</AddButtonText>
        </AddButton>
      </Content>
    </Container>
  );
}