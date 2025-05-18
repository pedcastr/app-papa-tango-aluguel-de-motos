import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Platform, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PdfViewer({ uri, fileName, onRemove, height = 500 }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLocalFile, setIsLocalFile] = useState(false);
  
  // Verifica se o arquivo é local ou remoto
  useEffect(() => {
    // Verifica se o URI é uma URL web ou um arquivo local
    const checkIfLocalFile = () => {
      if (!uri) return false;
      
      // Se estiver na web, verifica se o URI começa com blob: ou data:
      if (Platform.OS === 'web') {
        return uri.startsWith('blob:') || 
               uri.startsWith('data:') || 
               (!uri.startsWith('http://') && !uri.startsWith('https://'));
      }
      
      // Para dispositivos nativos, verifica se não é uma URL web
      return !(uri.startsWith('http://') || uri.startsWith('https://'));
    };
    
    setIsLocalFile(checkIfLocalFile());
  }, [uri]);

  // Determina a plataforma
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  const isWeb = Platform.OS === 'web';
  
  // Verifica se o URI é uma URL web
  const isWebUrl = uri && (uri.startsWith('http://') || uri.startsWith('https://'));

  // Função para baixar o PDF em dispositivos nativos
  const downloadPdf = async () => {
    if (!uri) return;
    
    setIsLoading(true);
    
    try {
      // Verifica se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          'Erro',
          'O compartilhamento não está disponível neste dispositivo',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Se for uma URL da web, precisamos baixar o arquivo primeiro
      if (isWebUrl) {
        const fileUri = FileSystem.documentDirectory + (fileName || 'document.pdf');
        const downloadResumable = FileSystem.createDownloadResumable(
          uri,
          fileUri
        );
        
        const { uri: localUri } = await downloadResumable.downloadAsync();
        await Sharing.shareAsync(localUri);
      } else {
        // Para arquivos locais, compartilhamos diretamente
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      Alert.alert(
        'Erro',
        'Não foi possível baixar o PDF',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Função para baixar o PDF (web)
  const handleDownloadPdf = () => {
    if (isWeb && uri) {
      const link = document.createElement('a');
      link.href = uri;
      link.download = fileName || 'documento.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Prepara a URL para visualização via Google Docs
  const getGoogleDocsViewerUrl = (url) => {
    if (!url) return null;
    
    // Retorna a URL formatada para o Google Docs Viewer
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  // Renderiza o visualizador simplificado para arquivos locais na web
  if (isWeb && isLocalFile) {
    return (
      <View style={styles.container}>
        <View style={styles.pdfIconContainer}>
          <MaterialIcons name="picture-as-pdf" size={80} color="#CB2921" style={{ marginBottom: 10, marginTop: 10 }} />
          <Text style={styles.fileName} numberOfLines={2} ellipsizeMode="middle">
            PDF Selecionado: <Text style={[styles.fileName, styles.bold]}>{fileName || "Documento PDF"}</Text>
          </Text>
          <Text style={styles.infoText}>
            Visualização prévia não disponível para arquivos locais. Use o botão abaixo para baixar o PDF.
          </Text>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.buttonDownload} 
            onPress={handleDownloadPdf}
          >
            <MaterialIcons name="file-download" size={18} color="#fff" />
            <Text style={styles.buttonText}>Baixar PDF</Text>
          </TouchableOpacity>
          
          {onRemove && (
            <TouchableOpacity style={styles.buttonCancel} onPress={onRemove}>
              <MaterialIcons name="close" size={18} color="#fff" />
              <Text style={styles.buttonText}>Remover</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Renderiza o visualizador de PDF para web com URLs remotas
  if (isWeb && isWebUrl) {
    // Usar Google Docs Viewer para evitar download automático
    const googleDocsUrl = getGoogleDocsViewerUrl(uri);
    
    return (
      <View style={styles.container}>
        <View style={[styles.pdfContainer, { height }]}>
          <iframe
            src={googleDocsUrl}
            style={styles.iframe}
            title="Visualizador de PDF"
          />
          {onRemove && (
            <TouchableOpacity style={styles.buttonRemove} onPress={onRemove}>
              <MaterialIcons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleDownloadPdf}>
            <MaterialIcons name="file-download" size={18} color="#fff" />
            <Text style={styles.buttonText}>Baixar PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Para dispositivos nativos, usamos o Google Docs Viewer
  if (isNative && isWebUrl) {
    const googleDocsUrl = getGoogleDocsViewerUrl(uri);
    
    if (googleDocsUrl) {
      return (
        <View style={styles.container}>
          <View style={[styles.pdfContainer, { height }]}>
            <WebView
              source={{ uri: googleDocsUrl }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#CB2921" />
                  <Text style={styles.loadingText}>Carregando documento...</Text>
                </View>
              )}
              onError={() => {
                console.log("Erro na visualização via Google Docs");
                Alert.alert(
                  'Erro',
                  'Não foi possível visualizar o PDF. Tente baixá-lo.',
                  [{ text: 'OK' }]
                );
              }}
            />
            {onRemove && (
              <TouchableOpacity style={styles.buttonRemove} onPress={onRemove}>
                <MaterialIcons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.buttonDownload}
              onPress={downloadPdf}
              disabled={isLoading}
            >
              <MaterialIcons name="file-download" size={18} color="#fff" />
              <Text style={styles.buttonText}>
                {isLoading ? 'Baixando...' : 'Baixar PDF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  // Fallback para visualização simples (ícone de PDF)
  return (
    <View style={styles.container}>
      <View style={styles.pdfIconContainer}>
        <MaterialIcons name="picture-as-pdf" size={80} color="#CB2921" style={{ marginBottom: 10, marginTop: 10 }} />
        <Text style={styles.fileName} numberOfLines={2} ellipsizeMode="middle">
          PDF Selecionado: <Text style={[styles.fileName, styles.bold]}>{fileName || "Documento PDF"}</Text>
        </Text>
        <Text style={styles.infoText}>
          Visualização prévia não disponível. Use o botão abaixo para baixar o PDF.
        </Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.buttonDownload}
          onPress={downloadPdf}
          disabled={isLoading}
        >
          <MaterialIcons name="file-download" size={18} color="#fff" />
          <Text style={styles.buttonText}>
            {isLoading ? 'Baixando...' : 'Baixar PDF'}
          </Text>
        </TouchableOpacity>
        
        {onRemove && (
          <TouchableOpacity style={styles.buttonCancel} onPress={onRemove}>
            <MaterialIcons name="close" size={18} color="#fff" />
            <Text style={styles.buttonText}>Remover</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  pdfContainer: {
    width: '100%',
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
    border: 'none',
  },
  pdfIconContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 200,
  },
  fileName: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  buttonDownload: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  buttonRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
    fontSize: 14,
  },
});
