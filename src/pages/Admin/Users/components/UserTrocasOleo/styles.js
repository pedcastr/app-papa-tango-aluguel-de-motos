import styled from "styled-components/native";
import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const Container = styled.View`
    flex: 1;
    padding: 16px;
    width: ${Platform.OS === 'web' ? '100%' : 'auto'};
    max-width: ${Platform.OS === 'web' ? '600px' : 'auto'};
    margin: ${Platform.OS === 'web' ? '0 auto' : '0'};
`;

export const ScrollContainerTrocaOleo = styled.ScrollView.attrs({
    showsVerticalScrollIndicator: false,
    contentContainerStyle: { flexGrow: 1 }
  })`
    flex: 1;
    margin-top: -10px;
`;

export const TextPage = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #000;
    margin-top: 20px;
`;

export const AreaFoto = styled.View`
    width: 100%;
    height: 118px;
    border-radius: 5px;
    background-color: #D9D9D9;
    align-items: center;
    justify-content: center;
`;

export const ScrollContainer = styled.ScrollView.attrs({
    contentContainerStyle: { flexGrow: 1 }
  })`
    flex: 1;
    padding: 16px;
    background-color: #fff;
`;

export const TextDataDetalhes = styled.Text`
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
    margin-top: 20px;
    color: #CB2921;
`;

export const TextTitleDetalhes = styled.Text`
    font-size: 16px;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 10px;
`;

export const ImageDetalhes = styled.Image`
    width: ${width - 32}px;
    height: 200px;
    margin-bottom: 20px;
    border-radius: 5px;
`;

export const ButtonContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 15px;
`;

export const ButtonEnviar = styled.TouchableOpacity`
    width: 100%;
    height: 40px;
    align-items: center;
    justify-content: center;
    align-self: center;
    margin-top: 5px;
`;

export const TextButtonEnviar = styled.Text`
    font-size: 18px;
    color: #CB2921;
    text-decoration: ${Platform.OS === 'web' ? 'underline' : 'none'};
    ${Platform.OS !== 'web' && 'text-decoration-line: underline;'}
`;

export const RemoveButton = styled.TouchableOpacity`
    position: absolute;
    top: 2px;
    right: 5px;
    background-color: rgba(255,255,255,0.8);
    border-radius: 12px;
    padding: 2px;
    z-index: 1;
    text-decoration: ${Platform.OS === 'web' ? 'underline' : 'none'};
    ${Platform.OS !== 'web' && 'text-decoration-line: underline;'}
    text-align: center;
`;

export const ContactButton = styled.TouchableOpacity`
    flex: 1;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border-radius: 10px;
    ${Platform.OS === 'web' ? 'box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);' : 'elevation: 3;'}
`;

export const ButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
    margin-left: 10px;
`;

export const ButtonDetalhesTroca = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 16px;
    background-color: #f5f5f5;
    margin-bottom: 8px;
    border-radius: 8px;
    ${Platform.OS === 'web' ? 'box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);' : 'elevation: 2;'}
`;

export const ButtonFoto = styled.TouchableOpacity``;

export const ViewTrocaInfo = styled.View`
    flex: 1;
`;

export const TextData = styled.Text`
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 8px;
`;

export const ImageKm = styled.Image`
    width: 100px;
    height: 110px;
    border-radius: 4px;
`;

export const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

export const TextButtonSemTrocas = styled.Text`
    font-size: 16px;
    color: #fff;
    font-weight: bold;
`;

export const ButtonNovaTroca = styled.TouchableOpacity`
    width: 70%;
    max-width: 500px;
    height: 50px;
    border-radius: 25px;
    background-color: rgb(43, 42, 42);
    align-items: center;
    justify-content: center;
    align-self: center;
    margin-bottom: 0px;
    margin-top: 10px;
    ${Platform.OS === 'web' ? 'box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);' : 'elevation: 3;'}
`;

export const TextButtonNovaTroca = styled.Text`
    font-size: 16px;
    color: #fff;
    font-weight: bold;
`;

export const ContainerLista = styled.View`
    flex: 1;
    padding: 16px;
    background-color: #fff;
`;

export const ContainerSemTrocas = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;



