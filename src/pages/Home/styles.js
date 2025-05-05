import styled from 'styled-components/native';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;
const isWebMobile = Platform.OS === 'web' && window.innerWidth < 768;


export const Background = styled(LinearGradient).attrs({
    colors: ['#CB2921', '#E74C3C', '#FFFFFF'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0.5 }
})`
    flex: 1;
`;

export const Container = styled.SafeAreaView`
    flex: 1;
`;

export const ViewPadding = styled.View`
    flex: 1;
    padding-horizontal: 20px;
    padding-top: ${Platform.OS === 'ios' ? '10px' : '20px'};
    padding-bottom: ${Platform.OS === 'ios' ? '0' : '20px'};
`;

export const Header = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${isWebDesktop ? '0px' : '25px'};
`;

export const WelcomeText = styled.Text`
    font-size: 24px;
    font-weight: bold;
    color: #FFFFFF;
`;

export const ProfileButton = styled.TouchableOpacity`
    width: 50px;
    height: 50px;
    justify-content: center;
    align-items: center;
`;

export const ProfileImage = styled.Image`
    width: ${props => props.large ? '100px' : '50px'};
    height: ${props => props.large ? '100px' : '50px'};
    border-radius: ${props => props.large ? '50px' : '25px'};
`;

export const MotoContainer = styled.ScrollView`
    flex: 1;
`;

export const TitleText = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: #FFFFFF;
    text-align: center;
`;

export const MotoImage = styled.Image` 
    width: 100%;
    max-width: 700px;
    align-self: ${Platform.OS === 'web' ? 'center' : ''};
    height: ${isWebDesktop ? '400px' : '200px'};
    border-radius: 15px;
    margin-bottom: 20px;
`;

export const InfoContainer = styled.View`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    max-width: ${Platform.OS === 'web' ? '700px' : '100%'};
    align-self: ${Platform.OS === 'web' ? 'center' : 'auto'};
`;

export const VeiculoInfo = styled.View`
    flex: 1;
    max-width: ${Platform.OS === 'web' ? '48%' : 'auto'};
    margin-left: ${isWebDesktop ? '50px' : '0px'};
`;

export const LocacaoInfo = styled.View`
    flex: 1;
    margin-left: ${isWebDesktop ? '200px' : '15px'};
    max-width: ${Platform.OS === 'web' ? '48%' : 'auto'};
`;

export const InfoTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: '#1E1E1E';
    margin-bottom: 10px;
`;

export const InfoText = styled.Text`
    font-size: 16px;
    color: ${isWebMobile? '#222' : '#667'};
    margin-bottom: 5px;
`;

export const InfoLabel = styled.Text`
    font-weight: bold;
    color:${isWebMobile ? '#222': 'rgb(75, 74, 74)'};
`;

export const EmptyContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    align-self: center;
    padding: 20px;
    width: ${Platform.OS === 'web' ? '100%' : 'auto'};
    max-width: ${Platform.OS === 'web' ? '600px' : 'auto'};
    margin: ${Platform.OS === 'web' ? '0 auto' : '0'};
`;

export const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

export const EmptyText = styled.Text`
    font-size: 16px;
    color: ${isWebMobile? '#222' : '#667'};
    text-align: center;
    font-weight: bold;
    margin-top: 30px;
`;

export const WhatsappButton = styled.TouchableOpacity`
    background-color:rgb(43, 42, 42);
    max-width: 400px;
    margin-top: 50px;
    padding: 15px 30px;
    border-radius: 25px;
    align-items: center;
    justify-content: center;
    elevation: 3;
`;

export const WhatsappText = styled.Text`
    color: #fff;
    font-size: 16px;
    font-weight: bold;
`;

export const ProfileModal = styled.View`
    flex: 1;
    background-color: #fff;
    elevation: 5;
`;

export const ProfileHeader = styled.View`
    padding: 20px;
    align-items: flex-end;
`;

export const CloseButton = styled.TouchableOpacity`
    padding: 5px;
    margin-top: ${Platform.OS === 'ios' ? '20px' : '0'};
`;

export const ProfileContent = styled.View`
    align-items: center;
    padding: 20px;
`;

export const ProfilePhotoContainer = styled.View`
    margin-bottom: 30px;
    position: relative;
`;

export const EditPhotoButton = styled.TouchableOpacity`
    position: absolute;
    right: 0;
    bottom: 0;
    background-color: #CB2921;
    padding: 10px;
    border-radius: 20px;
    elevation: 3;
`;

export const ProfileInfo = styled.View`
    width: 100%;
    margin-bottom: 30px;
    background-color: #F5F5F5;
    padding: 20px;
    border-radius: 15px;
`;

export const LogoutButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px 30px;
    border-radius: 25px;
    elevation: 3;
`;

export const LogoutText = styled.Text`
    color: #fff;
    font-size: 16px;
    font-weight: bold;
`;

export const Divider = styled.View`
  height: 1px;
  background-color: #E0E0E0;
  width: 100%;
  margin: 15px 0;
`;
