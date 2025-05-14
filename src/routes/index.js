import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppRoutes from './app.routes'; // Importamos o componente AppRoutes
import AdminRoutes from './admin.routes'; // Importamos o componente AdminRoutes (Rotas do Admin)
import LandingRoutes from './landing.routes'; // Importamos o componente LandingRoutes
import { AuthContext } from '../context/AuthContext'; // Importamos o contexto AuthContext
import Logo from '../assets/LogoTransparente.svg'; // Importamos o componente Logo 

export default function Routes() {
    const { user, cadastroConcluido, loading } = useContext(AuthContext);
  
    if (loading) {
      return (
        <View style={{ 
          flex: 1, 
          backgroundColor: '#CB2921', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginTop: -50 
          }}>
          <Logo width={180} height={160} />
          <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 40 }} />
        </View>
      );
    }

    // Se não houver usuário logado, mostra a Landing Page
    if (!user) {
      return <LandingRoutes />;
    }

    // Verifica se é um usuário admin
    if (user && user.role === 'admin') {
      return <AdminRoutes />;
    }
  
    // Se o usuário estiver logado e o cadastro estiver finalizado/aprovado, segue para AppRoutes. Caso contrário, segue para LandingRoutes.
    return user && cadastroConcluido ? <AppRoutes /> : <LandingRoutes />;
}