import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignIn from '../pages/SignIn'; 
import Email from '../pages/SignUp/email';
import CNH from '../pages/SignUp/cnh';
import Nome from '../pages/SignUp/nome';
import NomeCompleto from '../pages/SignUp/nomeCompleto'
import CPF from '../pages/SignUp/cpf';
import EmailVerification from '../pages/SignUp/emailVerification';
import Telefone from '../pages/SignUp/telefone';
import VerifyPhone from '../pages/SignUp/telefoneVerify';
import Endereco from '../pages/SignUp/endereco';
import ComprovanteDeEndereco from '../pages/SignUp/comprovanteDeEndereco';
import Selfie from '../pages/SignUp/selfie';
import Senha from '../pages/SignUp/senha';
import Concluido from '../pages/SignUp/concluido';

const AuthStack = createNativeStackNavigator();

export default function AuthRoutes() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen 
      name='SignIn' 
      component={SignIn} 
      options={{ headerShown: false }} 
      />

      <AuthStack.Screen 
      name='nome' 
      component={Nome} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
      />

      <AuthStack.Screen 
      name='nomeCompleto' 
      component={NomeCompleto} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
      />

      <AuthStack.Screen 
      name="cpf" 
      component={CPF} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
      />

      <AuthStack.Screen 
      name='Email' 
      component={Email} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
      />

    <AuthStack.Screen 
      name='EmailVerification' 
      component={EmailVerification} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
      />

    <AuthStack.Screen 
      name='Telefone' 
      component={Telefone} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
      />

    <AuthStack.Screen 
      name='VerifyPhone' 
      component={VerifyPhone} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
    />

    <AuthStack.Screen 
      name='endereco' 
      component={Endereco} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
    />

    <AuthStack.Screen 
      name='comprovanteDeEndereco' 
      component={ComprovanteDeEndereco} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
    />

    <AuthStack.Screen 
      name='CNH' 
      component={CNH} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
      />

    <AuthStack.Screen 
      name='selfie' 
      component={Selfie} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
    />

    <AuthStack.Screen 
      name='senha' 
      component={Senha} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
    />

    <AuthStack.Screen 
      name='concluido' 
      component={Concluido} 
      options={{ 
        headerShown: false,
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#CB2921',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }} 
    />
    </AuthStack.Navigator>
  );
}