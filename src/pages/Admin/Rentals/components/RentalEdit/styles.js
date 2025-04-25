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
    elevation: 2;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    shadow-color: #000;
    shadow-offset: 0px 1px;
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
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
    font-weight: 500;
`;

export const Input = styled.TextInput`
    background-color: ${props => props.error ? '#FFE8E8' : '#F5F5F5'};
    border-radius: 8px;
    padding: 12px;
    font-size: 16px;
    border: 1px solid ${props => props.error ? '#FF3B30' : '#E0E0E0'};
`;

export const SwitchContainer = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
`;

export const SwitchLabel = styled.Text`
    font-size: 16px;
    color: #333;
`;

export const Switch = styled.Switch``;

export const SubmitButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 8px;
    align-items: center;
    margin-top: 20px;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

export const SubmitButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
`;

export const DeleteButton = styled.TouchableOpacity`
    background-color: #FF3B30;
    padding: 15px;
    border-radius: 8px;
    align-items: center;
    margin-top: 15px;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

export const DeleteButtonText = styled.Text`
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
        props.available === false ? '#F9F9FF' : '#FFFFFF'
    };
`;

export const SelectionItemText = styled.Text`
    font-size: 16px;
    color: #333;
    font-weight: 500;
`;

export const SelectionItemDetail = styled.Text`
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
