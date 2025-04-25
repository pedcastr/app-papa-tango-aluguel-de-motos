import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Platform, ActivityIndicator, Alert, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import LottieAnimation from "../../components/LottieAnimation";
import { useRoute } from "@react-navigation/native";

import {
    Background,
    Container,
    ViewAnimacao,
    AreaAnimacao,
    AreaInput,
    TextPage,
    Input,
    ErrorText,
    AreaButtonContinuar,
    ButtonContinuar,
    TextButtonContinuar,
    ButtonReenvio,
    TextButtonReenvio,
} from "./styles";

export default function VerifyPhone({ navigation }) {
    const route = useRoute();
    const { phoneNumber, email, nome, nomeCompleto, codigo: codigoEnviado, cpf } = route.params;
    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState({ codigo: '' });;
    const [sucesso, setSucesso] = useState(false);
    const [reenviando, setReenviando] = useState(false);
    const [timer, setTimer] = useState(60);
    const [codigoAtual, setCodigoAtual] = useState(codigoEnviado);

    // Formata o número de telefone para exibição
    const formatarTelefone = (numero) => {
        const numeroLimpo = numero.replace(/\D/g, '').replace(/^55/, '');
        return `(${numeroLimpo.slice(0,2)}) ${numeroLimpo.slice(2,7)}-${numeroLimpo.slice(7)}`;
    };

    // Timer para reenvio do código
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Reseta animação ao voltar para tela
    useFocusEffect(
        useCallback(() => {
            setSucesso(false);
        }, [])
    );

    // Verifica o código digitado
    const verificarCodigo = async () => {
        console.log('Código digitado:', codigo);
        console.log('Código atual:', codigoAtual);
        
        setLoading(true);
        setErro({ codigo: '' });
        Keyboard.dismiss();
    
        if (codigo === codigoAtual) {
            setSucesso(true);
            setTimeout(() => {
                navigation.navigate("endereco", {
                    email,
                    nome,
                    nomeCompleto,
                    phoneNumber,
                    cpf,
                });
            }, 1500);
        } else {
            setErro({ codigo: 'Código incorreto.\nTente novamente, ou solicite um novo código.' });
        }
        setLoading(false);
    };

    // Reenvia o código via servidor venom-bot
    const reenviarCodigo = async () => {
        if (timer === 0) {
            setReenviando(true);

            try {
                const novoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
                
                const response = await fetch('http://192.168.100.89:3000/enviar-codigo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        numero: phoneNumber,
                        codigo: novoCodigo
                    })
                });
        
                const data = await response.json();
                
                if (data.success) {
                    setCodigoAtual(novoCodigo);
                    setTimer(60);
                    Alert.alert("Código reenviado!");
                }
            } catch (error) {
                console.log('Erro no reenvio:', error);
                Alert.alert("Erro", "Falha ao reenviar o código.\ntente novamente.");
            }

        setReenviando(false);

        }
    };

    return (
        <Pressable 
            onPress={Platform.OS !== 'web' ? () => Keyboard.dismiss() : undefined}
            style={{ flex: 1 }}
        >
            {sucesso ? (
                <ViewAnimacao>
                    <AreaAnimacao>
                        <LottieAnimation
                            source={require("../../assets/animacao.json")}
                            autoPlay
                            loop={false}
                            speed={2}
                        />
                    </AreaAnimacao>
                </ViewAnimacao>
            ) : (            
                <Background>
                    <Container>
                        <MaterialIcons
                            name="arrow-back"
                            size={28}
                            color="#fff"
                            style={{ marginTop: 10 }}
                            onPress={() => navigation.goBack()}
                        />

                        <AreaInput>
                            <TextPage style={{ marginBottom: 10 }}>
                                Digite o código enviado para{'\n'}{formatarTelefone(phoneNumber)}
                            </TextPage>
                            <Input
                                value={codigo}
                                onChangeText={(text) => {
                                    setCodigo(text);
                                    setErro(prev => ({ ...prev, codigo: "" }));
                                }}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoCapitalize="none"
                                error={!!erro.codigo}
                                autoCorrect={false}
                            />
                            {erro.codigo ? <ErrorText>{erro.codigo}</ErrorText> : null}
                        </AreaInput>

                        {codigo.length === 6 && (
                            <AreaButtonContinuar>
                                <ButtonContinuar onPress={verificarCodigo} disabled={loading}>
                                    {loading || reenviando ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <TextButtonContinuar>Verificar</TextButtonContinuar>
                                    )}
                                </ButtonContinuar>
                        </AreaButtonContinuar>
                        )}

                        <ButtonReenvio onPress={reenviarCodigo} disabled={timer > 0 || reenviando}>
                            <TextButtonReenvio>
                                {reenviando ? 'Reenviando código...' : 
                                    timer > 0 ? `Reenviar código em ${timer}s` : "Reenviar código"
                                }
                            </TextButtonReenvio>
                        </ButtonReenvio>

                    </Container>
                </Background>
            )}
        </Pressable>
    );
}