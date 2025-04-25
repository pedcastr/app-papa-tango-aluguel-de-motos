import Constants from 'expo-constants';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, PhoneAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Platform } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importação correta para todas as plataformas
import * as firebaseAuth from 'firebase/auth';

const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
  firebaseMeasurementId
} = Constants.expoConfig.extra;

export const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
  measurementId: firebaseMeasurementId
};

// Evita múltiplas inicializações do Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializa Firestore
const db = getFirestore(app);

// Inicializa o Storage
const storage = getStorage(app);

// Inicializa o Functions
const functions = getFunctions(app); // Adicione esta linha

// Inicializa o Auth de forma condicional baseado na plataforma
let auth;
if (Platform.OS !== 'web') {
  // Configuração para mobile - usando a importação correta
  auth = initializeAuth(app, {
    persistence: firebaseAuth.getReactNativePersistence(AsyncStorage),
    phoneAuthSettings: {
      timeout: 60,
      forceResendingToken: true
    }
  });
} else {
  // Configuração simples para web
  auth = getAuth(app);
}

// Configuração do provedor de autenticação por telefone
const phoneProvider = new PhoneAuthProvider(auth);

export { auth, db, storage, phoneProvider, functions, httpsCallable }; // Exporte functions e httpsCallable
