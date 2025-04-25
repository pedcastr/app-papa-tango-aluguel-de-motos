import React, {useState, useCallback} from 'react'; 
import { Linking, Alert } from 'react-native';
import { 
    Container, 
    TextTitle,
    AreaEscolha,
    ButtonOleo,
    ButtonProblemas,
    TextButtons,
} from "./styles";

export default function Manutencao({ navigation }) { 

    const [loading, setLoading] = useState(false);

    // Função para abrir WhatsApp
    const abrirWhatsApp = useCallback(() => { 
            
        setLoading(true);
        const telefone = '5585992684035';
        const mensagem = 'Olá! Preciso de ajuda :)\n\n Já  estou logado no app da Papa Tango e estou com problemas mecânicos na moto';
        const urlWhatsapp = `whatsapp://send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;
            
        Linking.canOpenURL(urlWhatsapp)
            .then(suportado => {
                if (suportado) {
                    return Linking.openURL(urlWhatsapp);
                } else {
                    Alert.alert('WhatsApp não está instalado');
                }
            })
            .catch(erro => {
                console.error('Erro ao abrir WhatsApp:', erro);
                Alert.alert('Não foi possível abrir o WhatsApp');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <Container>
            <TextTitle>Manutencão</TextTitle>

            <AreaEscolha>

                <ButtonOleo onPress={() => navigation.navigate('ListaTrocasOleo')}>
                    <TextButtons>Informar troca de óleo</TextButtons>
                </ButtonOleo>

                <ButtonProblemas onPress={abrirWhatsApp}>
                    {loading ? (
                        <TextButtons>Abrindo WhatsApp...</TextButtons>
                    ) : (
                        <TextButtons>Problemas com a moto</TextButtons>
                    )}
                </ButtonProblemas>

            </AreaEscolha>

        </Container>
    );
}