import styled from 'styled-components/native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { Platform } from 'react-native';

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

export const Container = styled.View`
    flex: 1;
    background-color: #FFFFFF;
`;

export const Content = styled.View`
    padding-bottom: 30px;
`;

export const Label = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-top: 15px;
    margin-bottom: 5px;
`;

export const Input = styled.TextInput`
    background-color: #F5F5F5;
    border-radius: 8px;
    padding: 12px 15px;
    font-size: 16px;
    border: 1px solid #E0E0E0;
    margin-bottom: 10px;
`;

export const TextArea = styled.TextInput`
    background-color: #F5F5F5;
    border-radius: 8px;
    padding: 12px 15px;
    font-size: 16px;
    border: 1px solid #E0E0E0;
    margin-bottom: 10px;
    min-height: 120px;
`;

export const PickerContainer = styled.View`
    margin-top: 15px;
    margin-bottom: 15px;
`;

export const PickerLabel = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
`;

export const Picker = styled(RNPicker)`
    background-color: #F5F5F5;
    border-radius: 8px;
    border: 1px solid #E0E0E0;
    margin-bottom: 10px;
`;

export const PickerItem = styled(RNPicker.Item)``;

export const CheckboxContainer = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    margin-bottom: 15px;
`;

export const Checkbox = styled.View`
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 2px solid #CB2921;
    background-color: ${props => props.checked ? '#CB2921' : 'transparent'};
    justify-content: center;
    align-items: center;
`;

export const CheckboxLabel = styled.Text`
    font-size: 16px;
    color: #333;
    margin-left: 10px;
`;

export const AttachmentContainer = styled.View`
    margin-top: 10px;
    margin-bottom: 20px;
`;

export const AttachmentButton = styled.TouchableOpacity`
    background-color: #2E7D32;
    padding: 12px 15px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;
`;

export const AttachmentButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
    margin-left: 10px;
`;

export const AttachmentPreview = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: #F5F5F5;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 15px;
`;

export const AttachmentName = styled.Text`
    font-size: 14px;
    color: #333;
    flex: 1;
`;

export const RemoveAttachmentButton = styled.TouchableOpacity`
    padding: 5px;
    background-color: #CB2921;
    elevation: 3;
    shadow-color: #000000;
    margin-left: 10px;
    border-radius: 20px;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
`;

export const PreviewImage = styled.Image`
    width: ${isWebDesktop ? '300px' : '150px'};
    height: ${isWebDesktop ? '300px' : '150px'};
    margin-left: 30px;
`;

export const SendButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

export const SendButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
`;

export const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: #FFFFFF;
`;

export const PdfContainer = styled.View`
    width: 100%;
    max-width: 900px;
    align-self: center;
    height: ${isWebDesktop ? '700px' : '400px'};
    margin-bottom: 30px;
    border-radius: 5px;
    overflow: hidden;
`;

export const TextAnexos = styled.Text`
    font-size: 18px;
    text-align: center;
    font-weight: bold;
    color: #333;
    margin-top: 10px;
    margin-bottom: 10px;

`