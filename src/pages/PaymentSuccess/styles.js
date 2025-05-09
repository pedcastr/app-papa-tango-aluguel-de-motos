import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  background-color: #FFFFFF;
`;

export const SuccessIcon = styled.View`
  margin-top: 10px;
  margin-bottom: 20px;
  align-items: center;
`;

export const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 10px;
`;

export const Subtitle = styled.Text`
  font-size: 16px;
  color: #666;
  text-align: center;
  margin-bottom: 30px;
`;

export const InfoCard = styled.View`
  background-color: #F8F9FA;
  border-radius: 10px;
  padding: 20px;
  width: 100%;
  margin-bottom: 20px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
`;

export const UserInfoCard = styled(InfoCard)`
  margin-top: 10px;
`;

export const UserInfoTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
`;

export const InfoRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom-width: 1px;
  border-bottom-color: #E0E0E0;
`;

export const InfoLabel = styled.Text`
  font-size: 16px;
  color: #666;
`;

export const InfoValue = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 10px;
`;

export const Button = styled.TouchableOpacity`
  background-color: #CB2921;
  border-radius: 25px;
  align-self: center;
  padding: 15px;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 10px;
`;

export const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

export const ShareButton = styled.TouchableOpacity`
  background-color: #6c757d;
  border-radius: 25px;
  padding: 15px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  width: 100%;
  margin-top: 20px;
`;

export const ShareButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
  margin-left: 10px;
`;

export const QRCodeContainer = styled.View`
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border-width: 1px;
  border-color: #E0E0E0;
`;

export const Instructions = styled.Text`
  font-size: 16px;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
  margin-top: 10px;
`;

export const CodeContainer = styled.View`
  background-color: #F8F9FA;
  border-radius: 8px;
  padding: 15px;
  width: 100%;
  margin-bottom: 20px;
  border-width: 1px;
  border-color: #E0E0E0;
`;

export const CodeText = styled.Text`
  font-family: monospace;
  font-size: 14px;
  color: #333;
  padding: 5px;
  text-align: center;
`;

export const Divider = styled.View`
  height: 1px;
  background-color: #E0E0E0;
  width: 100%;
  margin: 15px 0;
`;
