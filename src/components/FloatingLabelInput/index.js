import React, { useState } from 'react';
import { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { 
    Container, 
    InputContainer, 
    StyledInput, 
    AnimatedLabel,
    LabelContainer,
    IconContainer 
} from './styles';

export default function FloatingLabelInput({ 
    label, 
    value, 
    onChangeText, 
    error,
    isPassword,
    showPassword,
    togglePassword,
    ...rest 
}) {
    // Estado de foco do input
    const [isFocused, setIsFocused] = useState(false);
    
    // Valores para animação do label
    const translateY = useSharedValue(value ? -28 : 0);
    const scale = useSharedValue(value ? 0.85 : 1);

    // Estilo animado para movimento e escala do label
    const labelStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    // Handler para quando o input recebe foco
    const handleFocus = () => {
        setIsFocused(true);
        translateY.value = withTiming(-28);
        scale.value = withTiming(0.85);
    };

    // Handler para quando o input perde foco
    const handleBlur = () => {
        setIsFocused(false);
        if (!value) {
            translateY.value = withTiming(0);
            scale.value = withTiming(1);
        }
    };

    return (
        <Container isPassword={isPassword} isFocused={isFocused}>
            <InputContainer error={error}>
                <LabelContainer style={labelStyle}>
                    <AnimatedLabel isFocused={isFocused || !!value}>
                        {label}
                    </AnimatedLabel>
                </LabelContainer>
                
                <StyledInput
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...rest}
                />
                
                {isPassword && (
                    <IconContainer onPress={togglePassword} activeOpacity={0.7}>
                        <MaterialIcons 
                            name={showPassword ? 'visibility' : 'visibility-off'} 
                            size={24} 
                            color="#666"
                        />
                    </IconContainer>
                )}
            </InputContainer>
        </Container>
    );
}