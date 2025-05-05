import React, { useState } from 'react';
import { ScrollView, ActivityIndicator, Alert, Linking, Platform, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../../../services/firebaseConfig';
import { FeedbackModal } from '../../../../../components/FeedbackModal'; 

import {
    Container,
    BackButton,
    Section,
    SectionTitle,
    InfoRow,
    InfoLabel,
    InfoValue,
    AddressSection,
    DocumentSection,
    DocumentTitle,
    DocumentImage,
    PdfContainer,
    ActionButton,
    ActionButtonText,
    StatusBadge,
    StatusText,
    ButtonsContainer,
    LoadingContainer,
    ContactIconButton,
    WebPdfContainer,
    Divider,
} from './styles';

export default function UserDetails() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user: userParam } = route.params;
    
    // Cria uma cópia do objeto user para evitar problemas de read-only
    const [userData, setUserData] = useState({...userParam});
    
    const [loading, setLoading] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', title: '', message: '' });
    
    // Estado para controlar qual PDF está sendo visualizado em tela cheia
    const [fullScreenPdf, setFullScreenPdf] = useState(null);
    
    // Verifica se estamos na plataforma web
    const isWeb = Platform.OS === 'web';

    // Verifica se estamos em um dispositivo desktop
    const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;
    
    /**
     * Formata o número de telefone para o formato adequado do WhatsApp
     * Remove caracteres não numéricos e adiciona o código do país (55) se necessário
     */
    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        
        // Remove todos os caracteres não numéricos
        let cleanNumber = phone.replace(/\D/g, '');
        
        // Verifica se já tem o código do país
        if (!cleanNumber.startsWith('55')) {
            cleanNumber = '55' + cleanNumber;
        }
        
        return cleanNumber;
    };

    /**
     * Abre o WhatsApp com o número do usuário
     * Formata o número e verifica se o WhatsApp está instalado
     */
    const openWhatsApp = () => {
        const formattedNumber = formatPhoneNumber(userData.telefone);
        const whatsappUrl = `whatsapp://send?phone=${formattedNumber}`;
        
        console.log('Tentando abrir WhatsApp com URL:', whatsappUrl);
        
        Linking.canOpenURL(whatsappUrl)
            .then(supported => {
                if (supported) {
                    return Linking.openURL(whatsappUrl);
                } else {
                    // Alternativa: tente abrir o WhatsApp Web
                    console.log('Tentando alternativa para WhatsApp');
                    const webWhatsappUrl = `https://wa.me/${formattedNumber}`;
                    return Linking.openURL(webWhatsappUrl);
                }
            })
            .catch(err => {
                console.error('Erro ao abrir WhatsApp:', err);
                Alert.alert(
                    'Erro',
                    'Não foi possível abrir o WhatsApp',
                    [{ text: 'OK' }]
                );
            });
    };

    /**
     * Abre o aplicativo de email web/padrão do dispositivo com o endereço do usuário
     */
    const openEmail = () => {
        if (!userData.email) {
            console.log('Email não disponível');
            return;
        }
        
        // Verifica se estamos na web
        if (isWeb) {
            // URL do Gmail na web
            const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${userData.email}`;
            const mailtoUrl = `mailto:${userData.email}`;
            
            // Verifica se é um dispositivo móvel usando uma abordagem simples
            const isMobileWeb = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobileWeb) {
                // Em dispositivos móveis web, abre o Gmail na web diretamente
                // Isso é mais confiável em navegadores móveis
                window.open(gmailWebUrl, '_blank');
            } else {
                // Em desktop web, primeiro abre o Gmail na web
                window.open(gmailWebUrl, '_blank');
                
                // Depois pergunta se o usuário quer usar o cliente de email padrão
                setTimeout(() => {
                    const useDefaultClient = window.confirm(
                        'Deseja também abrir este email no seu aplicativo de email padrão?'
                    );
                    
                    if (useDefaultClient) {
                        // Cria um elemento <a> temporário para o mailto
                        const mailtoLink = document.createElement('a');
                        mailtoLink.href = mailtoUrl;
                        mailtoLink.style.display = 'none';
                        document.body.appendChild(mailtoLink);
                        
                        // Abre o cliente de email padrão
                        mailtoLink.click();
                        
                        // Remove o elemento
                        document.body.removeChild(mailtoLink);
                    }
                }, 1000);
            }
        } else {
            // Código para dispositivos nativos (Android/iOS)
            // Tenta abrir diretamente o app do Gmail (Android)
            const gmailAppUrl = `googlegmail://compose?to=${userData.email}`;
            
            Linking.canOpenURL(gmailAppUrl)
                .then(canOpenGmailApp => {
                    if (canOpenGmailApp) {
                        console.log('Abrindo app do Gmail diretamente');
                        return Linking.openURL(gmailAppUrl);
                    } else {
                        // Tente com o esquema mailto
                        console.log('Não foi possível abrir o app do Gmail, tentando mailto');
                        const mailtoUrl = `mailto:${userData.email}`;
                        
                        return Linking.canOpenURL(mailtoUrl)
                            .then(canOpenMailto => {
                                if (canOpenMailto) {
                                    return Linking.openURL(mailtoUrl);
                                } else {
                                    // Como última opção, abra o Gmail na web
                                    console.log('Abrindo Gmail na web como última opção');
                                    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${userData.email}`;
                                    return Linking.openURL(gmailWebUrl);
                                }
                            });
                    }
                })
                .catch(err => {
                    console.error('Erro ao abrir email:', err);
                    Alert.alert(
                        'Erro',
                        'Não foi possível abrir o aplicativo de email',
                        [{ text: 'OK' }]
                    );
                });
        }
    };

    // Função para enviar notificação pelo Firestore
    const enviarNotificacaoPeloFirestore = async (userEmail, title, body, data) => {
        try {
        // Gerar um ID único para a solicitação
        const requestId = `${userData.email}_${Date.now()}`;
        
        // Criar um documento de solicitação de notificação no Firestore
        await setDoc(doc(db, 'notificationRequests', requestId), {
            userEmail: userEmail,
            title: title,
            body: body,
            data: data,
            createdAt: serverTimestamp()
        });
        
        console.log(`Solicitação de notificação criada: ${requestId}`);
        return true;
        } catch (error) {
        console.error(`Erro ao criar solicitação de notificação: ${error.message}`);
        return false;
        }
    };

    // Função para enviar email pelo Firestore
    const enviarEmailPeloFirestore = async (userEmail, subject, body ) => {
        try {
        // Gerar um ID único para a solicitação
        const requestId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        // Criar um documento de solicitação de email no Firestore
        await setDoc(doc(db, 'emailRequests', requestId), {
            to: userEmail,
            subject: subject,
            html: body,
            createdAt: serverTimestamp(),
        });
        
        console.log(`Solicitação de email criada: ${requestId}`);
        return true;
        } catch (error) {
        console.error(`Erro ao criar solicitação de email: ${error.message}`);
        return false;
        }
    };
    
    /**
     * Atualiza o status de aprovação do usuário no Firestore
     * @param {boolean} approve - true para aprovar, false para rejeitar
     */
    const handleApprovalChange = async (approve) => {
        try {
            setLoading(true);
            
            // Referência ao documento do usuário no Firestore
            const userRef = doc(db, "users", userData.email);
            
            // Atualiza o campo 'aprovado' no Firestore
            await updateDoc(userRef, {
                aprovado: approve
            });
            
            // Atualiza o estado local com o novo valor de aprovação
            setUserData(prevData => ({
                ...prevData,
                aprovado: approve
            }));

            try {
                // Preparar dados para a notificação push
                const title = 'Seu cadastro ' + (approve ? 'foi aprovado' : 'não foi aprovado') + (approve ? ' 🥳🎉' : ' ☹️');
                const body = approve 
                    ? 'Parabéns! Seu cadastro foi aprovado com sucesso.' 
                    : 'Seu cadastro foi não foi aprovado. Entre em contato para mais informações.';
                const data = {
                    screen: 'SignIn',
                };

                // Usar o método alternativo baseado em Firestore
                const success = await enviarNotificacaoPeloFirestore(userData.email, title, body, data);

                if (!success) {
                    throw new Error("Falha ao criar solicitação de notificação");
                }

                console.log(`Notificação de ${approve ? 'aprovação' : 'não aprovação'} do usuário ${userData.email} processada com sucesso`);

                // Enviar também um email de lembrete
                const emailSubject = 'Seu cadastro ' + (approve ? 'foi aprovado' : 'não foi aprovado') + (approve ? ' 🥳🎉' : ' ☹️');
                const emailBody = approve 
                ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                    </div>
                    <h2 style="color: #CB2921; text-align: center; margin-bottom: 30px">📢 Cadastro Aprovado! Bem-vindo à Papa Tango Aluguel de Motos! 🏁</h2>
                    <p>Olá, <strong>${userData.nome}</strong>! 🎉</p>
                    <p>Parabéns! Seu cadastro foi aprovado com sucesso. Agora você pode acelerar rumo à sua próxima aventura e aproveitar todos os nossos serviços! 🚀</p>
                    <p>🔑 Use seu login e senha para acessar o nosso App e explorar todas as motos disponíveis para aluguel! 🏍️💨</p>
                    <p>📲 Em breve, um dos nossos atendentes entrará em contato com você pelo WhatsApp no número <strong>${userData.telefone}</strong>, enviando nosso catálogo de motos disponíveis e ajudando com qualquer dúvida que você tiver. 🏍️🛠️</p>
                    <br>
                    <p><strong>Atenciosamente, Equipe Papa Tango Aluguel de Motos</strong></p>
                </div>
                ` : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                    </div>
                    <h2 style="color: #CB2921; text-align: center; margin-bottom: 30px;">Cadastro Não Aprovado 😞</h2>
                    <p>Olá <strong>${userData.nome}</strong>,</p>
                    <br>
                    <p>Agradecemos o seu interesse em nossos serviços de aluguel de motos e por ter realizado seu cadastro conosco. Após a análise das informações fornecidas, infelizmente, neste momento, não conseguimos aprovar sua solicitação.</p>
                    <p>Nosso processo de análise inclui a verificação de documentos como CNH, antecedentes, comprovante de endereço e consulta financeira, garantindo a segurança de todos os nossos clientes e parceiros.</p>
                    <p>Caso tenha dúvidas sobre o processo ou deseje revisar as informações enviadas, estamos à disposição para esclarecer qualquer ponto e auxiliar da melhor forma possível.</p>
                    <p>Obrigado pela sua compreensão. Esperamos poder atendê-lo futuramente.</p>
                    <br>
                    <p><strong>Atenciosamente, Equipe Papa Tango Aluguel de Motos</strong></p>
                </div>
                `;
                
                await enviarEmailPeloFirestore(userData.email, emailSubject, emailBody );
                
                } catch (error) {
                    console.error(`Erro ao enviar notificação de aprovação/desaprovação do usuário ${userData.email}:`, error.message);
                
                    // Tentar registrar o erro no Firestore para análise posterior
                    try {
                        await setDoc(doc(db, 'notificationErrors', `${userData.email}_${Date.now()}`), {
                        userEmail: userData.email,
                        error: error.message,
                        timestamp: serverTimestamp()
                        });
                    } catch (e) {
                        console.error("Erro ao registrar falha de notificação:", e);
                    }
                }
            
            
            // Configura a mensagem de feedback
            setFeedback({
                type: 'success',
                title: 'Sucesso',
                message: approve 
                    ? 'Usuário aprovado com sucesso!' 
                    : 'Usuário rejeitado com sucesso!'
            });
            
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            setFeedback({
                type: 'error',
                title: 'Erro',
                message: 'Falha ao atualizar o status do usuário'
            });
        } finally {
            setLoading(false);
            setFeedbackVisible(true);
        }
    };
    
    /**
     * Exibe um diálogo de confirmação antes de aprovar o usuário
     */
    const confirmApproval = () => {
        Alert.alert(
            'Aprovar Usuário',
            'Tem certeza que deseja aprovar este usuário?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Aprovar', onPress: () => handleApprovalChange(true) }
            ]
        );
    };
    
    /**
     * Exibe um diálogo de confirmação antes de rejeitar o usuário
     */
    const confirmRejection = () => {
        Alert.alert(
            'Rejeitar Usuário',
            'Tem certeza que deseja rejeitar este usuário?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Rejeitar', onPress: () => handleApprovalChange(false) }
            ]
        );
    };
    
    /**
     * Abre um PDF em uma URL externa (navegador ou app de PDF)
     * Usado como alternativa se a visualização interna falhar
     */
    const openPdfExternally = (url) => {
        console.log('Tentando abrir PDF externamente:', url);
        
        Linking.canOpenURL(url)
            .then(supported => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    console.log('Não há suporte para abrir este tipo de URL');
                    Alert.alert(
                        'Erro',
                        'Não foi possível abrir o PDF externamente',
                        [{ text: 'OK' }]
                    );
                }
            })
            .catch(err => {
                console.error('Erro ao abrir PDF externamente:', err);
                Alert.alert(
                    'Erro',
                    'Não foi possível abrir o PDF',
                    [{ text: 'OK' }]
                );
            });
    };

    // Criar uma URL do Google PDF Viewer
    const getGooglePdfViewerUrl = (pdfUrl) => {
        // Codifica a URL do PDF para usar como parâmetro
        const encodedPdfUrl = encodeURIComponent(pdfUrl);
        // Retorna a URL do Google PDF Viewer com a URL do PDF como parâmetro
        return `https://docs.google.com/viewer?url=${encodedPdfUrl}&embedded=true`;
    };
    
    /**
     * Renderiza o visualizador de PDF adequado para a plataforma
     */
    const renderPdfViewer = (pdfUrl, height = isWebDesktop ? 600 : 300) => {
        if (isWeb) {
            // Renderiza um iframe para web
            return (
                <WebPdfContainer style={{ height }}>
                    <iframe 
                        src={pdfUrl} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none' }}
                        title="PDF Viewer"
                    />
                </WebPdfContainer>
            );
        } else {
            // Para nativo, carrega o PDF automaticamente usando o Google Docs Viewer
            return (
                <PdfContainer style={{ height }}>
                    <WebView
                        source={{ uri: getGooglePdfViewerUrl(pdfUrl) }}
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
                                        onPress: () => openPdfExternally(pdfUrl) 
                                    },
                                    { text: 'Cancelar', style: 'cancel' }
                                ]
                            );
                        }}
                        onHttpError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('WebView HTTP error: ', nativeEvent);
                            Alert.alert(
                                'Erro',
                                'Não foi possível carregar o PDF. Tente abrir externamente.',
                                [
                                    { 
                                        text: 'Abrir Externamente', 
                                        onPress: () => openPdfExternally(pdfUrl) 
                                    },
                                    { text: 'Cancelar', style: 'cancel' }
                                ]
                            );
                        }}
                    />
                </PdfContainer>
            );
        }
    };
    
    return (
        <Container>
            <ScrollView>
                {/* Status do Usuário */}
                <StatusBadge approved={userData.aprovado}>
                    <StatusText approved={userData.aprovado}>
                        {userData.aprovado ? 'Aprovado' : 'Pendente'}
                    </StatusText>
                </StatusBadge>
                
                {/* Informações Pessoais */}
                <Section>
                    <SectionTitle>Informações Pessoais</SectionTitle>
                    
                    <InfoRow>
                        <InfoLabel>Nome Completo:</InfoLabel>
                        <InfoValue>{userData.nomeCompleto || userData.nome}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                    
                    <InfoRow>
                        <InfoLabel>Email:</InfoLabel>
                        <InfoValue>{userData.email}</InfoValue>
                        <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {userData.email && (
                                <ContactIconButton onPress={openEmail}>
                                    <Icon name="email" size={24} color="#CB2921" />
                                </ContactIconButton>
                            )}
                        </View>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />

                    <InfoRow>
                        <InfoLabel>CPF:</InfoLabel>
                        <InfoValue>{userData.cpf}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />

                    <InfoRow>
                        <InfoLabel>Data de Nascimento:</InfoLabel>
                        <InfoValue>{userData.dataNascimento}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                    
                    <InfoRow>
                        <InfoLabel>Telefone:</InfoLabel>
                        <InfoValue>{userData.telefone}</InfoValue>
                        <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {userData.telefone && (
                                <ContactIconButton onPress={openWhatsApp}>
                                    <FontAwesome name="whatsapp" size={24} color="#25D366" />
                                </ContactIconButton>
                            )}
                        </View>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                    
                    <InfoRow>
                        <InfoLabel>Data de Cadastro:</InfoLabel>
                        <InfoValue>{userData.dataCadastro}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                </Section>
                
                {/* Endereço */}
                <AddressSection>
                    <SectionTitle>Endereço</SectionTitle>
                    
                    <InfoRow>
                        <InfoLabel>CEP:</InfoLabel>
                        <InfoValue>{userData.endereco?.cep}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                    
                    <InfoRow>
                        <InfoLabel>Logradouro:</InfoLabel>
                        <InfoValue>{userData.endereco?.logradouro}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />

                    <InfoRow>
                        <InfoLabel>Número:</InfoLabel>
                        <InfoValue>{userData.endereco?.numero}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                    
                    <InfoRow>
                        <InfoLabel>Bairro:</InfoLabel>
                        <InfoValue>{userData.endereco?.bairro}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                    
                    <InfoRow>
                        <InfoLabel>Cidade:</InfoLabel>
                        <InfoValue>{userData.endereco?.cidade}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                    
                    <InfoRow>
                        <InfoLabel>Estado:</InfoLabel>
                        <InfoValue>{userData.endereco?.estado}</InfoValue>
                    </InfoRow>
                    <Divider style={{ marginTop: - 10, marginBottom: 10 }} />
                </AddressSection>
                
                {/* Documentos - CNH */}
                <DocumentSection>
                    <SectionTitle>CNH</SectionTitle>
                    
                    {userData.cnh?.frente && (
                        <>
                            <DocumentTitle>Frente</DocumentTitle>
                            <DocumentImage 
                                source={{ uri: userData.cnh.frente.arquivoUrl }}
                                resizeMode="contain"
                            />
                        </>
                    )}
                    
                    {userData.cnh?.verso && (
                        <>
                            <DocumentTitle>Verso</DocumentTitle>
                            <DocumentImage 
                                source={{ uri: userData.cnh.verso.arquivoUrl }}
                                resizeMode="contain"
                            />
                        </>
                    )}
                    
                    {userData.cnh?.pdf && (
                        <>
                                <DocumentTitle style={{ marginTop: -5}}>
                                    CNH Digital (PDF)
                                    <ContactIconButton
                                        onPress={() => openPdfExternally(userData.cnh.pdf.arquivoUrl)}
                                    >
                                        <Icon name="open-in-new" size={20} color="#CB2921"/>
                                    </ContactIconButton>
                                </DocumentTitle>
                            {renderPdfViewer(userData.cnh.pdf.arquivoUrl)}
                        </>
                    )}
                </DocumentSection>
                
                {/* Comprovante de Endereço */}
                <DocumentSection>
                    <SectionTitle>Comprovante de Endereço</SectionTitle>
                    
                    {userData.comprovanteEndereco?.arquivo && (
                        <>
                            <DocumentTitle>Imagem</DocumentTitle>
                            <DocumentImage 
                                source={{ uri: userData.comprovanteEndereco.arquivo.arquivoUrl }}
                                resizeMode="contain"
                            />
                        </>
                    )}
                    
                    {userData.comprovanteEndereco?.pdf && (
                        <>
                            <DocumentTitle style={{ marginTop: -5}}>
                                PDF
                                <ContactIconButton 
                                    onPress={() => openPdfExternally(userData.comprovanteEndereco.pdf.arquivoUrl)}
                                    style={{ marginLeft: 10 }}
                                >
                                    <Icon name="open-in-new" size={20} color="#CB2921" />
                                </ContactIconButton>
                            </DocumentTitle>
                            {renderPdfViewer(userData.comprovanteEndereco.pdf.arquivoUrl)}
                        </>
                    )}
                </DocumentSection>
                
                {/* Selfie */}
                <DocumentSection>
                    <SectionTitle>Selfie com CNH</SectionTitle>
                        {userData.selfie && (
                            <DocumentImage 
                                source={{ uri: userData.selfie.arquivoUrl }}
                                resizeMode="contain"
                            />
                        )}
                </DocumentSection>
                
                {/* Botões de Ação */}
                <ButtonsContainer>
                    <ActionButton 
                        approve 
                        onPress={confirmApproval}
                        disabled={loading || userData.aprovado}
                        style={{ opacity: userData.aprovado ? 0.5 : 1 }}
                    >
                        <ActionButtonText>
                            {userData.aprovado ? 'Já Aprovado' : 'Aprovar Usuário'}
                        </ActionButtonText>
                    </ActionButton>
                    
                    <ActionButton 
                        reject 
                        onPress={confirmRejection}
                        disabled={loading || !userData.aprovado}
                        style={{ opacity: !userData.aprovado ? 0.5 : 1 }}
                    >
                        <ActionButtonText>
                            {!userData.aprovado ? 'Já Rejeitado' : 'Rejeitar Usuário'}
                        </ActionButtonText>
                    </ActionButton>
                </ButtonsContainer>
            </ScrollView>
            
            {/* Indicador de carregamento */}
            {loading && (
                <LoadingContainer>
                    <ActivityIndicator size="large" color="#CB2921" />
                </LoadingContainer>
            )}
            
            {/* Modal de PDF em tela cheia */}
            {fullScreenPdf && (
                <PdfContainer fullScreen>
                    <BackButton 
                        style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}
                        onPress={() => setFullScreenPdf(null)}
                    >
                        <Icon name="close" size={30} color="#FFF" />
                    </BackButton>
                    {renderPdfViewer(fullScreenPdf, '100%')}
                </PdfContainer>
            )}
            
            {/* Modal de feedback após aprovar/rejeitar */}
            <FeedbackModal
                visible={feedbackVisible}
                {...feedback}
                onClose={() => {
                    setFeedbackVisible(false);
                    // Navega de volta para a lista de usuários após fechar o modal
                    navigation.goBack();
                }}
            />
        </Container>
    );
}
