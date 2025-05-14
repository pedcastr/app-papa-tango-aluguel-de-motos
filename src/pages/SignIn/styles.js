import styled from 'styled-components/native';
import { Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Container principal com fundo branco
export const Background = styled(LinearGradient).attrs({
    colors: ['#CB2921', '#E74C3C', '#FFFFFF'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0.5 }
})`
    flex: 1;
`;

// Container que gerencia o comportamento do teclado por plataforma
export const Container = styled.KeyboardAvoidingView.attrs({
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: Platform.OS === 'ios' ? 50 : 0
})`
    flex: 1;
`;

// Área de scroll que mantém os toques mesmo com teclado aberto
export const ScrollContent = styled.ScrollView.attrs({
    contentContainerStyle: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    },
    keyboardShouldPersistTaps: 'handled'
})``;

// Container do conteúdo principal
export const ContentContainer = styled.View`
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 500px;
    align-self: center;
    padding-bottom: ${props => props.keyboardVisible ? '20px' : '120px'};
`;

// Container dos campos de input
export const AreaInput = styled.View`
    width: 100%;
    max-width: 400px;
    flex-direction: column;
    margin-bottom: ${Platform.OS === 'web' ? '15px' : '5px'};
    margin-top: ${Platform.OS === 'web' ? '5px' : '0px'};
`;

// Container específico para o campo de senha com ícone
export const PasswordContainer = styled.View`
    width: 100%;
    position: relative;
    margin-bottom: 5px;
`;

export const Input = styled.TextInput.attrs(props => ({
    ...(Platform.OS === 'web' && {
        autoComplete: 'off',
        spellCheck: false,
        enterKeyHint: 'next'
    })
}))`
    background-color: ${props => props.error ? '#FFE8E8' : '#F5F5F5'};
    border: ${props => props.error ? '2px rgb(57, 74, 224)' : 'none'};
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 15px;
    color: #000000;
    margin-bottom: 5px; 
    font-weight: bold;
    width: 100%;
    height: ${Platform.OS === 'ios' ? '50px' : '48px'};
    font-size: ${isSmallDevice ? '14px' : '16px'};
    
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

export const ButtonIconPassaword = styled.TouchableOpacity`
    position: absolute;
    right: 10px;
    top: ${Platform.OS === 'ios' ? '65px' : '80px'};
    transform: translateY(-15px);
    z-index: 2;
`;

// Botão do ícone de visibilidade da senha
export const IconButton = styled.TouchableOpacity`
    position: absolute;
    right: 15px;
    top: 13px;
    padding: 5px;
`;

// Texto de mensagem de erro
export const ErrorText = styled.Text`
    color: rgb(57, 74, 224);
    font-size: 14px;
    margin-top: -2px;
    margin-bottom: 10px;
    margin-left: 10px;
    font-weight: 500;
`;

// Botão principal de acesso
export const ButtonAcessar = styled.TouchableOpacity`
    width: 100%;
    max-width: 400px;
    height: 50px;
    border-radius: 25px;
    background-color: #CB2921;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
`;

// Texto dos botões principais
export const TextButtonAcessar = styled.Text`
    font-size: 18px;
    color: #fff;
    font-weight: bold;
`;

export const ButtonEsqueceuSenha = styled.TouchableOpacity`
    width: 100%;
    max-width: 400px;
    align-items: flex-end;
    padding-right: 10px;
    margin-bottom: 20px;
`;

export const TextButtonEsqueceuSenha = styled.Text`
    font-size: 14px;
    color: ${Platform.OS === 'web' ? 'black' : 'rgb(40, 94, 211)'};
    text-decoration: underline;
    font-weight: ${Platform.OS === 'web' ? 'bold' : 'normal'};
`;

// Botão secundário para criar conta
export const ButtonCriarConta = styled.TouchableOpacity``;

// Texto do botão criar conta
export const TextButtonCriar = styled.Text`
    font-size: 18px;
    color: #1E1E1E;
    font-weight: bold;
`;

// View para posicionar o botão de suporte ao final da tela
export const BottomButtonsContainer = styled.View`
    position: relative;
    bottom: 5px;
    left: 0;
    right: 0;
    padding: 0 30px;
    align-items: center;
    justify-content: center;
`;

// Botão de suporte
export const ButtonSuporte = styled.TouchableOpacity`
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    flex-direction: row;
`;

export const TextButtonSuporte = styled.Text`
    font-size: 20px;
    color: #000000;
    font-weight: bold;
`;
