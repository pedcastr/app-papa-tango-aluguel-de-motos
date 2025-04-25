import React, { useState, useRef, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native'; 
import { Keyboard, Platform, ActivityIndicator, Alert, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import LottieAnimation from "../../components/LottieAnimation";
import { useRoute } from "@react-navigation/native";
import api from "../../services/api";

import {
    Background,
    Container,
    ViewAnimacao,
    AreaAnimacao,
    AreaInput,
    TextPage,
    Input,
    RowContainer,
    HalfAreaInput,
    SmallInput,
    ErrorText,
    AreaButtonContinuar,
    ButtonContinuar,
    TextButtonContinuar,
} from "./styles";

export default function Endereco({ navigation }) {
    const route = useRoute();
    const { email, nome, nomeCompleto, phoneNumber, cpf } = route.params; 
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState({ cep : '' });
    const [erroNumero, setErroNumero] = useState(''); 
    const [cep, setCep] = useState('');
    const [numero, setNumero] = useState('');
    const [enderecoDados, setEnderecoDados] = useState(null); 
    const [mostrarCampos, setMostrarCampos] = useState(false); // Estado para controlar a exibição dos campos
    const inputRef = useRef(null); 
    const [inputCepFocused, setInputCepFocused] = useState(false); // Estado para controlar a exibição do input de CEP
    const [sucesso, setSucesso] = useState(false); 
    const [enderecoValido, setEnderecoValido] = useState(false); //estado para controlar visibilidade do botão continuar

    // Usado para pausar a animação json quando o usuário retorna para essa tela
    useFocusEffect( 
        useCallback(() => { 
            setSucesso(false); 
        }, []) 
    );

    // Função para remover os caracteres não numéricos do CEP e verificar se ele tem 8 dígitos
    const validarCep = (numero) => {
        const numerosSomente = numero.replace(/\D/g, ''); // explicação: esse (/D/g) significa que estamos procurando por qualquer caractere que não seja um dígito (ou seja, qualquer caractere que não seja um número). O g no final significa que estamos procurando por todos os caracteres que correspondem a essa condição e após a vírgula, estamos dizendo que queremos que essa busca seja feita globalmente (ou seja, em todo o texto).
        if (numerosSomente.length !== 8) return false; // Verifica se o cep tem 8 dígitos
        return true;
    };

    // Função para formatar o CEP enquanto digita e ele ficar com aquela formatação que vemos em vários sites
    const mascaraCep = (texto) => {
        const numerosSomente = texto.replace(/\D/g, '');
        let numeroFormatado = numerosSomente;

        if (numerosSomente.length <= 8) {
            numeroFormatado = numerosSomente.replace(/(\d{5})(\d{3})/, '$1-$2'); // explicação: (\d{5})(\d{3}) -> captura os 5 primeiros dígitos e os 3 seguintes e adiciona um hífen entre eles se fosse ( . ) seria .{5}.{3} e após a vírgula tem o $1 e $2 que são os grupos capturados, ou seja, os 5 primeiros dígitos e os 3 seguintes.
        }

        return numeroFormatado;
    };

    // Função para buscar dados do CEP usando a API ViaCEP
    const buscarCep = async () => {
        if (cep.length < 8) {
            setErro({cep: 'Digite um CEP válido'});
            return;
        }

        setLoading(true);
        setErro('');
        setErroNumero('');

        try {
            const cepLimpo = cep.replace(/\D/g, '');
            const response = await api.get(`/${cepLimpo}/json`);
            
            if (response.data.erro) {
                setErro({cep: 'CEP não encontrado'});
                setLoading(false);
                return;
            }

            setEnderecoDados(response.data);
            setMostrarCampos(true);
            setInputCepFocused(false);
            setNumero('');
            Keyboard.dismiss();
        } catch (error) {
            setErro({cep: 'Erro ao buscar CEP'});
            console.log('ERRO:', error);
        }

        setLoading(false);
    };

    const handleContinuar = async () => {
        if (!numero) {
            setErroNumero('Digite o número do endereço');
            setErro('');
            return;
        }
        setErroNumero('');
        setLoading(true);

        try {
            // Preparar dados para salvar no Firestore
            const dadosEndereco = {
                cep: cep,
                logradouro: enderecoDados.logradouro,
                numero: numero,
                bairro: enderecoDados.bairro,
                cidade: enderecoDados.localidade,
                estado: enderecoDados.uf
            };

            setSucesso(true); // Mostrar a animação json de sucesso

            setTimeout(() => {
                navigation.navigate("comprovanteDeEndereco", { email, nome, nomeCompleto, phoneNumber, dadosEndereco, cpf });
            }, 1500); // Aguarda 1.5 segundos antes de navegar
            
        } catch (error) {
            Alert.alert("Erro", "Erro ao salvar endereço.");
            console.error("Erro ao salvar endereço:", error);
        }

        setLoading(false);
    };

    return (
            <Pressable 
                onPress={Platform.OS !== 'web' ? () => Keyboard.dismiss() : undefined}
                style={{ flex: 1 }}
                setInputCepFocused={false}
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
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <Container>
                            <MaterialIcons
                                name="arrow-back"
                                size={28}
                                color="#fff"
                                style={{ marginTop: 10 }}
                                onPress={() => navigation.goBack()}
                            />

                            <AreaInput>
                                <TextPage>Digite seu CEP</TextPage>
                                <Input 
                                    value={cep}
                                    placeholder="00000-000"
                                    placeholderTextColor="rgb(207, 207, 207)"
                                    onChangeText={(text) => {
                                        const cepFormatado = mascaraCep(text);
                                        setCep(cepFormatado);

                                        const numerosSomente = text.replace(/\D/g, '');
                                        setEnderecoValido(validarCep(numerosSomente));
                                        
                                        setErro(prev => ({ ...prev, cep: "" }));
                                    }}
                                    keyboardType="numeric"
                                    maxLength={9}
                                    ref={inputRef}
                                    error={!!erro.cep}
                                    onFocus={() => setInputCepFocused(true)}
                                />
                            </AreaInput>

                            {erro.cep && <ErrorText>{erro.cep}</ErrorText>}
                            
                            {cep.length > 0 && (
                                <AreaButtonContinuar>
                                    <ButtonContinuar onPress={buscarCep} disabled={loading}>
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <TextButtonContinuar>Buscar</TextButtonContinuar>
                                        )}
                                    </ButtonContinuar>
                                </AreaButtonContinuar>
                            )}

                            {!inputCepFocused && mostrarCampos && (
                                <>
                                    <AreaInput>
                                        <TextPage style={{color: 'black'}}>Logradouro</TextPage>
                                        <Input 
                                            value={enderecoDados.logradouro}
                                            editable={false}
                                        />
                                    </AreaInput>

                                <RowContainer>
                                        <HalfAreaInput>
                                            <TextPage style={{color: 'black'}}>Número</TextPage>
                                            <SmallInput
                                                value={numero}
                                                onChangeText={(text) => {
                                                    setNumero(text);
                                                    setErroNumero('');
                                                }}
                                                keyboardType="numeric"
                                                error={!!erroNumero}
                                            />
                                            {erroNumero !== '' && (
                                            <ErrorText style={{color: 'red'}}>{erroNumero}</ErrorText>
                                            )}

                                        </HalfAreaInput>
                                            <HalfAreaInput>
                                            <TextPage style={{color: 'black'}}>Bairro</TextPage>
                                            <SmallInput 
                                                value={enderecoDados.bairro}
                                                editable={false}
                                            />
                                        </HalfAreaInput>
                                </RowContainer>

                                <RowContainer>
                                    <HalfAreaInput>
                                        <TextPage style={{color: 'black'}}>Cidade</TextPage>
                                        <SmallInput 
                                            value={enderecoDados.localidade}
                                            editable={false}
                                        />
                                    </HalfAreaInput>

                                    <HalfAreaInput>
                                        <TextPage style={{color: 'black'}}>Estado</TextPage>
                                        <SmallInput 
                                            value={enderecoDados.uf}
                                            editable={false}
                                        />
                                    </HalfAreaInput>
                                    </RowContainer>

                                    <AreaButtonContinuar>
                                        <ButtonContinuar onPress={handleContinuar} disabled={loading}>
                                            {loading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <TextButtonContinuar>Continuar</TextButtonContinuar>
                                            )}
                                        </ButtonContinuar>
                                    </AreaButtonContinuar>
                                </>
                            )}
                        </Container>
                    </ScrollView>
                </Background>
            )}
        </Pressable>
    );
}
