import React from 'react';
import { Modal, Animated } from 'react-native';
import {
    Container,
    ProgressContainer,
    ProgressBar,
    ProgressText,
} from './styles';

const ProgressModal = ({ visible, progress, status }) => {
    const width = progress * 100;
    
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <Container>
                <ProgressContainer>
                    <ProgressBar>
                        <Animated.View 
                            style={{
                                height: '100%',
                                width: `${width}%`,
                                backgroundColor: '#CB2921',
                                borderRadius: 4
                            }}
                        />
                    </ProgressBar>
                    <ProgressText>{status}</ProgressText>
                    <ProgressText>{Math.round(progress * 100)}%</ProgressText>
                </ProgressContainer>
            </Container>
        </Modal>
    );
};

export default ProgressModal;