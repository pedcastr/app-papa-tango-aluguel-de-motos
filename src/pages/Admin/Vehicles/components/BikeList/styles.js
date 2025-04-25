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

export const BikeCard = styled.View`
    background-color: #FFF;
    border-radius: 10px;
    margin-top: -20px;
    overflow: hidden;
    margin-bottom: ${isWebDesktop ? '60px' : '30px'};
    ${Platform.OS === 'web' 
        ? `box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);` 
        : `
            elevation: 5;
            shadow-color: #000;
            shadow-offset: 0px 1px;
            shadow-opacity: 0.1;
            shadow-radius: 2px;
        `
    }
`;

export const BikeImage = styled.Image`
    width: 100%;
    height: ${isWebDesktop ? '350px' : '200px'};
    margin-top: ${isWebDesktop ? '10px' : '0px'};
`;

export const BikeInfo = styled.View`
    padding: 15px;
`;

export const BikeModel = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333;
`;

export const InfoBike = styled.Text`
    font-size: 16px;
    color: #333;
`;

export const TextInfo = styled.Text`
    margin-top: 1px;
`;

export const BikeStatus = styled.Text`
    color: ${props => props.available ? '#28a745' : '#CB2921'};
    font-weight: bold;
    margin-top: 10px;
    font-size: 17px;
`;

export const ActionButton = styled.TouchableOpacity`
    background-color: rgb(43, 42, 42);
    padding: 10px;
    align-items: center;
`;

export const ActionButtonText = styled.Text`
    color: #FFF;
    font-weight: bold;
    text-align: center;
`;

export const EmptyMessage = styled.Text`
    font-size: 16px;
    color: #666;
    text-align: center;
`;
