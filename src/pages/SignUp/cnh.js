import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import PhotoPicker from '../../components/PhotoPicker';
import PdfViewer from '../../components/PdfViewer';
import * as DocumentPicker from 'expo-document-picker';
import LottieAnimation from "../../components/LottieAnimation";
import { storage } from '../../services/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Background,
  Container,
  ViewAnimacao,
  AreaAnimacao,
  TextPage,
  ButtonContainer,
  UploadButton,
  PdfContainer,
  AreaButtonContinuar,
  ButtonContinuar,
  TextButtonContinuar,
  TextPageCNH,
  ButtonContent,
  IconImage,
  ImageContainer,
  PreviewImage,
  RemoveButton,
} from './styles';

export default function CNH({ navigation }) {
  const route = useRoute();
  const { email, nome, nomeCompleto, cpf, phoneNumber, dadosEndereco, formData: existingFormData } = route.params;
  
  // FormData com os arquivos da CNH
  const [formData, setFormData] = useState({
    ...existingFormData,
    cnh: {
      frente: null,
      verso: null,
      pdf: null
    }
  });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedButton, setSelectedButton] = useState(null); // 'front' ou 'back'
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [pdfInstructionsShown, setPdfInstructionsShown] = useState(false);

  // Detectar se é desktop na web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const updateLayout = () => {
        setIsDesktop(window.innerWidth >= 768);
      };
      
      updateLayout(); // Verificar inicialmente
      window.addEventListener('resize', updateLayout);
      
      return () => window.removeEventListener('resize', updateLayout);
    }
  }, []);
  
  // Voltar a animação para o início se a tela for reexibida
  useFocusEffect(
    useCallback(() => {
      setSucesso(false);
    }, [])
  );
  
  // Função para atualizar a imagem após retorno do PhotoPicker
  const updateImage = (result) => {
    if(result && result.uri){
      if(selectedButton === 'front'){
        setFrontImage(result);
        // Se o PDF estiver selecionado, limpar
        if(pdfFile) setPdfFile(null);
      } else if(selectedButton === 'back'){
        setBackImage(result);
        // Se o PDF estiver selecionado, limpar
        if(pdfFile) setPdfFile(null);
      }
    }
  };

  // Abre o modal de escolha de foto (foto/tirar foto)
  const handleButtonPress = (buttonType) => {
    setSelectedButton(buttonType);
    setModalVisible(true);
  };

  // Abre o DocumentPicker para seleção de PDF
  const abrirPdf = async () => {
      
      // Verifica se está na web mobile
      const isWebMobile = Platform.OS === 'web' && window.innerWidth < 768;
      
      // Para web mobile, mostramos um toast ou mensagem na tela antes de abrir o seletor
      if (isWebMobile && Platform.OS === 'web' && !pdfInstructionsShown) {
        // Marca que as instruções foram mostradas para não mostrar novamente
        setPdfInstructionsShown(true);
        
        // Mostra uma mensagem temporária na tela
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'fixed';
        messageDiv.style.bottom = '20%';
        messageDiv.style.left = '10%';
        messageDiv.style.right = '10%';
        messageDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '15px';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.zIndex = '9999';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.fontSize = '16px';
        messageDiv.innerHTML = "Quando o seletor de arquivos abrir, clique no ícone de 'Arquivos' ou 'Documentos' ou 'Fotos e Vídeos' ou qualquer outro que não seja a câmera para acessar seus arquivos e selecione o PDF desejado.";
        
        document.body.appendChild(messageDiv);
        
        // Remove a mensagem após 8 segundos
        setTimeout(() => {
          if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
          }
        }, 8000);
        
        // Pequeno atraso antes de abrir o seletor para dar tempo de ler a mensagem
        setTimeout(() => {
          // Continua com a seleção normal
          try {
            DocumentPicker.getDocumentAsync({
              type: 'application/pdf',
              copyToCacheDirectory: true
            }).then(resultado => {
              if (resultado.canceled === false && resultado.assets && resultado.assets.length > 0) {
                const pdfAsset = resultado.assets[0];
                if (!pdfAsset.name && pdfAsset.uri) {
                  const uriParts = pdfAsset.uri.split('/');
                  pdfAsset.name = uriParts[uriParts.length - 1] || "documento.pdf";
                }
                setPdfFile(pdfAsset);
                setPhotoImage(null);
              }
            }).catch(err => {
              console.error("Erro ao selecionar PDF: ", err);
            });
          } catch (err) {
            console.error("Erro ao selecionar PDF: ", err);
          }
        }, 1500);
        
        return;
      }
      
      // Comportamento normal para outras plataformas ou se as instruções já foram mostradas
      try {
        // Solicitar permissão primeiro (se necessário)
        if (Platform.OS === 'android') {
          const permissionGranted = await solicitarPermissaoStorage();
          if (!permissionGranted) {
            Alert.alert("Permissão negada", "Precisamos de acesso ao armazenamento para selecionar PDFs.");
            return;
          }
        }
        
        const resultado = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true
        });
        
        if (resultado.canceled === false && resultado.assets && resultado.assets.length > 0) {
          const pdfAsset = resultado.assets[0];
          console.log("PDF selecionado:", pdfAsset);
          if (!pdfAsset.name && pdfAsset.uri) {
            const uriParts = pdfAsset.uri.split('/');
            pdfAsset.name = uriParts[uriParts.length - 1] || "documento.pdf";
          }
          
          setPdfFile(pdfAsset);
          // Se o PDF for selecionado, limpar as imagens
          setFrontImage(null);
          setBackImage(null);

        }
      } catch (err) {
        console.error("Erro ao selecionar PDF: ", err);
        Alert.alert("Erro", "Não foi possível selecionar o PDF. Tente novamente.");
      }
    };

  // Função para solicitar permissão de armazenamento (Android)
  const solicitarPermissaoStorage = async () => {
    if (Platform.OS === 'ios') return true;
    if (Platform.OS === 'android' && Platform.Version >= 33) return true;
    
    try {
      const { PermissionsAndroid } = require('react-native');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: "Permissão de Acesso aos Arquivos",
          message: "O aplicativo precisa de acesso ao armazenamento para ler arquivos PDF",
          buttonNeutral: "Pergunte-me depois",
          buttonNegative: "Cancelar",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Erro na solicitação da permissão de armazenamento", err);
      return false;
    }
  };

  // Função para upload e navegação para a próxima tela
  const handleCnhContinuar = async () => {
    setLoading(true);
    try {
      const updatedFormData = { ...formData };
      let downloadURLFront = null;
      let downloadURLBack = null;
      let downloadURLPdf = null;
      
      if(frontImage) {
        const response = await fetch(frontImage.uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `users/${email}/cnh/frente_${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        downloadURLFront = await getDownloadURL(storageRef);
        updatedFormData.cnh.frente = {
          arquivoUrl: downloadURLFront,
          dataUpload: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          tipo: 'imagem',
          nome: `frente_${Date.now()}.jpg`
        };
      }
      
      if(backImage) {
        const response = await fetch(backImage.uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `users/${email}/cnh/verso_${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        downloadURLBack = await getDownloadURL(storageRef);
        updatedFormData.cnh.verso = {
          arquivoUrl: downloadURLBack,
          dataUpload: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          tipo: 'imagem',
          nome: `verso_${Date.now()}.jpg`
        };
      }
      
      if(pdfFile) {
        const response = await fetch(pdfFile.uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `users/${email}/cnh/pdf_${Date.now()}.pdf`);
        await uploadBytes(storageRef, blob);
        downloadURLPdf = await getDownloadURL(storageRef);
        updatedFormData.cnh.pdf = {
          arquivoUrl: downloadURLPdf,
          dataUpload: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          tipo: 'pdf',
          nome: `pdf_${Date.now()}.pdf`
        };
        // Se o pdf foi enviado e não houver imagens, limpar os campos de imagem
        if(pdfFile && !frontImage && !backImage) {
          updatedFormData.cnh.frente = null;
          updatedFormData.cnh.verso = null;
        }
      }
      
      setFormData(updatedFormData);
      setSucesso(true);
      setTimeout(() => {
        navigation.navigate("selfie", {
          email,
          nome,
          nomeCompleto,
          cpf,
          phoneNumber,
          dadosEndereco,
          formData: updatedFormData
        });
      }, 1500);
    } catch (error) {
      console.log("Erro no upload:", error);
      Alert.alert("Erro", "Falha ao enviar o(s) arquivo(s). Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
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
              onPress={() => navigation.goBack()}
            />
            <TextPage style={{ marginTop: 30 }}>
              Tire foto da frente e verso da CNH ou envie o PDF do arquivo exportado da CNH digital
            </TextPage>
            <ButtonContainer>
              {/* Botão para foto frontal - USANDO O DESIGN DO CLI */}
              <UploadButton 
                onPress={() => handleButtonPress('front')}
                disabled={pdfFile !== null}
              >
                {frontImage ? (
                  <ImageContainer>
                    <PreviewImage source={{ uri: frontImage.uri }}/>
                    <TextPageCNH>Frente da CNH</TextPageCNH>
                    <RemoveButton onPress={() => setFrontImage(null)}>
                      <MaterialIcons name="close" size={20} color="#000" />
                    </RemoveButton>
                  </ImageContainer>
                ) : (
                  <ButtonContent>
                    <IconImage 
                      source={require('../../assets/cnh-frente.jpg')} 
                      style={pdfFile ? styles.disabledImage : null}
                    />
                    <TextPageCNH style={pdfFile ? styles.disabledText : null}>
                      Frente da CNH
                    </TextPageCNH>
                  </ButtonContent>
                )}
              </UploadButton>
              
              {/* Botão para foto traseira - USANDO O DESIGN DO CLI */}
              <UploadButton 
                onPress={() => handleButtonPress('back')}
                disabled={pdfFile !== null}
              >
                {backImage ? (
                  <ImageContainer>
                    <PreviewImage source={{ uri: backImage.uri }}/>
                    <TextPageCNH>Verso da CNH</TextPageCNH>
                    <RemoveButton onPress={() => setBackImage(null)}>
                      <MaterialIcons name="close" size={20} color="#000" />
                    </RemoveButton>
                  </ImageContainer>
                ) : (
                  <ButtonContent>
                    <IconImage 
                      source={require('../../assets/cnh-verso.jpg')} 
                      style={pdfFile ? styles.disabledImage : null}
                    />
                    <TextPageCNH style={pdfFile ? styles.disabledText : null}>
                      Verso da CNH
                    </TextPageCNH>
                  </ButtonContent>
                )}
              </UploadButton>
              
              {/* Botão para PDF - Ajustado para desktop */}
              <UploadButton 
                onPress={abrirPdf} 
                style={[
                  pdfFile && styles.uploadButtonWithPdf,
                  // Se for desktop e tiver PDF, ajusta a altura para ser maior
                  isDesktop && pdfFile && styles.desktopPdfContainer
                ]}
                disabled={frontImage !== null || backImage !== null}
              >
                {pdfFile ? (
                  <PdfContainer style={isDesktop ? styles.desktopPdfInnerContainer : null}>
                    <PdfViewer
                      uri={pdfFile.uri}
                      fileName={pdfFile.name || "documento.pdf"}
                      onRemove={() => setPdfFile(null)}
                      style={styles.fullSizePdfViewer}
                    />
                  </PdfContainer>
                ) : (
                  <ButtonContent>
                    <MaterialIcons 
                      name="picture-as-pdf" 
                      size={40} 
                      color={(frontImage || backImage) ? "#ccc" : "#000"} 
                    />
                    <TextPageCNH 
                      style={[
                        { marginLeft: 10 },
                        (frontImage || backImage) ? styles.disabledText : null
                      ]}
                    >
                      CNH Digital (PDF)
                    </TextPageCNH>
                  </ButtonContent>
                )}
              </UploadButton>
            </ButtonContainer>
            
            {/* Botão de continuar - Ajustado para ficar abaixo do PDF em desktop */}
            {(frontImage || backImage || pdfFile) && (
              <AreaButtonContinuar style={isDesktop && pdfFile ? styles.desktopContinueButton : null }>
                <ButtonContinuar onPress={handleCnhContinuar} style={{marginTop: 30}}>
                  {loading ? <ActivityIndicator color="#fff" /> : <TextButtonContinuar>Continuar</TextButtonContinuar>}
                </ButtonContinuar>
              </AreaButtonContinuar>
            )}
          </Container>
          
          {/* Modal para escolher tirar foto/selecionar da galeria */}
          <PhotoPicker
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onImageSelected={updateImage}
          />
        </Background>
      )}
    </ScrollView>
  );
}

// Estilos adicionais para controlar estados desabilitados e o container do PDF
const styles = StyleSheet.create({
  disabledImage: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
  uploadButtonWithPdf: {
    height: 300, // Altura maior para acomodar o PDF, igual ao CLI
  },
  pdfViewerContainer: {
    flex: 1,
    width: '100%',
    height: '85%', // Deixa espaço para o texto abaixo
    borderRadius: 5,
    overflow: 'hidden',
  },
  removeButtonContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullSizePdfViewer: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  desktopPdfContainer: {
    height: 500, // Altura maior para desktop
    maxHeight: 500,
  },
  desktopPdfInnerContainer: {
    height: '100%',
    position: 'relative',
  },
  desktopContinueButton: {
    marginTop: 70, // Espaço adicional para separar do PDF
    position: 'relative', // Garante que não sobreponha o PDF
    marginBottom: 30, // Espaço adicional para separar do fundo da tela
  },
});
