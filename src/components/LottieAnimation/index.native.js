import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const LottieAnimation = ({ 
  source, 
  autoPlay = true, 
  loop = false, 
  speed = 1, 
  style = {},
  onAnimationFinish = () => {}
}) => {
  const lottieRef = useRef(null);
  
  // Efeito para garantir que a animação seja reproduzida corretamente
  useEffect(() => {
    if (lottieRef.current && autoPlay) {
      // Pequeno atraso para garantir que o componente esteja montado
      const timer = setTimeout(() => {
        if (lottieRef.current) {
          lottieRef.current.reset();
          lottieRef.current.play();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoPlay, source]);

  return (
    <View style={[styles.container, style]}>
      <LottieView
        ref={lottieRef}
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={styles.animation}
        resizeMode="cover"
        onAnimationFinish={onAnimationFinish}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    margin: 20,
  },
  animation: {
    width: '100%',
    height: '50%',
  }
});

export default LottieAnimation;
