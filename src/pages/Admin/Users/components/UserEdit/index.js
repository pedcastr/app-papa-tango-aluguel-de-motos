import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View, ScrollView, Platform } from 'react-native';
import { db, storage } from '../../../../../services/firebaseConfig';
import { doc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';

import {
    Container,
    Form,
    Section,
    SectionTitle,
    InputGroup,
    Label,
    Input,
    Switch,
    Button,
    ButtonText,
    ImagensArquivoCNH,
    PdfContainer,
    FileActionContainer,
    DeleteButton,
    DeleteButtonText,
    UploadButton,
    UploadButtonText,
    SelectionList,
    SelectionItem,
    SelectionItemText,
    SelectionItemEmail,
    SelectButton,
    SelectButtonText,
    SelectedItemContainer,
    SelectedItemTitle,
    SelectedItemDetail,
    Divider
} from './styles';

/**
 * Função para renderizar o visualizador de PDF adequado para a plataforma
 */
const renderPdfViewer = (pdfUrl, height = 300) => {
    const isWeb = Platform.OS === 'web';
    const isWebDesktop = isWeb && window.innerWidth >= 768;
    
    if (isWeb) {
        // Renderiza um iframe para web
        return (
            <View style={{ height: isWebDesktop ? 600 : 300 }}>
                <iframe 
                    src={pdfUrl} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
                    title="PDF Viewer"
                />
            </View>
        );
    } else {
        // Para nativo, usa o Google Docs Viewer
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
        
        return (
            <View style={{ height: 300 }}>
                <WebView
                    source={{ uri: googleDocsUrl }}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                    renderLoading={() => <ActivityIndicator size="large" color="#CB2921" />}
                    startInLoadingState={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('WebView error: ', nativeEvent);
                        Alert.alert(
                            'Erro',
                            'Não foi possível carregar o PDF. Tente abrir externamente.',
                            [
                                { 
                                    text: 'Abrir Externamente', 
                                    onPress: () => Linking.openURL(pdfUrl) 
                                },
                                { text: 'Cancelar', style: 'cancel' }
                            ]
                        );
                    }}
                />
            </View>
        );
    }
};

/**
 * Função para fazer upload de arquivos PDF
 * @param {Object} userData - Dados do usuário
 * @param {string} fileType - Tipo de arquivo ('cnh' ou 'comprovanteEndereco')
 * @param {Function} setUserData - Função para atualizar o estado do usuário
 * @param {Function} setLoading - Função para atualizar o estado de carregamento
 */
const handleUploadPdf = async (userData, fileType, setUserData, setLoading) => {
    try {
        // Usar DocumentPicker para selecionar PDF
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true
        });
        
        if (result.canceled) {
            console.log('Usuário cancelou a seleção do documento');
            return;
        }
        
        if (result.assets && result.assets.length > 0) {
            const selectedPdf = result.assets[0];
            setLoading(true);
            
            // Criar um blob a partir do URI do PDF
            const fileUri = selectedPdf.uri;
            const response = await fetch(fileUri);
            const blob = await response.blob();
            
            // Determinar o caminho e nome do arquivo
            const fileName = `pdf_${Date.now()}.pdf`;
            let storagePath;
            
            // Definir o caminho correto no Storage baseado na estrutura informada
            if (fileType === 'cnh') {
                storagePath = `users/${userData.email}/cnh/${fileName}`;
            } else if (fileType === 'comprovanteEndereco') {
                storagePath = `users/${userData.email}/comprovantes/${fileName}`;
            }
            
            console.log("Fazendo upload de PDF para:", storagePath);
            
            // Upload para o Storage
            const fileRef = ref(storage, storagePath);
            await uploadBytes(fileRef, blob);
            
            // Obter URL do arquivo
            const downloadURL = await getDownloadURL(fileRef);
            console.log("URL do PDF:", downloadURL);
            
            // Preparar dados para atualizar no Firestore
            const fileData = {
                arquivoUrl: downloadURL,
                dataUpload: new Date().toISOString(),
                nome: fileName,
                tipo: 'application/pdf',
                tamanho: selectedPdf.size || 0,
            };
            
            // Atualizar Firestore
            let firestoreUpdate = {};
            if (fileType === 'cnh') {
                firestoreUpdate = { 'cnh.pdf': fileData };
            } else if (fileType === 'comprovanteEndereco') {
                firestoreUpdate = { 'comprovanteEndereco.pdf': fileData };
            }
            
            await updateDoc(doc(db, "users", userData.email), firestoreUpdate);
            console.log("Firestore atualizado com sucesso para PDF");
            
            // Atualizar estado local
            if (fileType === 'cnh') {
                setUserData(prev => ({
                    ...prev,
                    cnh: { ...prev.cnh || {}, pdf: fileData }
                }));
            } else if (fileType === 'comprovanteEndereco') {
                setUserData(prev => ({
                    ...prev,
                    comprovanteEndereco: { ...prev.comprovanteEndereco || {}, pdf: fileData }
                }));
            }
            
            Alert.alert('Sucesso', 'PDF enviado com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao fazer upload do PDF:', error);
        
        // Mensagem de erro mais específica
        if (error.code === 'DOCUMENT_PICKER_CANCELED') {
            console.log('Usuário cancelou a seleção do documento');
        } else {
            Alert.alert('Erro', 'Falha ao enviar PDF. Tente novamente.');
        }
    } finally {
        setLoading(false);
    }
};

/**
 * Função para fazer upload de imagem (CNH frente/verso, Comprovante ou Selfie)
 * @param {Object} userData - Dados do usuário
 * @param {string} fileType - Tipo de arquivo ('cnh', 'comprovanteEndereco' ou 'selfie')
 * @param {string} subType - Subtipo do arquivo ('frente', 'verso', 'arquivo')
 * @param {Function} setUserData - Função para atualizar o estado do usuário
 * @param {Function} setLoading - Função para atualizar o estado de carregamento
 */
const handleUploadImage = async (userData, fileType, subType, setUserData, setLoading) => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaType: 'photo',
            quality: 0.8,
        });
        
        if (result.canceled) return;
        
        if (result.assets && result.assets.length > 0) {
            const selectedImage = result.assets[0];
            setLoading(true);
            
            // Criar um blob a partir do URI da imagem
            const response = await fetch(selectedImage.uri);
            const blob = await response.blob();
            
            // Determinar o caminho e nome do arquivo
            const fileName = `foto_${Date.now()}.jpg`;
            let storagePath;
            
            // Definir o caminho correto no Storage baseado na estrutura informada
            if (fileType === 'cnh') {
                storagePath = `users/${userData.email}/cnh/${fileName}`;
            } else if (fileType === 'comprovanteEndereco') {
                storagePath = `users/${userData.email}/comprovantes/${fileName}`;
            } else if (fileType === 'selfie') {
                storagePath = `users/${userData.email}/selfie/${fileName}`;
            }
            
            console.log("Fazendo upload para:", storagePath);
            
            // Upload para o Storage
            const fileRef = ref(storage, storagePath);
            await uploadBytes(fileRef, blob);
            
            // Obter URL do arquivo
            const downloadURL = await getDownloadURL(fileRef);
            console.log("URL do arquivo:", downloadURL);
            
            // Preparar dados para atualizar no Firestore
            const fileData = {
                arquivoUrl: downloadURL,
                dataUpload: new Date().toISOString(),
                nome: fileName,
                tipo: selectedImage.type || 'image/jpeg',
            };
            
            // Atualizar Firestore
            let firestoreUpdate = {};
            if (fileType === 'cnh') {
                if (subType === 'frente') {
                    firestoreUpdate = { 'cnh.frente': fileData };
                } else if (subType === 'verso') {
                    firestoreUpdate = { 'cnh.verso': fileData };
                }
            } else if (fileType === 'comprovanteEndereco') {
                firestoreUpdate = { 'comprovanteEndereco.arquivo': fileData };
            } else if (fileType === 'selfie') {
                firestoreUpdate = { 'selfie': fileData };
            }
            
            await updateDoc(doc(db, "users", userData.email), firestoreUpdate);
            console.log("Firestore atualizado com sucesso");
            
            // Atualizar estado local
            if (fileType === 'cnh') {
                if (subType === 'frente') {
                    setUserData(prev => ({
                        ...prev,
                        cnh: { ...prev.cnh || {}, frente: fileData }
                    }));
                } else if (subType === 'verso') {
                    setUserData(prev => ({
                        ...prev,
                        cnh: { ...prev.cnh || {}, verso: fileData }
                    }));
                }
            } else if (fileType === 'comprovanteEndereco') {
                setUserData(prev => ({
                    ...prev,
                    comprovanteEndereco: { ...prev.comprovanteEndereco || {}, arquivo: fileData }
                }));
            } else if (fileType === 'selfie') {
                setUserData(prev => ({
                    ...prev,
                    selfie: fileData
                }));
            }
            
            Alert.alert('Sucesso', 'Arquivo enviado com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        Alert.alert('Erro', 'Falha ao enviar arquivo. Tente novamente.');
    } finally {
        setLoading(false);
    }
};

/**
 * Função para excluir arquivo
 * @param {Object} userData - Dados do usuário
 * @param {string} fileType - Tipo de arquivo ('cnh', 'comprovanteEndereco' ou 'selfie')
 * @param {string} subType - Subtipo do arquivo ('frente', 'verso', 'pdf', 'arquivo')
 * @param {Function} setUserData - Função para atualizar o estado do usuário
 * @param {Function} setLoading - Função para atualizar o estado de carregamento
 */
const handleDeleteFile = async (userData, fileType, subType, setUserData, setLoading) => {
    
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

    showConfirmation(
        'Confirmação',
        'Tem certeza que deseja excluir este arquivo?',
        async () => {
            try {
                setLoading(true);
                
                // Determinar o campo no Firestore e obter os dados do arquivo
                let firestoreUpdate = {};
                let fileData = null;
                
                // Obter os dados do arquivo
                if (fileType === 'cnh') {
                    if (subType === 'frente' && userData.cnh?.frente) {
                        fileData = userData.cnh.frente;
                        firestoreUpdate = { 'cnh.frente': null };
                    } else if (subType === 'verso' && userData.cnh?.verso) {
                        fileData = userData.cnh.verso;
                        firestoreUpdate = { 'cnh.verso': null };
                    } else if (subType === 'pdf' && userData.cnh?.pdf) {
                        fileData = userData.cnh.pdf;
                        firestoreUpdate = { 'cnh.pdf': null };
                    }
                } else if (fileType === 'comprovanteEndereco') {
                    if (subType === 'arquivo' && userData.comprovanteEndereco?.arquivo) {
                        fileData = userData.comprovanteEndereco.arquivo;
                        firestoreUpdate = { 'comprovanteEndereco.arquivo': null };
                    } else if (subType === 'pdf' && userData.comprovanteEndereco?.pdf) {
                        fileData = userData.comprovanteEndereco.pdf;
                        firestoreUpdate = { 'comprovanteEndereco.pdf': null };
                    }
                } else if (fileType === 'selfie' && userData.selfie) {
                    fileData = userData.selfie;
                    firestoreUpdate = { 'selfie': null };
                }
                
                // Primeiro, atualizar o Firestore para remover a referência
                await updateDoc(doc(db, "users", userData.email), firestoreUpdate);
                console.log("Referência removida do Firestore");
                
                // Atualizar estado local
                updateLocalState();
                
                // Tentar excluir do Storage usando a URL diretamente
                if (fileData && fileData.arquivoUrl) {
                    try {
                        if (Platform.OS === 'web') {
                            // Abordagem específica para web
                            const urlString = fileData.arquivoUrl;
                            const match = urlString.match(/\/o\/([^?]+)/);
                            
                            if (match && match[1]) {
                                const path = decodeURIComponent(match[1]);
                                console.log("Tentando excluir arquivo na web com caminho:", path);
                                
                                const fileRef = ref(storage, path);
                                await deleteObject(fileRef);
                                console.log("Arquivo excluído com sucesso do Storage na web");
                            } else {
                                throw new Error("Não foi possível extrair o caminho da URL");
                            }
                        } else {
                            // Abordagem para plataformas nativas
                            const urlString = fileData.arquivoUrl;
                            const fileRef = ref(storage, refFromURL(urlString));
                            await deleteObject(fileRef);
                            console.log("Arquivo excluído com sucesso do Storage usando referência da URL");
                        }
                    } catch (urlError) {
                        console.error("Erro ao excluir usando referência da URL:", urlError);
                        
                        // Se falhar, tentar múltiplas abordagens para construir o caminho
                        await tryMultipleDeleteApproaches(userData, fileType, subType, fileData);
                    }
                } else {
                    showMessage('Aviso', 'Não foi possível encontrar a URL do arquivo. O registro foi removido do banco de dados.');
                }
                
                showMessage('Sucesso', 'Arquivo excluído com sucesso do banco de dados!');
            } catch (error) {
                console.error('Erro ao excluir arquivo:', error);
                showMessage('Erro', 'Falha ao excluir arquivo. O registro foi removido do banco de dados, mas o arquivo pode ainda existir no armazenamento.');
            } finally {
                setLoading(false);
            }
        }
    );

    
    // Função para tentar múltiplas abordagens de exclusão
    async function tryMultipleDeleteApproaches(userData, fileType, subType, fileData) {
        const approaches = [];
        
        // Abordagem 1: Usando o nome do arquivo diretamente
        if (fileData.nome) {
            let path1;
            if (fileType === 'cnh') {
                path1 = `users/${userData.email}/cnh/${fileData.nome}`;
            } else if (fileType === 'comprovanteEndereco') {
                path1 = `users/${userData.email}/comprovantes/${fileData.nome}`;
            } else if (fileType === 'selfie') {
                path1 = `users/${userData.email}/selfie/${fileData.nome}`;
            }
            approaches.push(path1);
        }
        
        // Abordagem 2: Extrair nome do arquivo da URL
        if (fileData.arquivoUrl) {
            const urlParts = fileData.arquivoUrl.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            
            let path2;
            if (fileType === 'cnh') {
                path2 = `users/${userData.email}/cnh/${fileName}`;
            } else if (fileType === 'comprovanteEndereco') {
                path2 = `users/${userData.email}/comprovantes/${fileName}`;
            } else if (fileType === 'selfie') {
                path2 = `users/${userData.email}/selfie/${fileName}`;
            }
            approaches.push(path2);
        }
        
        // Abordagem 3: Tentar extrair o caminho completo da URL
        if (fileData.arquivoUrl) {
            const urlString = fileData.arquivoUrl;
            const match = urlString.match(/\/o\/([^?]+)/);
            if (match && match[1]) {
                const path3 = decodeURIComponent(match[1]);
                approaches.push(path3);
            }
        }
        
        // Abordagem 4: Para PDFs, tentar com extensão .pdf se não estiver presente
        if ((subType === 'pdf' || fileData.tipo === 'application/pdf') && fileData.nome && !fileData.nome.endsWith('.pdf')) {
            let path4;
            if (fileType === 'cnh') {
                path4 = `users/${userData.email}/cnh/${fileData.nome}.pdf`;
            } else if (fileType === 'comprovanteEndereco') {
                path4 = `users/${userData.email}/comprovantes/${fileData.nome}.pdf`;
            }
            approaches.push(path4);
        }
        
        // Tentar cada abordagem
        let success = false;
        for (const path of approaches) {
            try {
                console.log("Tentando excluir arquivo do Storage com caminho:", path);
                const fileRef = ref(storage, path);
                await deleteObject(fileRef);
                console.log("Arquivo excluído com sucesso do Storage:", path);
                success = true;
                break; // Sair do loop se uma abordagem funcionar
            } catch (error) {
                console.error(`Erro ao excluir com caminho ${path}:`, error);
            }
        }
        
        if (!success) {
            console.log("Nenhuma abordagem de exclusão funcionou. Arquivos podem precisar ser limpos manualmente.");
        }
    }
    
    // Função para extrair referência de URL do Firebase Storage
    function refFromURL(url) {
        try {
            // Tentar extrair o caminho da URL do Firebase Storage
            const match = url.match(/\/o\/([^?]+)/);
            if (match && match[1]) {
                return decodeURIComponent(match[1]);
            }
            throw new Error("Não foi possível extrair o caminho da URL");
        } catch (error) {
            console.error("Erro ao extrair referência da URL:", error);
            throw error;
        }
    }
    
    // Função interna para atualizar o estado local
    function updateLocalState() {
        if (fileType === 'cnh') {
            if (subType === 'frente') {
                setUserData(prev => ({
                    ...prev,
                    cnh: { ...prev.cnh, frente: null }
                }));
            } else if (subType === 'verso') {
                setUserData(prev => ({
                    ...prev,
                    cnh: { ...prev.cnh, verso: null }
                }));
            } else if (subType === 'pdf') {
                setUserData(prev => ({
                    ...prev,
                    cnh: { ...prev.cnh, pdf: null }
                }));
            }
        } else if (fileType === 'comprovanteEndereco') {
            if (subType === 'arquivo') {
                setUserData(prev => ({
                    ...prev,
                    comprovanteEndereco: { ...prev.comprovanteEndereco, arquivo: null }
                }));
            } else if (subType === 'pdf') {
                setUserData(prev => ({
                    ...prev,
                    comprovanteEndereco: { ...prev.comprovanteEndereco, pdf: null }
                }));
            }
        } else if (fileType === 'selfie') {
            setUserData(prev => ({
                ...prev,
                selfie: null
            }));
        }
    }
};

/**
 * Componente principal para edição de usuários
 * @param {Object} route - Objeto de rota com parâmetros
 * @param {Object} navigation - Objeto de navegação
 */
export default function UserEdit({ route, navigation }) {
    const { user } = route.params;
    const [userData, setUserData] = useState(user);
    const [loading, setLoading] = useState(false);
    
    // Novos estados para as listas
    const [motos, setMotos] = useState([]);
    const [alugueis, setAlugueis] = useState([]);
    const [contratos, setContratos] = useState([]);
    
    // Estados para controlar a exibição das listas
    const [showMotosList, setShowMotosList] = useState(false);
    const [showAluguelsList, setShowAluguelsList] = useState(false);
    const [showContratosList, setShowContratosList] = useState(false);
    
    // Estados para armazenar os itens selecionados
    const [selectedMoto, setSelectedMoto] = useState(null);
    const [selectedAluguel, setSelectedAluguel] = useState(null);
    const [selectedContrato, setSelectedContrato] = useState(null);
    
    // Função para carregar os dados das coleções
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Carregar motos
                const motosQuery = query(collection(db, "motos"), orderBy("marca"));
                const motosSnapshot = await getDocs(motosQuery);
                const motosData = motosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMotos(motosData);
                
                // Carregar aluguéis
                const alugueisQuery = query(collection(db, "alugueis"));
                const alugueisSnapshot = await getDocs(alugueisQuery);
                const alugueisData = alugueisSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAlugueis(alugueisData);
                
                // Carregar contratos
                const contratosQuery = query(collection(db, "contratos"));
                const contratosSnapshot = await getDocs(contratosQuery);
                const contratosData = contratosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setContratos(contratosData);
                
                // Definir os itens selecionados com base nos dados do usuário
                if (userData.motoAlugadaId) {
                    const moto = motosData.find(m => m.id === userData.motoAlugadaId);
                    if (moto) setSelectedMoto(moto);
                }
                
                if (userData.aluguelAtivoId) {
                    const aluguel = alugueisData.find(a => a.id === userData.aluguelAtivoId);
                    if (aluguel) setSelectedAluguel(aluguel);
                }
                
                if (userData.contratoId) {
                    const contrato = contratosData.find(c => c.id === userData.contratoId);
                    if (contrato) setSelectedContrato(contrato);
                }
                
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                Alert.alert("Erro", "Não foi possível carregar todos os dados necessários.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);
    
    // Funções para selecionar itens das listas
    const handleSelectMoto = (moto) => {
        setSelectedMoto(moto);
        setUserData(prev => ({
            ...prev,
            motoAlugadaId: moto.id
        }));
        setShowMotosList(false);
    };
    
    const handleSelectAluguel = (aluguel) => {
        setSelectedAluguel(aluguel);
        setUserData(prev => ({
            ...prev,
            aluguelAtivoId: aluguel.id
        }));
        setShowAluguelsList(false);
    };
    
    const handleSelectContrato = (contrato) => {
        setSelectedContrato(contrato);
        setUserData(prev => ({
            ...prev,
            contratoId: contrato.id
        }));
        setShowContratosList(false);
    };
    
    // Função para limpar seleção
    const handleClearSelection = (type) => {
        if (type === 'moto') {
            setSelectedMoto(null);
            setUserData(prev => ({
                ...prev,
                motoAlugadaId: '',
                motoAlugada: false
            }));
        } else if (type === 'aluguel') {
            setSelectedAluguel(null);
            setUserData(prev => ({
                ...prev,
                aluguelAtivoId: ''
            }));
        } else if (type === 'contrato') {
            setSelectedContrato(null);
            setUserData(prev => ({
                ...prev,
                contratoId: ''
            }));
        }
    };

    // Função para identificar se o dispositivo é um dispositivo móvel ou um desktop
    const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;
    
    /**
     * Função para excluir usuário
     */
    const handleDeleteUser = () => {
        Alert.alert(
            'Confirmação',
            'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sim, excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            
                            // Chamar Cloud Function para excluir usuário
                            const functions = getFunctions();
                            const deleteUserFunction = httpsCallable(functions, 'deleteUser');
                            
                            await deleteUserFunction({ email: userData.email });
                            
                            Alert.alert('Sucesso', 'Usuário excluído com sucesso!');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Erro ao excluir usuário:', error);
                            Alert.alert('Erro', 'Falha ao excluir usuário. Tente novamente.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };
    
    /**
     * Função para atualizar dados do usuário
     */
    const handleUpdate = async () => {
        try {
            setLoading(true);
            
            // Preparar os dados para atualização
            const updateData = {
                ...userData,
                // Garantir que os IDs sejam atualizados corretamente
                motoAlugadaId: selectedMoto ? selectedMoto.id : '',
                aluguelAtivoId: selectedAluguel ? selectedAluguel.id : '',
                contratoId: selectedContrato ? selectedContrato.id : '',
            };
            
            // Se não tiver moto selecionada, garantir que motoAlugada seja false
            if (!selectedMoto) {
                updateData.motoAlugada = false;
            }
            
            await updateDoc(doc(db, "users", userData.email), updateData);
            
            Alert.alert('Sucesso', 'Usuário atualizado com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            Alert.alert('Erro', 'Falha ao atualizar usuário');
        } finally {
            setLoading(false);
        }
    };
    
    // Renderização do componente
    return (
        <Container>
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
                    <Section>
                        <SectionTitle style={{marginBottom: 25}}>Informações de Locação</SectionTitle>
                        <InputGroup style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <Label>Tem moto alugada?</Label>
                            <Switch
                                value={userData.motoAlugada}
                                onValueChange={(value) => setUserData(prev => ({...prev, motoAlugada: value}))}
                                trackColor={{ false: '#767577', true: '#CB2921' }}
                                thumbColor={userData.motoAlugada ? '#CB2921' : '#767577'}
                            />
                        </InputGroup>

                    {/* Seleção de Moto */}
                    <InputGroup>
                            <Label>Qual a moto alugada?</Label>
                            {selectedMoto ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>{selectedMoto.marca} {selectedMoto.modelo}</SelectedItemTitle>
                                    <SelectedItemDetail>Placa: {selectedMoto.placa} | Ano: {selectedMoto.anoModelo}</SelectedItemDetail>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                        <SelectButton onPress={() => setShowMotosList(!showMotosList)} style={{ flex: 1, marginRight: 5 }}>
                                            <SelectButtonText>Trocar Moto</SelectButtonText>
                                        </SelectButton>
                                        <DeleteButton onPress={() => handleClearSelection('moto')} style={{ flex: 1, marginLeft: 5 }}>
                                            <DeleteButtonText>Remover</DeleteButtonText>
                                        </DeleteButton>
                                    </View>
                                </SelectedItemContainer>
                            ) : (
                                <SelectButton onPress={() => setShowMotosList(!showMotosList)}>
                                    <SelectButtonText>Selecionar Moto</SelectButtonText>
                                </SelectButton>
                            )}
                            
                            {showMotosList && (
                                <SelectionList>
                                    {motos.map((moto) => (
                                        <SelectionItem 
                                            key={moto.id} 
                                            onPress={() => handleSelectMoto(moto)}
                                            available={moto.disponivel}
                                        >
                                            <SelectionItemText>{moto.marca} {moto.modelo}</SelectionItemText>
                                            <SelectionItemEmail>Placa: {moto.placa} | Ano: {moto.anoModelo}</SelectionItemEmail>
                                        </SelectionItem>
                                    ))}
                                </SelectionList>
                            )}
                        </InputGroup>
                        
                        {/* Seleção de Aluguel */}
                        <InputGroup>
                            <Label>Qual o aluguel?</Label>
                            {selectedAluguel ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>Aluguel: {selectedAluguel.id}</SelectedItemTitle>
                                    <SelectedItemDetail>
                                        Mensal: R$ {selectedAluguel.valorMensal} | Semanal: R$ {selectedAluguel.valorSemanal} | Caução: R$ {selectedAluguel.valorCaucao}
                                    </SelectedItemDetail>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                        <SelectButton onPress={() => setShowAluguelsList(!showAluguelsList)} style={{ flex: 1, marginRight: 5 }}>
                                            <SelectButtonText>Trocar Aluguel</SelectButtonText>
                                        </SelectButton>
                                        <DeleteButton onPress={() => handleClearSelection('aluguel')} style={{ flex: 1, marginLeft: 5 }}>
                                            <DeleteButtonText>Remover</DeleteButtonText>
                                        </DeleteButton>
                                    </View>
                                </SelectedItemContainer>
                            ) : (
                                <SelectButton onPress={() => setShowAluguelsList(!showAluguelsList)}>
                                    <SelectButtonText>Selecionar Aluguel</SelectButtonText>
                                </SelectButton>
                            )}
                            
                            {showAluguelsList && (
                                <SelectionList>
                                    {alugueis
                                        .filter(aluguel => !selectedMoto || aluguel.motoId === selectedMoto.id)
                                        .map((aluguel) => (
                                            <SelectionItem 
                                                key={aluguel.id} 
                                                onPress={() => handleSelectAluguel(aluguel)}
                                            >
                                                <SelectionItemText>Aluguel: {aluguel.id}</SelectionItemText>
                                                <SelectionItemEmail>
                                                    Mensal: R$ {aluguel.valorMensal} | Semanal: R$ {aluguel.valorSemanal}
                                                </SelectionItemEmail>
                                            </SelectionItem>
                                        ))
                                    }
                                </SelectionList>
                            )}
                        </InputGroup>
                        
                        {/* Seleção de Contrato */}
                        <InputGroup>
                            <Label>Qual o contrato?</Label>
                            {selectedContrato ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>Contrato: {selectedContrato.id}</SelectedItemTitle>
                                    <SelectedItemDetail>
                                        Cliente: {selectedContrato.cliente} | Meses: {selectedContrato.mesesContratados}
                                    </SelectedItemDetail>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                        <SelectButton onPress={() => setShowContratosList(!showContratosList)} style={{ flex: 1, marginRight: 5 }}>
                                            <SelectButtonText>Trocar Contrato</SelectButtonText>
                                        </SelectButton>
                                        <DeleteButton onPress={() => handleClearSelection('contrato')} style={{ flex: 1, marginLeft: 5 }}>
                                            <DeleteButtonText>Remover</DeleteButtonText>
                                        </DeleteButton>
                                    </View>
                                </SelectedItemContainer>
                            ) : (
                                <SelectButton onPress={() => setShowContratosList(!showContratosList)}>
                                    <SelectButtonText>Selecionar Contrato</SelectButtonText>
                                </SelectButton>
                            )}
                            
                            {showContratosList && (
                                <SelectionList>
                                    {contratos
                                        .filter(contrato => 
                                            (!selectedAluguel || contrato.aluguelId === selectedAluguel.id) &&
                                            (!selectedMoto || contrato.motoId === selectedMoto.id)
                                        )
                                        .map((contrato) => (
                                            <SelectionItem 
                                                key={contrato.id} 
                                                onPress={() => handleSelectContrato(contrato)}
                                            >
                                                <SelectionItemText>Contrato: {contrato.id}</SelectionItemText>
                                                <SelectionItemEmail>
                                                    Cliente: {contrato.cliente} | Meses: {contrato.mesesContratados}
                                                </SelectionItemEmail>
                                            </SelectionItem>
                                            ))
                                            }
                                </SelectionList>
                            )}
                        </InputGroup>
                    </Section>
                    
                    <Section>
                        <SectionTitle style={{marginBottom: 25}}>Informações Pessoais</SectionTitle>
                        <InputGroup>
                            <Label>Como deseja ser chamado</Label>
                            <Input
                                value={userData.nome}
                                onChangeText={(text) => setUserData(prev => ({...prev, nome: text}))}
                                autoCapitalize="words"
                                editable={false} // Como deseja ser chamado não é editável
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Nome Completo</Label>
                            <Input
                                value={userData.nomeCompleto}
                                onChangeText={(text) => setUserData(prev => ({...prev, nomeCompleto: text}))}
                                autoCapitalize="words"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Telefone</Label>
                            <Input
                                value={userData.telefone}
                                onChangeText={(text) => setUserData(prev => ({...prev, telefone: text}))}
                                keyboardType="numeric"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>CPF</Label>
                            <Input
                                value={userData.cpf}
                                onChangeText={(text) => setUserData(prev => ({...prev, cpf: text}))}
                                keyboardType="numeric"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Email</Label>
                            <Input
                                value={userData.email}
                                onChangeText={(text) => setUserData(prev => ({...prev, email: text}))}
                                keyboardType="email-address"
                                editable={false} // Email não é editável
                            />
                        </InputGroup>
                    </Section>

                    <Section>
                        <SectionTitle style={{marginBottom: 25}}>Informações Residenciais</SectionTitle>
                        <InputGroup>
                            <Label>CEP</Label>
                            <Input
                                value={userData.endereco?.cep}
                                onChangeText={(text) => setUserData(prev => ({
                                    ...prev,
                                    endereco: {
                                        ...prev.endereco,
                                        cep: text
                                    }
                                }))}
                                keyboardType="numeric"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Logradouro</Label>
                            <Input
                                value={userData.endereco?.logradouro}
                                onChangeText={(text) => setUserData(prev => ({
                                    ...prev,
                                    endereco: {
                                        ...prev.endereco,
                                        logradouro: text
                                    }
                                }))}
                                autoCapitalize="words"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Número</Label>
                            <Input
                                value={userData.endereco?.numero}
                                onChangeText={(text) => setUserData(prev => ({
                                    ...prev,
                                    endereco: {
                                        ...prev.endereco,
                                        numero: text
                                    }
                                }))}
                                keyboardType="numeric"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Bairro</Label>
                            <Input
                                value={userData.endereco?.bairro}
                                onChangeText={(text) => setUserData(prev => ({
                                    ...prev,
                                    endereco: {
                                        ...prev.endereco,
                                        bairro: text
                                    }
                                }))}
                                autoCapitalize="words"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Cidade</Label>
                            <Input
                            value={userData.endereco?.cidade}
                            onChangeText={(text) => setUserData(prev => ({
                                ...prev,
                                endereco: {
                                    ...prev.endereco,
                                    cidade: text
                                }
                            }))}
                            autoCapitalize="words"
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Estado</Label>
                        <Input
                            value={userData.endereco?.estado}
                            onChangeText={(text) => setUserData(prev => ({
                                ...prev,
                                endereco: {
                                    ...prev.endereco,
                                    estado: text
                                }
                            }))}
                            autoCapitalize="words"
                        />
                    </InputGroup>
                </Section>
                {/* Seção de CNH */}
                <Section>
                    <SectionTitle style={{textAlign: 'center', color: '#CB2921', marginBottom: 30, fontSize: 22}}>Documentos - CNH</SectionTitle>
                    
                    {/* CNH - Frente */}
                    {userData.cnh?.frente ? (
                        <>
                            <SectionTitle>Foto Frente da CNH</SectionTitle>
                            <ImagensArquivoCNH
                                source={{uri: userData.cnh.frente.arquivoUrl}}
                                resizeMode='contain'
                            />
                            <FileActionContainer>
                                <DeleteButton onPress={() => handleDeleteFile(userData, 'cnh', 'frente', setUserData, setLoading)}>
                                    <DeleteButtonText>Excluir Foto</DeleteButtonText>
                                </DeleteButton>
                            </FileActionContainer>
                        </>
                    ) : (
                        <FileActionContainer>
                            <UploadButton onPress={() => handleUploadImage(userData, 'cnh', 'frente', setUserData, setLoading)}>
                                <UploadButtonText>Fazer Upload da Frente da CNH (Foto)</UploadButtonText>
                            </UploadButton>
                        </FileActionContainer>
                    )}
                    
                    {/* CNH - Verso */}
                    {userData.cnh?.verso ? (
                        <>
                            <SectionTitle>Foto Verso da CNH</SectionTitle>
                            <ImagensArquivoCNH
                                source={{uri: userData.cnh.verso.arquivoUrl}}
                                resizeMode='contain'
                            />
                            <FileActionContainer>
                                <DeleteButton onPress={() => handleDeleteFile(userData, 'cnh', 'verso', setUserData, setLoading)}>
                                    <DeleteButtonText>Excluir Foto</DeleteButtonText>
                                </DeleteButton>
                            </FileActionContainer>
                        </>
                    ) : (
                        <FileActionContainer>
                            <UploadButton onPress={() => handleUploadImage(userData, 'cnh', 'verso', setUserData, setLoading)}>
                                <UploadButtonText>Fazer Upload do Verso da CNH (Foto)</UploadButtonText>
                            </UploadButton>
                        </FileActionContainer>
                    )}
                    
                    {/* CNH - PDF */}
                    {userData.cnh?.pdf ? (
                        <>
                            <SectionTitle>Arquivo PDF da CNH</SectionTitle>
                            <PdfContainer>
                                {renderPdfViewer(userData.cnh.pdf.arquivoUrl)}
                            </PdfContainer>
                            <FileActionContainer style={{ marginTop: isWebDesktop ? 0 : -180}}>
                                <DeleteButton onPress={() => handleDeleteFile(userData, 'cnh', 'pdf', setUserData, setLoading)}>
                                    <DeleteButtonText>Excluir PDF</DeleteButtonText>
                                </DeleteButton>
                            </FileActionContainer>
                        </>
                    ) : (
                        <FileActionContainer>
                            <UploadButton onPress={() => handleUploadPdf(userData, 'cnh', setUserData, setLoading)}>
                                <UploadButtonText>Fazer Upload da CNH (PDF)</UploadButtonText>
                            </UploadButton>
                        </FileActionContainer>
                    )}
                </Section>
                {/* Seção de Comprovante de Endereço */}
                <Section>
                    <SectionTitle style={{textAlign: 'center', color: '#CB2921', marginBottom: 30, fontSize: 22}}>Documentos - Comprovante de Endereço</SectionTitle>
                    
                    {/* Comprovante de Endereço - Imagem */}
                    {userData.comprovanteEndereco?.arquivo ? (
                        <>
                            <SectionTitle>Foto do Comprovante</SectionTitle>
                            <ImagensArquivoCNH
                                source={{uri: userData.comprovanteEndereco.arquivo.arquivoUrl}}
                                resizeMode='contain'
                            />
                            <FileActionContainer>
                                <DeleteButton onPress={() => handleDeleteFile(userData, 'comprovanteEndereco', 'arquivo', setUserData, setLoading)}>
                                    <DeleteButtonText>Excluir Foto</DeleteButtonText>
                                </DeleteButton>
                            </FileActionContainer>
                        </>
                    ) : (
                        <FileActionContainer>
                            <UploadButton onPress={() => handleUploadImage(userData, 'comprovanteEndereco', 'arquivo', setUserData, setLoading)}>
                                <UploadButtonText>Fazer Upload de Comprovante (Foto)</UploadButtonText>
                            </UploadButton>
                        </FileActionContainer>
                    )}
                    
                    {/* Comprovante de Endereço - PDF */}
                    {userData.comprovanteEndereco?.pdf ? (
                        <>
                            <SectionTitle>Arquivo PDF do Comprovante</SectionTitle>
                            <PdfContainer>
                                {renderPdfViewer(userData.comprovanteEndereco.pdf.arquivoUrl)}
                            </PdfContainer>
                            <FileActionContainer style={{ marginTop: isWebDesktop ? 0 : -180}}>
                                <DeleteButton onPress={() => handleDeleteFile(userData, 'comprovanteEndereco', 'pdf', setUserData, setLoading)}>
                                    <DeleteButtonText>Excluir PDF</DeleteButtonText>
                                </DeleteButton>
                            </FileActionContainer>
                        </>
                    ) : (
                        <FileActionContainer>
                            <UploadButton onPress={() => handleUploadPdf(userData, 'comprovanteEndereco', setUserData, setLoading)}>
                                <UploadButtonText>Fazer Upload de Comprovante (PDF)</UploadButtonText>
                            </UploadButton>
                        </FileActionContainer>
                    )}
                </Section>
                {/* Seção de Selfie */}
                <Section>
                    <SectionTitle style={{textAlign: 'center', color: '#CB2921', marginBottom: 30, fontSize: 22}}>Selfie Com a CNH</SectionTitle>
                    
                    {userData.selfie ? (
                        <>
                            <ImagensArquivoCNH
                                source={{uri: userData.selfie.arquivoUrl}}
                                style={{ borderRadius: 10, width: 200, height: 200, alignSelf: 'center' }}
                                resizeMode='contain'
                            />
                            <FileActionContainer>
                                <DeleteButton onPress={() => handleDeleteFile(userData, 'selfie', null, setUserData, setLoading)}>
                                    <DeleteButtonText>Excluir Foto</DeleteButtonText>
                                </DeleteButton>
                            </FileActionContainer>
                        </>
                    ) : (
                        <FileActionContainer>
                            <UploadButton onPress={() => handleUploadImage(userData, 'selfie', null, setUserData, setLoading)}>
                                <UploadButtonText>Fazer Upload de Selfie com a CNH</UploadButtonText>
                            </UploadButton>
                        </FileActionContainer>
                    )}
                </Section>
                {/* Seção de Status */}
                <Section>
                    <SectionTitle style={{textAlign: 'left'}}>Status</SectionTitle>
                    <InputGroup style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Label>Aprovado</Label>
                        <Switch
                            value={userData.aprovado}
                            onValueChange={(value) => setUserData(prev => ({...prev, aprovado: value}))}
                            trackColor={{ false: '#767577', true: '#CB2921' }}
                            thumbColor={userData.aprovado ? '#CB2921' : '#767577'}
                        />
                    </InputGroup>
                </Section>
                {/* Botões de Ação */}
                <Button onPress={handleUpdate}>
                    <ButtonText>Salvar Alterações</ButtonText>
                </Button>
                
                <Button onPress={handleDeleteUser} style={{ backgroundColor: '#FF3B30', marginTop: 10 }}>
                    <ButtonText>Excluir Usuário</ButtonText>
                </Button>
            </Form>
        </ScrollView>
    </Container>
);
}
