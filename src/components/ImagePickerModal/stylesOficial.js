import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  justify-content: flex-end;
  background-color: rgba(0, 0, 0, 0.5);
`;

export const AreaModal = styled.View`
  background-color: #ffffff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  boxshadow-color: #000;
  boxshadow-offset: 0px 2px;
`;

export const ButtonOpcoes = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 15px;
    border-bottom-width: 1px;
    border-bottom-color: #eeeeee;
`;

export const TextButtonOpcoes = styled.Text`
    font-size: 16px;
    margin-left: 15px;
    color: #000000;
`;

export const ButtonOpcoesCancelar = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 15px;
    border-bottom-width: 1px;
    border-bottom-color: #eeeeee;
    justify-content: center;
    margin-top: 10px;
    border-bottom-width: 0;
`;

export const TextButtonOpcoesCancelar = styled.Text`
    color: #CB2921;
    font-size: 16px;
    font-weight: bold;
`;