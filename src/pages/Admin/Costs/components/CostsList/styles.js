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

export const Content = styled.View`
  flex: 1;
  padding-top: 16px;
`;

export const SummaryCard = styled.View`
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 20px;
  margin: 0 16px 16px 16px;
  align-items: center;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
`;

export const SummaryTitle = styled.Text`
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
`;

export const SummaryValue = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #333;
`;

export const ClientCard = styled.View`
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
`;

export const ClientCardHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

export const ClientAvatar = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: #CB2921;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

export const ClientInitials = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
`;

export const ClientInfo = styled.View`
  flex: 1;
`;

export const ClientName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`;

export const ClientCostInfo = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const ClientCostCount = styled.Text`
  font-size: 14px;
  color: #666;
`;

export const ClientCostValue = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #CB2921;
`;

export const ClientCardContent = styled.View`
  align-items: flex-end;
  margin-bottom: 12px;
`;

export const ClientCardFooter = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;

export const ViewDetailsButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  background-color: #F5F5F5;
  border-radius: 5px;
`;

export const ViewDetailsText = styled.Text`
  font-size: 14px;
  color: #CB2921;
  margin-left: 4px;
`;

export const AddButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 20px;
  right: 20px;
  left: 20px;
  background-color: #CB2921;
  padding: 15px;
  border-radius: 10px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  elevation: 3;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 3.84px;
`;

export const AddButtonText = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
  margin-left: 8px;
`;

export const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const EmptyText = styled.Text`
  font-size: 16px;
  color: #666;
  margin-top: 10px;
  text-align: center;
`;

export const SearchContainer = styled.View`
  padding: 0 16px;
  margin-bottom: 16px;
`;

export const SearchInput = styled.TextInput`
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 12px 15px;
  font-size: 16px;
  color: #333;
  border: 1px solid #E0E0E0;
  margin-bottom: 10px;
`;

export const ButtonsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

export const FilterButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  background-color: #F0F0F0;
  border-radius: 5px;
`;

export const SortButton = styled.TouchableOpacity`
  padding: 8px 12px;
  background-color: #F0F0F0;
  border-radius: 5px;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const TotalContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #FFFFFF;
  margin: 0 16px 80px 16px;
  border-radius: 10px;
`;

export const TotalLabel = styled.Text`
  font-size: 16px;
  color: #666;
`;

export const TotalValue = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;

export const ClientCostValueRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

export const ClientCostLabel = styled.Text`
  font-size: 14px;
  color: #666;
`;

export const ClientCostValueInstallment = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #2196F3;
`;

export const SummaryInstallmentValue = styled.Text`
  font-size: 16px;
  color: #2196F3;
  margin-top: 5px;
`;

export const TotalValueContainer = styled.View`
  align-items: flex-end;
`;

export const TotalInstallmentValue = styled.Text`
  font-size: 14px;
  color: #2196F3;
  margin-top: 4px;
`;