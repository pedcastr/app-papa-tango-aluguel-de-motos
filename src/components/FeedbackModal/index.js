import React from 'react';
import { Modal, Pressable } from 'react-native'; 
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
    ModalContainer,
    ModalContent,
    IconContainer,
    Title,
    Message,
    Button,
    ButtonText
} from './styles';

export const FeedbackModal = ({ visible, type, title, message, onClose }) => {
    const getIconProps = () => {
        switch (type) {
            case 'success':
                return { name: 'check-circle', color: '#4CAF50' };
            case 'error':
                return { name: 'error', color: '#f44336' };
            default:
                return { name: 'info', color: '#2196F3' };
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <Pressable onPress={onClose} style={{ flex: 1 }}>
                <ModalContainer>
                    <Pressable>
                        <ModalContent>
                            <IconContainer>
                                <Icon {...getIconProps()} size={50} />
                            </IconContainer>
                            <Title>{title}</Title>
                            <Message>{message}</Message>
                            <Button onPress={onClose}>
                                <ButtonText>OK</ButtonText>
                            </Button>
                        </ModalContent>
                    </Pressable>
                </ModalContainer>
            </Pressable>
        </Modal>
    );
};