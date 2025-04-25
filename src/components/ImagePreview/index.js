import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ImagePreview({ uri, onRemove, style }) {
  return ( 
    <View style={[styles.container, style]}>
      <Image source={{ uri }} style={styles.image} />
      <TouchableOpacity style={styles.buttonRemove} onPress={onRemove}>
        <MaterialIcons name="close" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 300,
    height: 300,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
  image: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  buttonRemove: {
    position: 'absolute',
    top: 5,
    right: 2,
    backgroundColor: 'rgba(255,0,0,0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
