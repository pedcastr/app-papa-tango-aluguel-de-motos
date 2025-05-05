import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View, ScrollView, Text, Platform } from 'react-native';
import { db, storage } from '../../../../../services/firebaseConfig';
import { doc, updateDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import {
    Container, 
    Form,
    Section,
    Switch,
    SectionTitle,
    InputGroup,
    Label,
    Input,
    Button,
    ButtonText,
    ImagemMoto,
    FileActionContainer,
    DeleteButton,
    DeleteButtonText,
    UploadButton,
    UploadButtonText,
    DeleteMotoButton,
    DeleteMotoButtonText,
} from './styles';

/**
 * Componente principal para edição de motos
 * @param {Object} route - Objeto de rota com parâmetros
 * @param {Object} navigation - Objeto de navegação
 */
export default function MotoEdit({ route, navigation }) {
    // Verificar se route.params e route.params.bike existem
    // Usamos 'bike' porque é o nome do parâmetro passado na navegação anterior
    const motoParam = route.params?.bike || {};
    const [motoData, setMotoData] = useState(motoParam);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Verificar se estamos em um dispositivo web mobile ou desktop
    const isWebDesktop = Platform.OS === 'web' && window.innerWidth > 768;

    // Verificar se temos um ID válido quando o componente é montado ou quando os parâmetros mudam
    useEffect(() => {
        const checkMotoData = async () => {
            // Se não temos ID na rota, verificar se temos ID separado
            if (!motoData.id && route.params?.id) {
                setLoading(true);
                try {
                    // Buscar dados da moto pelo ID no Firestore
                    const motoDoc = await getDoc(doc(db, "motos", route.params.id));
                    if (motoDoc.exists()) {
                        const data = motoDoc.data();
                        setMotoData({ id: route.params.id, ...data });
                    } else {
                        setError("Moto não encontrada");
                        showMessage("Erro", "Não foi possível encontrar os dados da moto");
                    }
                } catch (err) {
                    console.error("Erro ao buscar dados da moto:", err);
                    setError("Erro ao carregar dados");
                    showMessage("Erro", "Falha ao carregar dados da moto");
                } finally {
                    setLoading(false);
                }
            } else if (!motoData.id) {
                setError("ID da moto não fornecido");
                showMessage("Erro", "ID da moto não foi fornecido");
            }
        };

        checkMotoData();
    }, [route.params]);

    // Função para mostrar alerta em qualquer plataforma
    const showConfirmation = (title, message, onConfirm) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}\n\n${message}`)) {
                onConfirm();
            }
        } else {
            Alert.alert(title, message, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sim, excluir', onPress: onConfirm }
            ]);
        }
    };

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    /**
     * Função para fazer upload de imagem da moto
     * Abre a galeria, seleciona uma imagem, faz upload para o Storage
     * e atualiza a URL no Firestore
     */
    const handleUploadImage = async () => {
        // Verificar se temos um ID válido
        if (!motoData.id) {
            showMessage("Erro", "ID da moto não disponível");
            return;
        }

        try {
            // Abrir a galeria de imagens
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaType: 'photo',
                quality: 0.8,
            });

            // Se o usuário cancelou a seleção, sair da função
            if (result.didCancel) return;

            if (result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                setLoading(true);

                // Criar um blob a partir do URI da imagem
                const response = await fetch(selectedImage.uri);
                const blob = await response.blob();

                // Determinar o caminho e nome do arquivo
                const fileName = `foto_${Date.now()}.jpg`;
                // Caminho no Storage: motos/{id}/fotos/{nome_arquivo}.jpg
                const storagePath = `motos/${motoData.id}/fotos/${fileName}`;

                console.log("Fazendo upload para:", storagePath);

                // Upload para o Storage
                const fileRef = ref(storage, storagePath);
                await uploadBytes(fileRef, blob);
                
                // Obter URL do arquivo
                const downloadURL = await getDownloadURL(fileRef);
                console.log("URL do arquivo:", downloadURL);
                
                // Atualizar Firestore com a nova URL
                await updateDoc(doc(db, "motos", motoData.id), {
                    fotoUrl: downloadURL
                });
                console.log("Firestore atualizado com sucesso");
                
                // Atualizar estado local
                setMotoData(prev => ({
                    ...prev,
                    fotoUrl: downloadURL
                }));
                
                showMessage('Sucesso', 'Foto da moto enviada com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao fazer upload da imagem:', error);
            showMessage('Erro', 'Falha ao enviar foto da moto. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Função para excluir foto da moto
     * Remove a imagem do Storage e atualiza o Firestore
     */
    const handleDeleteMoto = async () => {
        // Verificar se temos um ID válido
        if (!motoData.id) {
            showMessage("Erro", "ID da moto não disponível");
            return;
        }
    
        // Confirmar a exclusão com o usuário
        showConfirmation(
            'Confirmação',
            'Tem certeza que deseja excluir permanentemente esta moto? Esta ação não pode ser desfeita.',
            async () => {
                try {
                    setLoading(true);
                    
                    // 1. Verificar se a moto está associada a algum aluguel ou contrato
                    const alugueisRef = collection(db, "alugueis");
                    const alugueisQuery = query(alugueisRef, where("motoId", "==", motoData.id));
                    const alugueisSnapshot = await getDocs(alugueisQuery);
                    
                    const contratosRef = collection(db, "contratos");
                    const contratosQuery = query(contratosRef, where("motoId", "==", motoData.id));
                    const contratosSnapshot = await getDocs(contratosQuery);
                    
                    const usersRef = collection(db, "users");
                    const usersQuery = query(usersRef, where("motoAlugadaId", "==", motoData.id));
                    const usersSnapshot = await getDocs(usersQuery);
                    
                    // Se a moto estiver associada a aluguéis, contratos ou usuários, perguntar se deseja continuar
                    if (!alugueisSnapshot.empty || !contratosSnapshot.empty || !usersSnapshot.empty) {
                        setLoading(false); // Desativar o loading enquanto aguarda a confirmação
                        
                        showConfirmation(
                            'Atenção',
                            `Esta moto está associada a ${alugueisSnapshot.size} aluguel(is), ${contratosSnapshot.size} contrato(s) e ${usersSnapshot.size} usuário(s). Excluir a moto também removerá essas associações. Deseja continuar?`,
                            async () => {
                                await realizarExclusaoCompleta(motoData, alugueisSnapshot, contratosSnapshot, usersSnapshot);
                            }
                        );
                    } else {
                        // Não há associações, prosseguir com a exclusão direta
                        await realizarExclusaoCompleta(motoData);
                    }
                } catch (error) {
                    console.error('Erro ao verificar associações da moto:', error);
                    showMessage('Erro', 'Falha ao excluir moto. Tente novamente.');
                    setLoading(false);
                }
            }
        );
    };
    
    // Função auxiliar para realizar a exclusão completa
    const realizarExclusaoCompleta = async (motoData, alugueisSnapshot = null, contratosSnapshot = null, usersSnapshot = null) => {
        try {
            setLoading(true);
            
            // 1. Excluir a foto do Storage, se existir
            if (motoData.fotoUrl) {
                try {
                    // Método 1: Tentar extrair o caminho da URL
                    const urlString = motoData.fotoUrl;
                    const match = urlString.match(/\/o\/([^?]+)/);
                    
                    if (match && match[1]) {
                        // Se conseguir extrair o caminho da URL
                        const path = decodeURIComponent(match[1]);
                        const fileRef = ref(storage, path);
                        await deleteObject(fileRef);
                        console.log("Foto excluída com sucesso do Storage");
                    } else {
                        // Método 2: Tentar com o ID da moto e nome do arquivo
                        const urlParts = motoData.fotoUrl.split('/');
                        const fileName = urlParts[urlParts.length - 1].split('?')[0];
                        const alternativePath = `motos/${motoData.id}/fotos/${fileName}`;
                        
                        const fileRef = ref(storage, alternativePath);
                        await deleteObject(fileRef);
                        console.log("Foto excluída com sucesso do Storage (caminho alternativo)");
                    }
                } catch (storageError) {
                    console.error("Erro ao excluir do Storage:", storageError);
                    // Continuar mesmo se falhar a exclusão da foto
                }
            }
            
            // 2. Remover associações com usuários
            if (usersSnapshot && !usersSnapshot.empty) {
                const atualizacoesUsuarios = [];
                usersSnapshot.forEach(userDoc => {
                    atualizacoesUsuarios.push(
                        updateDoc(doc(db, "users", userDoc.id), {
                            motoAlugadaId: null,
                            motoAlugada: false
                        })
                    );
                });
                
                if (atualizacoesUsuarios.length > 0) {
                    await Promise.all(atualizacoesUsuarios);
                    console.log(`${atualizacoesUsuarios.length} usuários atualizados`);
                }
            }
            
            // 3. Excluir aluguéis associados
            if (alugueisSnapshot && !alugueisSnapshot.empty) {
                const exclusoesAlugueis = [];
                alugueisSnapshot.forEach(aluguelDoc => {
                    exclusoesAlugueis.push(
                        deleteDoc(doc(db, "alugueis", aluguelDoc.id))
                    );
                });
                
                await Promise.all(exclusoesAlugueis);
                console.log(`${exclusoesAlugueis.length} aluguéis excluídos`);
            }
            
            // 4. Atualizar contratos associados (remover referência à moto)
            if (contratosSnapshot && !contratosSnapshot.empty) {
                const atualizacoesContratos = [];
                contratosSnapshot.forEach(contratoDoc => {
                    atualizacoesContratos.push(
                        updateDoc(doc(db, "contratos", contratoDoc.id), {
                            motoId: null
                        })
                    );
                });
                
                await Promise.all(atualizacoesContratos);
                console.log(`${atualizacoesContratos.length} contratos atualizados`);
            }
            
            // 5. Finalmente, excluir o documento da moto do Firestore
            await deleteDoc(doc(db, "motos", motoData.id));
            console.log("Documento da moto excluído com sucesso");
            
            showMessage('Sucesso', 'Moto excluída com sucesso!');
            
            // 6. Voltar para a tela anterior
            navigation.navigate('BikeList', {
                deleteBikeId: motoData.id,
                timestamp: Date.now(),
            });
            
        } catch (error) {
            console.error('Erro ao excluir moto:', error);
            showMessage('Erro', 'Falha ao excluir moto. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Função para atualizar dados da moto no Firestore
     */
    const handleUpdate = async () => {
        // Verificar se temos um ID válido
        if (!motoData.id) {
            showMessage("Erro", "ID da moto não disponível");
            return;
        }

        try {
            setLoading(true);
            // Atualizar todos os dados da moto no Firestore
            await updateDoc(doc(db, "motos", motoData.id), {
                ...motoData
            });
            showMessage('Sucesso', 'Moto atualizada com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao atualizar moto:', error);
            showMessage('Erro', 'Falha ao atualizar moto');
        } finally {
            setLoading(false);
        }
    };

    // Se houver erro, mostrar mensagem de erro e botão para voltar
    if (error) {
        return (
            <Container>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 18, color: '#CB2921', textAlign: 'center' }}>
                        {error}
                    </Text>
                    <Button onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                        <ButtonText>Voltar</ButtonText>
                    </Button>
                </View>
            </Container>
        );
    }

    // Renderização do componente principal
    return (
        <Container>
            {/* Indicador de carregamento */}
            {loading && (
                <View style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 999
                }}>
                    <ActivityIndicator size="large" color="#CB2921" />
                </View>
            )}
            
            <ScrollView>
                <Form>
                    {/* Seção de informações básicas da moto */}
                    <Section>
                        <SectionTitle>Informações da Moto</SectionTitle>

                        <InputGroup style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <Label>Moto Alugada?</Label>
                            <Switch
                                value={motoData.alugada}
                                onValueChange={(value) => setMotoData(prev => ({ ...prev, alugada: value }))}
                                trackColor={{ false: '#767577', true: '#CB2921' }}
                                thumbColor={motoData.alugada ? '#CB2921' : '#767577'}
                            />
                        </InputGroup>

                        <InputGroup>
                            <Label>ID</Label>
                            <Input 
                                value={motoData.id}
                                editable={false} // ID não deve ser editável
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Modelo</Label>
                            <Input 
                                value={motoData.modelo}
                                onChangeText={(text) => setMotoData(prev => ({...prev, modelo: text}))}
                                autoCapitalize="words"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Placa</Label>
                            <Input 
                                value={motoData.placa}
                                onChangeText={(text) => setMotoData(prev => ({...prev, placa: text}))}
                                autoCapitalize="characters"
                                maxLength={7}
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Ano</Label>
                            <Input 
                                value={motoData.anoModelo?.toString()}
                                onChangeText={(text) => setMotoData(prev => ({...prev, anoModelo: text}))}
                                keyboardType="numeric"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Marca</Label>
                            <Input 
                                value={motoData.marca}
                                onChangeText={(text) => setMotoData(prev => ({...prev, marca: text}))}
                                autoCapitalize="words"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Chassi</Label>
                            <Input 
                                value={motoData.chassi}
                                onChangeText={(text) => setMotoData(prev => ({...prev, chassi: text}))}
                                autoCapitalize="words"
                                maxLength={17}
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Renavam</Label>
                            <Input 
                                value={motoData.renavam}
                                onChangeText={(text) => setMotoData(prev => ({...prev, renavam: text}))}
                                autoCapitalize="words"
                                maxLength={11}
                            />
                        </InputGroup>
                    </Section>

                    {/* Seção de Foto da Moto */}
                    <Section>
                        <SectionTitle>Foto da Moto</SectionTitle>
                        
                        {/* Renderização condicional: mostrar foto ou botão de upload */}
                        {motoData.fotoUrl ? (
                            <>
                                {/* Se tiver foto, mostrar a imagem */}
                                <ImagemMoto
                                    source={{uri: motoData.fotoUrl}}
                                    resizeMode={isWebDesktop ? 'contain' : 'cover'}
                        
                                />
                                <FileActionContainer>
                                    <DeleteButton onPress={handleDeleteImage}>
                                        <DeleteButtonText>Excluir Foto</DeleteButtonText>
                                    </DeleteButton>
                                </FileActionContainer>
                            </>
                        ) : (
                            /* Se não tiver foto, mostrar botão de upload */
                            <FileActionContainer>
                                <UploadButton onPress={handleUploadImage}>
                                    <UploadButtonText>Adicionar Foto da Moto</UploadButtonText>
                                </UploadButton>
                            </FileActionContainer>
                        )}
                    </Section>

                    {/* Botão de salvar alterações */}
                    <Button onPress={handleUpdate}>
                        <ButtonText>Salvar Alterações</ButtonText>
                    </Button>

                    <DeleteMotoButton onPress={handleDeleteMoto}>
                        <DeleteMotoButtonText>Excluir Moto</DeleteMotoButtonText>
                    </DeleteMotoButton>
                    
                </Form>
            </ScrollView>
        </Container>
    );
}
