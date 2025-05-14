import React, { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Platform, Alert, ActivityIndicator, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import LottieAnimation from "../../components/LottieAnimation";
import { useRoute, useNavigation } from "@react-navigation/native";

import {
    Background,
    Container,
    AreaAnimacao,
    ViewAnimacao,
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


export default function EmailVerification() {
    const route = useRoute();
    const navigation = useNavigation();
    const { email, nome, nomeCompleto, cpf, dataNascimento } = route.params;
    const [codigo, setCodigo] = useState('');
    const [erros, setErros] = useState({ codigo: '' });
    const [loading, setLoading] = useState(false);
    const [reenviando, setReenviando] = useState(false);
    const [timer, setTimer] = useState(60);
    const [sucesso, setSucesso] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setSucesso(false);
        }, [])
    );

    // Timer para reenvio do código
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Função para reenviar o código
    const reenviarCodigo = async () => {
        if (timer === 0) {
            setReenviando(true);
            setCodigo('');

            try {
                await fetch("https://enviarcodigoemail-q3zrn7ctxq-uc.a.run.app", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                setTimer(60);
                showMessage("Código reenviado!");
            } catch (error) {
                showMessage("Erro", "Falha ao reenviar código.\nPor favor, tente novamente.");
            }

            setReenviando(false);
        }
    };

    // Função para verificar o código
    const verificarCodigo = async () => {
        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await fetch("https://verificarcodigo-q3zrn7ctxq-uc.a.run.app", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, codigo })
            });

            const data = await response.json();

            if (data.success) {

                setSucesso(true);
                setTimeout(() => {
                    navigation.navigate("Telefone", { email, nome, nomeCompleto, cpf, dataNascimento });
                }, 1500);

            } else {
                setErros({ codigo: "Código incorreto, tente novamente ou solicite um novo código." });
            }
        } catch (error) {
            showMessage("Erro", "Erro ao conectar ao servidor.\nPor favor, tente novamente mais tarde.");
        }

        setLoading(false);
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
                    <View style={{ padding: 16 }}>
                        <MaterialIcons
                            name="arrow-back"
                            size={28}
                            color="#fff"
                            style={{ marginTop: 10 }}
                            onPress={() => navigation.goBack()}
                        />
                    </View>
                    <Container>
                        <AreaInput>
                            <TextPage style={{ marginBottom: 10 }}>Digite o código enviado para o e-mail: {email}</TextPage>
                            <Input
                                value={codigo}
                                onChangeText={(text) => {
                                    setCodigo(text);
                                    setErros(prev => ({ ...prev, codigo: "" }));
                                }}
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                maxLength={6}
                                error={!!erros.codigo}
                                autoCorrect={false}
                            />
                            {erros.codigo ? <ErrorText>{erros.codigo}</ErrorText> : null}
                        </AreaInput>

                        {codigo.length >= 6 && !loading && !reenviando && (
                            <AreaButtonContinuar>
                                <ButtonContinuar onPress={verificarCodigo} disabled={loading}>
                                    <TextButtonContinuar>Verificar Código</TextButtonContinuar>
                                </ButtonContinuar>
                            </AreaButtonContinuar>
                        )}

                        {loading && (
                            <AreaButtonContinuar>
                                <ButtonContinuar>
                                    <TextButtonContinuar>
                                        <ActivityIndicator size="small" color="#fff" />
                                    </TextButtonContinuar>
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