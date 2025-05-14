import React from 'react';
import { View, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import {
    ScrollContainer,
    Header,
    TextTitleLista,
    TextDataDetalhes,
    TextTitleDetalhes,
    ImageDetalhes,
    Divider,
} from './styles';

export default function DetalhesTrocaOleo({ route, navigation }) {
    const { troca } = route.params;
    
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

    return (
        <ScrollContainer>
            <Header>
                <MaterialIcons
                    name="arrow-back"
                    size={28}
                    color="#000"
                    onPress={() => navigation.goBack()}
                />
                <TextTitleLista>Detalhes da troca de óleo</TextTitleLista>
            </Header>
            
            <TextDataDetalhes>Data: {troca.dataUpload}</TextDataDetalhes>
            
            <TextTitleDetalhes>Foto do Óleo</TextTitleDetalhes>
            <ImageDetalhes
                source={{ uri: troca.fotoOleo }}
                resizeMode="contain"
            />
            <Divider />
            
            <TextTitleDetalhes>Nota Fiscal</TextTitleDetalhes>
            <ImageDetalhes
                source={{ uri: troca.fotoNota }}
                resizeMode="contain"
            />
            <Divider />
            
            <TextTitleDetalhes>Quilometragem</TextTitleDetalhes>
            <ImageDetalhes
                source={{ uri: troca.fotoKm }}
                resizeMode="contain"
            />
            <Divider />
            
            <TextTitleDetalhes>Vídeo da Troca</TextTitleDetalhes>
            <WebVideo/>
        </ScrollContainer>
    );
}
