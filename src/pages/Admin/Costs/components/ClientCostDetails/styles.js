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

export const ClientInfoCard = styled.View`
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 20px;
  margin: 0 16px 16px 16px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
`;

export const ClientName = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`;

export const ClientEmail = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
`;

export const ClientTotalCosts = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #CB2921;
  margin-top: 5px;
`;

export const CostCard = styled.TouchableOpacity`
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

export const CostCardHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

export const CostDate = styled.Text`
  font-size: 14px;
  color: #666;
`;

export const CostValue = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #CB2921;
`;

export const CostCardContent = styled.View`
  margin-bottom: 12px;
`;

export const CostDescription = styled.Text`
  font-size: 16px;
  color: #333;
`;

export const CostCardFooter = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;

export const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  background-color: #F5F5F5;
  border-radius: 5px;
  margin-left: 8px;
`;

export const ActionButtonText = styled.Text`
  font-size: 14px;
  color: #333;
  margin-left: 4px;
`;

export const DeleteButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  background-color: #FFEBEE;
  border-radius: 5px;
  margin-left: 8px;
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

export const ModalContainer = styled.View`
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

export const ModalContent = styled.View`
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 20px;
  width: ${Platform.OS === 'web' ? '400px' : '90%'};
  max-width: 500px;
`;

export const ModalTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
`;

export const ModalText = styled.Text`
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
  text-align: center;
`;

export const ModalButtons = styled.View`
  flex-direction: row;
  justify-content: space-around;
`;

export const ModalButton = styled.TouchableOpacity`
  padding: 10px 20px;
  border-radius: 5px;
  background-color: ${props => props.cancel ? '#F5F5F5' : '#CB2921'};
`;

export const ModalButtonText = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #FFFFFF;
`;

export const CloseButton = styled.TouchableOpacity`
  align-self: center;
  padding: 10px 20px;
  border-radius: 5px;
  background-color: #CB2921;
  margin-top: 15px;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const CostDetailModal = styled.View`
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

export const CostDetailTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

export const CostDetailContent = styled.View`
  margin-bottom: 15px;
`;

export const CostDetailItem = styled.View`
  margin-bottom: 12px;
`;

export const CostDetailLabel = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`;

export const CostDetailValue = styled.Text`
  font-size: 16px;
  color: #333;
`;

export const PaymentTypeTag = styled.View`
  background-color: #E3F2FD;
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
  margin-top: 5px;
`;

export const PaymentTypeText = styled.Text`
  font-size: 12px;
  color: #2196F3;
  font-weight: bold;
`;

export const FilterContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 16px;
`;

export const FilterButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  background-color: #F0F0F0;
  border-radius: 5px;
`;

export const FilterButtonText = styled.Text`
  font-size: 14px;
  color: #333;
  margin-left: 5px;
`;

export const FilterInfo = styled.Text`
  font-size: 14px;
  color: #666;
`;