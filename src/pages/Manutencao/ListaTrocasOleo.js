import React, { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { FlatList, RefreshControl } from 'react-native';
import { db, auth } from "../../services/firebaseConfig";
import { collection, query, orderBy, limit, getDocs, doc } from "firebase/firestore";
import { MaterialIcons } from '@expo/vector-icons';

import {
  Container,
  ButtonDetalhesTroca,
  ViewTrocaInfo,
  TextData,
  ImageKm,
  ContainerLista,
  Header,
  TextTitleLista,
  ButtonNovaTroca,
  ContainerSemTrocas,
  TextButtonSemTrocas,
  TextButtonNovaTroca,
} from './styles';

export default function ListaTrocasOleo({ navigation }) {

  const [trocasOleo, setTrocasOleo] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused(); // Hook para verificar se a tela está em foco

  // Função para dá refresh e carregar as trocas de óleo do Firestore quando o usuário acessa a tela
  useEffect(() => {
    if (isFocused) {
      carregarTrocasOleo();
    }
  }, [isFocused]);

  // Carrega as trocas ao montar o componente
  useEffect(() => {
    carregarTrocasOleo();
  }, []);

  // Função para carregar as trocas de óleo do Firestore 
  const carregarTrocasOleo = async () => {
    try {
      const userEmail = auth.currentUser.email; // Obtém o email do usuário autenticado
      const userDocRef = doc(db, "users", userEmail);
      const trocasRef = collection(userDocRef, "trocasOleo");
      const q = query(
        trocasRef,
        orderBy("dataUpload", "desc"),
        limit(5)
      );

      const querySnapshot = await getDocs(q); // Esta linha executa a query definida anteriormente e retorna um snapshot (foto instantânea) dos documentos encontrados.
      const trocas = []; // Cria um array vazio que vai armazenar os dados formatados das trocas de óleo.
      querySnapshot.forEach((doc) => { // Para cada documento, cria um novo objeto com os dados do documento e o adiciona ao array de trocas.
        trocas.push({ id: doc.id, ...doc.data() });
      });

      setTrocasOleo(trocas);
    } catch (error) {
      console.error("Erro ao carregar trocas:", error);
    }
  };

  // Função para atualizar a lista quando o usuário puxa para baixo
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    carregarTrocasOleo().finally(() => {
      setRefreshing(false);
    });
  }, []);

  // Componente que renderiza cada item da lista de trocas
  const renderTrocaOleo = ({ item }) => (
    <ButtonDetalhesTroca
      onPress={() => navigation.navigate('Detalhes da Troca de Óleo', { troca: item })}
    >
      <ViewTrocaInfo>
        <TextData>Data: {item.dataUpload}</TextData>
        <ImageKm
          source={{ uri: item.fotoKm }}
          resizeMode="contain"
        />
      </ViewTrocaInfo>
      <MaterialIcons name="chevron-right" size={24} color="#000" />
    </ButtonDetalhesTroca>
  );

  return (
    <Container>
      {/* Header com botão de voltar e título */}
      <Header>
        <MaterialIcons
          name="arrow-back"
          size={28}
          color="#000"
          onPress={() => navigation.goBack()}
        />
        {trocasOleo.length > 0 && (
          <TextTitleLista>
            {trocasOleo.length === 1 ? 'Última troca de óleo' : 'Últimas trocas de óleo'}
          </TextTitleLista>
        )}
      </Header>

      {/* Conteúdo principal */}
      {trocasOleo.length > 0 ? (
        <>
          <FlatList
            data={trocasOleo}
            renderItem={renderTrocaOleo}
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            style={{ marginTop: 15 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#CB2921"]}
                tintColor="#CB2921"
              />
            }
          />
          <ButtonNovaTroca
            onPress={() => navigation.navigate('Troca de Óleo')}
          >
            <TextButtonNovaTroca>Informar nova troca de óleo</TextButtonNovaTroca>
          </ButtonNovaTroca>
        </>
      ) : (
        <ContainerSemTrocas>
          <ButtonNovaTroca
            onPress={() => navigation.navigate('Troca de Óleo')}
          >
            <TextButtonSemTrocas>Registrar Primeira Troca</TextButtonSemTrocas>
          </ButtonNovaTroca>
        </ContainerSemTrocas>
      )}
    </Container>
  );
}