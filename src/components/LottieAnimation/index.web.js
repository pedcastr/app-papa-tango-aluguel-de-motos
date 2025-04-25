import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import lottie from 'lottie-web';

const LottieAnimation = ({ 
  source, 
  autoPlay = true, 
  loop = false, 
  speed = 1, 
  style = {},
  onAnimationFinish = () => {}
}) => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current) {
      // Limpa animação anterior se existir
      if (animationRef.current) {
        animationRef.current.destroy();
      }
      
      // Carrega a animação usando lottie-web
      const animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: loop,
        autoplay: autoPlay,
        animationData: source,
      });
      
      // Configura velocidade
      animation.setSpeed(speed);
      
      // Configura callback de finalização
      if (!loop) {
        animation.addEventListener('complete', onAnimationFinish);
      }
      
      // Salva referência para limpeza
      animationRef.current = animation;
      
      return () => {
        animation.removeEventListener('complete', onAnimationFinish);
        animation.destroy();
      };
    }
  }, [source, autoPlay, loop, speed, onAnimationFinish]);
  
  return (
    <View style={[styles.container, style]}>
      <div ref={containerRef} style={styles.animation} />
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
  },
  animation: {
    width: '100%',
    height: '100%',
  }
});

export default LottieAnimation;
