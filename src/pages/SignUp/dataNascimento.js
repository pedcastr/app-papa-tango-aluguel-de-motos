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

export default function DataNascimento({ navigation }) {
    const route = useRoute();
    const { nome, nomeCompleto, cpf } = route.params;
    const [dataNascimento, setDataNascimento] = useState('');
    const [dataNascimentoError, setDataNascimentoError] = useState({ dataNascimento: '' });
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);


    useFocusEffect(
        useCallback(() => {
            setSucesso(false);
        }, [])
    );

    // Função para formatar a DataNascimento enquanto digita e ele ficar com aquela formatação que vemos em vários sites
    const mascaraDataNascimento = (texto) => {
        const numerosSomente = texto.replace(/\D/g, '');
        let numeroFormatado = numerosSomente;

        if (numerosSomente.length > 0) {
            // Formata como DD
            numeroFormatado = numerosSomente.substring(0, 2);

            if (numerosSomente.length > 2) {
                // Formata como DD/MM
                numeroFormatado = `${numerosSomente.substring(0, 2)}/${numerosSomente.substring(2, 4)}`;

                if (numerosSomente.length > 4) {
                    // Formata como DD/MM/AAAA
                    numeroFormatado = `${numerosSomente.substring(0, 2)}/${numerosSomente.substring(2, 4)}/${numerosSomente.substring(4, 8)}`;
                }
            }
        }

        return numeroFormatado;
    };

    // Função para validar se a data é verídica
    const validarData = (data) => {
        // Verifica se o formato é DD/MM/AAAA
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
            return { valido: false, mensagem: 'Formato inválido. Use DD/MM/AAAA' };
        }

        const [dia, mes, ano] = data.split('/').map(Number);
        const dataObj = new Date(ano, mes - 1, dia);
        const hoje = new Date();

        // Verifica se a data é válida (ex: 31/02/2023 não é válido)
        if (dataObj.getDate() !== dia || dataObj.getMonth() !== mes - 1 || dataObj.getFullYear() !== ano) {
            return { valido: false, mensagem: 'Data inválida' };
        }

        // Verifica se a data é futura
        if (dataObj > hoje) {
            return { valido: false, mensagem: 'A data não pode ser futura' };
        }

        // Verifica se a pessoa tem uma idade improvável (mais de 120 anos)
        const idadeMaxima = 120;
        const dataMinima = new Date();
        dataMinima.setFullYear(hoje.getFullYear() - idadeMaxima);
        if (dataObj < dataMinima) {
            return { valido: false, mensagem: 'Idade improvável' };
        }

        // Verificar se é maior de idade
        const maioridade = new Date();
        maioridade.setFullYear(hoje.getFullYear() - 18);
        if (dataObj > maioridade) {
            return { valido: false, mensagem: 'Você deve ser maior de idade' };
        }

        return { valido: true, mensagem: '' };
    };

    const handleContinuar = async () => {
        if (!dataNascimento) {
            setDataNascimentoError({ dataNascimento: 'Campo obrigatório' });
            return;
        }

        const validacao = validarData(dataNascimento);
        if (!validacao.valido) {
            setDataNascimentoError({ dataNascimento: validacao.mensagem });
            return;
        }

        Keyboard.dismiss();
        setLoading(true);

        try {
            setSucesso(true); // Mostra a animação json de sucesso
            setTimeout(() => {
                navigation.navigate('Email', { nome, nomeCompleto, cpf, dataNascimento });
            }, 2000); // Aguarda 2.0 segundos antes de navegar
        } catch (error) {
            console.error('Erro ao processar data de nascimento:', error);
            setDataNascimentoError({ dataNascimento: 'Erro ao processar. Tente novamente.' });
        } finally {
            setLoading(false);
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
                            <TextPage>Digite sua data de nascimento</TextPage>
                            <Input
                                value={dataNascimento}
                                placeholder='00/00/0000'
                                placeholderTextColor="rgb(207, 207, 207)"
                                onChangeText={(text) => {
                                    const dataFormatada = mascaraDataNascimento(text);
                                    setDataNascimento(dataFormatada);

                                    setDataNascimentoError(prev => ({ ...prev, dataNascimento: '' }));
                                }}
                                keyboardType='numeric'
                                maxLength={10}
                                error={!!dataNascimentoError.dataNascimento}
                            />
                            {dataNascimentoError.dataNascimento ? <ErrorText>{dataNascimentoError.dataNascimento}</ErrorText> : null}
                        </AreaInput>

                        {dataNascimento.length > 0 && (
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
