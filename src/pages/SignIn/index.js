import React, { useState, useEffect, useCallback } from 'react';
import { Linking, Keyboard, Alert, ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import FloatingLabelInput from '../../components/FloatingLabelInput'; // importando o componente de input
import { FontAwesome } from '@expo/vector-icons';
import Logo from '../../assets/LogoTransparente.svg'; // importei o pm install react-native-svg react-native-svg-transformer para usar a imagem em svg
import { FeedbackModal } from '../../components/FeedbackModal'; // importando o modal de feedback
import { doc, getDoc } from "firebase/firestore";
import { auth, db  } from '../../services/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { markUserAsRegistered } from '../../services/notificationService';
import { registerForPushNotifications } from '../../services/notificationService';
import {   
    Background, 
    Container, 
    ScrollContent,
    ContentContainer,
    AreaInput,
    Input,
    ButtonIconPassaword,
    ErrorText,
    TextButtonAcessar,
    ButtonAcessar,
    ButtonCriarConta,
    TextButtonCriar,
    BottomButtonsContainer,
    ButtonEsqueceuSenha,
    TextButtonEsqueceuSenha,
    TextButtonSuporte,
    ButtonSuporte,
} from './styles';

export default function SignIn({ navigation }) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [tecladoVisivel, setTecladoVisivel] = useState(false);
    const [erros, setErros] = useState({ email: '', senha: '' });
    const [loadingReset, setLoadingReset] = useState(false);
    const [loadingSupport, setLoadingSupport] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', title: '', message: '' })
    const [loading, setLoading] = useState(false);
    const {setCadastroConcluido} = useContext(AuthContext); // estado para setar o cadastro como concluido no AuthContext
    const [passwordVisible, setPasswordVisible] = useState(false); // Estado para controlar a visibilidade da senha

    const platformStyles = StyleSheet.create({
        inputShadow: Platform.select({
            android: {
                elevation: 2,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            web: {
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
            },
        }),
        buttonShadow: Platform.select({
            android: {
                elevation: 3,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
            },
            web: {
                boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
            },
        }),
    });

    // Monitora eventos do teclado
    useEffect(() => {
        const mostrarTeclado = Keyboard.addListener('keyboardDidShow', () => {
            setTecladoVisivel(true);
        });
        const esconderTeclado = Keyboard.addListener('keyboardDidHide', () => {
            setTecladoVisivel(false);
        });

        return () => {
            mostrarTeclado.remove();
            esconderTeclado.remove();
        };
    }, []);

    // Validação de email
    const validarEmail = (email) => {
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regexEmail.test(email);
    };

    // Função de autenticação
    const fazerLogin = async () => {
        Keyboard.dismiss();
        
        let novosErros = {};
    
        if (!email.trim()) {
            novosErros.email = 'Digite seu e-mail';
        } else if (!validarEmail(email)) {
            novosErros.email = 'Digite um e-mail válido';
        }
    
        if (!senha.trim()) {
            novosErros.senha = 'Digite sua senha';
        } else if (senha.length < 6) {
            novosErros.senha = 'A senha deve ter no mínimo 6 caracteres';
        }
    
        setErros(novosErros);
    
        if (Object.keys(novosErros).length > 0) {
            setLoading(false);
            return;
        }

        // Só inicia o loading se não houver erros
        setLoading(true);

        try {
            const emailFormatado = email.toLowerCase().trim();
            // Primeiro verificamos a aprovação
            const userDoc = await getDoc(doc(db, "users", emailFormatado));

            // Verifica se o usuário existe
            if (!userDoc.exists()) {
                setFeedback({
                    type: 'error',
                    title: 'Usuário não encontrado',
                    message: 'Este email não está cadastrado no sistema'
                });
                setFeedbackVisible(true);
                return;
            }

            const userData = userDoc.data();
            
            // Verifica aprovação apenas para usuários normais
            if (userData.role !== 'admin' && userData.aprovado === false) {
                setFeedback({
                    type: 'error',
                    title: 'Acesso Pendente',
                    message: 'Sua conta está aguardando aprovação. Entraremos em contato em breve.'
                });
                setFeedbackVisible(true);
                return;
            }

            // setCadastroConcluido só é chamado para usuários normais
            if (userData.role !== 'admin') {
                setCadastroConcluido(true);
            }

            // Só depois tenta fazer login
            await signInWithEmailAndPassword(auth, emailFormatado, senha);
            await registerForPushNotifications();
            await markUserAsRegistered(); // Marca o usuário como registrado para manipular receber ou não notificação de ainda não foi registrado.
            console.log('Usuário autenticado e aprovado'); 

        } catch (error) {
            if (error.code === 'auth/invalid-credential' || // erro de credenciais inválidas
                error.code === 'auth/user-not-found' || // erro de usuário não encontrado
                error.code === 'auth/wrong-password') { // erro de senha incorreta
                setFeedback({
                    type: 'error',
                    title: 'Credenciais Inválidas',
                    message: 'Email ou senha incorretos'
                });
            } else {
                setFeedback({
                    type: 'error',
                    title: 'Erro',
                    message: 'Ocorreu um erro ao fazer login\n\nTente novamente'
                });
            }
            setFeedbackVisible(true);
        } finally {
            setLoading(false);
        }
    }

    // Função para alterar a senha
    const resetarSenha = useCallback(async () => {
        if (loadingReset) return;
        
        setErros({});
        setSenha('');

        if (!email.trim()) {
            setErros({ email: 'Digite seu e-mail para recuperar a senha' });
            return;
        }

        if (!validarEmail(email)) {
            setErros({ email: 'Digite um email válido' });
            return;
        }

        try {
            setLoadingReset(true);
            
            const response = await fetch("https://enviaremailresetsenha-q3zrn7ctxq-uc.a.run.app", {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim()
                })
            });

            if (response.status === 404) {
                setFeedback({
                    type: 'error',
                    title: 'Email não cadastrado',
                    message: 'Este email não está cadastrado no sistema\n\nVerifique se digitou corretamente ou cadastre-se'
                });
                setFeedbackVisible(true);
                return;
            }

            setFeedback({
                type: 'success',
                title: 'Email Enviado!',
                message: 'Verifique sua caixa de entrada para redefinir sua senha'
            });
            setFeedbackVisible(true);
            setEmail('');

        } catch (error) {
            setFeedback({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível enviar o email de recuperação\nTente novamente'
            });
            setFeedbackVisible(true);
        } finally {
            setLoadingReset(false);
        }
    }, [email, loadingReset]);

    // Função para abrir WhatsApp
    const abrirWhatsApp = useCallback(() => {
        if (loadingSupport) return;
        
        setLoadingSupport(true);
        const telefone = '5585992684035';
        const mensagem = 'Olá! Preciso de ajuda :)';
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

    return (
            <Background>
                <Container>
                    <ScrollContent>
                        <ContentContainer keyboardVisible={tecladoVisivel}>
                            <Logo width={180} height={160} style={{ marginBottom: 20 }}/>
                            <AreaInput>
                                    <Input
                                        placeholder="Email"
                                        value={email}
                                        onChangeText={(texto) => {
                                            setEmail(texto);
                                            setErros(prev => ({...prev, email: ''}));
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        error={!!erros.email}
                                    />
                                    {erros.email ? <ErrorText>{erros.email}</ErrorText> : null}
                                    
                                    <Input
                                        placeholder='Senha'
                                        value={senha}
                                        onChangeText={(texto) => {
                                            setSenha(texto);
                                            setErros(prev => ({...prev, senha: ''}));
                                        }}
                                        secureTextEntry={!passwordVisible}
                                        error={!!erros.senha}
                                    />
                                    <ButtonIconPassaword // Botão de olho
                                    onPress={() => setPasswordVisible(!passwordVisible)} // Função para alternar a visibilidade da senha
                                    >
                                        <MaterialIcons name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="#666" />
                                    </ButtonIconPassaword>
                                    {erros.senha ? <ErrorText>{erros.senha}</ErrorText> : null}
                            </AreaInput>

                            {(email.length > 0 || senha.length > 0) && (
                                <ButtonEsqueceuSenha onPress={resetarSenha}>
                                    {loadingReset ? (
                                        <ActivityIndicator size="small" color="rgb(40, 94, 211)" />
                                    ) : (
                                        <TextButtonEsqueceuSenha>Esqueceu a senha?</TextButtonEsqueceuSenha>
                                    )}
                                </ButtonEsqueceuSenha>
                            )}

                            <ButtonAcessar 
                                onPress={fazerLogin}
                                activeOpacity={0.8}
                                disabled={loading}
                                style={platformStyles.buttonShadow}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <TextButtonAcessar>Acessar</TextButtonAcessar> }
                                
                            </ButtonAcessar>

                            {!tecladoVisivel && (
                                    <ButtonCriarConta 
                                        onPress={() => navigation.navigate('nome')}
                                        activeOpacity={0.7}
                                    >
                                        <TextButtonCriar>Criar uma conta</TextButtonCriar>
                                    </ButtonCriarConta>
                            )}
                        </ContentContainer>
                    </ScrollContent>
                
                    {!tecladoVisivel && (
                        <BottomButtonsContainer>
                            <ButtonSuporte 
                            onPress={abrirWhatsApp}
                            activeOpacity={0.8}
                            >
                            {loadingSupport ? (
                                <TextButtonSuporte>Abrindo Whatsapp...</TextButtonSuporte>
                            ) : (
                                <TextButtonSuporte>Ajuda</TextButtonSuporte>
                            )}
                            <FontAwesome name="whatsapp" size={24} color="#00000" marginLeft={5} />
                            </ButtonSuporte>
                        </BottomButtonsContainer>
                    )}

                    {feedbackVisible && (
                        <View 
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
                </Container>
            </Background>
        );
}

