import React, { useState, useCallback, useEffect } from 'react';
import { Linking, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import {
    Container,
    TextTitle,
    AreaEscolha,
    ButtonOleo,
    ButtonProblemas,
    TextButtons,
    AreaSemContratoAtivo,
    TextaAreaSemContrato,
    LoadingContainer,
} from "./styles";

export default function Manutencao({ navigation }) {

    // Carrega os dados 
    useEffect(() => {
        setLoadingContrato(true);
        carregarDados();
    }, []);

    const [loading, setLoading] = useState(false);
    const [loadingContrato, setLoadingContrato] = useState(false);
    const [contratoAtivo, setContratoAtivo] = useState(false);

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Função para abrir WhatsApp para manutenção
    const abrirWhatsAppManutencao = useCallback(() => {
        setLoading(true);
        const telefone = '5585992684035';
        const mensagem = 'Olá! Preciso de ajuda :)\n\nJá estou logado no app da Papa Tango e estou com problemas mecânicos na moto';
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
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Função para verificar se tem contrato ativo
    const carregarDados = async () => {
        try {
            setLoadingContrato(true);
            const userDoc = await getDoc(doc(db, "users", auth.currentUser.email));
            const userData = userDoc.data();

            if (userData.motoAlugada && userData.motoAlugadaId) {
                // Carrega dados do contrato usando contratoId
                const contratoDoc = await getDoc(doc(db, 'contratos', userData.contratoId));
                const contratoData = contratoDoc.data();
                setContratoAtivo({
                    ...contratoData
                });
            }

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoadingContrato(false);
        }
    }

    return (
        <Container>
            <TextTitle>Manutencão</TextTitle>

            {loadingContrato ? (
                <LoadingContainer>
                    <ActivityIndicator size="large" color="#CB2921" />
                </LoadingContainer>
            ) : (
                <>
                    {contratoAtivo ? (
                        contratoAtivo.statusContrato === true ? (
                            <AreaEscolha>

                                <ButtonOleo onPress={() => navigation.navigate('Lista de Trocas de Óleo')}>
                                    <TextButtons>Informar troca de óleo</TextButtons>
                                </ButtonOleo>

                                <ButtonProblemas onPress={abrirWhatsAppManutencao} activeOpacity={0.7}>
                                    {loading ? (
                                        <TextButtons>Abrindo WhatsApp...</TextButtons>
                                    ) : (
                                        <TextButtons>Problemas com a moto</TextButtons>
                                    )}
                                </ButtonProblemas>

                            </AreaEscolha>
                        ) : (
                            <AreaSemContratoAtivo>
                                <TextaAreaSemContrato>Você não possui contrato ativo</TextaAreaSemContrato>
                            </AreaSemContratoAtivo>
                        )
                    ) : (
                        <AreaSemContratoAtivo>
                            <TextaAreaSemContrato>Você não possui contrato ativo</TextaAreaSemContrato>
                        </AreaSemContratoAtivo>
                    )}
                </>
            )}
        </Container>
    );
}