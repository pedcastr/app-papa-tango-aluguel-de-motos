import React, { useState, useCallback } from 'react';
import {
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LottieAnimation from "../../components/LottieAnimation";
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebaseConfig';
// Importando os componentes reutilizáveis
import PhotoPicker from '../../components/PhotoPicker'; // Componente para seleção de foto
import ImagePreview from '../../components/ImagePreview'; // Componente para visualização de imagem
import PdfViewer from '../../components/PdfViewer'; // Componente para visualização de PDF

import {
  Background,
  Container,
  AreaAnimacao,
  ViewAnimacao,
  TextPage,
  ButtonFoto,
  AreaButtonContinuar,
  ButtonContinuar,
  TextButtonContinuar,
  AreaOpcoes,
  ButtonPdf,
  AreaImage,
  AreaPdf,
  ButtonIconCancelar
} from './styles';

export default function ComprovanteDeEndereco({ navigation }) {
  const route = useRoute();
  const { email, nome, nomeCompleto, phoneNumber, dadosEndereco, cpf, dataNascimento } = route.params;

  const [formData, setFormData] = useState({
    comprovanteEndereco: {
      arquivo: null,
      pdf: null
    }
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [photoImage, setPhotoImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [pdfInstructionsShown, setPdfInstructionsShown] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSucesso(false);
    }, [])
  );

  // Abre o modal para escolha da foto (PhotoPicker)
  const abrirOpcoes = () => {
    setModalVisible(true);
  };

  // Abre o seletor de PDF (usando expo-document-picker)
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
        setPhotoImage(null);
      }
    } catch (err) {
      console.error("Erro ao selecionar PDF: ", err);
      Alert.alert("Erro", "Não foi possível selecionar o PDF. Tente novamente.");
    }
  };

  // Solicita permissão para acesso a armazenamento (caso necessário, Android antigo)
  const solicitarPermissaoStorage = async () => {
    if (Platform.OS === 'ios') return true;
    if (Platform.OS === 'android' && Platform.Version >= 33) return true;
    try {
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

  // Função principal de upload e navegação para a tela "CNH"
  const handlecomprovanteDeEnderecoContinuar = async () => {
    setLoading(true);
    try {
      const updatedFormData = { ...formData };
      // Se a foto foi selecionada
      if (photoImage) {
        const response = await fetch(photoImage.uri);
        const blob = await response.blob();
        const storagePath = `users/${email}/comprovantes/foto_${Date.now()}.jpg`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, blob);
        console.log("Upload da foto realizado com sucesso!");
        const downloadURL = await getDownloadURL(storageRef);
        updatedFormData.comprovanteEndereco.arquivo = {
          arquivoUrl: downloadURL,
          dataUpload: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          tipo: 'imagem',
          nome: `foto_${Date.now()}.jpg`
        };
        // Garante que o PDF seja removido se a imagem for enviada
        updatedFormData.comprovanteEndereco.pdf = null;
      }
      // Se o PDF foi selecionado
      if (pdfFile) {
        const response = await fetch(pdfFile.uri);
        const blob = await response.blob();
        const storagePath = `users/${email}/comprovantes/doc_${Date.now()}.pdf`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, blob);
        console.log("Upload do PDF realizado com sucesso!");
        const downloadURL = await getDownloadURL(storageRef);
        updatedFormData.comprovanteEndereco.pdf = {
          arquivoUrl: downloadURL,
          dataUpload: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          tipo: 'pdf',
          nome: `doc_${Date.now()}.pdf`
        };
        // Garante que a imagem seja removida se um PDF for enviado
        updatedFormData.comprovanteEndereco.arquivo = null;
      }

      setFormData(updatedFormData);
      setSucesso(true);
      setTimeout(() => {
        navigation.navigate("CNH", {
          email,
          nome,
          nomeCompleto,
          phoneNumber,
          dadosEndereco,
          formData: updatedFormData,
          cpf,
          dataNascimento,
        });
      }, 1500);
    } catch (error) {
      console.log("Erro no upload:", error);
      Alert.alert("Erro", "Falha ao enviar o arquivo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={{ 
        flexGrow: 1, // Isso garante que o conteúdo seja esticado para ocupar toda a altura disponível
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
            <TextPage style={{ marginTop: 30, textAlign: 'center' }}>
              Tire uma foto, pegue da sua galeria ou envie em formato PDF, algum comprovante de endereço que esteja no seu nome
            </TextPage>
            <AreaOpcoes>
              {photoImage ? (
                // Se a foto foi selecionada, exibe o preview com botão de remover
                <ButtonFoto onPress={abrirOpcoes} style={{ width: '100%' }}>
                  <AreaImage>
                    <ImagePreview
                      uri={photoImage.uri}
                      onRemove={() => setPhotoImage(null)}
                    />
                  </AreaImage>
                </ButtonFoto>
              ) : pdfFile ? (
                // Se o PDF foi selecionado, exibe o visualizador de PDF
                <ButtonPdf onPress={abrirPdf} style={{ width: '100%' }}>
                  <AreaPdf>
                  <PdfViewer 
                    uri={pdfFile.uri} 
                    fileName={pdfFile.name || "documento.pdf"}
                    onRemove={() => setPdfFile(null)}
                  />
                    <ButtonIconCancelar onPress={() => setPdfFile(null)}>
                      <MaterialIcons name="close" size={20} color="#000" />
                    </ButtonIconCancelar>
                  </AreaPdf>
                </ButtonPdf>
              ) : (
                // Se nenhum arquivo foi selecionado, exibe os botões para foto e PDF
                <>
                  <ButtonFoto onPress={abrirOpcoes} style={{ width: '50%', marginTop: 60 }}>
                    <MaterialIcons name="camera-alt" size={118} color="#000" />
                  </ButtonFoto>
                  <ButtonPdf onPress={abrirPdf} style={{ width: '50%', marginTop: 60 }}>
                    <MaterialIcons name="picture-as-pdf" size={118} color="#000" />
                  </ButtonPdf>
                </>
              )}
            </AreaOpcoes>
            {(photoImage || pdfFile) && (
              <AreaButtonContinuar style={{ marginTop: -50 }}>
                <ButtonContinuar onPress={handlecomprovanteDeEnderecoContinuar}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <TextButtonContinuar>Continuar</TextButtonContinuar>
                  )}
                </ButtonContinuar>
              </AreaButtonContinuar>
            )}
            {/* Modal para opções de escolha de foto */}
            <PhotoPicker
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              onImageSelected={result => {
                setPhotoImage(result);
                setPdfFile(null);
              }}
            />
          </Container>
        </Background>
      )}
    </ScrollView>
  );
}
