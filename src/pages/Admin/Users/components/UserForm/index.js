import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Keyboard } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import PdfViewer from '../../../../../components/PdfViewerAdmin';
import { storage, db } from '../../../../../services/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import Constants from 'expo-constants';
import { FeedbackModal } from '../../../../../components/FeedbackModal';
import ProgressModal from '../../../../../components/ProgressModal';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../../../services/api';
import {
    Container,
    Form,
    Section,
    SectionTitle,
    InputGroup,
    Label,
    Input,
    DocumentSection,
    UploadButton,
    UploadButtonText,
    DocumentPreview,
    DocumentPreviewImage,
    RemoveButton,
    PdfContainer,
    SubmitButton,
    SubmitButtonText,
} from './styles';

export default function UserForm({ navigation }) {
    const auth = getAuth();

    const [formData, setFormData] = useState({
        nome: '',
        nomeCompleto: '',
        cpf: '',
        dataNascimento: '',
        email: '',
        telefone: '',
        senha: '',
        endereco: {
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
        },

        cnh: {
            frente: null,
            verso: null,
            pdf: null
        },
        comprovanteEndereco: {
            arquivo: null,
            pdf: null
        },
        selfie: null
    });

    const [localFiles, setLocalFiles] = useState({
        cnh: {
            frente: null,
            verso: null,
            pdf: null
        },
        comprovanteEndereco: {
            arquivo: null,
            pdf: null
        },
        selfie: null
    });

    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', title: '', message: '' });
    const [pdfUriCnh, setPdfUriCnh] = useState(null); // Armazena a URI local do PDF da CNH para visualização.
    const [pdfUriComprovante, setPdfUriComprovante] = useState(null); // Armazena a URI local do PDF do comprovante de endereço para visualização.

    // Estados para o modal de progresso
    const [loadingVisible, setLoadingVisible] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('Iniciando cadastro...');
    const [loadingCep, setLoadingCep] = useState(false);

    const buscarCep = async (cep) => {
        Keyboard.dismiss();
        if (cep.length !== 8) return;

        try {
            setLoadingCep(true);
            const response = await api.get(`${cep}/json`);

            if (response.data.erro) {
                setFeedback({
                    type: 'error',
                    title: 'CEP não encontrado',
                    message: 'O CEP informado não foi encontrado'
                });
                setFeedbackVisible(true);
                return;
            }

            setFormData(prev => ({
                ...prev,
                endereco: {
                    ...prev.endereco,
                    logradouro: response.data.logradouro,
                    bairro: response.data.bairro,
                    cidade: response.data.localidade,
                    estado: response.data.uf,
                    cep: cep
                }
            }));
        } catch (error) {
            console.log('Erro ao buscar CEP:', error);
            setFeedback({
                type: 'error',
                title: 'Erro na busca',
                message: 'Não foi possível buscar o endereço pelo CEP'
            });
            setFeedbackVisible(true);
        } finally {
            setLoadingCep(false);
        }
    };

    const handleUploadDocument = async (type, isPDF = false) => {
        try {
            let result;
            // Upload de PDF
            if (isPDF) {
                result = await DocumentPicker.getDocumentAsync({
                    type: 'application/pdf',
                    copyToCacheDirectory: true,
                });

                // Pega o arquivo PDF selecionado
                const file = result.assets ? result.assets[0] : result;
                const localUri = file.uri;

                // Atualiza o estado do preview do PDF baseado no tipo
                if (type === 'cnh') {
                    setPdfUriCnh(localUri);
                    // Armazena localmente para upload posterior
                    setLocalFiles(prev => ({
                        ...prev,
                        cnh: {
                            ...prev.cnh,
                            pdf: {
                                uri: localUri,
                                name: file.name,
                                type: file.mimeType || 'application/pdf'
                            }
                        }
                    }));

                    setFormData(prev => ({
                        ...prev,
                        cnh: {
                            ...prev.cnh,
                            pdf: {
                                arquivoUrl: localUri,
                                dataUpload: new Date().toISOString(),
                                tipo: file.mimeType || 'application/pdf',
                                nome: file.name
                            }
                        }
                    }));

                } else if (type === 'comprovantes') {
                    setPdfUriComprovante(localUri);
                    // Armazena localmente para upload posterior
                    setLocalFiles(prev => ({
                        ...prev,
                        comprovanteEndereco: {
                            ...prev.comprovanteEndereco,
                            pdf: {
                                uri: localUri,
                                name: file.name,
                                type: file.mimeType || 'application/pdf'
                            }
                        }
                    }));

                    setFormData(prev => ({
                        ...prev,
                        comprovanteEndereco: {
                            ...prev.comprovanteEndereco,
                            pdf: {
                                arquivoUrl: localUri,
                                dataUpload: new Date().toISOString(),
                                tipo: file.mimeType || 'application/pdf',
                                nome: file.name
                            }
                        }
                    }));
                }
            }
            // Upload de Imagem
            else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaType: 'photo',
                    maxWidth: 1280,
                    maxHeight: 1280,
                    quality: 0.8,
                    includeBase64: false
                });

                if (!result.assets || result.assets.length === 0) return; // verfica se alguma imagem foi selecionada

                const file = result.assets[0]; // pega a primeira imagem selecionada

                // Armazena localmente para upload posterior
                if (type.includes('cnh')) {
                    const docType = type.split('/')[1]; // frente ou verso
                    setLocalFiles(prev => ({
                        ...prev,
                        cnh: {
                            ...prev.cnh,
                            [docType]: {
                                uri: file.uri,
                                name: file.fileName || `image_${Date.now()}.jpg`,
                                type: file.type || 'image/jpeg'
                            }
                        }
                    }));

                    // Atualiza a visualização
                    setFormData(prev => ({
                        ...prev,
                        cnh: {
                            ...prev.cnh,
                            [docType]: {
                                arquivoUrl: file.uri,
                                dataUpload: new Date().toISOString(),
                                tipo: file.type,
                                nome: file.fileName
                            }
                        }
                    }));

                } else if (type === 'comprovantes') {
                    setLocalFiles(prev => ({
                        ...prev,
                        comprovanteEndereco: {
                            ...prev.comprovanteEndereco,
                            arquivo: {
                                uri: file.uri,
                                name: file.fileName || `image_${Date.now()}.jpg`,
                                type: file.type || 'image/jpeg'
                            }
                        }
                    }));

                    // Atualiza a visualização
                    setFormData(prev => ({
                        ...prev,
                        comprovanteEndereco: {
                            ...prev.comprovanteEndereco,
                            arquivo: {
                                arquivoUrl: file.uri,
                                dataUpload: new Date().toISOString(),
                                tipo: file.type,
                                nome: file.fileName
                            }
                        }
                    }));
                } else if (type === 'selfie') {
                    setLocalFiles(prev => ({
                        ...prev,
                        selfie: {
                            uri: file.uri,
                            name: file.fileName || `image_${Date.now()}.jpg`,
                            type: file.type || 'image/jpeg'
                        }
                    }));

                    // Atualiza a visualização
                    setFormData(prev => ({
                        ...prev,
                        selfie: {
                            arquivoUrl: file.uri,
                            dataUpload: new Date().toISOString(),
                            tipo: file.type,
                            nome: file.fileName
                        }
                    }));
                }
            }
        } catch (error) {
            console.log('Erro na seleção do arquivo:', error);
            setFeedback({
                type: 'error',
                title: 'Erro na Seleção',
                message: 'Falha ao selecionar o documento'
            });
            setFeedbackVisible(true);
        }
    };

    const uploadAllFiles = async (emailFormatado) => {
        try {
            const updatedFormData = { ...formData };
            const totalUploads = Object.values(localFiles).flat().filter(Boolean).length;
            let completedUploads = 0;

            // Função para atualizar o progresso
            const updateProgress = (status) => {
                completedUploads++;
                const progress = completedUploads / totalUploads;
                setUploadProgress(progress);
                setUploadStatus(status);
            };

            // Upload da CNH frente
            if (localFiles.cnh.frente) {
                setUploadStatus('Enviando CNH (frente)...');
                const storagePath = `users/${emailFormatado}/cnh/frente_${Date.now()}.jpg`;
                const storageRef = ref(storage, storagePath);

                const blob = await fetch(localFiles.cnh.frente.uri).then(r => r.blob());
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                updatedFormData.cnh.frente = {
                    arquivoUrl: downloadURL,
                    dataUpload: new Date().toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    tipo: 'imagem',
                    nome: `frente_${Date.now()}.jpg`
                };
                updateProgress('CNH (frente) enviada');
            }

            // Upload da CNH verso
            if (localFiles.cnh.verso) {
                setUploadStatus('Enviando CNH (verso)...');
                const storagePath = `users/${emailFormatado}/cnh/verso_${Date.now()}.jpg`;
                const storageRef = ref(storage, storagePath);

                const blob = await fetch(localFiles.cnh.verso.uri).then(r => r.blob());
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                updatedFormData.cnh.verso = {
                    arquivoUrl: downloadURL,
                    dataUpload: new Date().toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    tipo: 'imagem',
                    nome: `verso_${Date.now()}.jpg`
                };
                updateProgress('CNH (verso) enviada');
            }

            // Upload da CNH PDF
            if (localFiles.cnh.pdf) {
                setUploadStatus('Enviando CNH (PDF)...');
                const storagePath = `users/${emailFormatado}/cnh/pdf_${Date.now()}.pdf`;
                const storageRef = ref(storage, storagePath);

                const blob = await fetch(localFiles.cnh.pdf.uri).then(r => r.blob());
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                updatedFormData.cnh.pdf = {
                    arquivoUrl: downloadURL,
                    dataUpload: new Date().toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    tipo: 'pdf',
                    nome: `pdf_${Date.now()}.pdf`
                };
                updateProgress('CNH (PDF) enviada');
            }

            // Upload do comprovante de endereço (imagem)
            if (localFiles.comprovanteEndereco.arquivo) {
                setUploadStatus('Enviando comprovante de endereço...');
                const storagePath = `users/${emailFormatado}/comprovantes/foto_${Date.now()}.jpg`;
                const storageRef = ref(storage, storagePath);

                const blob = await fetch(localFiles.comprovanteEndereco.arquivo.uri).then(r => r.blob());
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                updatedFormData.comprovanteEndereco.arquivo = {
                    arquivoUrl: downloadURL,
                    dataUpload: new Date().toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    tipo: 'imagem',
                    nome: `foto_${Date.now()}.jpg`
                };
                updateProgress('Comprovante de endereço enviado');
            }

            // Upload do comprovante de endereço PDF
            if (localFiles.comprovanteEndereco.pdf) {
                setUploadStatus('Enviando comprovante de endereço (PDF)...');
                const storagePath = `users/${emailFormatado}/comprovantes/doc_${Date.now()}.pdf`;
                const storageRef = ref(storage, storagePath);

                const blob = await fetch(localFiles.comprovanteEndereco.pdf.uri).then(r => r.blob());
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                updatedFormData.comprovanteEndereco.pdf = {
                    arquivoUrl: downloadURL,
                    dataUpload: new Date().toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    tipo: 'pdf',
                    nome: `doc_${Date.now()}.pdf`
                };
                updateProgress('Comprovante de endereço (PDF) enviado');
            }

            // Upload da selfie
            if (localFiles.selfie) {
                setUploadStatus('Enviando selfie...');
                const storagePath = `users/${emailFormatado}/selfie/selfie_${Date.now()}.jpg`;
                const storageRef = ref(storage, storagePath);

                const blob = await fetch(localFiles.selfie.uri).then(r => r.blob());
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                updatedFormData.selfie = {
                    arquivoUrl: downloadURL,
                    dataUpload: new Date().toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    tipo: 'imagem',
                    nome: `selfie_${Date.now()}.jpg`
                };
                updateProgress('Selfie enviada');
            }
            return updatedFormData;
        } catch (error) {
            console.log('Erro no upload dos arquivos:', error);
            throw error;
        }
    };

    const validateForm = () => {
        if (!formData.nome || !formData.nomeCompleto || !formData.cpf || !formData.dataNascimento || !formData.email || !formData.telefone || !formData.senha) {
            setFeedback({
                type: 'error',
                title: 'Dados Incompletos',
                message: 'Preencha todos os dados pessoais, incluindo a senha'
            });
            return false;
        }

        // Validação completa da senha
        const senhaRegex = {
            minLength: formData.senha.length >= 8,
            hasUpperCase: /[A-Z]/.test(formData.senha),
            hasNumber: /[0-9]/.test(formData.senha),
            hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.senha)
        };

        if (!senhaRegex.minLength || !senhaRegex.hasUpperCase || !senhaRegex.hasNumber || !senhaRegex.hasSymbol) {
            let mensagemErro = 'A senha deve conter:';
            if (!senhaRegex.minLength) mensagemErro += '\n- No mínimo 8 caracteres';
            if (!senhaRegex.hasUpperCase) mensagemErro += '\n- Pelo menos uma letra maiúscula';
            if (!senhaRegex.hasNumber) mensagemErro += '\n- Pelo menos um número';
            if (!senhaRegex.hasSymbol) mensagemErro += '\n- Pelo menos um símbolo especial';

            setFeedback({
                type: 'error',
                title: 'Senha Fraca',
                message: mensagemErro
            });
            return false;
        }

        const endereco = formData.endereco;
        if (!endereco.cep || !endereco.logradouro || !endereco.numero ||
            !endereco.bairro || !endereco.cidade || !endereco.estado) {
            setFeedback({
                type: 'error',
                title: 'Endereço Incompleto',
                message: 'Preencha todos os dados do endereço'
            });
            return false;
        }

        const { cnh, comprovanteEndereco, selfie } = formData;

        // Verifica se o PDF da CNH foi enviado
        const temPdfCnh = cnh && cnh.pdf && cnh.pdf.arquivoUrl;

        if (!temPdfCnh) {
            // Se não tem PDF, precisa ter frente E verso
            const temFrenteCnh = cnh && cnh.frente && cnh.frente.arquivoUrl;
            const temVersoCnh = cnh && cnh.verso && cnh.verso.arquivoUrl;

            if (!temFrenteCnh || !temVersoCnh) {
                setFeedback({
                    type: 'error',
                    title: 'Documentação Incompleta',
                    message: 'Envie a CNH digital ou frente e verso da CNH física'
                });
                return false;
            }
        }

        // Verifica se tem pelo menos um comprovante de endereço
        const temComprovanteArquivo = comprovanteEndereco.arquivo && comprovanteEndereco.arquivo.arquivoUrl;
        const temComprovantePdf = comprovanteEndereco.pdf && comprovanteEndereco.pdf.arquivoUrl;

        if (!temComprovanteArquivo && !temComprovantePdf) {
            setFeedback({
                type: 'error',
                title: 'Documentação Incompleta',
                message: 'Envie o comprovante de endereço'
            });
            return false;
        }

        // Verifica se tem selfie
        const temSelfie = selfie && selfie.arquivoUrl;

        if (!temSelfie) {
            setFeedback({
                type: 'error',
                title: 'Documentação Incompleta',
                message: 'Envie a selfie com a CNH'
            });
            return false;
        }

        return true;
    };

    const handleRemoveDocument = (type) => {
        const [docType, subType] = type.split('/');

        // Remove CNH (frente, verso ou pdf)
        if (docType === 'cnh') {
            setFormData(prev => ({
                ...prev,
                cnh: {
                    ...prev.cnh,
                    [subType]: null
                }
            }));

            // Também remove do estado local
            setLocalFiles(prev => ({
                ...prev,
                cnh: {
                    ...prev.cnh,
                    [subType]: null
                }
            }));

            // Limpa o preview do PDF se necessário
            if (subType === 'pdf') {
                setPdfUriCnh(null);
            }
        }
        // Remove comprovante de endereço (arquivo ou pdf)
        else if (docType === 'comprovantes') {
            setFormData(prev => ({
                ...prev,
                comprovanteEndereco: {
                    ...prev.comprovanteEndereco,
                    [subType === 'pdf' ? 'pdf' : 'arquivo']: null
                }
            }));

            // Também remove do estado local
            setLocalFiles(prev => ({
                ...prev,
                comprovanteEndereco: {
                    ...prev.comprovanteEndereco,
                    [subType === 'pdf' ? 'pdf' : 'arquivo']: null
                }
            }));

            // Limpa o preview do PDF se necessário
            if (subType === 'pdf') {
                setPdfUriComprovante(null);
            }
        }
        // Remove selfie
        else {
            setFormData(prev => ({
                ...prev,
                [docType]: null
            }));

            // Também remove do estado local
            setLocalFiles(prev => ({
                ...prev,
                [docType]: null
            }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setFeedbackVisible(true);
            return;
        }

        try {
            setLoadingVisible(true);
            setUploadProgress(0);
            setUploadStatus('Iniciando cadastro...');

            // Configuração do Firebase para a instância secundária
            const {
                firebaseApiKey,
                firebaseAuthDomain,
                firebaseProjectId,
                firebaseStorageBucket,
                firebaseMessagingSenderId,
                firebaseAppId,
                firebaseMeasurementId
            } = Constants.expoConfig.extra;

            const firebaseConfig = {
                apiKey: firebaseApiKey,
                authDomain: firebaseAuthDomain,
                projectId: firebaseProjectId,
                storageBucket: firebaseStorageBucket,
                messagingSenderId: firebaseMessagingSenderId,
                appId: firebaseAppId,
                measurementId: firebaseMeasurementId
            };

            // Tenta obter a instância secundária se já existir, ou cria uma nova
            let secondaryApp;
            try {
                secondaryApp = getApp("secondary");
            } catch (error) {
                // Se não existir, cria uma nova instância
                secondaryApp = initializeApp(firebaseConfig, "secondary");
            }

            // Obtém a instância de autenticação do app secundário
            const secondaryAuth = getAuth(secondaryApp);

            const emailFormatado = formData.email.toLowerCase().trim();

            // Criar usuário na autenticação do Firebase usando a instância secundária
            setUploadStatus('Criando conta de usuário...');
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                emailFormatado,
                formData.senha
            );

            const user = userCredential.user;
            setUploadProgress(0.2);

            // Fazer upload dos arquivos
            setUploadStatus('Enviando documentos...');
            const updatedFormData = await uploadAllFiles(emailFormatado);

            // Salvar dados no Firestore
            setUploadStatus('Salvando informações...');
            setUploadProgress(0.9);

            await setDoc(doc(db, "users", emailFormatado), {
                uid: user.uid,
                nome: updatedFormData.nome,
                nomeCompleto: updatedFormData.nomeCompleto,
                cpf: updatedFormData.cpf,
                dataNascimento: updatedFormData.dataNascimento,
                email: emailFormatado,
                telefone: updatedFormData.telefone,
                endereco: updatedFormData.endereco,
                cnh: updatedFormData.cnh,
                comprovanteEndereco: updatedFormData.comprovanteEndereco,
                selfie: updatedFormData.selfie,
                aprovado: false,
                role: 'user',
                dataCadastro: new Date().toLocaleDateString('pt-BR'),
                motoAlugada: false,
                aluguelAtivoId: '',
                contratoId: '',
                motoAlugadaId: ''
            });

            // Deslogar o usuário da instância secundária
            await secondaryAuth.signOut();

            setUploadProgress(1);
            setUploadStatus('Cadastro concluído!');

            // Pequeno delay para mostrar que o cadastro foi concluído
            setTimeout(() => {
                setLoadingVisible(false);
                setFeedback({
                    type: 'success',
                    title: 'Sucesso',
                    message: 'Usuário cadastrado com sucesso!'
                });
                setFeedbackVisible(true);
                navigation.goBack();
            }, 1000);

        } catch (error) {
            setLoadingVisible(false);
            console.log('Erro ao cadastrar usuário:', error);

            let errorMessage = 'Falha ao cadastrar usuário';

            // Tratamento de erros específicos de autenticação
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este email já está sendo usado por outra conta';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
            }

            setFeedback({
                type: 'error',
                title: 'Erro',
                message: errorMessage
            });
            setFeedbackVisible(true);
        }
    };

    // Funções de formatação para máscaras
    const formatarDataNascimento = (texto) => {
        // Remove todos os caracteres não numéricos
        const numeros = texto.replace(/\D/g, '');

        // Aplica a máscara DD/MM/AAAA
        if (numeros.length <= 2) {
            return numeros;
        } else if (numeros.length <= 4) {
            return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
        } else {
            return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
        }
    };

    const formatarCPF = (texto) => {
        // Remove todos os caracteres não numéricos
        const numeros = texto.replace(/\D/g, '');

        // Aplica a máscara 000.000.000-00
        if (numeros.length <= 3) {
            return numeros;
        } else if (numeros.length <= 6) {
            return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
        } else if (numeros.length <= 9) {
            return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
        } else {
            return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
        }
    };

    const formataTelefone = (texto) => {
        // Remove todos os caracteres não numéricos
        const numeros = texto.replace(/\D/g, '');
        // Aplica a máscara (00) 00000-0000
        if (numeros.length <= 2) {
            return numeros;
        } else if (numeros.length <= 7) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        } else {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2 , 7)}${numeros.slice(7, 11)}`;
        };
    }

    return (
        <Container>
            <Form>
                {/* Seção de Dados Pessoais */}
                <Section>
                    <SectionTitle>Dados Pessoais</SectionTitle>
                    <InputGroup>
                        <Label>Primeiro Nome</Label>
                        <Input
                            value={formData.nome}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                            placeholder='Ex: Pedro'
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Nome Completo</Label>
                        <Input
                            value={formData.nomeCompleto}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, nomeCompleto: text }))}
                            placeholder='Ex: Pedro Henrique de Castro Martins'
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>CPF</Label>
                        <Input
                            value={formData.cpf}
                            onChangeText={(text) => setFormData(prev => ({ 
                                ...prev, 
                                cpf: formatarCPF(text)
                            }))}
                            keyboardType='numeric'
                            maxLength={14}
                            placeholder='000.000.000-00'
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Data de Nascimento</Label>
                        <Input
                            value={formData.dataNascimento}
                            onChangeText={(text) => setFormData(prev => ({ 
                                ...prev, 
                                dataNascimento: formatarDataNascimento(text)
                            }))}
                            keyboardType='numeric'
                            maxLength={10}
                            placeholder='DD/MM/AAAA'
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Email</Label>
                        <Input
                            value={formData.email}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder='exemplo@email.com'
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Senha</Label>
                        <Input
                            value={formData.senha}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, senha: text }))}
                            keyboardType="password"
                            placeholder='J*****@1020'
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Telefone</Label>
                        <Input
                            value={formData.telefone}
                            onChangeText={(text) => setFormData(prev => ({ 
                                ...prev, 
                                telefone: formataTelefone(text)
                            }))}
                            keyboardType="phone-pad"
                            maxLength={12}
                            placeholder='(00) 00000-0000'
                        />
                    </InputGroup>
                </Section>

                {/* Seção de Endereço */}
                <Section>
                    <SectionTitle>Endereço</SectionTitle>
                    <InputGroup>
                        <Label>CEP</Label>
                        <Input
                            value={formData.endereco.cep}
                            onChangeText={(text) => {
                                // Remove caracteres não numéricos
                                const cepNumerico = text.replace(/\D/g, '');
                                setFormData(prev => ({
                                    ...prev,
                                    endereco: { 
                                        ...prev.endereco, 
                                        cep: cepNumerico 
                                    }
                                }));

                                // Se o CEP tiver 8 dígitos, busca automaticamente
                                if (cepNumerico.length === 8) {
                                    buscarCep(cepNumerico);
                                }
                            }}
                            keyboardType="numeric"
                            maxLength={8}
                            placeholder='00000-000'
                        />
                        {loadingCep && <ActivityIndicator size="small" color="#E74C3C" style={{ position: 'absolute', right: 15 }} />}
                    </InputGroup>
                    <InputGroup>
                        <Label>Logradouro</Label>
                        <Input
                            value={formData.endereco.logradouro}
                            onChangeText={(text) => setFormData(prev => ({
                                ...prev,
                                endereco: { ...prev.endereco, logradouro: text }
                            }))}
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Número</Label>
                        <Input
                            value={formData.endereco.numero}
                            onChangeText={(text) => setFormData(prev => ({
                                ...prev,
                                endereco: { ...prev.endereco, numero: text }
                            }))}
                            keyboardType="numeric"
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Bairro</Label>
                        <Input
                            value={formData.endereco.bairro}
                            onChangeText={(text) => setFormData(prev => ({
                                ...prev,
                                endereco: { ...prev.endereco, bairro: text }
                            }))}
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Cidade</Label>
                        <Input
                            value={formData.endereco.cidade}
                            onChangeText={(text) => setFormData(prev => ({
                                ...prev,
                                endereco: { ...prev.endereco, cidade: text }
                            }))}
                        />
                    </InputGroup>
                    <InputGroup>
                        <Label>Estado</Label>
                        <Input
                            value={formData.endereco.estado}
                            onChangeText={(text) => setFormData(prev => ({
                                ...prev,
                                endereco: { ...prev.endereco, estado: text }
                            }))}
                        />
                    </InputGroup>
                </Section>

                {/* Seção de Documentos */}
                <Section>
                    <SectionTitle>Documentos</SectionTitle>

                    {/* CNH Física */}
                    <DocumentSection>
                        <Label>CNH - Frente</Label>
                        <UploadButton onPress={() => handleUploadDocument('cnh/frente')}>
                            <UploadButtonText>Upload CNH Frente</UploadButtonText>
                        </UploadButton>
                        {formData.cnh.frente && (
                            <DocumentPreview>
                                <DocumentPreviewImage
                                    source={{ uri: formData.cnh.frente.arquivoUrl }}
                                    resizeMode="contain"
                                />
                                <RemoveButton onPress={() => handleRemoveDocument('cnh/frente')}>
                                    <MaterialIcons name="close" size={24} color="#FFF" />
                                </RemoveButton>
                            </DocumentPreview>
                        )}
                    </DocumentSection>

                    <DocumentSection>
                        <Label>CNH - Verso</Label>
                        <UploadButton onPress={() => handleUploadDocument('cnh/verso')}>
                            <UploadButtonText>Upload CNH Verso</UploadButtonText>
                        </UploadButton>
                        {formData.cnh.verso && (
                            <DocumentPreview>
                                <DocumentPreviewImage
                                    source={{ uri: formData.cnh.verso.arquivoUrl }}
                                    resizeMode="contain"
                                />
                                <RemoveButton onPress={() => handleRemoveDocument('cnh/verso')}>
                                    <MaterialIcons name="close" size={24} color="#FFF" />
                                </RemoveButton>
                            </DocumentPreview>
                        )}
                    </DocumentSection>

                    {/* CNH Digital */}
                    <DocumentSection>
                        <Label>CNH - Digital (PDF)</Label>
                        <UploadButton onPress={() => handleUploadDocument('cnh', true)}>
                            <UploadButtonText>Upload CNH Digital</UploadButtonText>
                        </UploadButton>
                        {pdfUriCnh && (
                            <PdfContainer>
                                <PdfViewer
                                    uri={pdfUriCnh}
                                    fileName={formData.cnh.pdf?.nome || "CNH_Digital.pdf"}
                                    height={300}
                                    onRemove={() => {
                                        setPdfUriCnh(null);
                                        handleRemoveDocument('cnh/pdf');
                                    }}
                                />
                            </PdfContainer>
                        )}
                    </DocumentSection>

                    {/* Comprovante de Endereço */}
                    <DocumentSection>
                        <Label>Comprovante de Endereço</Label>
                        <UploadButton onPress={() => handleUploadDocument('comprovantes')}>
                            <UploadButtonText>Upload Comprovante</UploadButtonText>
                        </UploadButton>
                        {formData.comprovanteEndereco.arquivo && (
                            <DocumentPreview>
                                <DocumentPreviewImage
                                    source={{ uri: formData.comprovanteEndereco.arquivo.arquivoUrl }}
                                    resizeMode="contain"
                                />
                                <RemoveButton onPress={() => handleRemoveDocument('comprovantes/arquivo')}>
                                    <MaterialIcons name="close" size={24} color="#FFF" />
                                </RemoveButton>
                            </DocumentPreview>
                        )}
                    </DocumentSection>
                    <DocumentSection>
                        <Label>Comprovante de Endereço (PDF)</Label>
                        <UploadButton onPress={() => handleUploadDocument('comprovantes', true)}>
                            <UploadButtonText>Upload Comprovante (PDF)</UploadButtonText>
                        </UploadButton>
                        {pdfUriComprovante && (
                            <PdfContainer>
                                <PdfViewer
                                    uri={pdfUriComprovante}
                                    fileName={formData.comprovanteEndereco.pdf?.nome || "Comprovante_Endereco.pdf"}
                                    height={300}
                                    onRemove={() => {
                                        setPdfUriComprovante(null);
                                        handleRemoveDocument('comprovantes/pdf');
                                    }}
                                />
                            </PdfContainer>
                        )}
                    </DocumentSection>

                    {/* Selfie */}
                    <DocumentSection>
                        <Label>Selfie com a CNH</Label>
                        <UploadButton onPress={() => handleUploadDocument('selfie')}>
                            <UploadButtonText>Upload Selfie com a CNH</UploadButtonText>
                        </UploadButton>
                        {formData.selfie && (
                            <DocumentPreview>
                                <DocumentPreviewImage
                                    source={{ uri: formData.selfie.arquivoUrl }}
                                    resizeMode="contain"
                                />
                                <RemoveButton onPress={() => handleRemoveDocument('selfie')}>
                                    <MaterialIcons name="close" size={24} color="#FFF" />
                                </RemoveButton>
                            </DocumentPreview>
                        )}
                    </DocumentSection>
                </Section>

                <SubmitButton onPress={handleSubmit}>
                    <SubmitButtonText>Cadastrar Usuário</SubmitButtonText>
                </SubmitButton>
            </Form>

            <FeedbackModal
                visible={feedbackVisible}
                {...feedback}
                onClose={() => setFeedbackVisible(false)}
            />

            <ProgressModal
                visible={loadingVisible}
                progress={uploadProgress}
                status={uploadStatus}
            />
        </Container>
    );
}