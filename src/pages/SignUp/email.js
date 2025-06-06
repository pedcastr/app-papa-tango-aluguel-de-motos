import React, { useState, useCallback } from "react";
import { View } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Alert, ActivityIndicator, Platform, Pressable } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import LottieAnimation from "../../components/LottieAnimation";
import { useRoute } from "@react-navigation/native";

import {
    Background,
    Container,
    AreaInput,
    TextPage,
    Input,
    ErrorText,
    AreaButtonContinuar,
    ButtonContinuar,
    TextButtonContinuar,
    AreaAnimacao,
    ViewAnimacao,
} from "./styles";

export default function Email({ navigation }) {
    const route = useRoute();
    const { nome, nomeCompleto, cpf, dataNascimento } = route.params;
    const [email, setEmail] = useState('');
    const [erros, setErros] = useState({ email: '' });
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setSucesso(false);
        }, [])
    );

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Função para validar o formato do e-mail
    const validarEmail = (email) => {
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regexEmail.test(email);
    };

    // Função principal para seguir para próxima tela, salvando o usuário no firebase
    const emailContinuar = async () => {
        Keyboard.dismiss();
        setLoading(true);

        let novosErros = {};

        if (!validarEmail(email)) {
            novosErros.email = "Digite um e-mail válido";
        }

        setErros(novosErros);

        if (Object.keys(novosErros).length === 0) {
            try {

                // Enviar código de verificação
                const response = await fetch("https://enviarcodigoemail-q3zrn7ctxq-uc.a.run.app", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                setSucesso(true);

                setTimeout(() => {
                    if (data.success) {
                        navigation.navigate("Verificação de Email", { email, nome, nomeCompleto, cpf, dataNascimento });
                    } else {
                        showMessage("Erro", "Falha ao enviar o código, tente novamente.");
                    }
                }, 1500);

            } catch (error) {
                showMessage("Erro", "Por favor, tente novamente mais tarde.");
                console.error("Erro ao salvar e-mail ou enviar código:", error);
            }
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
                            <TextPage>Digite seu email</TextPage>
                            <Input
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setErros(prev => ({ ...prev, email: "" }));
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={!!erros.email}
                                autoCorrect={false}
                            />
                            {erros.email ? <ErrorText>{erros.email}</ErrorText> : null}
                        </AreaInput>

                        {email.length > 0 && (
                            <AreaButtonContinuar>
                                <ButtonContinuar onPress={emailContinuar} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <TextButtonContinuar>Continuar</TextButtonContinuar>}
                                </ButtonContinuar>
                            </AreaButtonContinuar>
                        )}
                    </Container>
                </Background>
            )}
        </Pressable>
    );
}