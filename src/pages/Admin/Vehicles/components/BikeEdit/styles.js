import styled from 'styled-components/native';
import { Platform } from 'react-native';

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

// Container principal com suporte a KeyboardAvoidingView
export const Container = styled.KeyboardAvoidingView.attrs({
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: Platform.OS === 'ios' ? 50 : 0
})`
    flex: 1;
    background-color: #FFFFFF;
`;

// Container do formulário
export const Form = styled.View`
    padding: 20px;
`;

// Seção do formulário com estilo de card
export const Section = styled.View`
    margin-bottom: 20px;
    background-color: #F8F8F8;
    border-radius: 10px;
    padding: 15px;
    ${Platform.OS === 'web' 
        ? `box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);` 
        : `
            elevation: 2;
            shadow-color: #000;
            shadow-offset: 0px 1px;
            shadow-opacity: 0.1;
            shadow-radius: 2px;
        `
    }
`;

export const Switch = styled.Switch`
    transform: scale(0.9);
    margin-top: ${Platform.OS === 'web' ? '0px' : '-15px'};
`;

// Título da seção
export const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
`;

// Grupo de input com label
export const InputGroup = styled.View`
    margin-bottom: 15px;
`;

// Label para campos de input
export const Label = styled.Text`
    font-size: 16px;
    color: #555;
    margin-bottom: 5px;
`;

// Campo de input estilizado
export const Input = styled.TextInput`
    background-color: #FFFFFF;
    padding: 12px 15px;
    border-radius: 8px;
    color: #000000;
    font-size: 16px;
    border: 1px solid #DDD;
`;

// Botão principal de ação
export const Button = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 8px;
    align-items: center;
    margin-top: 10px;
    margin-bottom: 20px;
`;

// Texto do botão principal
export const ButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
`;

// Componente de imagem para mostrar a foto da moto
export const ImagemMoto = styled.Image`
    width: 100%;
    height: ${isWebDesktop ? '350px' : '200px'};
    border-radius: 10px;
    margin-bottom: 10px;
`;

// Container para botões de ação relacionados a arquivos
export const FileActionContainer = styled.View`
    flex-direction: row;
    justify-content: center;
    margin-top: 10px;
`;

// Botão para excluir arquivos
export const DeleteButton = styled.TouchableOpacity`
    background-color: #FF3B30;
    padding: 10px 15px;
    border-radius: 8px;
    align-items: center;
    margin-horizontal: 5px;
`;

// Texto do botão de excluir
export const DeleteButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 14px;
    font-weight: bold;
`;

// Botão para fazer upload de arquivos
export const UploadButton = styled.TouchableOpacity`
    background-color: #007AFF;
    padding: 10px 15px;
    border-radius: 8px;
    align-items: center;
    margin-horizontal: 5px;
`;

// Texto do botão de upload
export const UploadButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 14px;
    font-weight: bold;
`;

export const DeleteMotoButton = styled(Button)`
    background-color: #000000;
    margin-top: 20px;
`;

export const DeleteMotoButtonText = styled(ButtonText)`
    color: #FFFFFF;
`;
