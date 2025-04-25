import styled from 'styled-components/native';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const Container = styled.View`
    flex: 1;
    background-color: #F5F5F5;
`;

export const BackButton = styled.TouchableOpacity`
    padding: 5px;
`;

export const Section = styled.View`
    background-color: #FFF;
    margin: 10px;
    padding: 15px;
    border-radius: 10px;
    elevation: 2;
`;

export const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
    border-bottom-width: 1px;
    border-bottom-color: #E0E0E0;
    padding-bottom: 5px;
`;

export const InfoRow = styled.View`
    flex-direction: row;
    margin-bottom: 10px;
    flex-wrap: wrap;
`;

export const InfoLabel = styled.Text`
    font-weight: bold;
    color: #555;
    width: 100px;
`;

export const InfoValue = styled.Text`
    color: #333;
    flex: 1;
`;

export const AddressSection = styled(Section)``;

export const DocumentSection = styled(Section)``;

export const DocumentTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #555;
    margin-bottom: 10px;
`;

export const DocumentImage = styled.Image`
    width: 100%;
    height: 550px;
    border-radius: 10px;
    margin-bottom: 20px;
    background-color: #F0F0F0;
`;

export const PdfContainer = styled.View`
    width: 100%;
    height: ${props => props.fullScreen ? '100%' : '500px'};
    margin-bottom: 20px;
    border-radius: 5px;
    overflow: hidden;
    ${props => props.fullScreen && `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
        background-color: rgba(0, 0, 0, 0.9);
    `}
`;

export const ButtonsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    padding: 15px;
    margin-bottom: 20px;
`;

export const ActionButton = styled.TouchableOpacity`
    background-color: ${props => props.approve ? '#4CAF50' : props.reject ? '#F44336' : '#2196F3'};
    padding: 15px;
    border-radius: 8px;
    flex: 0.48;
    align-items: center;
`;

export const ActionButtonText = styled.Text`
    color: #FFF;
    font-weight: bold;
    font-size: 16px;
`;

export const StatusBadge = styled.View`
    background-color: ${props => props.approved ? '#E8F5E9' : '#FFEBEE'};
    padding: 8px 15px;
    border-radius: 20px;
    align-self: flex-start;
    margin: 15px 0 5px 15px;
    border: 1px solid ${props => props.approved ? '#4CAF50' : '#F44336'};
`;

export const StatusText = styled.Text`
    color: ${props => props.approved ? '#4CAF50' : '#F44336'};
    font-weight: bold;
    font-size: 14px;
`;

export const LoadingContainer = styled.View`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    justify-content: center;
    align-items: center;
    z-index: 999;
`;

export const FullScreenContainer = styled.View`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #000;
    z-index: 1000;
    justify-content: center;
    align-items: center;
`;

export const CloseButton = styled.TouchableOpacity`
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1001;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 10px;
    border-radius: 20px;
`;

export const FullScreenImage = styled.Image`
    width: ${width}px;
    height: ${width * 1.5}px;
    resize-mode: contain;
`;

export const DocumentInfo = styled.View`
    margin-bottom: 10px;
`;

export const DocumentInfoText = styled.Text`
    color: #666;
    font-size: 12px;
    margin-bottom: 5px;
`;

export const NoDocumentText = styled.Text`
    color: #999;
    font-style: italic;
    text-align: center;
    margin: 20px 0;
`;

export const Divider = styled.View`
    height: 1px;
    background-color: #E0E0E0;
    margin: 10px 0;
`;

export const ContactIconButton = styled.TouchableOpacity`
    padding: 5px;
    margin-left: 10px;
    justify-content: center;
    align-items: center;
`;

export const WebPdfContainer = styled.View`
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
    background-color: #F5F5F5;
    border: 1px solid #E0E0E0;
`;
