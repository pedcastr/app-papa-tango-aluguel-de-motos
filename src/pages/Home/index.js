import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Linking, ActivityIndicator, Platform, ActionSheetIOS, Alert, View } from 'react-native';
import { auth, db, storage } from '../../services/firebaseConfig';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerModal } from '../../components/ImagePickerModal';
import NotificationBell from '../../components/NotificationBell';

import {
    Container,
    ViewPadding,
    Header,
    WelcomeText,
    ProfileButton,
    ProfileImage,
    MotoContainer,
    TitleText,
    MotoImage,
    InfoContainer,
    VeiculoInfo,
    LocacaoInfo,
    InfoTitle,
    InfoText,
    EmptyContainer,
    EmptyText,
    WhatsappButton,
    WhatsappText,
    ProfileHeader,
    CloseButton,
    ProfileContent,
    ProfilePhotoContainer,
    EditPhotoButton,
    ProfileModal,
    ProfileInfo,
    LogoutButton,
    LogoutText,
    InfoLabel,
    LoadingContainer,
} from './styles';

export default function Home() {
    // Estados para gerenciar os dados
    const [userData, setUserData] = useState(null);
    const [contratoAtivo, setContratoAtivo] = useState(null);
    const [motoData, setMotoData] = useState(null);
    const [aluguelData, setAluguelData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalVisible2, setModalVisible2] = useState(false);
    const [userPhoto, setUserPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingSupport, setLoadingSupport] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    

    // Carrega os dados e pagamentos pendentes ao iniciar o componente
    useEffect(() => {
        carregarDados();
    }, []);

    // Função para abrir o seletor de fotos (usando ActionSheetIOS no iOS)
    const abrirSeletorFotos = useCallback(() => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
                    cancelButtonIndex: 0,
                    title: 'Selecione uma opção',
                    message: 'Como você deseja adicionar sua foto?'
                },
                (buttonIndex) => {
                    console.log('ActionSheet: botão selecionado:', buttonIndex);
                    if (buttonIndex === 1) {
                        abrirCamera();
                    } else if (buttonIndex === 2) {
                        abrirGaleria();
                    }
                }
            );
        } else {
            setModalVisible2(true);
        }
    }, []);

    // Função para carregar todos os dados necessários
    const carregarDados = async () => {
        try {
            setLoading(true);
    
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.email));
            const userData = userDoc.data();
            setUserData(userData);
            
            // se o usuário tiver uma foto de perfil, carrega a foto
            if (userData.photoURL) {
                setUserPhoto(userData.photoURL);
            }
    
            if (userData.motoAlugada && userData.motoAlugadaId) {
                // Carrega dados da moto
                const motoDoc = await getDoc(doc(db, 'motos', userData.motoAlugadaId));
                setMotoData(motoDoc.data());
    
                // Carrega dados do aluguel
                const aluguelDoc = await getDoc(doc(db, 'alugueis', userData.aluguelAtivoId));
                setAluguelData(aluguelDoc.data());
                
                // Carrega dados do contrato usando contratoId
                const contratoDoc = await getDoc(doc(db, 'contratos', userData.contratoId));
                const contratoData = contratoDoc.data();
                setContratoAtivo({
                    ...contratoData,
                    statusContrato: 'ativo'
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    // Função para selecionar foto da galeria
    const abrirGaleria = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                alert('Precisamos de permissão para acessar suas fotos!');
                return;
            }
            
            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });
            
            if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
                const { uri } = resultado.assets[0];
                uploadPhoto(uri);
            }
        } catch (error) {
            console.error('Erro ao abrir galeria:', error);
            alert('Erro ao abrir a galeria de fotos. Por favor, tente novamente.');
        }
    };

    // Função para tirar foto com a câmera
    const abrirCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status !== 'granted') {
                alert('Precisamos de permissão para acessar sua câmera!');
                return;
            }
            
            const resultado = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });
            
            if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
                const { uri } = resultado.assets[0];
                uploadPhoto(uri);
            }
        } catch (error) {
            console.error('Erro ao abrir câmera:', error);
            alert('Erro ao abrir a câmera. Por favor, tente novamente.');
        }
    };

    // Função para fazer upload da foto no Storage
    const uploadPhoto = async (uri) => {
        try {
            setUploadingPhoto(true);
            // Cria referência no storage
            const storageRef = ref(storage, `profile/${auth.currentUser.email}/avatar.jpg`);
            
            // Converte URI para blob
            const response = await fetch(uri);
            const blob = await response.blob();
            
            // Faz upload do arquivo
            await uploadBytes(storageRef, blob);
            
            // Obtém URL do arquivo
            const photoURL = await getDownloadURL(storageRef);
            
            // Atualiza URL no Firestore
            await updateDoc(doc(db, 'users', auth.currentUser.email), {
                photoURL: photoURL
            });
            
            // Atualiza estado
            setUserPhoto(photoURL);
        } catch (error) {
            console.error('Erro no upload:', error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Função para abrir WhatsApp
    const handleWhatsapp = useCallback(() => {
        if (loadingSupport) return;
        
        setLoadingSupport(true);
        const telefone = '5585992684035';
        const mensagem = 'Olá! Já estou logado no app da Papa Tango e quero alugar uma moto :)';
        const urlWhatsapp = `whatsapp://send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;
        
        Linking.canOpenURL(urlWhatsapp)
            .then(suportado => {
                if (suportado) {
                    return Linking.openURL(urlWhatsapp);
                } else {
                    Alert.alert('WhatsApp não está instalado');
                }
            })
            .catch(erro => {
                console.error('Erro ao abrir WhatsApp:', erro);
                Alert.alert('Não foi possível abrir o WhatsApp');
            })
            .finally(() => {
                setLoadingSupport(false);
            });
    }, [loadingSupport]);

    // Função para fazer logout
    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    // Função para calcular tempo de locação
    const calcularTempoLocacao = (dataInicio) => {
        if (!dataInicio || !dataInicio.toDate) return "Carregando...";
        
        try {
            const inicio = dataInicio.toDate();
            const hoje = new Date();
            const diffMeses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + 
                             (hoje.getMonth() - inicio.getMonth());
            
            if (diffMeses < 1) return "Menos de 1 mês";
            if (diffMeses === 1) return "1 mês";
            return `${diffMeses} meses`;
        } catch (error) {
            console.error('Erro ao calcular tempo:', error);
            return "Erro ao calcular tempo";
        }
    };

    return (
        <Container>
            <ViewPadding>
                <Header>
                    <WelcomeText>Olá, {userData?.nome}</WelcomeText>
                    <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        justifyContent: 'flex-end' /* Garantir alinhamento à direita */
                    }}>
                        {/* Componente de notificação */}
                        <NotificationBell userType="client" />
                        
                        <ProfileButton onPress={() => setModalVisible(true)}>
                        {userPhoto ? (
                            <ProfileImage source={{ uri: userPhoto }} />
                        ) : (
                            <MaterialCommunityIcons name="account-circle" size={50} color="#1E1E1E" />
                        )}
                        </ProfileButton>
                    </View>
                </Header>

                {loading ? (
                    <LoadingContainer>
                        <ActivityIndicator size="large" color="#CB2921" />
                    </LoadingContainer>
                ) : (
                    <>
                        {contratoAtivo ? (
                            contratoAtivo.statusContrato === 'ativo' ? (
                                <MotoContainer>
                                    <TitleText>Moto Alugada</TitleText>
                                    <MotoImage source={{ uri: motoData?.fotoUrl }} />
                                    <InfoContainer>
                                        <VeiculoInfo>
                                            <InfoTitle>Dados do Veículo</InfoTitle>
                                            <InfoText>
                                                <InfoLabel>Placa:</InfoLabel> {motoData?.placa}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Marca:</InfoLabel> {motoData?.marca}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Modelo:</InfoLabel> {motoData?.modelo}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Ano:</InfoLabel> {motoData?.anoModelo}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Chassi:</InfoLabel> {motoData?.chassi}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Renavam:</InfoLabel> {motoData?.renavam}
                                            </InfoText>
                                        </VeiculoInfo>
                                        <LocacaoInfo>
                                            <InfoTitle>Dados da Locação</InfoTitle>
                                            <InfoText>
                                                <InfoLabel>Valor Semanal: </InfoLabel>R$ {aluguelData?.valorSemanal}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Valor Mensal: </InfoLabel>R$ {aluguelData?.valorMensal}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Caução: </InfoLabel>R$ {aluguelData?.valorCaucao}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Tempo: </InfoLabel>{contratoAtivo?.dataInicio ? calcularTempoLocacao(contratoAtivo.dataInicio) : 'Carregando...'}
                                            </InfoText>
                                            <InfoText>
                                                <InfoLabel>Pagamento: </InfoLabel>{contratoAtivo?.tipoRecorrenciaPagamento === 'semanal' ? 'Semanal' : 'Mensal'}
                                            </InfoText>
                                        </LocacaoInfo>
                                    </InfoContainer>
                                </MotoContainer>
                            ) : (
                                <EmptyContainer>
                                    <MaterialCommunityIcons name="emoticon-sad-outline" size={300} color="#CB2921" />
                                    <EmptyText>{userData?.nome}, seu contrato de locação está encerrado</EmptyText>
                                    <WhatsappButton 
                                    onPress={handleWhatsapp}
                                    activeOpacity={0.8}
                                    >
                                        {loadingSupport ? (
                                            <WhatsappText>Abrindo Whatsapp...</WhatsappText>
                                        ) : (
                                            <WhatsappText>Alugar Novamente</WhatsappText>
                                        )}
                                    </WhatsappButton>
                                </EmptyContainer>
                            )
                        ) : (
                            <EmptyContainer>
                                <MaterialCommunityIcons name="emoticon-sad-outline" size={300} color="#CB2921"/>
                                <EmptyText>{userData?.nome}, você não possui nenhuma moto alugada na Papa Tango</EmptyText>
                                <WhatsappButton 
                                onPress={handleWhatsapp}
                                activeOpacity={0.8}
                                >
                                    {loadingSupport ? (
                                        <WhatsappText>Abrindo Whatsapp...</WhatsappText>
                                    ) : (
                                        <WhatsappText>Alugar Moto</WhatsappText>
                                    )}
                                </WhatsappButton>
                            </EmptyContainer>
                        )}
                    </>
                )}

                <Modal visible={modalVisible} animationType="slide" transparent>
                    <ProfileModal>
                        <ProfileHeader>
                            <CloseButton onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#000" />
                            </CloseButton>
                        </ProfileHeader>
                        <ProfileContent>
                            <ProfilePhotoContainer>
                                {uploadingPhoto ? (
                                    <ActivityIndicator size="large" color="#CB2921" />
                                ) : (
                                    <>
                                        {userPhoto ? (
                                            <ProfileImage large source={{ uri: userPhoto }} />
                                        ) : (
                                            <MaterialCommunityIcons name="account-circle" size={100} color="#1E1E1E" />
                                        )}
                                        <EditPhotoButton onPress={abrirSeletorFotos}>
                                            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                                        </EditPhotoButton>
                                    </>
                                )}
                            </ProfilePhotoContainer>
                            <ProfileInfo>
                                <InfoText>
                                    <InfoLabel>Nome:</InfoLabel> {userData?.nomeCompleto}
                                </InfoText>
                                <InfoText>
                                    <InfoLabel>CPF:</InfoLabel> {userData?.cpf}
                                </InfoText>
                                <InfoText>
                                    <InfoLabel>Email:</InfoLabel> {userData?.email}
                                </InfoText>
                                <InfoText>
                                    <InfoLabel>Telefone:</InfoLabel> {userData?.telefone}
                                </InfoText>
                                <InfoText>
                                    <InfoLabel>Data de abertura da conta:</InfoLabel> {userData?.dataCadastro}
                                </InfoText>
                            </ProfileInfo>
                            <LogoutButton onPress={handleLogout}>
                                <LogoutText>Sair do App</LogoutText>
                            </LogoutButton>
                        </ProfileContent>
                    </ProfileModal>
                </Modal>
                {/* Modal para opções de escolha de foto na plataforma Android e web */}
                {Platform.OS !== 'ios' && (
                    <ImagePickerModal 
                        visible={modalVisible2}
                        onClose={() => setModalVisible2(false)}
                        onGalleryPress={() => {
                            setModalVisible2(false);
                            abrirGaleria();
                        }}
                        onCameraPress={() => {
                            setModalVisible2(false);
                            abrirCamera();
                        }}
                    />
                )}
            </ViewPadding>
        </Container>
    );
}
