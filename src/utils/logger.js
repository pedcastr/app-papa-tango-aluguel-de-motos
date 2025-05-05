import { logger, consoleTransport, fileAsyncTransport } from 'react-native-logs';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { logError } from './crashlytics';

// Configuração para salvar logs em arquivo (apenas para dispositivos móveis)
const fileConfig = {
  loggerName: 'papaMotosLogger',
  fileName: `papa-motos-logs-${new Date().toISOString().split('T')[0]}.log`,
  filePath: FileSystem.documentDirectory,
  maxNumberOfFiles: 5,
};

// Configuração do logger
const config = {
  severity: __DEV__ ? 'debug' : 'info',
  transport: __DEV__
    ? consoleTransport
    : [
        consoleTransport,
        Platform.OS !== 'web' ? fileAsyncTransport(fileConfig) : null,
      ].filter(Boolean),
  transportOptions: {
    color: __DEV__,
    hideDate: false,
    hideLevel: false,
  },
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  },
  async: true,
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  enabled: true,
};

// Criar a instância do logger
const log = logger.createLogger(config);

// Armazenar as funções originais do logger
const originalErrorLog = log.error;
const originalFatalLog = log.fatal;

// Sobrescrever as funções de erro para enviar para o Crashlytics
log.error = (message, data = {}) => {
  // Chamar a função original do logger
  originalErrorLog(message, data);
  
  // Enviar para o Crashlytics (apenas em dispositivos móveis)
  if (Platform.OS !== 'web') {
    try {
      if (message instanceof Error) {
        logError(message, data);
      } else if (data && data.stack) {
        // Se temos um stack trace nos dados, provavelmente é um erro
        logError(new Error(String(message)), data);
      } else {
        // Caso contrário, é apenas uma mensagem de erro
        logError(String(message), data);
      }
    } catch (e) {
      console.error('Erro ao enviar para Crashlytics:', e);
    }
  }
};

// Também sobrescrever log.fatal para erros críticos
log.fatal = (message, data = {}) => {
  // Chamar a função original do logger
  originalFatalLog(message, data);
  
  // Enviar para o Crashlytics com prioridade mais alta
  if (Platform.OS !== 'web') {
    try {
      if (message instanceof Error) {
        logError(message, { ...data, fatal: true });
      } else if (data && data.stack) {
        logError(new Error(String(message)), { ...data, fatal: true });
      } else {
        logError(String(message), { ...data, fatal: true });
      }
    } catch (e) {
      console.error('Erro ao enviar erro fatal para Crashlytics:', e);
    }
  }
};

// Função para exportar logs (útil para enviar logs para suporte)
export const exportLogs = async () => {
  if (Platform.OS === 'web') {
    return null;
  }
  
  try {
    const logFilePath = `${FileSystem.documentDirectory}${fileConfig.fileName}`;
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
    
    if (fileInfo.exists) {
      return logFilePath;
    }
    return null;
  } catch (error) {
    console.error('Erro ao exportar logs:', error);
    return null;
  }
};

// Sobrescrever console.log e outros métodos para usar o logger
if (!__DEV__) {
  const originalConsole = { ...console };
  
  console.log = (...args) => {
    log.info(...args);
    if (__DEV__) originalConsole.log(...args);
  };
  
  console.info = (...args) => {
    log.info(...args);
    if (__DEV__) originalConsole.info(...args);
  };
  
  console.warn = (...args) => {
    log.warn(...args);
    if (__DEV__) originalConsole.warn(...args);
  };
  
  console.error = (...args) => {
    log.error(...args);
    if (__DEV__) originalConsole.error(...args);
  };
}

export default log;
