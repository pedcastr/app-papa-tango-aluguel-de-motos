import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native'; // Importando o useFocusEffect para pausar a animação quando retornar para essa tela
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
    const [sucesso, setSucesso] = useState(false); // Estado para mostrar a animação json

    // Usado para pausar a animação json quando o usuário retorna para essa tela
    useFocusEffect( // useFocusEffect é usado para executar uma função de efeito sempre que a tela é focada
        useCallback(() => { // useCallback é usado para memorizar uma função, evitando que a função seja recriada a cada renderização
            setSucesso(false); // Reseta o estado de sucesso quando a tela é focada novamente
        }, []) // logo, quando o usuário entra na tela, a animação json de sucesso é resetada e só é chamada caso o usuário siga para outra tela.
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
            navigation.navigate('cpf', { nome, nomeCompleto });
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
                    <Container>
                        <MaterialIcons 
                            name="arrow-back" 
                            size={28} 
                            color="#fff"
                            style={{ marginTop: 10 }}
                            onPress={() => navigation.goBack()} 
                        />
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
