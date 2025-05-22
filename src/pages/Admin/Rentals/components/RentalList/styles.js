import styled from 'styled-components/native';
import { Platform } from 'react-native';

export const Container = styled.View`
    flex: 1;
    background-color: #F5F5F5;
    padding: 16px;
`;

export const RentalsList = styled.ScrollView.attrs({
    showsVerticalScrollIndicator: true,
    contentContainerStyle: {
        paddingBottom: 20
    }
})`
    flex: 1;
`;

export const RentalCard = styled.View`
    background-color: #FFFFFF;
    border-radius: 10px;
    margin-bottom: 16px;
    elevation: 2;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    shadow-color: #000;
    shadow-offset: 0px 1px;
    overflow: hidden;
`;

export const RentalHeader = styled.View`
    padding: 12px;
    background-color: #F9F9F9;
    border-bottom-width: 1px;
    border-bottom-color: #EEEEEE;
`;

export const RentalStatus = styled.View`
    background-color: ${props => 
        props.status === 'inativo' ? '#FFE8E8' : 
        props.status === 'ativo' ? '#E8F5E9' : '#F5F5F5'};
    padding: 6px 12px;
    border-radius: 20px;
    align-self: flex-start;
`;

export const StatusText = styled.Text`
    color: ${props => 
        props.status === 'inativo' ? '#D32F2F' : 
        props.status === 'ativo' ? '#2E7D32' : '#333333'};
    font-weight: bold;
    font-size: 14px;
`;

export const RentalInfo = styled.View`
    padding: 16px;
`;

export const InfoRow = styled.View`
    flex-direction: row;
    margin-bottom: 8px;
    align-items: center;
`;

export const InfoLabel = styled.Text`
    font-weight: bold;
    color: #666666;
    width: 120px;
    font-size: 14px;
`;

export const InfoValue = styled.Text`
    color: #333333;
    flex: 1;
    font-size: 14px;
`;

export const EditButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 10px;
    border-radius: 8px;
    align-items: center;
    margin-top: 10px;
`;

export const EditButtonText = styled.Text`
    color: #FFFFFF;
    font-weight: bold;
    font-size: 14px;
`;

export const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

export const EmptyListContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

export const EmptyListText = styled.Text`
    color: #999;
    font-size: 16px;
    margin-top: 10px;
    text-align: center;
`;

export const EmptyText = styled.Text`
    font-size: 16px;
    color: #667;
    text-align: center;
    margin-top: 26px;
`;
