import React, { useState, useCallback } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Alert, ActivityIndicator, View, ScrollView, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieAnimation from "../../components/LottieAnimation";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebaseConfig';
import PhotoPicker from '../../components/PhotoPicker';
import ImagePreview from '../../components/ImagePreview';

import {
  Background,
  Container,
  AreaAnimacao,
  ViewAnimacao,
  TextPage,
  ButtonContinuar,
  TextButtonContinuar,
  AreaDescricao,
  TextAreaDescricao,
  AreaPhotoImage,
} from './styles';

export default function Selfie({ navigation }) {
  const route = useRoute();
  const { email, nome, nomeCompleto, cpf, phoneNumber, dadosEndereco, formData, dataNascimento } = route.params;

  // Estado para armazenar a selfie tirada
  const [photoImage, setPhotoImage] = useState(null);
  // Controla a exibição do modal para escolher a câmera
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSucesso(false);
    }, [])
  );

  // Função para mostrar mensagem de sucesso/erro
  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Ao invés de chamar diretamente launchCamera,
  // abrimos o modal PhotoPicker que permite usar a câmera
  const abrirPhotoPicker = () => {
    setModalVisible(true);
  };

  // Função para fazer o upload da selfie e avançar
  const handleContinuar = async () => {
    if (!photoImage) {
      showMessage("Erro", "Por favor, tire uma selfie primeiro");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(photoImage.uri);
      const blob = await response.blob();

      // Define o caminho para armazenamento no Firebase Storage
      const storageRef = ref(storage, `users/${email}/selfie/selfie_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      console.log("Upload da selfie realizada com sucesso!");

      const downloadURLSelfie = await getDownloadURL(storageRef);

      // Atualiza o formData com a selfie
      const updatedFormData = { ...formData };
      updatedFormData.selfie = {
        arquivoUrl: downloadURLSelfie,
        dataUpload: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        tipo: 'imagem',
        nome: `selfie_${Date.now()}.jpg`
      };

      setSucesso(true);
      setTimeout(() => {
        navigation.navigate("Senha", { email, nome, nomeCompleto, cpf, phoneNumber, dadosEndereco, formData: updatedFormData, dataNascimento });
      }, 1500);
    } catch (error) {
      console.log("Erro no upload:", error);
      showMessage("Erro", "Falha ao enviar a selfie. Tente novamente.");
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
              source={require('../../assets/animacao.json')}
              autoPlay
              loop={false}
              speed={2}
            />
          </AreaAnimacao>
        </ViewAnimacao>
      ) : (
        <Background>
          <View style={{ padding: 16 }}>
            <MaterialIcons
              name="arrow-back"
              size={28}
              color="#fff"
              style={{ marginTop: 10 }}
              onPress={() => navigation.goBack()}
            />
          </View>
          <Container>
            <TextPage style={{ marginTop: 30, textAlign: 'center', marginBottom: 20 }}>
              Selfie com a CNH
            </TextPage>
            {photoImage ? (
              // Se já foi tirada uma selfie, exibimos o preview
              <AreaPhotoImage>
                <ImagePreview
                  uri={photoImage.uri}
                  onRemove={() => setPhotoImage(null)}
                />
                <ButtonContinuar style={{ marginTop: 50, alignSelf: 'center' }} onPress={handleContinuar}>
                  {loading ? <ActivityIndicator size="small" color="#fff" /> : <TextButtonContinuar>Continuar</TextButtonContinuar>}
                </ButtonContinuar>
              </AreaPhotoImage>
            ) : (
              // Caso contrário, mostramos as instruções e o botão para tirar selfie
              <AreaDescricao style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <TextAreaDescricao>
                  Agora, precisamos que você faça uma selfie com a CNH.{'\n\n'}
                  Instruções:{'\n'}
                  1. Vá para um ambiente bem iluminado{'\n'}
                  2. Mantenha o rosto e a CNH visíveis{'\n'}
                  3. Mantenha a CNH próxima ao rosto{'\n'}
                  4. Tire a CNH do plástico para evitar reflexos
                </TextAreaDescricao>
                <LottieAnimation
                  source={require('../../assets/selfie.json')}
                  autoPlay
                  loop={true}
                  speed={2}
                  style={{ width: '100%', height: 350, alignSelf: 'center' }}
                />
                <ButtonContinuar style={{ marginTop: 50, alignSelf: 'center' }} onPress={abrirPhotoPicker} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="#fff" /> : <TextButtonContinuar>Tirar Selfie</TextButtonContinuar>}
                </ButtonContinuar>
              </AreaDescricao>
            )}
            {/* Modal para escolher tirar foto via PhotoPicker */}
            <PhotoPicker
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              onImageSelected={(result) => {
                setPhotoImage(result);
                setModalVisible(false);
              }}
            />
          </Container>
        </Background>
      )}
    </ScrollView>
  );
}
