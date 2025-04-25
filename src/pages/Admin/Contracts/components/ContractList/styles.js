import styled from 'styled-components/native';
import { Platform } from 'react-native';

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

export const Container = styled.ScrollView.attrs({
    contentContainerStyle: {
        padding: 20,
        paddingBottom: 30
    },
    nestedScrollEnabled: true
})`
    flex: 1;
    background-color: #F5F5F5;
`;

export const ContractCard = styled.View`
    background-color: #FFF;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 40px;
    elevation: 2;
    margin-top: -20px;
`;

export const ContractNumber = styled.Text`
    font-size: 20px;
    color: #333;
`;

export const ContractId = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: #333;
`;

export const ContractContainer = styled.Text`
`;

export const ContractDetails = styled.View`
    margin-top: 10px;
`;

export const DetailRow = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 5px;
`;

export const DetailLabel = styled.Text`
    color: #555;
`;

export const DetailLabelStatus = styled.Text`
    color: #555;
    font-size: 17px;
    margin-top: 10px;
    margin-bottom: 10px;
`;

export const DetailStatus = styled.Text`
    color: ${props => props.aprovado ? '#28a745' : 'red'};
    font-weight: bold;
    font-size: 17px;
    margin-top: 10px;
    margin-bottom: 10px;
`;

export const DetailValue = styled.Text`
    color: #333;
    font-weight: bold;
`;

export const ActionButtons = styled.View`
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 15px;
`;

export const PdfContainer = styled.View`
    width: 100%;
    max-width: 900px;
    align-self: center;
    height: ${isWebDesktop ? '700px' : '400px'};
    margin-bottom: 30px;
    border-radius: 5px;
    overflow: hidden;
`;

export const ContactIconButton = styled.TouchableOpacity`
    padding: 5px;
    margin-left: 10px;
    justify-content: center;
    align-items: center;
`;

export const DocumentTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    margin-top: 30px;
    color: #555;
    margin-bottom: 10px;
`;

export const ActionButton = styled.TouchableOpacity`
    background-color: rgb(43, 42, 42);
    padding: 10px;
    width: 30%;
    align-self: center;
    align-items: center;
    justify-content: center;
    border-radius: 25px;
    margin-top: 15px;
`;

export const ActionButtonText = styled.Text`
    color: #FFF;
    font-weight: bold;
    margin-left: 5px;
    font-size: 16px;
`;

export const EmptyMessage = styled.Text`
    font-size: 16px;
    color: #666;
    text-align: center;
`;
