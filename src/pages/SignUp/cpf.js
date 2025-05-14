import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Importando o useFocusEffect para pausar a animação quando retornar para essa tela
import { Pressable, Keyboard, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LottieAnimation from "../../components/LottieAnimation"; 
import { useRoute } from "@react-navigation/native"; // Para pegar o nome passado pela navegação

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

export default function CPF({ navigation }) {
    const route = useRoute(); 
    const { nome, nomeCompleto } = route.params;
    const [cpf, setCpf] = useState('');
    const [cpfError, setCpfError] = useState({ cpf: '' });
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false); 
    const [cpfValido, setCpfValido] = useState(false); 

    useFocusEffect( 
        useCallback(() => { 
            setSucesso(false); 
        }, []) 
    );

    // Função para remover os caracteres não numéricos do cpf e verificar se ele tem 11 dígitos
    const validarCpf = (cpf) => {
        // Remove caracteres não numéricos
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        // Verifica se tem 11 dígitos
        if (cpfLimpo.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cpfLimpo)) return false;

        // Validação dos dígitos verificadores
        let soma = 0;
        let resto; 

        // Primeiro dígito verificador
        for (let i = 1; i <= 9; i++) {
        soma = soma + parseInt(cpfLimpo.substring(i-1, i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

        // Segundo dígito verificador
        soma = 0;
        for (let i = 1; i <= 10; i++) {
        soma = soma + parseInt(cpfLimpo.substring(i-1, i)) * (12 - i);
        }
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

        return true;
    };

    // Função para formatar o cpf enquanto digita e ele ficar com aquela formatação que vemos em vários sites
    const mascaraCpf = (texto) => {
        const numerosSomente = texto.replace(/\D/g, '');
        let numeroFormatado = numerosSomente;

        if (numerosSomente.length <= 11) {
            numeroFormatado = numerosSomente.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } 

        return numeroFormatado;
    };

    const handleContinuar = async () => {
        if (!validarCpf(cpf)) {
            setCpfError({ cpf: 'CPF inválido' });
            return;
        }

        Keyboard.dismiss();
        setSucesso(true); // Mostra a animação json de sucesso
        setTimeout(() => {
            navigation.navigate('Data de Nascimento', { nome, nomeCompleto, cpf }); 
        }, 2000) // Aguarda 2.0 segundos antes de navegar
            
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
                    <View style={{padding: 16}}>
                        <MaterialIcons 
                            name="arrow-back" 
                            size={28} 
                            color="#fff"
                            style={{ marginTop: 10}}
                            onPress={() => navigation.goBack()} 
                        />
                    </View>
                    <Container>
                        <AreaInput>
                            <TextPage>Digite seu CPF</TextPage>
                                <Input 
                                    value={cpf}
                                    placeholder='000.000.000-00'
                                    placeholderTextColor="rgb(207, 207, 207)"
                                    onChangeText={(text) => {
                                        const cpfFormatado = mascaraCpf(text);
                                        setCpf(cpfFormatado);

                                        const numerosSomente = text.replace(/\D/g, '');
                                        setCpfValido(validarCpf(numerosSomente));

                                        setCpfError(prev => ({ ...prev, cpf: '' }));
                                    }}
                                    keyboardType='numeric'
                                    maxLength={14}
                                    error={!!cpfError.cpf}
                                />
                            {cpfError.cpf ? <ErrorText>{cpfError.cpf}</ErrorText> : null}
                        </AreaInput>
                            
                        {cpf.length > 0 && (
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