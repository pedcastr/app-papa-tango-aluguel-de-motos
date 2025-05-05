import React, { useState, useCallback, useContext } from "react";
import { useFocusEffect } from '@react-navigation/native'; 
import { Keyboard, Platform, Alert, ActivityIndicator, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import LottieAnimation from "../../components/LottieAnimation";
import { createUserWithEmailAndPassword } from "firebase/auth"; // para criar a autenticação do usuário no firebase
import { auth, db } from "../../services/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRoute } from "@react-navigation/native"; 
import {
    Background,
    Container,
    AreaAnimacao,
    ViewAnimacao,
    AreaInput,
    TextPage,
    Input,
    AreaButtonContinuar,
    ButtonContinuar,
    TextButtonContinuar,
    AreaInputSenha,
    ButtonIconPassaword,
    TextErrorPassword,
    AreaCriteriosSenha,
    TextCriteriosSenha,
} from "./styles";
import { AuthContext } from "../../context/AuthContext";

export default function Senha({ navigation }) {
    const route = useRoute();
    const { email, nome, nomeCompleto, cpf, phoneNumber, dadosEndereco, formData, dataNascimento } = route.params; 
    const [senhaRepetida, setSenhaRepetida] = useState("");
    const [senhaRepetidaErro, setSenhaRepetidaErro] = useState("");
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState(''); 
    const [passwordVisible, setPasswordVisible] = useState(false); // Estado para controlar a visibilidade da senha
    const [showPasswordCriteria, setShowPasswordCriteria] = useState(false); // Estado para mostrar/ocultar as indicações de senha quando o input for focado
    // Estado para validação individual da senha
    const [passwordValidation, setPasswordValidation] = useState({ // Estado para controlar os texts que alteram de acordo com a validação da senha
        minLength: false,
        number: false,
        symbol: false,
        uppercase: false,
    });
    const [loading, setLoading] = useState(false);
    const [repeatPasswordVisible, setRepeatPasswordVisible] = useState(false); // Estado para controlar a visibilidade da senha representada pelo ícone do olho no input de 'repita sua senha'
    const [focusedInput, setFocusedInput] = useState(null); // Estado para alterar a cor do TextPage do input
    const [sucesso, setSucesso] = useState(false);

    const { setRegistrationInProcess } = useContext(AuthContext);

    // Usado para pausar a animação json quando o usuário retorna para essa tela
        useFocusEffect( 
            useCallback(() => { 
                setSucesso(false); 
            }, []) 
        );

    // Função para gerar o feedback de erro caso as senhas não coincidam no input de 'repita sua senha'
    function handleRepeatPasswordChange(text) {
        setSenhaRepetida(text);
        if(text.length >= password.length) {
            if(text !== password) {
                setSenhaRepetidaErro("As senhas não coincidem");
            } else {
                setSenhaRepetidaErro("");
            }
        }
    }

    // Função para validar o formato da senha
    function validatePasswordFormat(text) { 
        // Validação da senha:
        // Mínimo de 8 caracteres
        // Pelo menos 1 número
        // Pelo menos 1 símbolo especial
        // Pelo menos 1 letra maiúscula
        const regex = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z]).{8,}$/; // Regex para validar a senha
        return regex.test(text);
    }

    // Função para validar o formato da senha e atualizar o estado de validação individual (conforme o usuário digita correto muda de cor)
    function handlePasswordChange(text) {
        setPassword(text);
    
        // Atualiza o estado de cada critério
        setPasswordValidation({
          minLength: text.length >= 8,
          number: /[0-9]/.test(text),
          symbol: /[!@#$%^&*(),.?":{}|<>]/.test(text),
          uppercase: /[A-Z]/.test(text),
        });
    
        if(text === ''){
          setPasswordError('');
          return;
        }
        if (!validatePasswordFormat(text)) { // se a senha não passar na validação
            if (text.length >= password.length) {
                setPasswordError('Verifique os requisitos da senha');
            }
        } else {
          setPasswordError('');
        }
      }
    
    // Função para concluir o cadastro e ir para a tela concluido.js
    async function handleConcluir(){ 
        Keyboard.dismiss();
        if(password === '' || senhaRepetida === ''){
        Alert.alert('Atenção','Preencha todos os campos!');
        return;
        }
        if(passwordError || senhaRepetidaErro){
        Alert.alert('Atenção','Verifique os campos com erros');
        return;
        }
        if(password !== senhaRepetida){
        setSenhaRepetidaErro("As senhas não coincidem");
        return;
        }
        
        setLoading(true);
        setRegistrationInProcess(true); // Sinaliza que o cadastro está em processo

        try {
            const emailFormatado = email.toLowerCase().trim();
        
            // Criar usuário e documento
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, "users", emailFormatado), {
                nome,
                nomeCompleto,
                cpf,
                dataNascimento,
                email: emailFormatado,
                telefone: phoneNumber,
                endereco: dadosEndereco,
                comprovanteEndereco: formData.comprovanteEndereco, // Extraído do formData
                cnh: formData.cnh, // Extraído do formData
                selfie: formData.selfie, // Extraído do formData
                aprovado: false,
                aluguelAtivoId: "",
                contratoId: "",
                motoAlugada: false,
                motoAlugadaId: "",
                role: "user",
                dataCadastro: new Date().toLocaleDateString('pt-BR'),
                uid: user.uid
            });

                setSucesso(true);
                setTimeout(() => {
                    navigation.navigate('concluido', { nome, email });
                }, 1500);


        } catch (error) {
            console.error(error);
            let mensagemErro = 'Ocorreu um erro ao criar a conta';
            
            if(error.code === 'auth/email-already-in-use') {
                mensagemErro = 'Este email já está em uso';
            }
            
            Alert.alert('Erro', mensagemErro);
            // Em caso de erro, desativa a flag
            setRegistrationInProcess(false);
        } finally {
            setLoading(false);
        }
    }


    return (
        <Pressable 
            onPress={Platform.OS !== 'web' ? () => Keyboard.dismiss() : undefined}
            style={{ flex: 1 }}
        >
            {sucesso ? (
              <ViewAnimacao>
                <AreaAnimacao>
                  <LottieAnimation
                    source={require("../../assets/final.json")}
                    autoPlay
                    loop={false}
                    speed={2}
                  />
                </AreaAnimacao>
              </ViewAnimacao>
             ) : ( <Background>
                    <Container>
                        <MaterialIcons
                            name="arrow-back"
                            size={28}
                            color="#fff"
                            style={{ marginTop: 10 }}
                            onPress={() => navigation.goBack()}
                        />
                        <AreaInput>
                            <AreaInputSenha>
                                <TextPage>Crie sua senha</TextPage>
                                <Input
                                    secureTextEntry={!passwordVisible}
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    // Exibe as indicações ao focar no input
                                    onFocus={() => {
                                        setShowPasswordCriteria(true); // Oculta as indicações quando o input perder o foco
                                        setFocusedInput('create'); // muda a cor do input 'repita sua senha' para preto
                                    }}
                                    onBlur={() => {
                                        setShowPasswordCriteria(false);
                                        setFocusedInput(null);
                                    }}
                                    style={{ paddingRight: 40 }} // Adicione paddingRight para o botão de olho
                                />
                                <ButtonIconPassaword // Botão de olho
                                    onPress={() => setPasswordVisible(!passwordVisible)} // Função para alternar a visibilidade da senha
                                >
                                    <MaterialIcons name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="#666" />
                                </ButtonIconPassaword>
                                </AreaInputSenha>
                                { passwordError !== '' &&
                                    <TextErrorPassword>{passwordError}</TextErrorPassword>}

                                    { showPasswordCriteria && (
                                        <AreaCriteriosSenha>
                                            <TextCriteriosSenha style={{ color: passwordValidation.minLength ? 'blue' : 'black'}}>
                                                • Mínimo de 8 caracteres
                                            </TextCriteriosSenha>
                                            <TextCriteriosSenha style={{ color: passwordValidation.number ? 'blue' : 'black'}}>
                                                • Pelo menos 1 número (0-9)
                                            </TextCriteriosSenha>
                                            <TextCriteriosSenha style={{ color: passwordValidation.symbol ? 'blue' : 'black'}}>
                                                • Pelo menos 1 símbolo especial (!, @, # ...)
                                            </TextCriteriosSenha>
                                            <TextCriteriosSenha style={{ color: passwordValidation.uppercase ? 'blue' : 'black'}}>
                                                • Pelo menos 1 letra maiúscula (A-Z)
                                            </TextCriteriosSenha>
                                        </AreaCriteriosSenha>
                                    )
                                }
                        </AreaInput>

                        <AreaInput>
                            <AreaInputSenha>
                                <TextPage style={{ color: focusedInput ? '#000' : 'rgb(226, 226, 226)' }}>
                                    Repita sua senha
                                </TextPage>
                                <Input
                                    value={senhaRepetida}
                                    onChangeText={handleRepeatPasswordChange}
                                    secureTextEntry={!repeatPasswordVisible}
                                    onFocus={() => setFocusedInput('repeat')} // muda a cor do input 'repita sua senha' para preto
                                    onBlur={() => setFocusedInput(null)} 
                                    style={{ paddingRight: 40 }}
                                />
                                <ButtonIconPassaword
                                    onPress={() => setRepeatPasswordVisible(!repeatPasswordVisible)}
                                >
                                    <MaterialIcons 
                                        name={repeatPasswordVisible ? 'visibility' : 'visibility-off'} 
                                        size={24} 
                                        color="#666" 
                                    />
                                </ButtonIconPassaword>
                                {senhaRepetidaErro ? 
                                    <TextErrorPassword>{senhaRepetidaErro}</TextErrorPassword> 
                                : null}
                            </AreaInputSenha>
                        </AreaInput>
                        
                        {password && senhaRepetida && (
                            <AreaButtonContinuar>
                            <ButtonContinuar onPress={handleConcluir} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <TextButtonContinuar>Concluir</TextButtonContinuar>}
                                </ButtonContinuar>
                            </AreaButtonContinuar>
                        )}
                        
                    </Container>
                </Background>
            )}
        </Pressable>

    );
}

