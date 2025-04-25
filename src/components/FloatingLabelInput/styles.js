import styled from 'styled-components/native';
import Animated from 'react-native-reanimated';

// Container principal com margem dinâmica para o input de senha
export const Container = styled.View`
    width: 100%;
    margin-bottom: ${props => props.isPassword && props.isFocused ? '30px' : '15px'};
    position: relative;
    margin-top: ${props => props.isPassword && props.isFocused ? '15px' : '0px'};
`;

// Container do input com borda e background
export const InputContainer = styled.View`
    width: 100%;
    height: 56px;
    background-color: ${props => props.error ? '#FFE8E8' : '#F5F5F5'};
    border-radius: 15px;
    border: 1px solid ${props => props.error ? '#FF3B30' : '#E0E0E0'};
    justify-content: center;
`;

// Container do label animado
export const LabelContainer = styled(Animated.View)`
    position: absolute;
    left: 15px;
    z-index: 1;
`;

// Label com efeito de corte quando focado
export const AnimatedLabel = styled(Animated.Text)`
    color: #667;
    font-size: 18px;
    font-weight: ${props => props.isFocused ? 'bold' : 'normal'};
    color: ${props => props.isFocused ? '#000' : '#667'};
    z-index: 2;
    margin-left: -4px;
`;

// Campo de input estilizado
export const StyledInput = styled.TextInput`
    flex: 1;
    padding: 0 15px;
    font-size: 16px;
    color: #000;
`;

// Container do ícone de visibilidade da senha
export const IconContainer = styled.TouchableOpacity`
    position: absolute;
    right: 15px;
    padding: 5px;
`;
