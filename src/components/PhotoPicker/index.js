import React from 'react';
import { View, TouchableOpacity, Text, Modal, Alert, Platform, ActionSheetIOS } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PhotoPicker({ visible, onClose, onImageSelected }) {

  // Função para mostrar mensagem de sucesso/erro
  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Função para abrir a câmera
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      showMessage('Permissão negada', 'Precisamos de acesso à câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    // Verifica se o usuário não cancelou
    if (!result.canceled && result.assets && result.assets.length > 0) {
      onImageSelected(result.assets[0]);
      onClose();
    }
  };

  // Função para abrir a galeria
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      showMessage('Permissão negada', 'Precisamos de acesso à galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    // Verifica se o usuário não cancelou
    if (!result.canceled && result.assets && result.assets.length > 0) {
      onImageSelected(result.assets[0]);
      onClose();
    }
  };

  // Se a plataforma for iOS, use o ActionSheetIOS para exibir as opções nativas
  const showIosActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          openCamera();
        } else if (buttonIndex === 2) {
          openGallery();
        }
      }
    );
  };

  // Em iOS ignora o modal customizado e mostra a ActionSheet
  if (Platform.OS === 'ios') {
    // Se o componente estiver visível, imediatamente dispara o ActionSheet.
    if (visible) {
      showIosActionSheet();
    }
    // Não renderiza nada (ou pode renderizar um placeholder) pois o ActionSheet é nativo.
    return null;
  }

  // Para Android e Web, renderiza o modal customizado
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ backgroundColor: "white", padding: 20 }}>
          <TouchableOpacity onPress={openCamera} style={{ padding: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Tirar Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openGallery} style={{ padding: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Escolher da Galeria</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
            <Text style={{ fontSize: 16, color: "red" }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
