import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native'; // Importando o useFocusEffect para pausar a animação quando retornar para essa tela
import { Pressable, Keyboard, ActivityIndicator, Platform, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LottieAnimation from "../../components/LottieAnimation";

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

export default function Nome({ navigation }) {
    const [nome, setNome] = useState('');
    const [nomeError, setNomeError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false); // Estado para mostrar a animação json

    // Usado para pausar a animação json quando o usuário retorna para essa tela
    useFocusEffect( // useFocusEffect é usado para executar uma função de efeito sempre que a tela é focada
        useCallback(() => { // useCallback é usado para memorizar uma função, evitando que a função seja recriada a cada renderização
            setSucesso(false); // Reseta o estado de sucesso quando a tela é focada novamente
        }, []) // logo, quando o usuário entra na tela, a animação json de sucesso é resetada e só é chamada caso o usuário siga para outra tela.
    );

    const handleContinuar = async () => {
        Keyboard.dismiss();

        setSucesso(true); // Mostra a animação json de sucesso

        setTimeout(() => {
            navigation.navigate('Nome Completo', { nome });
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
                            <TextPage>Como deseja ser chamado(a)?</TextPage>
                            <Input
                                value={nome}
                                onChangeText={(text) => {
                                    setNome(text);
                                    setNomeError('');
                                }}
                                autoCapitalize="words"
                                error={!!nomeError}
                            />
                            {nomeError ? <ErrorText>{nomeError}</ErrorText> : null}
                        </AreaInput>

                        {nome.length > 0 && (
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
