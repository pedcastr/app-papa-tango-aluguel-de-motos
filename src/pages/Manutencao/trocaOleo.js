import React, { useState } from 'react'; 
import { Image, ActivityIndicator, View, Platform, Text, TouchableOpacity, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker'; // Expo image picker
import { ImagePickerModal } from '../../components/ImagePickerModal';
import { db, storage, auth } from "../../services/firebaseConfig";
import { doc, collection, addDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { httpsCallable, getFunctions } from 'firebase/functions';
import { FeedbackModal } from '../../components/FeedbackModal';
import ProgressModal from '../../components/ProgressModal';

import {
    Container,
    ScrollContainerTrocaOleo,
    TextTitle,
    AreaIconPage,
    TextPage,
    AreaFoto,
    ButtonEnviar,
    TextButtonEnviar,
    ButtonFoto,
    RemoveButton,
    Divider,
} from "./styles";

export default function TrocaOleo({ navigation }) {

    const [fotoOleo, setFotoOleo] = useState(null);
    const [fotoNota, setFotoNota] = useState(null);
    const [videoOleo, setVideoOleo] = useState(null);
    const [fotoKm, setFotoKm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [tipoMidiaAtual, setTipoMidiaAtual] = useState(null);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', title: '', message: '' })
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');

    // função que abre o modal de opções de foto
    const abrirOpcoes = (tipo) => {
        setTipoMidiaAtual(tipo);
        setModalVisible(true);
    };

    // Função para solicitar permissões (funciona em todas as plataformas)
    const solicitarPermissoes = async (tipo) => {
        if (Platform.OS !== 'web') {
            let permissaoResult;
            
            if (tipo === 'camera') {
                permissaoResult = await ImagePicker.requestCameraPermissionsAsync();
            } else {
                permissaoResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            }
            
            if (!permissaoResult.granted) {
                setFeedback({
                    type: 'error',
                    title: 'Permissão negada',
                    message: tipo === 'camera' 
                        ? 'Precisamos de permissão para acessar sua câmera' 
                        : 'Precisamos de permissão para acessar sua galeria'
                });
                setFeedbackVisible(true);
                return false;
            }
            return true;
        }
        return true; // No web, não precisamos de permissões explícitas
    };

    // Função para selecionar foto da galeria
    const abrirGaleria = async (tipoFoto) => {
        const permissaoConcedida = await solicitarPermissoes('galeria');
        if (!permissaoConcedida) return;
        
        // NOTA: Estamos usando MediaTypeOptions depreciado intencionalmente
        // porque as novas APIs (MediaType) causam erros de execução nesta versão específica.
        // Isso deve ser revisado em futuras atualizações do expo-image-picker.
        const opcoes = {
            mediaTypes: tipoFoto === 'video' 
                ? ImagePicker.MediaTypeOptions.Videos 
                : ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
            videoMaxDuration: 20,
        };
        
        try {
            const resultado = await ImagePicker.launchImageLibraryAsync(opcoes);
            
            if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
                const asset = resultado.assets[0];
                switch(tipoFoto) {
                    case 'oleo':
                        setFotoOleo(asset);
                        break;
                    case 'nota':
                        setFotoNota(asset);
                        break;
                    case 'km':
                        setFotoKm(asset);
                        break;
                    case 'video':
                        setVideoOleo(asset);
                        break;
                }
            }
        } catch (error) {
            console.error("Erro ao abrir galeria:", error);
        }
    };

    // Função para tirar foto com a câmera
    const abrirCamera = async (tipoMidia) => {
        const permissaoConcedida = await solicitarPermissoes('camera');
        if (!permissaoConcedida) return;
        
        const opcoes = {
            mediaTypes: tipoMidia === 'video' 
                ? ImagePicker.MediaTypeOptions.Videos 
                : ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
            videoMaxDuration: 20,
        };
        
        try {
            const resultado = await ImagePicker.launchCameraAsync(opcoes);
            
            if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
                const asset = resultado.assets[0];
                switch(tipoMidia) {
                    case 'oleo':
                        setFotoOleo(asset);
                        break;
                    case 'nota':
                        setFotoNota(asset);
                        break;
                    case 'km':
                        setFotoKm(asset);
                        break;
                    case 'video':
                        setVideoOleo(asset);
                        break;
                }
            }
        } catch (error) {
            console.error("Erro ao abrir câmera:", error);
        }
    };

    const enviarParaFirebase = async () => {
        // Verificação de arquivos faltantes
        const fotosFaltantes = [];
        if (!fotoOleo) fotosFaltantes.push('\nfoto do óleo que foi adicionado');
        if (!fotoNota) fotosFaltantes.push('\nfoto da nota fiscal');
        if (!fotoKm) fotosFaltantes.push('\nfoto dos kms da moto após a troca de óleo');
        if (!videoOleo) fotosFaltantes.push('\nvídeo do óleo sendo adicionado');

        // Exibe feedback se houver arquivos faltantes
        if (fotosFaltantes.length > 0) {
            setFeedback({
                type: 'error',
                title: 'Envie todos os arquivos',
                message: `Está faltando: ${fotosFaltantes.join(', ')}.`
            });
            setFeedbackVisible(true);
            return;
        }

        try {
            setLoading(true);
            setUploadProgress(0);
            setUploadStatus('Iniciando processo...');

            // Obtém dados do usuário logado
            const userEmail = auth.currentUser.email;
            const userDoc = await getDoc(doc(db, "users", userEmail));
            const userData = userDoc.data();
            const userName = userData.nome;
            const userPhone = userData.telefone;
            
            // Função para upload de arquivos
            const uploadArquivo = async (arquivo, tipo) => {
                const extensao = tipo === 'video' ? '.mp4' : '.jpg';
                const storageRef = ref(storage, `users/${userEmail}/trocasOleo/${tipo}_${Date.now()}${extensao}`);
                
                // Adaptação para funcionar em todas as plataformas
                let blob;
                if (Platform.OS === 'web') {
                    // Para web, precisamos converter a URI para blob de forma diferente
                    if (tipo === 'video' && arquivo.uri.startsWith('blob:')) {
                        // Se já for um blob URL no web, podemos usar diretamente
                        const response = await fetch(arquivo.uri);
                        blob = await response.blob();
                    } else {
                        // Para imagens no web, podemos precisar de uma abordagem diferente
                        const response = await fetch(arquivo.uri);
                        blob = await response.blob();
                    }
                } else {
                    // Para dispositivos móveis
                    const response = await fetch(arquivo.uri);
                    blob = await response.blob();
                }
                
                await uploadBytes(storageRef, blob);
                return await getDownloadURL(storageRef);
            };

            // Referências do Firestore
            const userDocRef = doc(db, "users", userEmail);
            const trocasCollection = collection(userDocRef, "trocasOleo");

            // Upload dos arquivos com progresso
            setUploadStatus('Enviando foto do óleo...');
            const urlFotoOleo = await uploadArquivo(fotoOleo, 'oleo');
            setUploadProgress(0.25);

            setUploadStatus('Enviando nota fiscal...');
            const urlFotoNota = await uploadArquivo(fotoNota, 'nota');
            setUploadProgress(0.50);

            setUploadStatus('Enviando foto do km...');
            const urlFotoKm = await uploadArquivo(fotoKm, 'km');
            setUploadProgress(0.75);

            setUploadStatus('Enviando vídeo...');
            const urlVideo = await uploadArquivo(videoOleo, 'video');
            setUploadProgress(0.85);

            // Formatação da data atual
            const dataAtual = new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            setUploadStatus('Salvando informações...');
            // Salvando no Firestore
            await addDoc(trocasCollection, {
                email: userEmail,
                nome: userName,
                telefone: userPhone,
                fotoOleo: urlFotoOleo,
                fotoNota: urlFotoNota,
                fotoKm: urlFotoKm,
                videoOleo: urlVideo,
                dataUpload: dataAtual
            });

            setUploadStatus('Concluindo...');
            setUploadProgress(0.95);

            // Enviando email com os dados do usuário e fotos e vídeo
            const functions = getFunctions();
            const enviarEmailTrocaOleo = httpsCallable(functions, 'enviarEmailTrocaOleo');
            const emailData = {
                userName,
                userEmail,
                userPhone,
                dataUpload: dataAtual,
                fotoOleo: urlFotoOleo,
                fotoNota: urlFotoNota,
                fotoKm: urlFotoKm,
                videoOleo: urlVideo
            };
        
            await enviarEmailTrocaOleo(emailData);

            setUploadProgress(1);
            setUploadStatus('Concluído com sucesso!');
            navigation.goBack();

        } catch (error) {
            console.error("Erro ao enviar documentos: ", error);
            setFeedback({
                type: 'error',
                title: 'Erro',
                message: 'Erro ao enviar documentos. Por favor, tente novamente mais tarde.'
            });
            setFeedbackVisible(true);
            
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <ScrollContainerTrocaOleo>
                <AreaIconPage>
                    <MaterialIcons
                        name="arrow-back"
                        size={28}
                        color="#000"
                        onPress={() => navigation.goBack()}
                    />
                    <TextTitle style={{ flex: 1, marginTop: -3, marginRight: 25 }}>
                        Troca de óleo
                    </TextTitle>
                </AreaIconPage>

                <TextPage style={{ marginTop: 20 }}>
                    Foto do óleo que foi adicionado
                </TextPage>
                <ButtonFoto onPress={() => abrirOpcoes('oleo')}>
                    <AreaFoto>
                        {fotoOleo ? (
                            <View>
                                <Image 
                                source={{ uri: fotoOleo.uri }} 
                                style={{ width: 364, height: 118 }} 
                                resizeMode="contain"
                                />
                                <RemoveButton onPress={() => setFotoOleo(null)}>
                                    <MaterialIcons name="close" size={20} color="#000" />
                                </RemoveButton>
                            </View>
                        ) : <MaterialIcons name="camera-alt" size={110} color="#000" /> }
                    </AreaFoto>
                </ButtonFoto>
                <Divider style={{ marginTop: 25, marginBottom: -5 }} />

                <TextPage>
                    Foto da nota fiscal de compra do óleo
                </TextPage>
                <ButtonFoto onPress={() => abrirOpcoes('nota')}>
                    <AreaFoto>
                        {fotoNota ? (
                            <View>
                                <Image 
                                    source={{ uri: fotoNota.uri }} 
                                    style={{ width: 364, height: 118 }} 
                                    resizeMode="contain"
                                />
                                <RemoveButton onPress={() => setFotoNota(null)}>
                                    <MaterialIcons name="close" size={20} color="#000" />
                                </RemoveButton>
                            </View>
                        ) : <MaterialIcons name="camera-alt" size={110} color="#000" />}
                    </AreaFoto>
                </ButtonFoto>
                <Divider style={{ marginTop: 25, marginBottom: -5 }} />

                <TextPage>
                    Vídeo do novo óleo sendo adicionado e no mesmo vídeo mostrar kms totais da moto
                </TextPage>
                <ButtonFoto onPress={() => abrirOpcoes('video')}>
                    <AreaFoto>
                        {videoOleo ? (
                            <View>
                                {Platform.OS === 'web' ? (
                                    // Para web: usar elemento de vídeo HTML nativo
                                    <video
                                        src={videoOleo.uri}
                                        controls
                                        style={{
                                            width: 364,
                                            height: 118,
                                            backgroundColor: '#D9D9D9'
                                        }}
                                    />
                                ) : (
                                    // Para mobile: mostrar thumbnail com botão para visualizar
                                    <View style={{ 
                                        width: 364, 
                                        height: 118, 
                                        backgroundColor: '#D9D9D9', 
                                        justifyContent: 'center', 
                                        alignItems: 'center' 
                                    }}>
                                        <MaterialIcons name="videocam" size={40} color="#666" />
                                        
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 5 }}>
                                            <TouchableOpacity 
                                                style={{ 
                                                    backgroundColor: '#CB2921', 
                                                    paddingVertical: 8, 
                                                    paddingHorizontal: 12, 
                                                    borderRadius: 5,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginRight: 10
                                                }}
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Vídeo selecionado",
                                                        "O vídeo foi selecionado com sucesso e será enviado quando você clicar em 'Enviar'.",
                                                        [{ text: "OK" }]
                                                    );
                                                }}
                                            >
                                                <MaterialIcons name="check-circle" size={16} color="#fff" />
                                                <Text style={{ color: '#fff', marginLeft: 5 }}>
                                                    Vídeo selecionado
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                                <RemoveButton onPress={() => setVideoOleo(null)}>
                                    <MaterialIcons name="close" size={20} color="#000" />
                                </RemoveButton>
                            </View>
                        ) : <MaterialIcons name="camera-alt" size={110} color="#000" />}
                    </AreaFoto>
                </ButtonFoto>
                <Divider style={{ marginTop: 25, marginBottom: -5 }} />

                <TextPage>
                    Foto dos kms totais da moto após a troca de óleo
                </TextPage>
                <ButtonFoto onPress={() => abrirOpcoes('km')}>
                    <AreaFoto>
                        {fotoKm ? (
                            <View>
                                <Image 
                                    source={{ uri: fotoKm.uri }} 
                                    style={{ width: 364, height: 118 }} 
                                    resizeMode="contain"
                                />
                                <RemoveButton onPress={() => setFotoKm(null)}>
                                    <MaterialIcons name="close" size={20} color="#000" />
                                </RemoveButton>
                            </View>
                        ) : <MaterialIcons name="camera-alt" size={110} color="#000" />}
                    </AreaFoto>
                </ButtonFoto>
                <Divider style={{ marginTop: 25, marginBottom: -5 }} />

                
                <ButtonEnviar onPress={enviarParaFirebase} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#000" />
                    ) : (
                        <TextButtonEnviar>
                            Enviar
                        </TextButtonEnviar>
                    )}
                </ButtonEnviar>

                <ProgressModal 
                    visible={loading}
                    progress={uploadProgress}
                    status={uploadStatus}
                />

                {feedbackVisible && (
                    <View 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 9999
                        }}
                    >
                        <FeedbackModal
                            visible={feedbackVisible}
                            {...feedback}
                            onClose={() => setFeedbackVisible(false)}
                        />
                    </View>
                )}
                
                {/* Modal para opções de escolha de foto */}
                <ImagePickerModal 
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onGalleryPress={() => {
                        setModalVisible(false);
                        abrirGaleria(tipoMidiaAtual);
                    }}
                    onCameraPress={() => {
                        setModalVisible(false);
                        abrirCamera(tipoMidiaAtual);
                    }}
                />
            </ScrollContainerTrocaOleo>
        </Container>
    );
}
