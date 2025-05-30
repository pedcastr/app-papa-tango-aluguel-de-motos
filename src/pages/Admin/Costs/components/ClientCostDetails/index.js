import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../../../../services/firebaseConfig';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

import {
  Container,
  Header,
  HeaderTitle,
  BackButton,
  Content,
  ClientInfoCard,
  ClientName,
  ClientEmail,
  ClientTotalCosts,
  CostCard,
  CostDate,
  CostDescription,
  CostValue,
  EmptyContainer,
  EmptyText,
  AddButton,
  AddButtonText,
  CostCardHeader,
  CostCardContent,
  CostCardFooter,
  DeleteButton,
  ActionButton,
  ActionButtonText,
  ModalContainer,
  ModalContent,
  ModalTitle,
  ModalText,
  ModalButtons,
  ModalButton,
  ModalButtonText,
  CloseButton,
  LoadingContainer,
  CostDetailModal,
  CostDetailTitle,
  CostDetailContent,
  CostDetailItem,
  CostDetailLabel,
  CostDetailValue,
  PaymentTypeTag,
  PaymentTypeText,
  FilterContainer,
  FilterButton,
  FilterButtonText,
  FilterInfo
} from './styles';

export default function ClientCostDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { client } = route.params;
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState([]);
  const [selectedCost, setSelectedCost] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [costToDelete, setCostToDelete] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'month', 'week'
  const [filteredCosts, setFilteredCosts] = useState([]);

  // Buscar custos do cliente
  useEffect(() => {
    fetchClientCosts();
  }, []);

  // Função para mostrar mensagem de sucesso/erro
  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // UseEffect para filtrar os custos quando o filtro ou os custos mudarem
  useEffect(() => {
    if (costs.length === 0) {
      setFilteredCosts([]);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filterPeriod === 'week') {
      // Calcular o início da semana (segunda-feira)
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Se for domingo, voltar 6 dias, senão calcular dias até segunda
      startOfWeek.setDate(today.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);

      setFilteredCosts(costs.filter(cost => cost.date >= startOfWeek));
    } else if (filterPeriod === 'month') {
      // Início do mês atual
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setFilteredCosts(costs.filter(cost => cost.date >= startOfMonth));
    } else {
      // Todos os custos
      setFilteredCosts(costs);
    }
  }, [costs, filterPeriod]);

  // Função para calcular o total dos custos filtrados
  const calculateFilteredTotal = () => {
    return filteredCosts.reduce((sum, cost) => sum + (cost.value || 0), 0);
  };

  // Função para alternar o filtro de período
  const toggleFilterPeriod = () => {
    setFilterPeriod(prev => {
      if (prev === 'all') return 'month';
      if (prev === 'month') return 'week';
      return 'all';
    });
  };

  // Função para buscar custos do cliente
  const fetchClientCosts = async () => {
    try {
      setLoading(true);

      const costsQuery = query(
        collection(db, "costs"),
        where("clientId", "==", client.clientId),
        orderBy("date", "desc")
      );

      const snapshot = await getDocs(costsQuery);

      const costsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      }));

      setCosts(costsData);
    } catch (error) {
      console.error("Erro ao buscar custos do cliente:", error);
      showMessage("Erro", "Não foi possível carregar os custos deste cliente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para navegar para a tela de registro de custos
  const navigateToRegisterCost = () => {
    navigation.navigate('RegisterCost', {
      preSelectedClient: {
        id: client.clientId,
        nome: client.clientName,
        email: client.clientEmail
      }
    });
  };

  // Função para mostrar detalhes do custo
  const showCostDetails = (cost) => {
    setSelectedCost(cost);
    setDetailModalVisible(true);
  };

  // Função para confirmar exclusão de custo
  const confirmDeleteCost = (cost) => {
    setCostToDelete(cost);
    setDeleteModalVisible(true);
  };

  // Função para excluir custo
  const deleteCost = async () => {
    if (!costToDelete) return;

    try {
      setLoading(true);

      // Excluir documento do Firestore
      await deleteDoc(doc(db, "costs", costToDelete.id));

      // Atualizar lista de custos
      setCosts(prevCosts => prevCosts.filter(cost => cost.id !== costToDelete.id));

      // Fechar modal
      setDeleteModalVisible(false);
      setCostToDelete(null);

      showMessage("Sucesso", "Custo excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir custo:", error);
      showMessage("Erro", "Não foi possível excluir o custo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar data
  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString('pt-BR');
  };

  // Renderizar item da lista de custos
  const renderCostItem = ({ item }) => (
    <CostCard onPress={() => showCostDetails(item)}>
      <CostCardHeader>
        <CostDate>{formatDate(item.date)}</CostDate>
        <CostValue>
          {item.paymentType === 'parcelado'
            ? `R$ ${item.installmentValue.toFixed(2).replace('.', ',')} (${item.installments}x)`
            : `R$ ${item.value.toFixed(2).replace('.', ',')}`}
        </CostValue>
      </CostCardHeader>

      <CostCardContent>
        <CostDescription numberOfLines={2}>
          {item.description}
        </CostDescription>
        {item.paymentType === 'parcelado' && (
          <PaymentTypeTag>
            <PaymentTypeText>Parcelado</PaymentTypeText>
          </PaymentTypeTag>
        )}
      </CostCardContent>

      <CostCardFooter>
        <ActionButton onPress={() => showCostDetails(item)}>
          <MaterialIcons name="visibility" size={16} color="#3498db" />
          <ActionButtonText>Detalhes</ActionButtonText>
        </ActionButton>

        <DeleteButton onPress={() => confirmDeleteCost(item)}>
          <MaterialIcons name="delete" size={16} color="#e74c3c" />
          <ActionButtonText>Excluir</ActionButtonText>
        </DeleteButton>
      </CostCardFooter>
    </CostCard>
  );

  // Renderizar conteúdo vazio
  const renderEmptyContent = () => (
    <EmptyContainer>
      <MaterialIcons name="money-off" size={50} color="#CCCCCC" />
      <EmptyText>Nenhum custo registrado para este cliente</EmptyText>
    </EmptyContainer>
  );

  // Renderizar tela de carregamento
  if (loading && costs.length === 0) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#CB2921" />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </BackButton>
        <HeaderTitle>Custos do Cliente</HeaderTitle>
      </Header>

      <Content>
        <ClientInfoCard>
          <ClientName>{client.clientName}</ClientName>
          {client.clientEmail && <ClientEmail>{client.clientEmail}</ClientEmail>}
          <ClientTotalCosts>
            Total: R$ {client.totalValue.toFixed(2).replace('.', ',')} ({client.count} {client.count === 1 ? 'custo' : 'custos'})
          </ClientTotalCosts>
        </ClientInfoCard>

        <FilterContainer>
          <FilterButton onPress={toggleFilterPeriod}>
            <MaterialIcons name="filter-list" size={20} color="#333" />
            <FilterButtonText>
              {filterPeriod === 'all' ? 'Todos' :
                filterPeriod === 'month' ? 'Este Mês' : 'Esta Semana'}
            </FilterButtonText>
          </FilterButton>

          <FilterInfo>
            {filteredCosts.length} {filteredCosts.length === 1 ? 'custo' : 'custos'}:
            R$ {calculateFilteredTotal().toFixed(2).replace('.', ',')}
          </FilterInfo>
        </FilterContainer>

        <FlatList
          data={filteredCosts}
          keyExtractor={item => item.id}
          renderItem={renderCostItem}
          ListEmptyComponent={renderEmptyContent}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
            flexGrow: filteredCosts.length === 0 ? 1 : undefined
          }}
        />

        <AddButton onPress={navigateToRegisterCost}>
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
          <AddButtonText>Registrar Novo Custo</AddButtonText>
        </AddButton>
      </Content>

      {/* Modal de confirmação de exclusão */}
      {deleteModalVisible && (
        <ModalContainer>
          <ModalContent>
            <ModalTitle>Confirmar Exclusão</ModalTitle>
            <ModalText>
              Tem certeza que deseja excluir este custo? Esta ação não pode ser desfeita.
            </ModalText>
            <ModalButtons>
              <ModalButton onPress={() => setDeleteModalVisible(false)}>
                <ModalButtonText cancel>Cancelar</ModalButtonText>
              </ModalButton>
              <ModalButton onPress={deleteCost}>
                <ModalButtonText>Confirmar</ModalButtonText>
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalContainer>
      )}

      {/* Modal de detalhes do custo */}
      {detailModalVisible && selectedCost && (
        <CostDetailModal>
          <ModalContent>
            <CostDetailTitle>Detalhes do Custo</CostDetailTitle>

            <CostDetailContent>
              <CostDetailItem>
                <CostDetailLabel>Data:</CostDetailLabel>
                <CostDetailValue>{formatDate(selectedCost.date)}</CostDetailValue>
              </CostDetailItem>

              <CostDetailItem>
                <CostDetailLabel>Tipo de Pagamento:</CostDetailLabel>
                <CostDetailValue>
                  {selectedCost.paymentType === 'parcelado' ? 'Parcelado' : 'À Vista'}
                </CostDetailValue>
              </CostDetailItem>

              {selectedCost.paymentType === 'parcelado' && (
                <>
                  <CostDetailItem>
                    <CostDetailLabel>Número de Parcelas:</CostDetailLabel>
                    <CostDetailValue>{selectedCost.installments}</CostDetailValue>
                  </CostDetailItem>

                  <CostDetailItem>
                    <CostDetailLabel>Valor da Parcela:</CostDetailLabel>
                    <CostDetailValue>
                      R$ {selectedCost.installmentValue.toFixed(2).replace('.', ',')}
                    </CostDetailValue>
                  </CostDetailItem>
                </>
              )}

              <CostDetailItem>
                <CostDetailLabel>Valor:</CostDetailLabel>
                <CostDetailValue>R$ {selectedCost.value.toFixed(2).replace('.', ',')}</CostDetailValue>
              </CostDetailItem>

              <CostDetailItem>
                <CostDetailLabel>Descrição:</CostDetailLabel>
                <CostDetailValue>{selectedCost.description}</CostDetailValue>
              </CostDetailItem>

              <CostDetailItem>
                <CostDetailLabel>Registrado por:</CostDetailLabel>
                <CostDetailValue>{selectedCost.createdBy || "Não informado"}</CostDetailValue>
              </CostDetailItem>

              <CostDetailItem>
                <CostDetailLabel>Data de registro:</CostDetailLabel>
                <CostDetailValue>
                  {selectedCost.createdAt?.toDate ?
                    selectedCost.createdAt.toDate().toLocaleString('pt-BR') :
                    "Não informado"}
                </CostDetailValue>
              </CostDetailItem>
            </CostDetailContent>

            <CloseButton onPress={() => setDetailModalVisible(false)}>
              <ModalButtonText>Fechar</ModalButtonText>
            </CloseButton>
          </ModalContent>
        </CostDetailModal>
      )}
    </Container>
  );
}
