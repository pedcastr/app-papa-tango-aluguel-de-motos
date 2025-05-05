import styled from 'styled-components/native';

export const Container = styled.SafeAreaView`
  flex: 1;
  padding: 20px;
  background-color: #FFFFFF;
`;

export const Header = styled.View`
  margin-bottom: 20px;
  align-items: center;
`;

export const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  textt-align: center;
  color: #333;
`;

export const Card = styled.View`
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  elevation: 3;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
  border: 1px solid #EEEEEE;
`;

export const CardTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
`;

export const CardContent = styled.View`
  margin-top: 10px;
  padding-top: 10px;
  border-top-width: 1px;
  border-top-color: #EEEEEE;
`;

export const CardText = styled.Text`
  font-size: 14px;
  color: #666;
`;

export const CardAmount = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #CB2921;
  margin-top: 5px;
  margin-bottom: 5px;
`;

export const Button = styled.TouchableOpacity`
  background-color: #CB2921;
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
`;

export const ButtonText = styled.Text`
  color: #FFFFFF;
  font-weight: bold;
  font-size: 14px;
`;

export const EmptyContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const EmptyText = styled.Text`
  font-size: 16px;
  color: #999;
  text-align: center;
  margin-top: 15px;
  margin-bottom: 15px;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const StatusBadge = styled.View`
  padding-vertical: 4px;
  padding-horizontal: 8px;
  border-radius: 12px;
  background-color: ${props => props.color || '#6c757d'};
`;

export const StatusText = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
`;

export const PaymentInfoContainer = styled.View`
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  elevation: 3;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
`;

export const PaymentInfoTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #343a40;
`;

export const PaymentInfoRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const PaymentInfoLabel = styled.Text`
  color: #6c757d;
  font-size: 14px;
`;

export const PaymentInfoValue = styled.Text`
  font-weight: bold;
  font-size: 14px;
  color: #212529;
`;

export const CountdownContainer = styled.View`
  padding: 10px;
  border-radius: 20px;
  margin-top: 10px;
  margin-bottom: 15px;
`;

export const CountdownText = styled.Text`
  text-align: center;
  font-weight: bold;
  font-size: 14px;
`;

export const Divider = styled.View`
  height: 1px;
  background-color: #E0E0E0;
  width: 100%;
  margin: 15px 0;
`;
