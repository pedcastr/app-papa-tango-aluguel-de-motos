import styled from 'styled-components/native';
import { Platform, FlatList } from 'react-native';

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
    margin-bottom: 24px;
    background-color: #FFFFFF;
    border-radius: 10px;
    padding: 16px;
    elevation: 2;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    shadow-color: #000;
    shadow-offset: 0px 1px;
`;

export const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333333;
    margin-bottom: 16px;
`;

export const InputGroup = styled.View`
    margin-bottom: 16px;
`;

export const Label = styled.Text`
    font-size: 16px;
    color: #666666;
    margin-bottom: 8px;
`;

export const Input = styled.TextInput`
    background-color: ${props => props.error ? '#FFE8E8' : '#F5F5F5'};
    border: 1px solid ${props => props.error ? '#FF3B30' : '#E0E0E0'};
    border-radius: 8px;
    padding: 12px;
    font-size: 16px;
    color: #333333;
`;

export const SwitchContainer = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
`;

export const SwitchLabel = styled.Text`
    font-size: 16px;
    color: #666666;
`;

export const ErrorText = styled.Text`
    color: #FF3B30;
    font-size: 14px;
    margin-top: 4px;
    margin-left: 4px;
`;

export const SubmitButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    margin-top: 16px;
    margin-bottom: 32px;
    opacity: ${props => props.disabled ? 0.7 : 1};
`;

export const SubmitButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
`;

export const SelectButton = styled.TouchableOpacity`
    background-color: #F5F5F5;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    padding: 12px;
    align-items: center;
`;

export const SelectButtonText = styled.Text`
    color: #666666;
    font-size: 16px;
`;

export const SelectedItemContainer = styled.View`
    background-color: #F5F5F5;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    padding: 12px;
`;

export const SelectedItemTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #333333;
    margin-bottom: 4px;
`;

export const SelectedItemDetail = styled.Text`
    font-size: 14px;
    color: #666666;
    margin-bottom: 12px;
`;

export const ModalContainer = styled.View`
    flex: 1;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
`;

export const ModalContent = styled.View`
    width: 90%;
    max-height: 80%;
    background-color: #FFFFFF;
    border-radius: 10px;
    overflow: hidden;
`;

export const ModalHeader = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom-width: 1px;
    border-bottom-color: #E0E0E0;
`;

export const ModalTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333333;
`;

export const CloseButton = styled.TouchableOpacity`
    padding: 4px;
`;

export const ModalBody = styled.View`
    padding: 16px;
    max-height: 500px;
`;

export const ModalSearchContainer = styled.View`
    flex-direction: row;
    align-items: center;
    background-color: #F5F5F5;
    border-radius: 8px;
    padding: 0 12px;
    margin-bottom: 16px;
`;

export const ModalSearchIcon = styled.View`
    margin-right: 8px;
`;

export const ModalSearchInput = styled.TextInput`
    flex: 1;
    padding: 12px 0;
    font-size: 16px;
    color: #333333;
`;

export const SelectionList = styled(FlatList).attrs({
    showsVerticalScrollIndicator: true,
    contentContainerStyle: {
        paddingBottom: 16
    }
})`
    max-height: 400px;
`;

export const SelectionItem = styled.TouchableOpacity`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom-width: 1px;
    border-bottom-color: #E0E0E0;
    opacity: ${props => props.unavailable ? 0.6 : 1};
`;

export const SelectionItemText = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #333333;
    margin-bottom: 4px;
`;

export const SelectionItemDetail = styled.Text`
    font-size: 14px;
    color: #666666;
`;

export const NoResultsText = styled.Text`
    text-align: center;
    color: #999;
    font-size: 16px;
    margin-top: 20px;
`;
