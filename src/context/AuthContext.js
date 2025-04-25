import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cadastroConcluido, setCadastroConcluido] = useState(false);
  const [registrationInProcess, setRegistrationInProcess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Função para registrar o token de notificação do usuário
  const registerForPushNotifications = async (userEmail) => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status !== 'granted') {
        return;
      }
      
      // Obter o projectId das configurações ou usar o valor fixo como fallback
      const projectId = Constants.expoConfig?.eas?.projectId || // tenta obter o projectId das configurações se não conseguir usa o valor fixo como fallback
                        "2d93efbd-1062-4051-bf44-18c916565fb7";
      
      // Obter o token de notificação com o projectId correto
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });
      
      const token = tokenData.data;
      
      // Salvar o token no Firestore
      if (userEmail && token) {
        const emailFormatado = userEmail.toLowerCase().trim();
        const userDocRef = doc(db, "users", emailFormatado);
        
        await updateDoc(userDocRef, {
          pushToken: token,
          tokenUpdatedAt: new Date()
        });
        
        console.log('Token de notificação registrado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao registrar token de notificação:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          // Formata o email para usar como chave no Firestore
          const emailFormatado = user.email.toLowerCase().trim();
          const userDocRef = doc(db, "users", emailFormatado);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              ...user,
              role: userData.role
            });
            if (userData.role === 'admin') {
              setCadastroConcluido(false);
            } else if (userData.aprovado === true) {
              setCadastroConcluido(true);
            } else {
              setCadastroConcluido(false);
            }
            
            // Registrar token de notificação quando o usuário faz login
            registerForPushNotifications(user.email);
          }
        } catch (error) {
          console.error("Erro ao buscar documento do usuário:", error);
          setCadastroConcluido(false);
        }
      } else {
        setCadastroConcluido(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        cadastroConcluido,
        setCadastroConcluido,
        registrationInProcess,
        setRegistrationInProcess,
        loading,
        registerForPushNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
