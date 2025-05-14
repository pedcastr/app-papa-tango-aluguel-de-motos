import styled from 'styled-components/native';

export const NotificationButton = styled.TouchableOpacity`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  position: relative;
`;

export const NotificationBadge = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  background-color: #000000;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  padding-horizontal: 4px;
`;

export const NotificationBadgeText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

export const NotificationModal = styled.View`
  flex: 1;
  background-color: white;
`;

export const NotificationHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #CB2921;
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color:rgb(129, 128, 128); 
`;

export const NotificationTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #FFFFFF;
`;

export const CloseButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
`;

export const NotificationList = styled.FlatList`
  flex: 1;
  padding: 10px;
`;

export const NotificationItem = styled.TouchableOpacity`
  padding: 15px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
  background-color: ${props => props.read ? 'white' : '#f9f9f9'};
`;

export const NotificationItemTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
`;

export const NotificationItemBody = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

export const NotificationItemDate = styled.Text`
  font-size: 12px;
  color: #999;
  text-align: right;
`;

export const EmptyNotificationContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const EmptyNotificationText = styled.Text`
  font-size: 16px;
  color: #999;
  text-align: center;
  margin-top: 10px;
`;

export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;