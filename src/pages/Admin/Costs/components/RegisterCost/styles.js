import styled from 'styled-components/native';
import { Platform } from 'react-native';

export const Container = styled.View`
  flex: 1;
  background-color: #F5F5F5;
`;

export const Header = styled.View`
  background-color: #CB2921;
  padding: 20px;
  flex-direction: row;
  align-items: center;
`;

export const HeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
  margin-left: 15px;
`;

export const BackButton = styled.TouchableOpacity`
  padding: 5px;
`;

export const FormContainer = styled.View`
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
`;

export const FormTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
`;

export const InputContainer = styled.View`
  margin-bottom: 20px;
`;

export const Label = styled.Text`
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
`;

export const Input = styled.TextInput`
  background-color: #F5F5F5;
  border-radius: 5px;
  padding: 12px 15px;
  font-size: 16px;
  color: #333;
  border: 1px solid #E0E0E0;
  flex: 1;
`;

export const TextArea = styled.TextInput`
  background-color: #F5F5F5;
  border-radius: 5px;
  padding: 12px 15px;
  font-size: 16px;
  color: #333;
  border: 1px solid #E0E0E0;
  min-height: 100px;
  text-align-vertical: top;
`;

export const ValueContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #F5F5F5;
  border-radius: 5px;
  border: 1px solid #E0E0E0;
`;

export const CurrencySymbol = styled.Text`
  font-size: 16px;
  color: #333;
  padding: 0 10px;
`;

export const SubmitButton = styled.TouchableOpacity`
  background-color: #CB2921;
  padding: 15px;
  border-radius: 10px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  opacity: ${props => props.disabled ? 0.7 : 1};
`;

export const SubmitButtonText = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
  margin-left: 8px;
`;

export const ClientSelectorButton = styled.TouchableOpacity`
  background-color: #F5F5F5;
  border-radius: 5px;
  padding: 12px 15px;
  font-size: 16px;
  border: 1px solid #E0E0E0;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const ClientSelectorButtonText = styled.Text`
  font-size: 16px;
  color: ${props => props.selected ? '#333' : '#999'};
`;

export const ClientModalContainer = styled.View`
  flex: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

export const ClientModalContent = styled.View`
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 20px;
  width: ${Platform.OS === 'web' ? '500px' : '90%'};
  max-width: 600px;
  max-height: ${Platform.OS === 'web' ? '600px' : '80%'};
`;

export const ClientModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

export const ClientModalTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;

export const ClientModalCloseButton = styled.TouchableOpacity`
  padding: 5px;
`;

export const SearchInput = styled.TextInput`
  background-color: #F5F5F5;
  border-radius: 5px;
  padding: 12px 15px;
  font-size: 16px;
  color: #333;
  border: 1px solid #E0E0E0;
  margin-bottom: 15px;
`;

export const ClientList = styled.ScrollView`
  max-height: 400px;
`;

export const ClientItem = styled.TouchableOpacity`
  padding: 15px;
  border-bottom-width: 1px;
  border-bottom-color: #E0E0E0;
`;

export const ClientName = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`;

export const ClientEmail = styled.Text`
  font-size: 14px;
  color: #666;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const EmptyText = styled.Text`
  font-size: 16px;
  color: #666;
  text-align: center;
  padding: 20px;
`;

export const PaymentTypeContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const PaymentTypeOption = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  background-color: ${props => props.selected ? '#CB2921' : '#F5F5F5'};
  border-radius: 5px;
  margin-right: ${props => props.selected ? '5px' : '0'};
  margin-left: ${props => !props.selected ? '5px' : '0'};
  align-items: center;
`;

export const PaymentTypeText = styled.Text`
  font-size: 16px;
  font-weight: ${props => props.selected ? 'bold' : 'normal'};
  color: ${props => props.selected ? '#FFFFFF' : '#333'};
`;
