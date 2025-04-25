import styled from 'styled-components/native';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const isWebMobile = Platform.OS === 'web' && window.innerWidth < 768;
const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

export const Container = styled.ScrollView.attrs({
    contentContainerStyle: {
        padding: 20,
        paddingBottom: 30 
    }
})`
    flex: 1;
    background-color: #F5F5F5;
`;

export const UserCard = styled.View`
    background-color: #FFF;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
    ${Platform.OS === 'web' 
        ? `box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);` 
        : `
            shadow-color: #000;
            shadow-offset: 0px 1px;
            shadow-opacity: 0.1;
            shadow-radius: 2px;
            elevation: 2;
        `
    }
`;

export const UserInfo = styled.View`
    flex: 1;
    margin-top: 10px;
    margin-bottom: ${Platform.OS === 'web' ? '50px' : '0px'};
`;

export const UserEmail = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333;
`;

// Alterando de Text para View para evitar o erro de renderização de texto
export const TextContainer = styled.View`
    flex-direction: row;
    align-items: center;
    margin-top: 5px;
`;

export const TextInfo = styled.Text`
    font-size: 16px;
    color: #555;
    font-weight: bold;
`;

export const TextInfoStatus = styled.Text`
    font-size: 18px;
    color: #555;
    margin-top: 10px;
    font-weight: bold;
    margin-bottom: 10px;
`;

export const TextUserData = styled.Text`
    font-size: 14px;
    color: #666;
`;

export const TextUserDataMotoAlugada = styled.Text`
    font-size: 14px;
    color: ${props => props.alugada ? '#28a745' : 'red'};
    font-weight: bold;
`;

export const UserStatus = styled.Text`
    color: ${props => props.approved ? '#28a745' : 'red'};
    font-weight: bold;
    margin-top: 10px;
    font-size: 17px;
    margin-bottom: 10px;
`;

export const ActionButton = styled.TouchableOpacity`
    background-color: rgb(43, 42, 42);
    padding: 10px;
    border-radius: 18px;
    align-items: center;
    justify-content: center;
    width: ${Platform.OS === 'web' ? '25%' : '25%'};
`;

export const ActionButtonText = styled.Text`
    color: #FFF;
    font-weight: bold;
    font-size: 15px;
`;

export const DestalhesButton = styled.TouchableOpacity`
    background-color: #CB2921;
    align-items: center;
    justify-content: center;
    padding: 10px;
    border-radius: 18px;
    width: 30%;
`;

export const DestalhesButtonText = styled.Text`
    color: #FFF;
    font-weight: bold;
    font-size: 15px;
`;

export const AreaButtons = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-top: ${Platform.OS === 'web' ? '170px' : '10px'};
    width: 100%;
`;

export const TrocaOleoButton = styled.TouchableOpacity`
    background-color: rgb(241, 112, 6);
    padding: 10px;
    border-radius: 18px;
    align-items: center;
    justify-content: center;
    width: ${Platform.OS === 'web' ? '35%' : '35%'};
`;

export const TrocaOleoButtonText = styled.Text`
    color: #FFF;
    font-weight: bold;
    font-size: 15px;
`;

export const EmptyMessage = styled.Text`
    font-size: 16px;
    color: #666;
    text-align: center;
`;
