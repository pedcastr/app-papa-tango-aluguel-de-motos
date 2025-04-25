import React, { useRef, useEffect, } from 'react';
import { 
  StyleSheet, 
  Animated, 
  View,
  SafeAreaView,
  StatusBar,
} from 'react-native';

export default function SplashAnimation() {
    const larAnimada = useRef(new Animated.Value(300)).current;
    const altAnimada = useRef(new Animated.Value(300)).current;
    const opacidadeAnimada = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      Animated.sequence([
        Animated.timing(opacidadeAnimada, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.parallel([
          Animated.timing(larAnimada, {
            toValue: 400,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(altAnimada, {
            toValue: 400,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(opacidadeAnimada, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start(() => {
      });
    }, []);
  
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#CB2921'}}>
          <StatusBar backgroundColor='#CB2921' barStyle='light-content' />
            <View style={styles.container}>
                <Animated.Image
                source={require('../assets/Logo.png')}
                style={{
                    width: larAnimada,
                    height: altAnimada,
                    opacity: opacidadeAnimada,
                }}
                />
            </View>
        </SafeAreaView>        
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CB2921',
  },
});