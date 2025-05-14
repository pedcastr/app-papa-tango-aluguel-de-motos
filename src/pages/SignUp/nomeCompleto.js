import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, Keyboard, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LottieAnimation from "../../components/LottieAnimation";
import { useRoute } from "@react-navigation/native";

import {
    Background,
    Container,
    AreaAnimacao,
    AreaInput,
    TextPage,
    Input,
    ErrorText,
    AreaButtonContinuar,
    ButtonContinuar,
    TextButtonContinuar,
    ViewAnimacao,
} from './styles';

export default function NomeCompleto({ navigation }) {
    const [nomeCompleto, setNomeCompleto] = useState('');
    const route = useRoute();
    const { nome } = route.params;
    const [nomeCompletoError, setNomeCompletoError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setSucesso(false);
        }, [])
    );

    const validarNomeCompleto = (nome) => {
        // Remove espaços extras no início e fim
        const nomeTrimmed = nome.trim();

        // Divide o nome em palavras
        const palavras = nomeTrimmed.split(/\s+/);

        // Verifica se há pelo menos duas palavras
        if (palavras.length < 2) {
            return false;
        }

        // Verifica se cada palavra tem pelo menos 2 caracteres
        for (const palavra of palavras) {
            if (palavra.length < 2) {
                return false;
            }
        }

        return true;
    };

    const handleContinuar = async () => {
        if (!validarNomeCompleto(nomeCompleto)) {
            setNomeCompletoError('Por favor, insira seu nome completo (nome e sobrenome)');
            return;
        }

        Keyboard.dismiss();
        setSucesso(true);
        setTimeout(() => {
            navigation.navigate('CPF', { nome, nomeCompleto });
        }, 2000)

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
                            <TextPage>Qual o seu nome completo?</TextPage>
                            <Input
                                value={nomeCompleto}
                                onChangeText={(text) => {
                                    setNomeCompleto(text);
                                    setNomeCompletoError('');
                                }}
                                autoCapitalize="words"
                                error={!!nomeCompletoError}
                            />
                            {nomeCompletoError ? <ErrorText>{nomeCompletoError}</ErrorText> : null}
                        </AreaInput>

                        {nomeCompleto.length > 0 && (
                            <AreaButtonContinuar>
                                <ButtonContinuar onPress={handleContinuar} disabled={loading}>
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
