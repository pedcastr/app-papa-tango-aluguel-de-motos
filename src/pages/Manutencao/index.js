import React, { useState, useCallback, useEffect } from 'react';
import { Linking, ActivityIndicator, View } from 'react-native';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { FeedbackModal } from '../../components/FeedbackModal'; // Modal de feedback

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

    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', title: '', message: '' })

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
                    setFeedback({
                        type: 'error',
                        title: 'WhatsApp não está instalado',
                        message: 'Não foi possível abrir o WhatsApp\nSe o problema persistir, entre em contato por WhatsApp com o suporte no número (85) 99268-4035 ou envie um e-mail para papatangoalugueldemotos@gmail.com'
                    });
                    setFeedbackVisible(true);
                }
            })
            .catch(erro => {
                console.error('Erro ao abrir WhatsApp:', erro);
                setFeedback({
                    type: 'error',
                    title: 'Erro ao abrir o WhatsApp',
                    message: 'Não foi possível abrir o WhatsApp\nSe o problema persistir, entre em contato por WhatsApp com o suporte no número (85) 99268-4035 ou envie um e-mail para papatangoalugueldemotos@gmail.com'
                });
                setFeedbackVisible(true);
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
            {feedbackVisible && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}
                >
                    <FeedbackModal
                        visible={feedbackVisible}
                        {...feedback}
                        onClose={() => setFeedbackVisible(false)}
                    />
                </View>
            )}
        </Container>
    );
}