import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingPage from '../pages/LandingPage';
import SignIn from '../pages/SignIn';
import Nome from '../pages/SignUp/nome';
import NomeCompleto from '../pages/SignUp/nomeCompleto';
import CPF from '../pages/SignUp/cpf';
import DataNascimento from '../pages/SignUp/dataNascimento';
import Email from '../pages/SignUp/email';
import EmailVerification from '../pages/SignUp/emailVerification';
import Telefone from '../pages/SignUp/telefone';
import Endereco from '../pages/SignUp/endereco';
import ComprovanteDeEndereco from '../pages/SignUp/comprovanteDeEndereco';
import CNH from '../pages/SignUp/cnh';
import Selfie from '../pages/SignUp/selfie';
import Senha from '../pages/SignUp/senha';
import Concluido from '../pages/SignUp/concluido';

const Stack = createNativeStackNavigator();

export default function LandingRoutes() {
  return (
    <Stack.Navigator>
      {/* A Landing Page é a primeira tela que o usuário vê */}
      <Stack.Screen 
        name="Papa Tango - Aluguel de Motos" 
        component={LandingPage} 
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="Login" 
        component={SignIn} 
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='Nome'
        component={Nome}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='Nome Completo'
        component={NomeCompleto}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='CPF'
        component={CPF}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='Data de Nascimento'
        component={DataNascimento}
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
        name='Verificação de Email'
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
        name='Endereço'
        component={Endereco}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='Comprovante de Endereço'
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
        name='Selfie'
        component={Selfie}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='Senha'
        component={Senha}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='Fim do Cadastro'
        component={Concluido}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
