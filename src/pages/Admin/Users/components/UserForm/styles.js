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
    elevation: 2;
`;

export const SectionTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
`;

export const InputGroup = styled.View`
    margin-bottom: 15px;
`;

export const Label = styled.Text`
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
`;

export const Input = styled.TextInput`
    background-color: #F8F9FA;
    padding: 12px;
    border-radius: 5px;
    border-width: 1px;
    border-color: #DDD;
    font-size: 16px;
`;

export const DocumentSection = styled.View`
    margin-bottom: 20px;
`;

export const UploadButton = styled.TouchableOpacity`
    background-color: #285ED3;
    padding: 12px;
    border-radius: 5px;
    align-items: center;
    margin-top: 5px;
`;

export const UploadButtonText = styled.Text`
    color: #FFF;
    font-weight: bold;
    font-size: 14px;
`;

export const DocumentPreview = styled.View`
    margin-top: 10px;
    border-radius: 5px;
    overflow: hidden;
    position: relative;
`;

export const DocumentPreviewImage = styled.Image`
    width: 100%;
    height: 200px;
`;

export const RemoveButton = styled.TouchableOpacity`
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 8px;
    border-radius: 20px;
`;

export const PdfContainer = styled.View`
    margin-top: 10px;
    height: ${isWebDesktop ? '500px' : '410px'};
    border-radius: 5px;
    overflow: hidden;
    position: relative;
    border-width: 1px;
    border-color: #DDD;
`;

export const PDFPreviewText = styled.Text`
    color: #333;
    font-size: 14px;
    flex: 1;
    margin-right: 10px;
`;

export const SubmitButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px;
    border-radius: 25px;
    align-items: center;
    margin-top: 20px;
    margin-bottom: 30px;
`;

export const SubmitButtonText = styled.Text`
    color: #FFF;
    font-size: 16px;
    font-weight: bold;
`;
