import styled from 'styled-components/native';

export const Container = styled.View`
    flex: 1;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
`;

export const ProgressContainer = styled.View`
    width: 80%;
    background-color: white;
    border-radius: 10px;
    padding: 20px;
`;

export const ProgressBar = styled.View`
    height: 8px;
    background-color: #E0E0E0;
    border-radius: 4px;
    overflow: hidden;
`;

export const ProgressText = styled.Text`
    font-size: 14px;
    color: #666;
    margin-top: 5px;
    text-align: center;
`;