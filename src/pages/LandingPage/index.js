import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StatusBar, Linking, ScrollView, Platform, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { scheduleNonRegisteredUserNotifications } from '../../services/notificationService';
import { FeedbackModal } from '../../components/FeedbackModal'; // Modal de feedback

import {
  // Componentes estilizados
  Container,
  Header,
  LogoContainer,
  Logo,
  LoginButton,
  LoginButtonText,
  HeroSection,
  HeroTitle,
  HeroSubtitle,
  HeroButton,
  HeroButtonText,
  MotorcycleSection,
  SectionTitle,
  MotorcycleCard,
  MotorcycleImage,
  MotorcycleInfo,
  MotorcycleTitle,
  MotorcycleDetail,
  MotorcyclePrice,
  MotorcycleNote,
  ContactSection,
  ContactTitle,
  ContactText,
  ContactButton,
  ContactButtonText,
  SocialButtons,
  WhatsAppButton,
  InstagramButton,
  AppDownloadBanner,
  AppDownloadText,
  AppDownloadButtons,
  StoreButton,
  StoreImage,
  CloseBannerButton,
} from './styles';

/**
 * LandingPage - Página inicial do aplicativo para usuários não autenticados
 * 
 * Esta página apresenta a empresa e seus serviços, permitindo que o usuário
 * navegue para a tela de login ou cadastro.
 */
export default function LandingPage() {
  const navigation = useNavigation();

  const [bannerVisible, setBannerVisible] = useState(true); // Estado para controlar a visibilidade do banner na tela

  // Estado para controlar a visibilidade do modal de feedback
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', title: '', message: '' })

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await scheduleNonRegisteredUserNotifications();
      } catch (error) {
        console.error('Erro ao configurar notificações:', error);
      }
    };

    setupNotifications();
  }, []);

  // Função para navegar para a tela de login
  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  // Função para navegar para a tela de cadastro
  const handleRegisterPress = () => {
    navigation.navigate('Nome');
  };

  // Função para abrir o WhatsApp
  const openWhatsApp = () => {
    const phone = '5585992684035';
    const message = Platform.OS === 'android' ? 'Olá! Vim do App e gostaria de saber mais sobre a Papa Tango.' : 'Olá! Vim do site e gostaria de saber mais sobre a Papa Tango.';
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          setFeedback({
            type: 'error',
            title: 'WhatsApp não está instalado',
            message: 'Não foi possível abrir o WhatsApp\nSe o problema persistir, entre em contato por WhatsApp com o suporte no número (85) 99268-4035 ou envie um e-mail para papatangoalugueldemotos@gmail.com'
          });
          setFeedbackVisible(true);
        }
      })
      .catch(erro => {
        console.error('Erro ao abrir WhatsApp:', erro);
        setFeedback({
          type: 'error',
          title: 'Erro ao abrir o WhatsApp',
          message: 'Não foi possível abrir o WhatsApp\nSe o problema persistir, entre em contato por WhatsApp com o suporte no número (85) 99268-4035 ou envie um e-mail para papatangoalugueldemotos@gmail.com'
        });
        setFeedbackVisible(true);
      })
  };

  // Função para abrir o Instagram
  const openInstagram = () => {
    const instagramUrl = 'https://www.instagram.com/papatango_alugueldemotos/';
    Linking.openURL(instagramUrl).catch(err => console.error('Erro ao abrir Instagram:', err));
  };

  // Determina a plataforma pelo tamnho da janela
  const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

  return (
    <Container>
      {/* Configuração da barra de status */}
      <StatusBar backgroundColor="#CB2921" barStyle="light-content" />

      {/* Cabeçalho com logo e botão de login */}
      <Header>
        <LogoContainer>
          <Logo source={require('../../assets/Logo.png')} resizeMode="cover" />
        </LogoContainer>
        <LoginButton onPress={handleLoginPress}>
          <LoginButtonText>Entrar</LoginButtonText>
        </LoginButton>
      </Header>

      <ScrollView showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}>
        {/* Seção principal com chamada para ação */}
        <HeroSection>
          <HeroTitle>Alugue uma moto e tenha liberdade, rapidez e economia no seu dia a dia.</HeroTitle>
          <HeroSubtitle>
            Temos motos excelentes e de altíssima qualidade, com preços acessíveis e planos flexíveis.
          </HeroSubtitle>
          <HeroButton onPress={handleRegisterPress}>
            <HeroButtonText>Cadastre-se agora</HeroButtonText>
          </HeroButton>
        </HeroSection>

        {/* Seção de motos disponíveis */}
        <MotorcycleSection>
          <SectionTitle>Algumas de Nossas Motos</SectionTitle>

          <View style={isWebDesktop ? { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' } : {}}>
            <MotorcycleCard>
              <MotorcycleImage
                source={require('../../assets/Foto_Xre.jpg')}
                resizeMode={isWebDesktop ? 'contain' : 'cover'}
              />
              <MotorcycleInfo>
                <MotorcycleTitle>Honda XRE 190</MotorcycleTitle>
                <MotorcycleDetail>• Partida Elétrica</MotorcycleDetail>
                <MotorcycleDetail>• Motor de 190,00 cc</MotorcycleDetail>
                <MotorcycleDetail>• Já com Suporte de Celular</MotorcycleDetail>
                <MotorcycleDetail>• Alongador de Guidão Incluso</MotorcycleDetail>
                <MotorcycleDetail>• Moto com seguro</MotorcycleDetail>
                <MotorcyclePrice>R$ 350,00/Semana</MotorcyclePrice>
                <MotorcyclePrice>R$ 700,00/Caução</MotorcyclePrice>
                <MotorcycleNote>*Valor referente ao plano mensal</MotorcycleNote>
                <MotorcycleNote>*Verificar disponibilidade do modelo</MotorcycleNote>
              </MotorcycleInfo>
            </MotorcycleCard>

            <MotorcycleCard>
              <MotorcycleImage
                source={require('../../assets/Foto_Bros.jpeg')}
                resizeMode={isWebDesktop ? 'contain' : 'cover'}
              />
              <MotorcycleInfo>
                <MotorcycleTitle>Honda NXR 150 Bros</MotorcycleTitle>
                <MotorcycleDetail>• Partida Elétrica</MotorcycleDetail>
                <MotorcycleDetail>• Motor de 150,00 cc</MotorcycleDetail>
                <MotorcycleDetail>• Já com Suporte de Celular</MotorcycleDetail>
                <MotorcycleDetail>• Alongador de Guidão Incluso</MotorcycleDetail>
                <MotorcycleDetail>• Moto com seguro</MotorcycleDetail>
                <MotorcyclePrice>R$ 260,00/Semana</MotorcyclePrice>
                <MotorcyclePrice>R$ 400,00/Caução</MotorcyclePrice>
                <MotorcycleNote>*Valor referente ao plano mensal</MotorcycleNote>
                <MotorcycleNote>*Verificar disponibilidade do modelo</MotorcycleNote>
              </MotorcycleInfo>
            </MotorcycleCard>

            <MotorcycleCard>
              <MotorcycleImage
                source={require('../../assets/Foto_Fan.jpg')}
                resizeMode={isWebDesktop ? 'contain' : 'cover'}
              />
              <MotorcycleInfo>
                <MotorcycleTitle>Honda CG 150 FAN ESDI</MotorcycleTitle>
                <MotorcycleDetail>• Partida Elétrica</MotorcycleDetail>
                <MotorcycleDetail>• Motor de 150,00 cc</MotorcycleDetail>
                <MotorcycleDetail>• Já com Suporte de Celular</MotorcycleDetail>
                <MotorcycleDetail>• Super Econômica</MotorcycleDetail>
                <MotorcycleDetail>• Moto com seguro</MotorcycleDetail>
                <MotorcyclePrice>R$ 230,00/Semana</MotorcyclePrice>
                <MotorcyclePrice>R$ 400,00/Caução</MotorcyclePrice>
                <MotorcycleNote>*Valor referente ao plano mensal</MotorcycleNote>
                <MotorcycleNote>*Verificar disponibilidade do modelo</MotorcycleNote>
              </MotorcycleInfo>
            </MotorcycleCard>
          </View>

        </MotorcycleSection>

        {/* Seção de contato */}
        <ContactSection>
          <ContactTitle>Entre em contato</ContactTitle>
          <ContactText>
            Estamos prontos para atender você e tirar todas as suas dúvidas sobre nossos serviços.
          </ContactText>
          <ContactButton onPress={openWhatsApp}>
            <ContactButtonText>Fale conosco</ContactButtonText>
          </ContactButton>
        </ContactSection>
      </ScrollView>

      {/* Banner de download do app (apenas para web) */}
      {Platform.OS === 'web' && bannerVisible && (
        <AppDownloadBanner>
          <AppDownloadText>
            Baixe Nosso App!
          </AppDownloadText>
          <AppDownloadButtons>
            <StoreButton
              onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.papatango.alugueldemotos')}
            >
              <StoreImage
                source={require('../../assets/google-play-badge.png')}
                resizeMode="contain"
              />
            </StoreButton>
            <CloseBannerButton onPress={() => setBannerVisible(false)}>
              <FontAwesome name="times" size={18} color="#666" />
            </CloseBannerButton>
          </AppDownloadButtons>
        </AppDownloadBanner>
      )}

      {/* Botões flutuantes de redes sociais */}
      <SocialButtons>
        <InstagramButton onPress={openInstagram}>
          <FontAwesome name="instagram" size={24} color="white" />
        </InstagramButton>
        <WhatsAppButton onPress={openWhatsApp}>
          <FontAwesome name="whatsapp" size={24} color="white" />
        </WhatsAppButton>
      </SocialButtons>

      {feedbackVisible && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <FeedbackModal
            visible={feedbackVisible}
            {...feedback}
            onClose={() => setFeedbackVisible(false)}
          />
        </View>
      )}

    </Container>
  );
}
