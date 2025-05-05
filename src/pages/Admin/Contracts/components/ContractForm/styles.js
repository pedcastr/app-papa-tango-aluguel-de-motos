import styled from 'styled-components/native';
import { Platform } from 'react-native';

export const Container = styled.KeyboardAvoidingView.attrs({
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: Platform.OS === 'ios' ? 50 : 0
})`
    flex: 1;
    background-color: #FFFFFF;
`;

export const Form = styled.View`
    padding: 20px;
`;

export const Section = styled.View`
    margin-bottom: 20px;
    background-color: #FFFFFF;
    border-radius: 10px;
    padding: 15px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3.84px;
    elevation: 5;
`;

export const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
`;

export const InputGroup = styled.View`
    margin-bottom: 15px;
`;

export const Label = styled.Text`
    font-size: 16px;
    color: #555;
    margin-bottom: 5px;
`;

export const Input = styled.TextInput`
    width: 100%;
    height: 50px;
    background-color: ${props => props.error ? '#FFE8E8' : '#F5F5F5'};
    border-radius: 10px;
    border: 1px solid ${props => props.error ? '#FF3B30' : '#E0E0E0'};
    padding: 0 15px;
    font-size: 16px;
`;

export const SwitchContainer = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
`;

export const SwitchLabel = styled.Text`
    font-size: 16px;
    color: #333;
`;

export const FileSection = styled.View`
    margin-bottom: 20px;
    background-color: #FFFFFF;
    border-radius: 10px;
    padding: 15px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3.84px;
    elevation: 5;
`;

export const FileButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
`;

export const FileButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
`;

export const FilePreviewText = styled.Text`
    font-size: 14px;
    color: #333;
    margin-top: 10px;
`;

export const PdfContainer = styled.View`
    margin-top: 15px;
    margin-bottom: 15px;
    border: 1px solid #E0E0E0;
    border-radius: 10px;
    overflow: hidden;
`;

export const DocumentTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
`;

export const ChangeFileButton = styled.TouchableOpacity`
    background-color: #666;
    padding: 12px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
`;

export const ChangeFileButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 14px;
    font-weight: bold;
`;

export const SubmitButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    margin-bottom: 30px;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

export const SubmitButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
`;

export const ErrorText = styled.Text`
    color: #FF3B30;
    font-size: 14px;
    margin-top: 5px;
    margin-left: 5px;
`;

// Novos componentes para a seleção de itens
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
    color: #666;
    margin-top: 3px;
    margin-bottom: 10px;
`;

export const UserInfoContainer = styled.View`
    background-color: #FFF8F8;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #FFDDDD;
    margin-top: 10px;
    margin-bottom: 15px;
`;

export const UserInfoTitle = styled.Text`
    font-size: 16px;
    color: #CB2921;
    font-weight: bold;
    margin-bottom: 8px;
`;

export const UserInfoText = styled.Text`
    font-size: 14px;
    color: #333;
    margin-bottom: 5px;
`;

export const Divider = styled.View`
    height: 1px;
    background-color: #E0E0E0;
    margin-vertical: 15px;
`;

export const CheckboxContainer = styled.View`
    flex-direction: row;
    align-items: center;
    margin-top: 5px;
`;

export const CheckboxWrapper = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    margin-right: 20px;
`;

export const Checkbox = styled.View`
    width: 20px;
    height: 20px;
    border-radius: 3px;
    border-width: 1px;
    border-color: #CB2921;
    justify-content: center;
    align-items: center;
`;

export const CheckboxInner = styled.View`
    width: 12px;
    height: 12px;
    border-radius: 2px;
    background-color: #CB2921;
`;

export const CheckboxLabel = styled.Text`
    font-size: 16px;
    color: #333;
    margin-left: 8px;
`;
