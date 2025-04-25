import styled from 'styled-components/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

export const Container = styled.SafeAreaView`
    flex: 1;
    background-color: #FFFFFF;
    padding: 20px;
`;

export const Form = styled.View`
    flex: 1;
    width: 100%;
`;

export const Section = styled.View`
    margin-bottom: 20px;
    background-color: #F9F9F9;
    border-radius: 15px;
    padding: 15px;
    border: 1px solid #E0E0E0;
`;

export const Switch = styled.Switch`
    transform: scale(0.9);
    margin-top: ${Platform.OS === 'web' ? '0px' : '-10px'};
`;

export const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #1E1E1E;
    margin-bottom: 15px;
    text-align: center;
`;

export const InputGroup = styled.View`
    margin-bottom: 15px;
`;

export const Label = styled.Text`
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
`;

export const Input = styled.TextInput`
    width: 100%;
    height: 50px;
    background-color: ${props => props.error ? '#FFE8E8' : '#F5F5F5'};
    border-radius: 10px;
    border: 1px solid ${props => props.error ? '#FF3B30' : '#E0E0E0'};
    padding: 0 15px;
    font-size: 16px;
    color: #333;
`;

export const ErrorText = styled.Text`
    color: #FF3B30;
    font-size: 14px;
    margin-top: 5px;
`;

export const StatusContainer = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-top: 5px;
    align-items: center;
    justify-content: center;
`;

export const StatusOption = styled.TouchableOpacity`
    flex-basis: 48%;
    margin: 5px;
    padding: 12px;
    background-color: ${props => props.selected ? '#CB2921' : '#F5F5F5'};
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    align-self: center;
    border: 1px solid ${props => props.selected ? '#CB2921' : '#E0E0E0'};
`;

export const StatusLabel = styled.Text`
    color: ${props => props.selected ? '#FFFFFF' : '#333333'};
    font-weight: ${props => props.selected ? 'bold' : 'normal'};
    font-size: 14px;
`;

export const ImagePreviewContainer = styled.TouchableOpacity`
    width: 100%;
    height: ${isWebDesktop ? '350px' : '280px'};
    background-color: #F5F5F5;
    border-radius: 10px; 
    overflow: hidden;
    justify-content: center;
    align-items: center;
    border: 1px dashed #999;
    margin-bottom: 10px;
    position: relative;
`;

export const MotoImage = styled.Image`
    width: 100%;
    height: 100%;
    resize-mode: cover;
`;

export const ImagePlaceholder = styled.View`
    justify-content: center;
    align-items: center;
`;

export const NoImageText = styled.Text`
    color: #999;
    font-size: 16px;
    margin-top: 10px;
`;

export const RemoveImageButton = styled.TouchableOpacity`
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    width: 30px;
    height: 30px;
    justify-content: center;
    align-items: center;
    z-index: 10;
`;

export const RemoveImageIcon = styled(MaterialCommunityIcons)`
`;

export const ImageActions = styled.View`
    flex-direction: row;
    justify-content: center;
    margin-top: 10px;
`;

export const ActionButton = styled.TouchableOpacity`
    background-color: #E74C3C;
    padding: 12px 20px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    margin: 0 5px;
`;

export const ActionButtonText = styled.Text`
    color: #FFFFFF;
    font-weight: bold;
    font-size: 14px;
`;

export const SubmitButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    margin-bottom: 30px;
`;

export const SubmitButtonText = styled.Text`
    color: #FFFFFF;
    font-weight: bold;
    font-size: 18px;
`;
