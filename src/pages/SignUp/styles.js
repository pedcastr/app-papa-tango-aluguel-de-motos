import styled from 'styled-components/native';
import { Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

export const Background = styled(LinearGradient).attrs({
    colors: ['#CB2921', '#E74C3C', '#FFFFFF'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0.6 }
})`
    flex: 1;
    width: 100%;
`;

export const Container = styled.View`
    flex: 1;
    padding: 16px;
    width: ${Platform.OS === 'web' ? '100%' : 'auto'};
    max-width: ${Platform.OS === 'web' ? '600px' : 'auto'};
    margin: ${Platform.OS === 'web' ? '0 auto' : '0'};
`;

export const AreaInput = styled.View`
    width: 100%;
    margin-top: 30px;
`;

export const InputRow = styled.View`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    flex-wrap: ${Platform.OS === 'web' ? 'wrap' : 'nowrap'};
`;

export const InputContainer = styled.View`
    width: ${Platform.OS === 'web' && width < 500 ? '100%' : '48%'};
    margin-bottom: ${Platform.OS === 'web' && width < 500 ? '10px' : '0'};
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

export const RowContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    flex-wrap: ${Platform.OS === 'web' && width < 500 ? 'wrap' : 'nowrap'};
`;

export const HalfAreaInput = styled(AreaInput)`
    width: ${Platform.OS === 'web' && width < 500 ? '100%' : '48%'};
    margin-bottom: ${Platform.OS === 'web' && width < 500 ? '10px' : '0'};
`;

export const SmallInput = styled(Input)`
    width: 100%;
`;

export const ErrorText = styled.Text`
    color: rgb(57, 74, 224);
    font-size: 14px;
    margin-top: -2px;
    margin-bottom: 5px;
    margin-left: 5px;
`;

export const AreaTextoIcone = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-self: stretch;
`;

export const TextPage = styled.Text`
    font-size: ${isSmallDevice ? '18px' : '20px'};
    color: #ffffff;
    margin-bottom: 5px;
    font-weight: bold;
    margin-left: 5px;
    text-align: ${Platform.OS === 'web' ? 'center' : 'left'};
`;

export const AreaOpcoes = styled.View`
    width: 100%;
    flex-direction: ${Platform.OS === 'web' && width < 500 ? 'column' : 'row'};
    align-items: center;
    justify-content: center;
    position: relative;
    flex: 1;
`;

export const ButtonFoto = styled.TouchableOpacity`
    flex: 1;
    width: ${Platform.OS === 'web' && width < 500 ? '100%' : '50%'};
    height: ${Platform.OS === 'web' && width < 500 ? '300px' : '75%'};
    align-items: center;
    justify-content: center;
    padding: 5px;
    margin-bottom: ${Platform.OS === 'web' && width < 500 ? '15px' : '30px'};
`;

export const ButtonPdf = styled.TouchableOpacity`
    flex: 1;
    width: ${Platform.OS === 'web' && width < 500 ? '100%' : '50%'};
    height: ${Platform.OS === 'web' && width < 500 ? '300px' : '75%'};
    align-items: center;
    justify-content: center;
    padding: 5px;
    margin-bottom: 30px;
`;

export const AreaButtonContinuar = styled.View`
    width: 100%;
    margin-top: 30px;
    align-items: center;
    justify-content: center;
    padding-bottom: ${Platform.OS === 'ios' ? '20px' : '0'};
`;

export const ButtonContinuar = styled.TouchableOpacity`
    background-color: rgb(43, 42, 42);
    width: ${Platform.OS === 'web' ? '200px' : '45%'};
    height: 45px;
    border-radius: 25px;
    align-items: center;
    justify-content: center;
    
    ${Platform.OS === 'web' 
        ? `box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.2);` 
        : `
            elevation: 3;
            shadow-color: #000;
            shadow-offset: 0px 2px;
            shadow-opacity: 0.2;
            shadow-radius: 3px;
        `
    }
`;

export const TextButtonContinuar = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #fff;
`;

export const ButtonContainer = styled.View`
    width: 100%;
    padding: 20px;
    gap: 15px;
`;

export const UploadButton = styled.TouchableOpacity`
    background-color: #F5F5F5;
    border-radius: 10px;
    padding: 15px;
    flex-direction: row;
    align-items: center;
    height: 80px;
    
    ${Platform.OS === 'web' 
        ? `box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);` 
        : `
            shadow-color: #000;
            shadow-offset: 0px 1px;
            shadow-opacity: 0.1;
            shadow-radius: 2px;
            elevation: 2;
        `
    }
`;

export const ImageContainer = styled.View`
    flex-direction: row;
    align-items: center;
    flex: 1;
`;

export const PreviewImage = styled.Image`
    width: 60px;
    height: 60px;
    border-radius: 5px;
`;

export const TextPageCNH = styled.Text`
    font-size: 16px;
    margin-left: 15px;
    flex: 1;
`;

export const RemoveButton = styled.TouchableOpacity`
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgba(255,255,255,0.8);
    border-radius: 12px;
    padding: 4px;
    z-index: 1;
`;

export const ButtonContent = styled.View`
    flex-direction: row;
    align-items: center;
    gap: 15px;
`;

export const IconImage = styled.Image`
    width: 60px;
    height: 40px;
    resize-mode: contain;
`;

export const PdfContainer = styled.View`
    flex: 1;
    width: 100%;
    margin-top: 40px;
    position: relative;
    height: ${Platform.OS === 'web' ? '250px' : 'auto'};
`;

export const AreaInputSenha = styled.View`
    position: relative;
    width: 100%;
`;

export const ButtonIconPassaword = styled.TouchableOpacity`
    position: absolute;
    right: 10px;
    top: ${Platform.OS === 'ios' ? '65px' : '60px'};
    transform: translateY(-15px);
    z-index: 2;
`;

export const TextErrorPassword = styled.Text`
    color: rgb(43, 42, 42);
    font-size: 14px;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 10px;
    margin-left: 5px;
`;

export const AreaCriteriosSenha = styled.View`
    margin-top: 5px;
    margin-bottom: 10px;
`;

export const TextCriteriosSenha = styled.Text`
    font-size: 14px;
    font-weight: bold;
`;

export const AreaAnimacao = styled.View`
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: ${Platform.OS === 'web' ? '#ffffff' : 'transparent'};
`;

export const TextAnimacao = styled.Text`
    font-size: 18px;
    color: ${Platform.OS === 'web' ? '#000000' : '#ffffff'};
    margin-top: 10px;
`;

export const ButtonReenvio = styled.TouchableOpacity``;

export const TextButtonReenvio = styled.Text`
    margin-top: 40px;
    font-weight: bold;
    margin-left: 5px;
    color: rgb(43, 42, 42);
    font-size: 16px;
`;

export const AreaDescricao = styled.View`
    width: 100%;
`;

export const TextAreaDescricao = styled.Text`
    margin-left: 5px;
    font-weight: bold;
    font-size: 16px;
    text-align: left;
    line-height: 24px;
    color: rgb(43, 42, 42);
`;

export const AreaImage = styled.View`
    width: 100%;
    height: 100%;
    position: relative;
`;

export const ButtonIconCancelar = styled.TouchableOpacity`
    position: absolute;
    top: ${Platform.OS === 'web' ? '-30px' : '-40px'};
    right: 10px;
    background-color: rgba(255,255,255,0.7);
    border-radius: 15px;
    padding: 5px;
    z-index: 2;
`;

export const AreaPdf = styled.View`
    position: relative;
    width: 100%;
    height: ${Platform.OS === 'web' ? '300px' : '90%'};
    background-color: #F5F5F5;
    border-radius: 15px;
    margin-top: ${Platform.OS === 'web' ? '0' : '-20px'};
    overflow: hidden;
`;

export const AreaPhotoImage = styled.View`
    width: 100%;
    height: 100%;
`;

export const ButtonIconCancelarPageSelfie = styled.TouchableOpacity`
    position: absolute;
    top: 10px;
    right: 0;
    background-color: rgba(255,255,255,0.7);
    border-radius: 15px;
    padding: 3px;
    z-index: 2;
`;

export const ViewAnimacao = styled.View`
    flex: 1;
    background-color: #ffffff;
    align-items: center;
    justify-content: center;
`;

export const BackgroundPageConcluido = styled.View`
    flex: 1;
    background-color: #ffffff; 
`;

export const ButtonSupportPageConcluido = styled.TouchableOpacity`
    background-color: rgb(43, 42, 42);
    color: #ffffff;
    width: ${Platform.OS === 'web' ? '200px' : '45%'};
    height: 45px;
    border-radius: 25px;
    align-items: center;
    justify-content: center;
    
    ${Platform.OS === 'web' 
        ? `box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.2);` 
        : `
            elevation: 3;
            shadow-color: #000;
            shadow-offset: 0px 2px;
            shadow-opacity: 0.2;
            shadow-radius: 3px;
        `
    }
`;

export const TextPageConcluido = styled.Text`
    font-size: 20px;
    color: #000000;
    margin-bottom: 5px;
    font-weight: bold;
    margin-left: 5px;
    text-align: ${Platform.OS === 'web' ? 'center' : 'left'};
`;
