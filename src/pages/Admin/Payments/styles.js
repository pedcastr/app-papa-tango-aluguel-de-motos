import styled from 'styled-components/native';
import { Platform } from 'react-native';

export const Container = styled.SafeAreaView`
    flex: 1;
    background-color: #F8F9FA;
`;

export const Header = styled.View`
    flex-direction: row;
    justify-content: space-between;
    height: 65px;
    align-items: center;
    padding: 16px;
    background-color: #CB2921;
`;

export const HeaderTitle = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: #ffffff;
`;

export const HeaderRight = styled.View`
    flex-direction: row;
    align-items: center;
`;

export const FilterButton = styled.TouchableOpacity`
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background-color: #F8F9FA;
    justify-content: center;
    align-items: center;
    margin-left: 8px;
`;

export const FilterButtonText = styled.Text`
    font-size: 14px;
    color: #333;
`;

export const SearchContainer = styled.View`
    flex-direction: row;
    align-items: center;
    background-color: #FFF;
    border-radius: 8px;
    margin: 16px;
    margin-bottom: 8px;
    elevation: 2;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
`;

export const SearchInput = styled.TextInput`
    flex: 1;
    padding: 12px 10px;
    font-size: 16px;
    color: #333;
`;

export const FilterContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    padding: 0 16px;
    margin-bottom: 16px;
`;

export const FilterOption = styled.TouchableOpacity`
    padding: 8px 12px;
    border-radius: 16px;
    background-color: ${props => props.active ? '#CB2921' : '#E9ECEF'};
`;

export const FilterOptionText = styled.Text`
    font-size: 14px;
    font-weight: ${props => props.active ? 'bold' : 'normal'};
    color: ${props => props.active ? '#FFF' : '#6C757D'};
`;

export const PaymentCard = styled.View`
    background-color: #FFF;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    elevation: 2;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
`;

export const PaymentHeader = styled.View`
    align-items: start;
    margin-bottom: 8px;
`;

export const PaymentTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #212529;
`;

export const StatusBadge = styled.View`
    padding: 4px 8px;
    border-radius: 12px;
    align-items: center;
    align-self: flex-end;
    justify-content: center;
    margin-bottom: 10px;
    max-width: 30%;
`;

export const StatusText = styled.Text`
    font-size: 12px;
    font-weight: bold;
    color: #FFF;
`;

export const PaymentAmount = styled.Text`
    font-size: 24px;
    font-weight: bold;
    color: #212529;
    margin-bottom: 12px;
`;

export const PaymentInfo = styled.View`
    margin-bottom: 16px;
`;

export const PaymentInfoRow = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 8px;
`;

export const PaymentInfoLabel = styled.Text`
    font-size: 14px;
    color: #6C757D;
`;

export const PaymentInfoValue = styled.Text`
    font-size: 14px;
    font-weight: 500;
    color: #212529;
`;

export const PaymentActions = styled.View`
    flex-direction: row;
    justify-content: space-between;
`;

export const ActionButton = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: 4px;
    flex: 1;
    margin: 0 4px;
`;

export const ActionButtonText = styled.Text`
    font-size: 14px;
    font-weight: 500;
    color: #FFF;
    margin-left: 6px;
`;

export const EmptyContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

export const EmptyText = styled.Text`
    font-size: 16px;
    color: #6C757D;
    text-align: center;
    margin-top: 16px;
`;

export const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

export const BackButton = styled.TouchableOpacity`
    width: 40px;
    height: 40px;
    justify-content: center;
    align-items: center;
`;

export const UserInfo = styled.View`
    background-color: #FFF;
    padding: 16px;
    margin: 16px;
    border-radius: 8px;
    elevation: 2;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
`;

export const UserName = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: #212529;
`;

export const UserEmail = styled.Text`
    font-size: 14px;
    color: #6C757D;
    margin-top: 4px;
`;

export const Card = styled.View`
    background-color: #FFF;
    border-radius: 8px;
    padding: 16px;
    elevation: 2;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
`;

export const CardTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #212529;
    margin-bottom: 8px;
`;

export const CardSection = styled.View`
    margin-top: 16px;
`;

export const SectionTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #495057;
    margin-bottom: 12px;
`;

export const DetailRow = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 8px;
`;

export const DetailLabel = styled.Text`
    font-size: 14px;
    color: #6C757D;
`;

export const DetailValue = styled.Text`
    font-size: 14px;
    font-weight: 500;
    color: #212529;
    max-width: 90%;
    text-align: right;
`;

export const Divider = styled.View`
    height: 1px;
    background-color: #E9ECEF;
    margin-vertical: 16px;
`;

export const AddButton = styled.TouchableOpacity`
    background-color: #28a745;
    padding: 12px 16px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin: 16px;
`;

export const AddButtonText = styled.Text`
    color: #FFF;
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

export const QRCodeContainer = styled.View`
  align-items: center;
  justify-content: center;
  margin: 10px 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
`;

export const QRCodeImage = styled.Image`
  width: 200px;
  height: 200px;
  margin: 10px 0;
`;

export const CodeContainer = styled.View`
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin: 10px 0;
`;

export const CodeText = styled.Text`
  font-family: monospace;
  font-size: 14px;
  color: #333;
  margin-top: 5px;
  padding: 8px;
  background-color: #fff;
  border: 1px dashed #ccc;
  border-radius: 4px;
`;

export const CopyButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #007bff;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
`;

export const CopyButtonText = styled.Text`
  color: #fff;
  font-weight: bold;
  margin-left: 8px;
`;

export const LinkButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #6c757d;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
`;

export const LinkButtonText = styled.Text`
  color: #fff;
  font-weight: bold;
  margin-left: 8px;
`;