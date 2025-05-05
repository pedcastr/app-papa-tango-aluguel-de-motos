import styled from 'styled-components/native';
import { Platform } from 'react-native';

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

export const Container = styled.ScrollView`
    flex: 1;
    background-color: #F5F5F5;
    padding: 20px;
`;

export const Form = styled.View`
    width: 100%;
`;

export const Section = styled.View`
    background-color: #FFFFFF;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3.84px;
    elevation: 5;
`;

export const Switch = styled.Switch`
    transform: scale(0.9);
    margin-top: ${isWebDesktop ? '0' : '-15px'};
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
    background-color: #F5F5F5;
    padding: 12px;
    border-radius: 5px;
    border-width: 1px;
    border-color: ${props => props.error ? '#FF3B30' : '#E0E0E0'};
    font-size: 16px;
`;

export const UpdateButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 25px;
    align-items: center;
    margin-top: 20px;
    margin-bottom: 10px;
`;

export const UpdateButtonText = styled.Text`
    color: #FFF;
    font-size: 16px;
    font-weight: bold;
`;

export const PdfContainer = styled.View`
    width: 100%;
    max-width: 900px;
    align-self: center;
    height: ${isWebDesktop ? '700px' : '400px'};
    margin-vertical: 10px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #DDD;
`;

export const DocumentTitle = styled.Text`
    font-size: 16px;
    color: #333;
    margin-bottom: 10px;
    font-weight: bold;
`;

export const ContactIconButton = styled.TouchableOpacity`
    padding: 5px;
    margin-left: 10px;
`;

export const PdfActionsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 10px;
    margin-bottom: 20px;
`;

export const PdfActionButton = styled.TouchableOpacity`
    background-color: ${props => props.color || '#CB2921'};
    padding: 10px 15px;
    border-radius: 5px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin: 5px;
`;

export const PdfActionButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 500;
    margin-left: 5px;
`;

export const DeleteButton = styled.TouchableOpacity`
    background-color: #FF3B30;
    padding: 15px;
    border-radius: 25px;
    align-items: center;
    margin-top: 20px;
`;

export const DeleteButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
`;

export const SelectionList = styled.ScrollView`
    max-height: 200px;
    background-color: #F5F5F5;
    border-radius: 5px;
    border: 1px solid #E0E0E0;
    margin-top: 5px;
`;

export const SelectionItem = styled.TouchableOpacity`
    padding: 12px;
    border-bottom-width: 1px;
    border-bottom-color: #E0E0E0;
    background-color: ${props => props.available === false ? '#FFF5F5' : '#FFFFFF'};
    opacity: ${props => props.available === false ? 0.7 : 1};
`;

export const SelectionItemText = styled.Text`
    font-size: 16px;
    color: #333;
    font-weight: bold;
`;

export const SelectionItemEmail = styled.Text`
    font-size: 14px;
    color: #666;
    margin-top: 2px;
`;

export const SelectButton = styled.TouchableOpacity`
    background-color: #007AFF;
    padding: 12px;
    border-radius: 5px;
    align-items: center;
`;

export const SelectButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 14px;
    font-weight: bold;
`;

export const SelectedItemContainer = styled.View`
    background-color: #F5F5F5;
    padding: 12px;
    border-radius: 5px;
    border: 1px solid #E0E0E0;
    margin-bottom: 10px;
`;

export const SelectedItemTitle = styled.Text`
    font-size: 16px;
    color: #333;
    font-weight: bold;
`;

export const SelectedItemDetail = styled.Text`
    font-size: 14px;
    color: #666;
    margin-top: 5px;
    margin-bottom: 10px;
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
