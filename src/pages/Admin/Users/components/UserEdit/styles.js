import styled from 'styled-components/native';
import { Platform } from 'react-native';

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

export const Container = styled.ScrollView`
    flex: 1;
    background-color: #F5F5F5;
`;

export const Form = styled.View`
    padding: 20px;
`;

export const Section = styled.View`
    background-color: #FFF;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 20px;
`;

export const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
    text-align: center;
`;

export const InputGroup = styled.View`
    margin-bottom: 15px;
`;

export const Label = styled.Text`
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
`;

export const Input = styled.TextInput` 
    background-color: #F8F9FA;
    padding: 12px;
    border-radius: 5px;
    border-width: 1px;
    border-color: #DDD;
`;

export const Switch = styled.Switch`
    transform: scale(0.9);
    margin-top: ${Platform.OS === 'web' ? '0px' : '-15px'};
`;

export const Button = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 25px;
    align-items: center;
`;

export const ButtonText = styled.Text`
    color: #FFF;
    font-size: 18px;
    font-weight: bold;
`;

export const ImagensArquivoCNH = styled.Image`
    width: 100%;
    height: ${isWebDesktop ? '400px' : '250px'};
    margin-bottom: 10px;
    border-radius: 10px;
`;

export const PdfContainer = styled.View`
    width: 100%;
    max-width: 700px;
    align-self: center;
    height: ${props => props.fullScreen ? '100%' : '500px'};
    margin-bottom: 20px;
    border-radius: 5px;
    overflow: hidden;
`;

export const FileActionContainer = styled.View`
    width: 100%;
    flex-direction: row;
    justify-content: center;
    margin-bottom: 50px;
`;

export const DeleteButton = styled.TouchableOpacity`
    background-color: #FF3B30;
    padding: 10px 20px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    margin: 5px;
`;

export const DeleteButtonText = styled.Text`
    color: white;
    font-size: 16px;
    font-weight: bold;
`;

export const UploadButton = styled.TouchableOpacity`
    background-color: #007AFF;
    padding: 10px 20px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    margin: 5px;
`;

export const UploadButtonText = styled.Text`
    color: white;
    font-size: 16px;
    font-weight: bold;
`;

export const SelectionList = styled.ScrollView.attrs({
    nestedScrollEnabled: true,
    contentContainerStyle: {
        paddingBottom: 10
    }
})`
    max-height: 200px;
    background-color: #F9F9F9;
    border-radius: 10px;
    border: 1px solid #E0E0E0;
    margin-top: 10px;
    padding: 5px;
`;

export const SelectionItem = styled.TouchableOpacity`
    padding: 12px;
    border-bottom-width: 1px;
    border-bottom-color: #EEEEEE;
    background-color: ${props => 
        props.approved === false ? '#FFF9F9' : 
        props.available === false ? '#F9F9FF' : 
        '#FFFFFF'
    };
`;

export const SelectionItemText = styled.Text`
    font-size: 16px;
    color: #333;
    font-weight: 500;
`;

export const SelectionItemEmail = styled.Text`
    font-size: 14px;
    color: #666;
    margin-top: 3px;
`;

export const SelectButton = styled.TouchableOpacity`
    background-color: #F0F0F0;
    padding: 12px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    border: 1px solid #E0E0E0;
`;

export const SelectButtonText = styled.Text`
    color: #333;
    font-size: 14px;
    font-weight: 500;
`;

export const SelectedItemContainer = styled.View`
    background-color: #F5F5F5;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #E0E0E0;
`;

export const SelectedItemTitle = styled.Text`
    font-size: 16px;
    color: #333;
    font-weight: bold;
`;

export const SelectedItemDetail = styled.Text`
    font-size: 14px;
    color: #667;
    margin-top: 3px;
    margin-bottom: 10px;
`;

export const Divider = styled.View`
    height: 1px;
    background-color: #E0E0E0;
    margin-vertical: 15px;
`;
