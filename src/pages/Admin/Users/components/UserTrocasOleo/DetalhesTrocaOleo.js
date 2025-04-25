import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { 
    ScrollContainer,
    TextDataDetalhes,
    TextTitleDetalhes,
    ImageDetalhes,
    ButtonContainer,
    ContactButton,
    ButtonText
} from './styles';
import { 
    Alert,
    TextInput, 
    Linking,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function DetalhesTrocaOleo({ route }) { 
    const { troca, userData } = route.params;
    const [motoInfo, setMotoInfo] = useState(null);
    const [kmProximaTroca, setKmProximaTroca] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Buscar informações da moto quando o componente carregar
    useEffect(() => {
        const fetchMotoInfo = async () => {
            try {
                setLoading(true);
                if (userData && userData.motoAlugadaId) {
                    const db = getFirestore();
                    
                    // Acessa diretamente o documento da moto usando o ID
                    const motoDoc = await getDoc(doc(db, "motos", userData.motoAlugadaId));
                    
                    if (motoDoc.exists()) {
                        console.log("Dados da moto encontrados:", motoDoc.data());
                        setMotoInfo(motoDoc.data());
                    } else {
                        console.log("Documento da moto não encontrado, tentando buscar por consulta");
                        
                        // Método alternativo: buscar por consulta
                        const motosRef = collection(db, "motos");
                        const motosSnapshot = await getDocs(motosRef);
                        
                        let found = false;
                        motosSnapshot.forEach((doc) => {
                            if (doc.id === userData.motoAlugadaId) {
                                console.log("Moto encontrada por consulta:", doc.data());
                                setMotoInfo(doc.data());
                                found = true;
                            }
                        });
                        
                        if (!found) {
                            console.log("Moto não encontrada em nenhuma consulta");
                        }
                    }
                } else {
                    console.log("ID da moto não disponível no userData:", userData);
                }
            } catch (error) {
                console.error("Erro ao buscar informações da moto:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchMotoInfo();
    }, [userData]);

    // Componente de vídeo específico para web
    const WebVideo = () => {
        // Usando React Native Web para renderizar um elemento HTML nativo
        return (
            <View style={{ width: '100%', height: 350, marginBottom: 20 }}>
                {/* O elemento video HTML nativo só funciona na web */}
                {Platform.OS === 'web' ? (
                    <video
                        src={troca.videoOleo}
                        controls
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#D9D9D9',
                        }}
                    />
                ) : (
                    // Fallback para mobile - continua usando WebView
                    <WebView
                        source={{
                            html: `
                            <html>
                            <body style="margin:0;padding:0;background-color:#D9D9D9;">
                                <video
                                width="100%"
                                height="100%"
                                controls
                                style="background-color:#D9D9D9;"
                                >
                                <source src="${troca.videoOleo}" type="video/mp4">
                                </video>
                            </body>
                            </html>
                            `
                        }}
                        style={{ width: '100%', height: '100%' }}
                    />
                )}
            </View>
        );
    };

    // Função para obter a descrição da moto
    const getMotoDescription = () => {
        if (motoInfo) {
            return `${motoInfo.modelo || 'Modelo não disponível'} ${motoInfo.anoModelo || ''} - ${motoInfo.placa || 'Placa não disponível'}`;
        }
        return "Informações da moto não disponíveis";
    };

    /**
     * Formata o número de telefone para o formato internacional
     */
    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        
        // Remove todos os caracteres não numéricos
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Verifica o formato e adiciona o código do país se necessário
        if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
            // Já está no formato correto
        } else if (cleanPhone.length === 11 || cleanPhone.length === 10) {
            // Número brasileiro sem código do país (com ou sem 9º dígito)
            cleanPhone = '55' + cleanPhone;
        } else if (cleanPhone.length === 9 || cleanPhone.length === 8) {
            // Apenas o número sem DDD, assumimos DDD 11 (São Paulo)
            cleanPhone = '5511' + cleanPhone;
        }
        
        return cleanPhone;
    };

    /**
     * Abre a foto no navegador para download
     */
    const openPhotoInBrowser = () => {
        if (!troca.fotoKm) {
            Alert.alert("Erro", "URL da foto não disponível");
            return;
        }
        
        // Abre a URL da foto diretamente no navegador
        Linking.openURL(troca.fotoKm)
            .then(() => {
                console.log("Navegador aberto com sucesso");
            })
            .catch(err => {
                console.error("Erro ao abrir o navegador:", err);
                Alert.alert("Erro", "Não foi possível abrir a foto no navegador.");
            });
    };

    /**
     * Abre o WhatsApp com uma mensagem pré-preenchida
     */
    const openWhatsApp = async () => {
        if (!kmProximaTroca) {
            Alert.alert("Atenção", "Por favor, informe o KM da próxima troca antes de enviar a mensagem.");
            return;
        }

        const phone = formatPhoneNumber(userData.telefone);
        if (!phone) {
            Alert.alert("Erro", "Telefone do usuário não disponível");
            return;
        }
        
        // Prepara a mensagem para o WhatsApp
        const message = encodeURIComponent(`Olá *${userData.nome}*\n\n Segue o seu alerta de troca de óleo com a foto do painel mostrando os kms totais da moto enviado por você\n\n⚠️ *ALERTA TROCA DE ÓLEO*⚠️\n\n*Moto:* ${getMotoDescription()}\n*Próxima troca:* ${kmProximaTroca}Kms\n*Viscosidade:* 10w30\n*Marcas recomendadas:* Mobil, Ipiranga, Lubrax, Castrol e Petronas.\n\n⚠️Recomendamos o óleo Móbil, pois ele trás mais desempenho ao motor e economia de combustível⚠️\n\n*Recomendações quando for trocar o óleo*\n\n\n- Tirar uma foto do óleo que será colocado\n\n- Gravar um vídeo adicionando o novo óleo e mostrar o painel da moto no mesmo vídeo\n\n- Tirar uma foto do km da moto após colocar o novo óleo\n\n- Tirar uma foto do comprovante de compra do óleo, constando a data em que foi realizada a compra`);
        
        const url = `https://wa.me/${phone}?text=${message}`;
        
        // Abre o WhatsApp
        Linking.openURL(url).catch(err => {
            console.error("Erro ao abrir o WhatsApp:", err);
            Alert.alert("Erro", "Não foi possível abrir o WhatsApp");
        });
    };

    /**
     * Abre o cliente de email com uma mensagem pré-preenchida
     */
    const openEmail = async () => {
        if (!kmProximaTroca) {
            Alert.alert("Atenção", "Por favor, informe o KM da próxima troca antes de enviar a mensagem.");
            return;
        }

        const email = userData.email;
        if (!email) {
            Alert.alert("Erro", "Email do usuário não disponível");
            return;
        }

        // Prepara o assunto e corpo do email
        const subject = encodeURIComponent("⚠️ ALERTA TROCA DE ÓLEO ⚠️");
        const body = encodeURIComponent(`Olá ${userData.nome}\n\n Segue o seu alerta de troca de óleo com a foto do painel mostrando os kms totais da moto enviado por você\n\n⚠️ ALERTA TROCA DE ÓLEO ⚠️\n\nMoto: ${getMotoDescription()}\n\nPróxima troca: ${kmProximaTroca}Kms\n\nViscosidade: 10w30\n\nMarcas recomendadas: Mobil, Ipiranga, Lubrax, Castrol e Petronas.\n\n\n⚠️Recomendamos o óleo Móbil, pois ele trás mais desempenho ao motor e economia de combustível⚠️\n\n\nRecomendações quando for trocar o óleo\n\n\n- Tirar uma foto do óleo que será colocado\n\n- Gravar um vídeo adicionando o novo óleo e mostrar o painel da moto no mesmo vídeo\n\n- Tirar uma foto do km da moto após colocar o novo óleo\n\n- Tirar uma foto do comprovante de compra do óleo, constando a data em que foi realizada a compra`);
        
        let url = `mailto:${email}?subject=${subject}&body=${body}`;
        
        // Abre o cliente de email
        Linking.openURL(url).catch(err => {
            console.error("Erro ao abrir o cliente de email:", err);
            Alert.alert("Erro", "Não foi possível abrir o cliente de email");
        });
    };

    return (
        <ScrollContainer>
            <TextDataDetalhes>Data: {troca.dataUpload}</TextDataDetalhes>
            
            <TextTitleDetalhes>Foto do Óleo</TextTitleDetalhes>
            <ImageDetalhes 
                source={{ uri: troca.fotoOleo }}
                resizeMode="contain"
            />

            <TextTitleDetalhes>Nota Fiscal</TextTitleDetalhes>
            <ImageDetalhes
                source={{ uri: troca.fotoNota }}
                resizeMode="contain"
            />

            <TextTitleDetalhes>Quilometragem</TextTitleDetalhes>
            <ImageDetalhes
                source={{ uri: troca.fotoKm }}
                resizeMode="contain"
            />

            <TextTitleDetalhes>Vídeo da Troca</TextTitleDetalhes>
            <WebVideo/>
            
            <View style={{ padding: 15, marginTop: 20 }}>
                <TextTitleDetalhes>Informar KM da próxima troca:</TextTitleDetalhes>
                <TextInput
                    style={{
                        height: 50,
                        borderColor: '#ccc',
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: 15,
                        marginTop: 10,
                        marginBottom: 20,
                        fontSize: 16
                    }}
                    placeholder="Digite o KM da próxima troca"
                    keyboardType="numeric"
                    value={kmProximaTroca}
                    onChangeText={setKmProximaTroca}
                />
                
                {/* Botão para abrir a foto no navegador */}
                <ButtonContainer>
                    <ContactButton 
                        onPress={openPhotoInBrowser}
                        style={{ backgroundColor: '#4CAF50', marginRight: 10 }}
                    >
                        <FontAwesome name="external-link" size={20} color="#FFFFFF" />
                        <ButtonText>Baixar Foto no Navegador</ButtonText>
                    </ContactButton>
                </ButtonContainer>
                
                {/* Botões para contato */}
                <TextTitleDetalhes style={{ marginTop: 20 }}>(OBS.: Baixe a foto e anexe a mensagem do WhatsApp e Email){'\n\n'} Enviar alerta para o cliente:</TextTitleDetalhes>
                <ButtonContainer>
                    <ContactButton 
                        onPress={openWhatsApp}
                        style={{ backgroundColor: '#25D366', marginRight: 10 }}
                    >
                        <FontAwesome name="whatsapp" size={20} color="#FFFFFF" />
                        <ButtonText>WhatsApp</ButtonText>
                    </ContactButton>
                    
                    <ContactButton 
                        onPress={openEmail}
                        style={{ backgroundColor: '#D44638' }}
                    >
                        <FontAwesome name="envelope" size={20} color="#FFFFFF" />
                        <ButtonText>Email</ButtonText>
                    </ContactButton>
                </ButtonContainer>
            </View>
        </ScrollContainer>
    );
}
