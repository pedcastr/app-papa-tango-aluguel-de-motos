import React, { useState, useCallback } from "react";
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
} from "./styles";

export default function Telefone({ navigation }) {
    const route = useRoute();
    const { email, nome, nomeCompleto, cpf } = route.params; 
    const [telefone, setTelefone] = useState(''); 
    const [erros, setErros] = useState({ telefone: '' }); 
    const [loading, setLoading] = useState(false); 
    const [sucesso, setSucesso] = useState(false); 
    const [telefoneValido, setTelefoneValido] = useState(false); //estado para controlar visibilidade do botão continuar

    // Usado para pausar a animação json quando o usuário retorna para essa tela
    useFocusEffect( 
        useCallback(() => { 
            setSucesso(false); 
        }, []) 
    );

    // Função para validar o número de telefone
    const validarTelefone = (numero) => {
        const numeroLimpo = numero.replace(/\D/g, ''); // Remove caracteres não numéricos
        if (numeroLimpo.length !== 11) return false; // Verifica se o número tem 11 dígitos
        if (numeroLimpo[2] !== '9') return false; // Verifica se o terceiro dígito é '9'
        return true;
    };

    // Função para formatar o telefone (de forma visual)
    const mascaraTelefone = (texto) => {
        const numeroLimpo = texto.replace(/\D/g, ''); // Remove caracteres não numéricos
        let numeroFormatado = numeroLimpo;
        
        if (numeroLimpo.length >= 11) {
            numeroFormatado = `(${numeroLimpo.slice(0,2)}) ${numeroLimpo.slice(2,7)}-${numeroLimpo.slice(7,11)}`; // Formata o número
        }
        
        return numeroFormatado;
    };

    // Função que envia o código via WhatsApp usando a API local
    const enviarCodigoWhatsApp = async (numero) => {
        const codigo = Math.floor(100000 + Math.random() * 900000).toString(); // Gera um código aleatório de 6 dígitos e trasforma em string
        
        // Remove todos os caracteres especiais e espaços
        let numeroLimpo = numero
            .replace('+', '') // Remove o sinal de mais
            .replace(/\s/g, '') // Remove espaços
            .replace(/\D/g, ''); // Remove caracteres não numéricos
        
        // número no formato: 5585999999999
        if (numeroLimpo.length === 11) {
            numeroLimpo = '55' + numeroLimpo;
        }
        
        console.log('Número enviado:', numeroLimpo); // Para consulta
        
        try {
            const response = await fetch('http://192.168.100.89:3000/enviar-codigo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    numero: numeroLimpo,
                    codigo: codigo.toString()
                })
            });
    
            const data = await response.json();
            if (data.success) {
                return codigo;
            }
            throw new Error('Falha ao enviar código'); // Lança um erro se a resposta não for bem-sucedida
        } catch (error) {
            console.log('Erro no envio:', error);
            throw error;
        }
    };

    // Função principal de validação e envio do código
    const telefoneContinuar = async () => {
        Keyboard.dismiss();
        setLoading(true);

        let novosErros = {};

        const numeroLimpo = telefone.replace(/\D/g, '');

        setErros(novosErros);

        if (Object.keys(novosErros).length === 0) {
            try {
                // Formata o número com +55
                const numeroFormatado = `+55${numeroLimpo}`;

                // Envia o código via WhatsApp
                const codigoVerificacao = await enviarCodigoWhatsApp(numeroFormatado);
                
                // Mostra animação de sucesso e navega para tela de verificação
                setSucesso(true);
                setTimeout(() => {
                    navigation.navigate("VerifyPhone", {
                        codigo: codigoVerificacao,
                        phoneNumber: numeroFormatado,
                        email,
                        nome,
                        nomeCompleto,
                        cpf,
                    });
                }, 1500);
            } catch (error) {
                console.log('Erro:', error);
                Alert.alert("Erro", "Falha ao enviar o código de verificação");
            } finally {
                setLoading(false);
            }
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
                            onPress={() => navigation.goBack()} // Navega para a tela anterior
                        />

                        <AreaInput>
                            <TextPage>Digite o seu número de WhatsApp com DDD</TextPage>
                            <Input
                                placeholder="(85) 99999-9999"
                                placeholderTextColor="rgb(207, 207, 207)"
                                value={telefone}
                                onChangeText={(text) => {
                                    const textoFormatado = mascaraTelefone(text); // Formata o texto
                                    setTelefone(textoFormatado); // Atualiza o estado do telefone

                                    const numeroLimpo = text.replace(/\D/g, '');
                                    setTelefoneValido(validarTelefone(numeroLimpo));
                                }}
                                keyboardType="phone-pad"
                                maxLength={15}
                                autoCapitalize="none"
                                autoCorrect={false}
                                error={!!erros.telefone} // Indica se há erro
                            />
                            {erros.telefone ? <ErrorText>{erros.telefone}</ErrorText> : null}
                        </AreaInput>

                        {telefoneValido && (
                            <AreaButtonContinuar>
                                <ButtonContinuar onPress={telefoneContinuar} disabled={loading}>
                                    {loading ? <ActivityIndicator size="small" color="#FFF" /> : <TextButtonContinuar>Continuar</TextButtonContinuar>}
                                </ButtonContinuar>
                            </AreaButtonContinuar>
                        )}

                    </Container>
                </Background>
            )}
        </Pressable>
    );
}
