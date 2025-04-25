import styled from 'styled-components/native';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const ModalContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
`;

export const ModalContent = styled.View`
    background-color: white;
    padding: 25px;
    border-radius: 15px;
    align-items: center;
    width: 90%;
    max-width: 340px;
    elevation: 5;
    shadow-color: #000000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.25;
`;

export const IconContainer = styled.View`
    margin-bottom: 15px;
`;

export const Title = styled.Text`
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #333;
`;

export const Message = styled.Text`
    font-size: 16px;
    text-align: center;
    color: #666;
    margin-bottom: 20px;
`;

export const Button = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 10px 30px;
    border-radius: 5px;
`;

export const ButtonText = styled.Text`
    color: white;
    font-size: 16px;
    font-weight: bold;
`;

