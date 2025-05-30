import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, Keyboard, Pressable, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db, auth } from '../../../../../services/firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import DatePickerMultiplatform from '../../../../../components/DatePickerMultiplatform';

import {
  Container,
  Header,
  HeaderTitle,
  BackButton,
  FormContainer,
  FormTitle,
  InputContainer,
  Label,
  Input,
  TextArea,
  ValueContainer,
  CurrencySymbol,
  SubmitButton,
  SubmitButtonText,
  ClientSelectorButton,
  ClientSelectorButtonText,
  ClientModalContainer,
  ClientModalContent,
  ClientModalHeader,
  ClientModalTitle,
  ClientModalCloseButton,
  SearchInput,
  ClientList,
  ClientItem,
  ClientName,
  ClientEmail,
  LoadingContainer,
  EmptyText,
  PaymentTypeContainer,
  PaymentTypeOption,
  PaymentTypeText
} from './styles';

export default function RegisterCost() {
  const navigation = useNavigation();
  const route = useRoute();
  const preSelectedClient = route.params?.preSelectedClient;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState(preSelectedClient || null);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [paymentType, setPaymentType] = useState('avista'); // 'avista' ou 'parcelado'
  const [installments, setInstallments] = useState('1');
  const [category, setCategory] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const categories = [
    'Manutenção',
    'Proteção Veicular',
    'Impostos',
    'Peças',
    'Serviço',
    'Outros'
  ];

  // Buscar clientes ao montar o componente
  useEffect(() => {
    if (preSelectedClient) {
      setSelectedClient(preSelectedClient);
    }
    fetchClients();
  }, []);

  // Função para selecionar categoria
  const selectCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    setCategoryModalVisible(false);
  };

  // Função para mostrar mensagem de sucesso/erro
  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Função para lidar com a mudança no tipo de pagamento
  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (type === 'avista') {
      setInstallments('1');
    }
  };

  // Função para buscar clientes
  const fetchClients = async () => {
    try {
      setLoadingClients(true);

      const clientsQuery = query(
        collection(db, "users"),
        orderBy("nome")
      );

      const snapshot = await getDocs(clientsQuery);

      const clientsData = snapshot.docs
        .filter(doc => doc.data().nome) // Filtrar apenas usuários com nome
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      setClients(clientsData);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      showMessage("Erro", "Não foi possível carregar a lista de clientes.");
    } finally {
      setLoadingClients(false);
    }
  };

  // Função para abrir modal de seleção de cliente
  const openClientModal = () => {
    setClientModalVisible(true);
  };

  // Função para selecionar cliente
  const selectClient = (client) => {
    setSelectedClient(client);
    setClientModalVisible(false);
  };

  // Função para formatar valor monetário
  const formatCurrency = (text) => {
    // Remover todos os caracteres não numéricos
    let value = text.replace(/\D/g, '');

    // Converter para número e dividir por 100 para obter o valor em reais
    value = (parseInt(value) / 100).toFixed(2);

    // Formatar com separador de milhares e vírgula decimal
    return value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Função para processar entrada de valor
  const handleValueChange = (text) => {
    // Remover formatação
    const numericValue = text.replace(/\D/g, '');

    // Atualizar estado com valor formatado
    setValue(formatCurrency(numericValue));
  };

  // Função para registrar custo
  const handleSubmit = async () => {
    // Validar campos
    if (!description.trim()) {
      showMessage("Erro", "Por favor, informe uma descrição para o custo.");
      return;
    }

    if (!value) {
      showMessage("Erro", "Por favor, informe um valor para o custo.");
      return;
    }

    if (!selectedClient) {
      showMessage("Erro", "Por favor, selecione um cliente.");
      return;
    }

    if (paymentType === 'parcelado' && (!installments || parseInt(installments) < 2)) {
      showMessage("Erro", "Para pagamento parcelado, informe pelo menos 2 parcelas.");
      return;
    }

    try {
      setSubmitting(true);

      // Converter valor para número
      const numericValue = parseFloat(value.replace('.', '').replace(',', '.'));

      // Obter informações do usuário atual
      const currentUser = auth.currentUser;
      const userEmail = currentUser ? currentUser.email : null;

      // Criar documento de custo
      const costData = {
        description,
        value: numericValue,
        date,
        clientId: selectedClient.id,
        clientName: selectedClient.nome,
        clientEmail: selectedClient.email,
        paymentType,
        installments: parseInt(installments),
        installmentValue: paymentType === 'parcelado' ? numericValue / parseInt(installments) : numericValue,
        category: category || 'Sem categoria',
        createdBy: userEmail,
        createdAt: serverTimestamp()
      };

      // Adicionar ao Firestore
      await addDoc(collection(db, "costs"), costData);

      showMessage(
        "Sucesso",
        "Custo registrado com sucesso!"
      );

      navigation.navigate('CostsList');

    } catch (error) {
      console.error("Erro ao registrar custo:", error);
      showMessage("Erro", "Não foi possível registrar o custo. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar clientes com base na busca
  const filteredClients = searchQuery.trim() === ''
    ? clients
    : clients.filter(client =>
      client.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Renderizar item da lista de clientes
  const renderClientItem = (client) => (
    <ClientItem key={client.id} onPress={() => selectClient(client)}>
      <ClientName>{client.nome}</ClientName>
      {client.email && <ClientEmail>{client.email}</ClientEmail>}
    </ClientItem>
  );

  // Renderizar conteúdo vazio
  const renderEmptyClientList = () => (
    <EmptyText>
      {loadingClients
        ? "Carregando clientes..."
        : "Nenhum cliente encontrado"}
    </EmptyText>
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
    <Pressable
      onPress={Platform.OS !== 'web' ? () => Keyboard.dismiss() : undefined}
      style={{ flex: 1 }}
    >
      <Container>
        <Header>
          <BackButton onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </BackButton>
          <HeaderTitle>Registrar Custo</HeaderTitle>
        </Header>

        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <FormContainer>
            <FormTitle>Informações do Custo</FormTitle>

            <InputContainer>
              <Label>Cliente</Label>
              <ClientSelectorButton onPress={openClientModal}>
                <ClientSelectorButtonText selected={selectedClient}>
                  {selectedClient ? selectedClient.nome : "Selecione um cliente"}
                </ClientSelectorButtonText>
                <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
              </ClientSelectorButton>
            </InputContainer>

            <InputContainer>
              <Label>Data</Label>
              <DatePickerMultiplatform
                value={date}
                onChange={setDate}
              />
            </InputContainer>

            <InputContainer>
              <Label>Valor</Label>
              <ValueContainer>
                <CurrencySymbol>R$</CurrencySymbol>
                <Input
                  value={value}
                  onChangeText={handleValueChange}
                  keyboardType="numeric"
                  placeholder="0,00"
                />
              </ValueContainer>
            </InputContainer>

            <InputContainer>
              <Label>Tipo de Pagamento</Label>
              <PaymentTypeContainer>
                <PaymentTypeOption
                  onPress={() => handlePaymentTypeChange('avista')}
                  selected={paymentType === 'avista'}
                >
                  <PaymentTypeText selected={paymentType === 'avista'}>À Vista</PaymentTypeText>
                </PaymentTypeOption>
                <PaymentTypeOption
                  onPress={() => handlePaymentTypeChange('parcelado')}
                  selected={paymentType === 'parcelado'}
                >
                  <PaymentTypeText selected={paymentType === 'parcelado'}>Parcelado</PaymentTypeText>
                </PaymentTypeOption>
              </PaymentTypeContainer>
            </InputContainer>

            {paymentType === 'parcelado' && (
              <InputContainer>
                <Label>Número de Parcelas</Label>
                <Input
                  value={installments}
                  onChangeText={setInstallments}
                  keyboardType="numeric"
                  placeholder="Informe o número de parcelas"
                />
              </InputContainer>
            )}

            <InputContainer>
              <Label>Categoria</Label>
              <ClientSelectorButton onPress={() => setCategoryModalVisible(true)}>
                <ClientSelectorButtonText selected={category}>
                  {category || "Selecione uma categoria"}
                </ClientSelectorButtonText>
                <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
              </ClientSelectorButton>
            </InputContainer>

            <InputContainer>
              <Label>Descrição</Label>
              <TextArea
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva o custo..."
                multiline
                numberOfLines={4}
              />
            </InputContainer>

            <SubmitButton
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="save" size={24} color="#FFFFFF" />
                  <SubmitButtonText>Registrar Custo</SubmitButtonText>
                </>
              )}
            </SubmitButton>
          </FormContainer>
        </ScrollView>

        {/* Modal de seleção de cliente */}
        {clientModalVisible && (
          <ClientModalContainer>
            <ClientModalContent>
              <ClientModalHeader>
                <ClientModalTitle>Selecionar Cliente</ClientModalTitle>
                <ClientModalCloseButton onPress={() => setClientModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </ClientModalCloseButton>
              </ClientModalHeader>

              <SearchInput
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {loadingClients ? (
                <ActivityIndicator size="large" color="#CB2921" style={{ marginTop: 20 }} />
              ) : (
                <ClientList>
                  {filteredClients.length > 0
                    ? filteredClients.map(renderClientItem)
                    : renderEmptyClientList()}
                </ClientList>
              )}
            </ClientModalContent>
          </ClientModalContainer>
        )}

        {/* Modal de seleção de categoria */}
        {categoryModalVisible && (
          <ClientModalContainer>
            <ClientModalContent>
              <ClientModalHeader>
                <ClientModalTitle>Selecionar Categoria</ClientModalTitle>
                <ClientModalCloseButton onPress={() => setCategoryModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </ClientModalCloseButton>
              </ClientModalHeader>

              <ClientList>
                {categories.map((cat, index) => (
                  <ClientItem key={index} onPress={() => selectCategory(cat)}>
                    <ClientName>{cat}</ClientName>
                  </ClientItem>
                ))}
              </ClientList>
            </ClientModalContent>
          </ClientModalContainer>
        )}
      </Container>
    </Pressable>
  );
}
