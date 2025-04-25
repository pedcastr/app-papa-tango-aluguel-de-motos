import styled from 'styled-components/native';

export const Container = styled.SafeAreaView`
    flex: 1;
`;

export const PaymentContainer = styled.View`
    flex: 1;
    padding: 20px;
`;

export const Title = styled.Text`
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    color: #333;
    margin-bottom: 20px;
`;

export const Subtitle = styled.Text`
    font-size: 16px;
    color: #666;
    margin-bottom: 5px;
`;

export const AmountText = styled.Text`
    font-size: 28px;
    font-weight: bold;
    color: #CB2921;
    margin-bottom: 30px;
`;

export const WebViewContainer = styled.View`
    width: 100%;
    height: 400px;
    margin-bottom: 20px;
    border: 1px solid #E0E0E0;
    border-radius: 10px;
    overflow: hidden;
`;

export const Button = styled.TouchableOpacity`
    background-color: #CB2921;
    max-width: 500px;
    padding: 15px;
    border-radius: 25px;
    align-self: center;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

export const ButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
`;

export const Divider = styled.View`
    height: 1px;
    background-color: #E0E0E0;
    width: 100%;
    margin-vertical: 20px;
`;

export const ErrorContainer = styled.View`
    background-color: #FFE8E8;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #FF3B30;
`;

export const ErrorText = styled.Text`
    color: #FF3B30;
    font-size: 14px;
`;

export const PaymentOption = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 15px;
    border-radius: 10px;
    border-width: 1px;
    margin-bottom: 15px;
    background-color: #FFFFFF;
`;

export const PaymentOptionIcon = styled.View`
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background-color: #F5F5F5;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
`;

export const PaymentOptionText = styled.Text`
    font-size: 16px;
    color: #333;
`;

export const PaymentMethodContainer = styled.View`
    padding: 15px;
    background-color: #F8F8F8;
    border-radius: 10px;
    margin-bottom: 20px;
`;

export const PaymentMethodTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
`;

export const PaymentMethodDescription = styled.Text`
    font-size: 14px;
    color: #666;
`;

// Adicione este componente aos estilos existentes
export const InfoBanner = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 15px;
  background-color: #E3F2FD;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #BBDEFB;
`;