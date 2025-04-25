import styled from 'styled-components/native';
import { Platform } from 'react-native';

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

export const Container = styled.ScrollView`
    flex: 1;
    background-color: #F5F5F5;
`;

export const Form = styled.View`
    padding: 20px;
`;

export const Section = styled.View`
    background-color: #FFF;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 20px;
`;

export const Switch = styled.Switch`
    transform: scale(0.9);
    margin-top: ${isWebDesktop ? '0' : '-15px'};
`;

export const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
`;

export const InputGroup = styled.View`
    width: 100%;
    margin-bottom: 15px;
`;

export const Label = styled.Text`
    font-size: 16px;
    color: #555;
    margin-bottom: 5px;
`;

export const Input = styled.TextInput`
    width: 100%;
    height: 50px;
    background-color: #F5F5F5;
    border-radius: 8px;
    padding: 0 15px;
    font-size: 16px;
    color: #333;
    border: 1px solid #E0E0E0;
`;

export const UpdateButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 25px;
    align-items: center;
    margin-top: 20px;
`;

export const UpdateButtonText = styled.Text`
    color: #FFF;
    font-size: 16px;
    font-weight: bold;
`;

export const PdfContainer = styled.View`
    width: 100%;
    max-width: 900px;
    align-self: center;
    height: ${isWebDesktop ? '700px' : '400px'};
    margin-vertical: 10px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #DDD;
`;

export const DocumentTitle = styled.Text`
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-vertical: 10px;
    flex-direction: row;
    align-items: center;
`;

export const ContactIconButton = styled.TouchableOpacity`
    padding: 5px;
    margin-left: 10px;
`;

export const PdfActionsContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 10px;
    margin-bottom: 20px;
`;

export const PdfActionButton = styled.TouchableOpacity`
    background-color: ${props => props.color || '#CB2921'};
    padding: 10px 15px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex: 1;
    margin-horizontal: 5px;

    ${Platform.OS === 'web' 
        ? `box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.2);` 
        : `
            elevation: 2;
            shadow-color: #000;
            shadow-offset: 0px 2px;
            shadow-opacity: 0.2;
            shadow-radius: 3px;
        `
    }
`;

export const PdfActionButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 500;
    margin-left: 5px;
`;
