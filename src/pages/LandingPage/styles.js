import styled from 'styled-components/native';
import { Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const isWebMobile = Platform.OS === 'web' && window.innerWidth < 768;
const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

// Container principal
export const Container = styled.View`
  flex: 1;
  background-color: #fff;
`;

// Componentes do cabeçalho
export const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #CB2921;
  padding-vertical: 10px;
  padding-horizontal: 20px;
  height: 70px;
`;

export const LogoContainer = styled.View`
  flex: 1;
`;

export const Logo = styled.Image`
  width: 120px;
  height: 50px;
`;

export const LoginButton = styled.TouchableOpacity`
  background-color: white;
  padding-vertical: 8px;
  padding-horizontal: 20px;
  border-radius: 20px;
`;

export const LoginButtonText = styled.Text`
  color: #CB2921;
  font-weight: bold;
  font-size: 16px;
`;

// Componentes da seção principal (hero)
export const HeroSection = styled.View`
  padding: 20px;
  background-color: #f8f8f8;
  align-items: center;
  padding-top: 40px;
  padding-bottom: 40px;
`;

export const HeroTitle = styled.Text`
  font-size: ${isSmallDevice ? '22px' : '24px'};
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
  color: #333;
`;

export const HeroSubtitle = styled.Text`
  font-size: 16px;
  text-align: center;
  margin-bottom: 24px;
  color: #666;
  padding-horizontal: 10px;
`;

export const HeroButton = styled.TouchableOpacity`
  background-color: #CB2921;
  padding-vertical: 12px;
  padding-horizontal: 30px;
  border-radius: 25px;
  
  /* Sombras específicas para cada plataforma */
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-offset: 0px 2px;
      shadow-opacity: 0.2;
      shadow-radius: 3px;
    `,
    android: `
      elevation: 4;
    `,
    web: `
      box-shadow: 0px 2px 5px rgba(0,0,0,0.2);
    `,
  })}
`;

export const HeroButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

// Componentes da seção de motos
export const MotorcycleSection = styled.View`
  padding: 20px;
  background-color: white;
`;

export const SectionTitle = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

export const MotorcycleCard = styled.View`
  width: ${isWebDesktop ? '32%' : 'auto'};
  background-color: white;
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
  
  /* Sombras específicas para cada plataforma */
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-offset: 0px 2px;
      shadow-opacity: 0.1;
      shadow-radius: 4px;
    `,
    android: `
      elevation: 3;
    `,
    web: `
      box-shadow: 0px 2px 5px rgba(0,0,0,0.1);
    `,
  })}
`;

export const MotorcycleImage = styled.Image`
  width: ${isWebDesktop ? '95%' : '100%'};
  height: ${isWebDesktop ? '500px' : '200px'};
  border-radius: ${isWebDesktop ? '20px' : '0px'};
  align-self: center;
  margin-top: ${isWebDesktop ? '-50px' : '0px'};
`;

export const MotorcycleInfo = styled.View`
  padding: 15px;
`;

export const MotorcycleTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
`;

export const MotorcycleDetail = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`;

export const MotorcyclePrice = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-top: 8px;
`;

export const MotorcycleNote = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  font-style: italic;
`;

// Componentes da seção de contato
export const ContactSection = styled.View`
  background-color: #333;
  padding: 40px;
  align-items: center;
`;

export const ContactTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: white;
  margin-bottom: 16px;
`;

export const ContactText = styled.Text`
  font-size: 16px;
  color: white;
  text-align: center;
  margin-bottom: 24px;
`;

export const ContactButton = styled.TouchableOpacity`
  background-color: #CB2921;
  padding-vertical: 12px;
  padding-horizontal: 24px;
  border-radius: 30px;
`;

export const ContactButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

// Botões de redes sociais flutuantes
export const SocialButtons = styled.View`
  position: absolute;
  bottom: ${Platform.OS === 'web' ? '70px' : '20px'};
  right: 20px;
  flex-direction: column;
  z-index: 100;
`;

export const WhatsAppButton = styled.TouchableOpacity`
  background-color: #25d366;
  width: 50px;
  height: 50px;
  border-radius: 25px;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  
  /* Sombras específicas para cada plataforma */
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-offset: 0px 2px;
      shadow-opacity: 0.2;
      shadow-radius: 3px;
    `,
    android: `
      elevation: 4;
    `,
    web: `
      box-shadow: 0px 2px 5px rgba(0,0,0,0.2);
    `,
  })}
`;

export const InstagramButton = styled.TouchableOpacity`
  background-color: #C13584;
  width: 50px;
  height: 50px;
  border-radius: 25px;
  justify-content: center;
  align-items: center;
  
  /* Sombras específicas para cada plataforma */
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-offset: 0px 2px;
      shadow-opacity: 0.2;
      shadow-radius: 3px;
    `,
    android: `
      elevation: 4;
    `,
    web: `
      box-shadow: 0px 2px 5px rgba(0,0,0,0.2);
    `,
  })}
`;

// Banner de download do app (apenas para web)
export const AppDownloadBanner = styled.View`
  display: ${Platform.OS === 'web' ? 'flex' : 'none'};
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 12px 20px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-top-width: 1px;
  border-top-color: #ddd;
  z-index: 1000;
  box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.1);
`;

export const AppDownloadText = styled.Text`
  font-size: ${isWebDesktop ? '16px' : '14px'};
  font-weight: 500;
  color: #333;
  flex: 1;
  margin-right: 15px;
`;

export const AppDownloadButtons = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const StoreButton = styled.TouchableOpacity`
  margin-horizontal: 5px;
`;

export const StoreImage = styled.Image`
  width: ${isWebDesktop ? '135px' : '100px'};
  height: ${isWebDesktop ? '40px' : '30px'};
`;

export const CloseBannerButton = styled.TouchableOpacity`
  padding: 8px;
  margin-left: 10px;
`;

