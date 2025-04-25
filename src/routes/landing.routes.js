import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingPage from '../pages/LandingPage'; // Nova página de landing
import SignIn from '../pages/SignIn';
import Nome from '../pages/SignUp/nome';
import NomeCompleto from '../pages/SignUp/nomeCompleto';
import CPF from '../pages/SignUp/cpf';
import Email from '../pages/SignUp/email';
import EmailVerification from '../pages/SignUp/emailVerification';
import Telefone from '../pages/SignUp/telefone';
import VerifyPhone from '../pages/SignUp/telefoneVerify';
import Endereco from '../pages/SignUp/endereco';
import ComprovanteDeEndereco from '../pages/SignUp/comprovanteDeEndereco';
import CNH from '../pages/SignUp/cnh';
import Selfie from '../pages/SignUp/selfie';
import Senha from '../pages/SignUp/senha';
import Concluido from '../pages/SignUp/concluido';

const Stack = createNativeStackNavigator();

// Este arquivo define as rotas para usuários não autenticados
// Começa com a Landing Page e inclui todas as rotas de autenticação
export default function LandingRoutes() {
  return (
    <Stack.Navigator>
      {/* A Landing Page é a primeira tela que o usuário vê */}
      <Stack.Screen 
        name="LandingPage" 
        component={LandingPage} 
        options={{ headerShown: false }}
      />
      
      {/* Incluímos todas as rotas de autenticação existentes */}
      <Stack.Screen 
        name="SignIn" 
        component={SignIn} 
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='nome'
        component={Nome}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='nomeCompleto'
        component={NomeCompleto}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='cpf'
        component={CPF}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='Email'
        component={Email}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='EmailVerification'
        component={EmailVerification}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='Telefone'
        component={Telefone}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='VerifyPhone'
        component={VerifyPhone}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='endereco'
        component={Endereco}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='comprovanteDeEndereco'
        component={ComprovanteDeEndereco}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='CNH'
        component={CNH}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='selfie'
        component={Selfie}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='senha'
        component={Senha}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='concluido'
        component={Concluido}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
