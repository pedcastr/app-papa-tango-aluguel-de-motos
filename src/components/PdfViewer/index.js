import React from 'react';
import { View, TouchableOpacity, Text, Platform, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

export default function PdfViewer({ uri, fileName, onRemove }) {
  // Função para baixar o PDF (web mobile)
  const handleDownloadPdf = () => {
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = uri;
      link.download = fileName || 'documento.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Função para visualizar o PDF (nativo)
  const handleViewPdf = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        Alert.alert(
          "Visualizar PDF",
          "Escolha um aplicativo para abrir o PDF ou salve-o no seu dispositivo.",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Abrir",
              onPress: async () => {
                await Sharing.shareAsync(uri, {
                  UTI: '.pdf', // Para iOS
                  mimeType: 'application/pdf', // Para Android
                });
              }
            }
          ]
        );
      } else {
        Alert.alert("Erro", "O compartilhamento não está disponível neste dispositivo");
      }
    } catch (error) {
      console.error('Erro ao abrir o PDF:', error);
      Alert.alert('Erro', 'Não foi possível abrir o PDF. Tente novamente.');
    }
  };

  // Determina a plataforma
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  const isWebMobile = Platform.OS === 'web' && window.innerWidth < 768;
  const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

  // Versão para dispositivos nativos (Android/iOS)
  if (isNative) {
    return (
      <View style={styles.container}>
        <View style={styles.fileInfoContainer}>
          <MaterialIcons name="picture-as-pdf" size={30} color="#CB2921" />
        </View>
        
        <View style={styles.pdfIconContainer}>
          <MaterialIcons name="picture-as-pdf" size={80} color="#CB2921" style={{ marginBottom: 10, marginTop: 10 }} />
          <Text style={styles.fileName} numberOfLines={2} ellipsizeMode="middle">
            PDF Selecionado: <Text style={[styles.fileName, styles.bold]}>{fileName || "Documento PDF"}</Text>
          </Text>
        </View>
        
        <View style={styles.buttonRow}>
          {/* Botão de visualizar (apenas para plataformas nativas) */}
          <TouchableOpacity style={styles.buttonView} onPress={handleViewPdf}>
            <MaterialIcons name="visibility" size={18} color="#fff" />
            <Text style={styles.buttonText}>Visualizar</Text>
          </TouchableOpacity>
          
          {/* Botão de remover */}
          <TouchableOpacity style={styles.buttonCancel} onPress={onRemove}>
            <MaterialIcons name="close" size={18} color="#fff" />
            <Text style={styles.buttonText}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Versão para web mobile
  if (isWebMobile) {
    return (
      <View style={styles.container}>
        
        <View style={styles.pdfIconContainer}>
          <MaterialIcons name="picture-as-pdf" size={80} color="#CB2921" style={{ marginBottom: 10, marginTop: 10 }} />
          <Text style={styles.fileName} numberOfLines={2} ellipsizeMode="middle">
            PDF Selecionado:<Text style={[styles.fileName, styles.bold]}>{fileName || "Documento PDF"}</Text>
          </Text>
        </View>
        
        <View style={styles.buttonRow}>
          {/* Botão de baixar (web mobile) */}
          <TouchableOpacity style={styles.button} onPress={handleDownloadPdf}>
            <MaterialIcons name="file-download" size={18} color="#fff" />
            <Text style={styles.buttonText}>Baixar PDF</Text>
          </TouchableOpacity>
          
          {/* Botão de remover */}
          <TouchableOpacity style={styles.buttonCancel} onPress={onRemove}>
            <MaterialIcons name="close" size={18} color="#fff" />
            <Text style={styles.buttonText}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Versão para web desktop (com iframe)
  return (
    <View style={styles.container}>
      <View style={styles.pdfContainer}>
        <iframe
          src={uri}
          style={styles.iframe}
          title="Visualizador de PDF"
        />
        <TouchableOpacity style={styles.buttonRemove} onPress={onRemove}>
          <MaterialIcons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  pdfContainer: {
    width: '100%',
    height: 500,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  pdfIconContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  pdfLabel: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 10, // Adicionando margem superior para separar dos elementos acima
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#007bff',
    margin: 5,
    borderRadius: 5,
  },
  buttonView: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#28a745',
    margin: 5,
    borderRadius: 5,
  },
  buttonCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#CB2921',
    margin: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  buttonRemove: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,0,0,0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
