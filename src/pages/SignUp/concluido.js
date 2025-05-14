import React, { useState, useEffect } from 'react';
import { useRoute } from "@react-navigation/native";
import { Linking, ActivityIndicator, Platform } from 'react-native';
import LottieAnimation from "../../components/LottieAnimation";
import { FontAwesome } from '@expo/vector-icons';

import {
    Container,
    AreaButtonContinuar,
    ButtonContinuar,
    TextButtonContinuar,
    BackgroundPageConcluido,
    ButtonSupportPageConcluido,
    TextPageConcluido
} from './styles';

export default function Concluido({ navigation }) {

    const route = useRoute();
    const { nome, email } = route.params;
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const enviarEmailConfirmacao = async () => {
            try {
                const response = await fetch("https://enviaremailconclusao-q3zrn7ctxq-uc.a.run.app", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        nome
                    })
                });

                const data = await response.json();
            } catch (error) {
                console.error('Erro ao enviar email:', error);
            }
        };

        enviarEmailConfirmacao();
    }, []);

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Função para abrir WhatsApp
    const abrirWhatsApp = () => {
        setLoading(true);
        const telefone = '5585992684035';
        const mensagem = 'Olá! Cheguei na última etapa do cadastro através do app e preciso de ajuda :)';
        const urlWhatsapp = `whatsapp://send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;

        Linking.canOpenURL(urlWhatsapp)
            .then(suportado => {
                if (suportado) {
                    return Linking.openURL(urlWhatsapp);
                } else {
                    showMessage('WhatsApp não está instalado');
                }
            })
            .catch(erro => {
                console.error('Erro ao abrir WhatsApp:', erro);
                showMessage('Não foi possível abrir o WhatsApp');
            });
        setLoading(false);
    };

    return (
        <BackgroundPageConcluido>
            <Container>
                <TextPageConcluido style={{ marginTop: 30, textAlign: 'center', marginBottom: 30, color: '#CB2921' }}>Olá, {nome}!</TextPageConcluido>
                <TextPageConcluido>
                    Você chegou na última etapa do cadastro! 🎉🏍️🥳{'\n\n'}
                    Pedimos que aguarde até 4 horas úteis para fazermos a análise de sua documentação{'\n\n'}
                    Você receberá um email de confirmação e falaremos com você através do WhatsApp assim que sua conta for aprovada.
                </TextPageConcluido>
                <LottieAnimation
                    source={require('../../assets/tempo.json')}
                    autoPlay
                    loop={true}
                    style={{ width: '100%', height: '300', alignSelf: 'center' }}
                />
                <AreaButtonContinuar style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ButtonContinuar onPress={() => navigation.navigate('Login')}>
                        <TextButtonContinuar>Ok</TextButtonContinuar>
                    </ButtonContinuar>
                    <ButtonSupportPageConcluido onPress={abrirWhatsApp}>
                        {loading ? <ActivityIndicator color="#fff" /> : <FontAwesome name="whatsapp" size={24} color="#fff" />}
                    </ButtonSupportPageConcluido>
                </AreaButtonContinuar>
            </Container>
        </BackgroundPageConcluido>
    );
}