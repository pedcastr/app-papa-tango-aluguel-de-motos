import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../../../../services/firebaseConfig';
import axios from 'axios';
import PdfViewer from '../../../../../components/PdfViewer'


import {
    Container,
    Content,
    Label,
    Input,
    TextArea,
    PickerContainer,
    PickerLabel,
    Picker,
    PickerItem,
    CheckboxContainer,
    CheckboxLabel,
    Checkbox,
    AttachmentContainer,
    AttachmentButton,
    AttachmentButtonText,
    AttachmentPreview,
    RemoveAttachmentButton,
    SendButton,
    SendButtonText,
    LoadingContainer,
    PreviewImage,
    PdfContainer,
    TextAnexos
} from './styles';

export default function BulkMessages() {
    const navigation = useNavigation();

    const [titulo, setTitulo] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [tipoUsuarios, setTipoUsuarios] = useState('todos');
    const [enviarEmail, setEnviarEmail] = useState(true);
    const [enviarNotificacao, setEnviarNotificacao] = useState(true);
    const [imagem, setImagem] = useState(null);
    const [documento, setDocumento] = useState(null);
    const [loading, setLoading] = useState(false);
    const [enviando, setEnviando] = useState(false);

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Função para selecionar imagem da galeria
    const selecionarImagem = async () => {
        try {
            // Solicitar permissão para acessar a galeria
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                showMessage('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
                return;
            }

            // Abrir o seletor de imagens
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, // Permite edição da imagem 
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImagem({
                    uri: result.assets[0].uri,
                    name: 'imagem_' + new Date().getTime() + '.jpg',
                    type: 'image/jpeg'
                });
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            showMessage('Erro', 'Não foi possível selecionar a imagem.');
        }
    };

    // Função para selecionar documento
    const selecionarDocumento = async () => {
        try {
            const resultado = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (resultado.canceled === false && resultado.assets && resultado.assets.length > 0) {
                const pdfAsset = resultado.assets[0];
                if (!pdfAsset.name && pdfAsset.uri) {
                    const uriParts = pdfAsset.uri.split('/');
                    pdfAsset.name = uriParts[uriParts.length - 1] || "documento.pdf";
                }

                setDocumento(pdfAsset);

            }
        } catch (error) {
            console.error('Erro ao selecionar documento:', error);
            showMessage('Erro', 'Não foi possível selecionar o documento.');
        }
    };

    // Função para remover imagem
    const removerImagem = () => {
        setImagem(null);
    };

    // Função para remover documento
    const removerDocumento = () => {
        setDocumento(null);
    };

    // Função para fazer upload de arquivo para o Firebase Storage
    const uploadArquivo = async (arquivo, pasta) => {
        if (!arquivo) return null;

        try {
            // Criar uma referência para o arquivo no Storage
            const storageRef = ref(storage, `${pasta}/${arquivo.name}`);

            // Converter URI para blob
            const response = await fetch(arquivo.uri);
            const blob = await response.blob();

            // Fazer upload do blob
            await uploadBytes(storageRef, blob);

            // Obter URL de download
            const downloadURL = await getDownloadURL(storageRef);

            return downloadURL;
        } catch (error) {
            console.error(`Erro ao fazer upload de ${pasta}:`, error);
            throw error;
        }
    };

    // Função para enviar mensagem em massa
    const enviarMensagem = async () => {
        // Validar campos obrigatórios
        if (!titulo.trim()) {
            showMessage('Campo obrigatório', 'Por favor, informe o título da mensagem.');
            return;
        }

        if (!mensagem.trim()) {
            showMessage('Campo obrigatório', 'Por favor, informe o conteúdo da mensagem.');
            return;
        }

        if (!enviarEmail && !enviarNotificacao) {
            showMessage('Opção obrigatória', 'Selecione pelo menos uma forma de envio (email ou notificação).');
            return;
        }

        try {
            setEnviando(true);

            // Verificar se o usuário está autenticado
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showMessage('Erro', 'Você precisa estar autenticado para enviar mensagens.');
                setEnviando(false);
                return;
            }

            // Renovar o token de autenticação antes de chamar a função
            const idToken = await currentUser.getIdToken(true);

            // Upload de imagem se selecionada
            let imagemUrl = null;
            if (imagem) {
                const imagemRef = ref(storage, `mensagens/${Date.now()}_${imagem.name}`);
                await uploadBytes(imagemRef, await fetch(imagem.uri).then(r => r.blob()));
                imagemUrl = await getDownloadURL(imagemRef);
            }

            // Upload de documento se selecionado
            let documentoUrl = null;
            if (documento) {
                const documentoRef = ref(storage, `documentos/${Date.now()}_${documento.name}`);
                await uploadBytes(documentoRef, await fetch(documento.uri).then(r => r.blob()));
                documentoUrl = await getDownloadURL(documentoRef);
            }

            // Preparar dados para envio
            const dados = {
                titulo,
                mensagem,
                tipoUsuarios,
                enviarEmail,
                enviarNotificacao,
                imagemUrl,
                documentoUrl
            };

            // Chamar a função HTTP
            const response = await axios({
                method: 'post',
                url: 'https://enviarmensagememmassahttp-q3zrn7ctxq-uc.a.run.app',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                data: dados
            });

        } catch (error) {
            console.error('Erro ao enviar mensagens:', error);

            // Extrair mensagem de erro da resposta
            let errorMessage = 'Não foi possível enviar as mensagens.';

            if (error.response && error.response.data) {
                errorMessage = error.response.data.error || error.response.data.message || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showMessage('Erro', errorMessage);
        } finally {
            setEnviando(false);
        }
    };

    if (loading) {
        return (
            <LoadingContainer>
                <ActivityIndicator size="large" color="#CB2921" />
                <Text style={{ marginTop: 10 }}>Carregando...</Text>
            </LoadingContainer>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <Container>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Content>
                        <Label>Título da Mensagem</Label>
                        <Input
                            placeholder="Digite o título"
                            value={titulo}
                            onChangeText={setTitulo}
                        />

                        <Label>Mensagem</Label>
                        <TextArea
                            placeholder="Digite a mensagem que será enviada"
                            value={mensagem}
                            onChangeText={setMensagem}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />

                        <PickerContainer>
                            <PickerLabel>Enviar para:</PickerLabel>
                            <Picker
                                selectedValue={tipoUsuarios}
                                onValueChange={(itemValue) => setTipoUsuarios(itemValue)}
                            >
                                <PickerItem label="Todos os usuários" value="todos" />
                                <PickerItem label="Usuários com contratos ativos" value="contratosAtivos" />
                                <PickerItem label="Usuários com contratos inativos" value="contratosInativos" />
                            </Picker>
                        </PickerContainer>

                        <CheckboxContainer onPress={() => setEnviarEmail(!enviarEmail)}>
                            <Checkbox>
                                {enviarEmail && <Feather name="check" size={16} color="#000" />}
                            </Checkbox>
                            <CheckboxLabel>Enviar por Email</CheckboxLabel>
                        </CheckboxContainer>

                        <CheckboxContainer onPress={() => setEnviarNotificacao(!enviarNotificacao)}>
                            <Checkbox>
                                {enviarNotificacao && <Feather name="check" size={16} color="#000" />}
                            </Checkbox>
                            <CheckboxLabel>Enviar por Notificação Push</CheckboxLabel>
                        </CheckboxContainer>

                        <AttachmentContainer>
                            <Label>Anexos</Label>

                            {!imagem && (
                                <AttachmentButton onPress={selecionarImagem}>
                                    <Feather name="image" size={20} color="#FFF" />
                                    <AttachmentButtonText>Selecionar Imagem</AttachmentButtonText>
                                </AttachmentButton>
                            )}

                            {imagem && (
                                <View style={{ flexDirection: 'column', backgroundColor: '#F5F5F5', marginBottom: 20, borderRadius: 10, marginTop: 10 }}>
                                    <TextAnexos>Imagem</TextAnexos>
                                    <AttachmentPreview>
                                        <PreviewImage source={{ uri: imagem.uri }} resizeMode='contain' />
                                        <RemoveAttachmentButton onPress={removerImagem}>
                                            <Feather name="x" size={20} color="#fff" />
                                        </RemoveAttachmentButton>
                                    </AttachmentPreview>
                                </View>
                            )}

                            {!documento && (
                                <AttachmentButton onPress={selecionarDocumento}>
                                    <Feather name="file" size={20} color="#FFF" />
                                    <AttachmentButtonText>Selecionar Documento PDF</AttachmentButtonText>
                                </AttachmentButton>
                            )}

                            {documento && (
                                <AttachmentPreview style={{ flexDirection: 'column' }}>
                                    <TextAnexos>Documento</TextAnexos>
                                    <PdfContainer>
                                        <PdfViewer
                                            uri={documento.uri}
                                            fileName={documento.name}
                                            onRemove={removerDocumento}
                                        />
                                    </PdfContainer>
                                </AttachmentPreview>
                            )}
                        </AttachmentContainer>

                        <SendButton onPress={enviarMensagem} disabled={enviando}>
                            {enviando ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <SendButtonText>Enviar Mensagem</SendButtonText>
                            )}
                        </SendButton>
                    </Content>
                </ScrollView>
            </Container>
        </KeyboardAvoidingView>
    );
}