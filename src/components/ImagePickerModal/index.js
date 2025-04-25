import React from 'react';
import { Modal, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  Container,
  AreaModal,
  ButtonOpcoes,
  TextButtonOpcoes,
  ButtonOpcoesCancelar,
  TextButtonOpcoesCancelar,
} from './stylesOficial';

export const ImagePickerModal = ({ visible, onClose, onGalleryPress, onCameraPress }) => { 
  // Se estiver no iOS, não renderiza o modal (usamos ActionSheetIOS no iOS)
  if (Platform.OS === 'ios') {
    return null;
  }
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={{ flex: 1 }}>
        <Container>
          <Pressable>
            <AreaModal>
              <ButtonOpcoes
                onPress={onGalleryPress}
              >
                <MaterialIcons name="photo-library" size={30} color="#000" />
                <TextButtonOpcoes>Galeria</TextButtonOpcoes>
              </ButtonOpcoes>

              <ButtonOpcoes
                onPress={onCameraPress}
              >
                <MaterialIcons name="camera-alt" size={30} color="#000" />
                <TextButtonOpcoes>Câmera</TextButtonOpcoes>
              </ButtonOpcoes>

              <ButtonOpcoesCancelar 
                onPress={onClose}
              >
                <TextButtonOpcoesCancelar>Cancelar</TextButtonOpcoesCancelar>
              </ButtonOpcoesCancelar>
            </AreaModal>
          </Pressable>
        </Container>
      </Pressable>
    </Modal>
  );
};