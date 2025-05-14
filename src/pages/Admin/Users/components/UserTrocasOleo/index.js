import React, { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { FlatList, RefreshControl, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from "../../../../../services/firebaseConfig";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";

import {
    ButtonDetalhesTroca,
    ViewTrocaInfo,
    TextData,
    ImageKm,
    ContainerLista,
    ButtonNovaTroca,
    TextButtonNovaTroca,
    ContainerSemTrocas,
    TextButtonSemTrocas,
    LoadingContainer,
} from './styles';

export default function UserTrocaOleo() {
    const navigation = useNavigation();
    const route = useRoute();
    const [trocasOleo, setTrocasOleo] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isFocused = useIsFocused();

    // Obtém o usuário dos parâmetros da rota
    const { user: userParam } = route.params || {};

    // Inicializa o estado do usuário
    const [userData, setUserData] = useState(null);

    // Configura os dados do usuário quando o componente é montado
    useEffect(() => {
        if (userParam) {
            setUserData({ ...userParam });
        } else {
            console.error("Nenhum dado de usuário recebido da rota");
            setError("Dados do usuário não encontrados");
            setLoading(false);
        }
    }, [userParam]);

    // Carrega as trocas quando o componente está em foco ou quando userData muda
    useEffect(() => {
        if (isFocused && userData) {
            carregarTrocasOleo();
        }
    }, [isFocused, userData]);

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Função para carregar as trocas de óleo do Firestore
    const carregarTrocasOleo = async () => {
        if (!userData || !userData.email) {
            setError("Dados do usuário inválidos");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Normaliza o email para evitar problemas de case sensitivity
            const userEmail = userData.email.toLowerCase().trim();

            // Verifica se o documento do usuário existe
            const userDocRef = doc(db, "users", userEmail);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                console.log("Documento do usuário não encontrado no Firestore");
                setTrocasOleo([]);
                setLoading(false);
                return;
            }

            // Abordagem alternativa: buscar documentos individualmente para evitar o erro interno
            try {
                // Busca a subcoleção de trocas de óleo
                const trocasRef = collection(userDocRef, "trocasOleo");
                const q = query(
                    trocasRef,
                    orderBy("dataUpload", "desc"),
                    limit(10)
                );

                const querySnapshot = await getDocs(q);

                const trocas = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Verifica se os dados necessários existem
                    if (data && data.dataUpload) {
                        trocas.push({
                            id: doc.id,
                            ...data,
                            // Garante que a URL da imagem existe
                            fotoKm: data.fotoKm || 'https://via.placeholder.com/150?text=Sem+Imagem'
                        });
                    } else {
                        console.log("Documento com dados incompletos:", doc.id);
                    }
                });

                setTrocasOleo(trocas);
            } catch (firestoreError) {
                console.error("Erro específico do Firestore:", firestoreError);

                // Abordagem de fallback se a consulta falhar
                console.log("Tentando abordagem alternativa...");

                // Tenta obter a lista de IDs de documentos primeiro
                const trocasCollectionRef = collection(userDocRef, "trocasOleo");
                const trocasSnapshot = await getDocs(trocasCollectionRef);

                const trocasManual = [];
                for (const docSnap of trocasSnapshot.docs) {
                    try {
                        const data = docSnap.data();
                        if (data && data.dataUpload) {
                            trocasManual.push({
                                id: docSnap.id,
                                ...data,
                                fotoKm: data.fotoKm || 'https://via.placeholder.com/150?text=Sem+Imagem'
                            });
                        }
                    } catch (docError) {
                        console.error("Erro ao processar documento:", docError);
                    }
                }

                // Ordena manualmente por data (mais recente primeiro)
                trocasManual.sort((a, b) => {
                    // Tenta converter para Date se possível
                    const dateA = new Date(a.dataUpload);
                    const dateB = new Date(b.dataUpload);

                    // Se a conversão for válida, compara as datas
                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        return dateB - dateA;
                    }

                    // Caso contrário, compara como strings
                    return b.dataUpload.localeCompare(a.dataUpload);
                });

                setTrocasOleo(trocasManual.slice(0, 10)); // Limita a 10 itens
            }
        } catch (error) {
            console.error("Erro ao carregar trocas:", error);
            setError("Não foi possível carregar as trocas de óleo. Tente novamente.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Função para atualizar a lista quando o usuário puxa para baixo
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        carregarTrocasOleo();
    }, [userData]);

    // Função para navegar para a tela de detalhes da troca
    const navegarParaDetalhesTroca = (troca) => {
        navigation.navigate('DetalhesTrocaOleo', {
            troca,
            userData
        });
    };

    // Função para navegar para a tela de registro de nova troca
    const navegarParaNovaTroca = () => {
        if (userData) {
            navigation.navigate('TrocaOleo', { userData });
        } else {
            showMessage("Erro", "Dados do usuário não disponíveis");
        }
    };

    // Componente que renderiza cada item da lista de trocas
    const renderTrocaOleo = ({ item }) => (
        <ButtonDetalhesTroca
            onPress={() => navegarParaDetalhesTroca(item)}
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

    // Renderiza o componente de loading
    if (loading && !refreshing) {
        return (
            <LoadingContainer>
                <ActivityIndicator size="large" color="#CB2921" />
                <TextButtonSemTrocas>Carregando trocas de óleo...</TextButtonSemTrocas>
            </LoadingContainer>
        );
    }

    // Renderiza mensagem de erro
    if (error) {
        return (
            <ContainerSemTrocas>
                <TextButtonSemTrocas>{error}</TextButtonSemTrocas>
                <ButtonNovaTroca onPress={carregarTrocasOleo}>
                    <TextButtonNovaTroca>Tentar novamente</TextButtonNovaTroca>
                </ButtonNovaTroca>
            </ContainerSemTrocas>
        );
    }

    return (
        <ContainerLista>
            {trocasOleo.length > 0 ? (
                <>
                    <FlatList
                        data={trocasOleo}
                        renderItem={renderTrocaOleo}
                        keyExtractor={item => item.id}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#CB2921"]}
                                tintColor="#CB2921"
                            />
                        }
                    />
                    <ButtonNovaTroca onPress={navegarParaNovaTroca}>
                        <TextButtonNovaTroca>Registrar nova troca de óleo</TextButtonNovaTroca>
                    </ButtonNovaTroca>
                </>
            ) : (
                <ContainerSemTrocas>
                    <TextButtonSemTrocas>O usuário ainda NÃO realizou nenhuma troca de óleo</TextButtonSemTrocas>
                    <ButtonNovaTroca onPress={navegarParaNovaTroca}>
                        <TextButtonNovaTroca>Registrar primeira troca de óleo</TextButtonNovaTroca>
                    </ButtonNovaTroca>
                </ContainerSemTrocas>
            )}
        </ContainerLista>
    );
}
