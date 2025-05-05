import styled from 'styled-components/native';
import { Platform, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const isMobile = Platform.OS !== 'web' || screenWidth < 768;

export const Container = styled.SafeAreaView`
    flex: 1;
    background-color: #f5f5f5;
`;

export const Header = styled.View`
    flex-direction: row;
    justify-content: space-between;
    height: 65px;
    align-items: center;
    padding: 16px;
    background-color: #CB2921;
`;

export const HeaderTitle = styled.Text`
    font-size: 24px;
    font-weight: bold;
    color: #FFFFFF;
`;

export const DashboardScrollView = styled.ScrollView`
    flex: 1;
    padding: 16px;
`;

export const StatsContainer = styled.View`
    margin-bottom: 24px;
`;

// Grid para layout mobile (2 colunas)
export const CardGrid = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
`;

export const CardRow = styled.View`
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 12px;
    width: 100%;
`;

export const StatCard = styled.View`
    background-color: ${props => props.color || '#ffffff'};
    border-radius: 12px;
    padding: 16px;
    flex-direction: row;
    align-items: center;
    width: 100%;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3.84px;
    elevation: 5;
`;

export const StatCardTouchable = styled.TouchableOpacity`
    width: ${isMobile ? '48%' : '32%'};
    margin-bottom: ${isMobile ? '10px' : '0'};
`;

export const StatIconContainer = styled.View`
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background-color: rgba(255, 255, 255, 0.2);
    justify-content: center;
    align-items: center;
    margin-right: 12px;
`;

export const StatContent = styled.View`
    flex: 1;
`;

export const StatTitle = styled.Text`
    font-size: 14px;
    color: #fff;
    margin-bottom: 4px;
`;

export const StatNumber = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: #fff;
`;

export const StatSubtitle = styled.Text`
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
`;

export const SectionTitle = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-top: 16px;
    margin-bottom: 12px;
`;

export const FinancialSection = styled.View`
    margin-bottom: 24px;
    background-color: #fff;
    border-radius: 16px;
    padding: 16px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3.84px;
    elevation: 5;
`;

export const FinancialSectionTitle = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-bottom: 4px;
`;

export const FinancialSectionSubtitle = styled.Text`
    font-size: 14px;
    color: #666;
    margin-bottom: 16px;
`;

export const FinancialCard = styled.View`
    background-color: #fff;
    border-radius: 12px;
    padding: 16px;
    width: ${isMobile ? '100%' : '48%'};
    border: 1px solid #e0e0e0;
`;

export const FinancialCardHeader = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 8px;
`;

export const FinancialCardTitle = styled.Text`
    font-size: 14px;
    color: #333;
    margin-left: 8px;
    font-weight: 500;
`;

export const FinancialCardValue = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 4px;
`;

export const FinancialCardSubtitle = styled.Text`
    font-size: 12px;
    color: #666;
`;

export const FinancialCardTrend = styled.View`
    margin-top: 8px;
`;

export const FinancialCardTrendUp = styled.View`
    flex-direction: row;
    align-items: center;
`;

export const FinancialCardTrendDown = styled.View`
    flex-direction: row;
    align-items: center;
`;

export const FinancialCardTrendText = styled.Text`
    font-size: 12px;
    color: ${props => props.positive ? '#2ecc71' : '#e74c3c'};
    margin-left: 4px;
`;

export const FinancialCardTrendValue = styled.Text`
    font-weight: bold;
`;

export const ChartContainer = styled.View`
    background-color: #FFFFFF;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
    elevation: 3;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3.84px;
    align-self: center;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: auto;
`;

export const ChartTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 12px;
    text-align: center;
`;

export const ChartLegend = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 12px;
`;

export const ChartLegendItem = styled.View`
    flex-direction: row;
    align-items: center;
    margin-right: 16px;
    margin-bottom: 8px;
`;

export const ChartLegendColor = styled.View`
    width: 12px;
    height: 12px;
    border-radius: 6px;
    background-color: ${props => props.color};
    margin-right: 6px;
`;

export const ChartLegendText = styled.Text`
    font-size: 12px;
    color: #666;
`;

export const ButtonsContainer = styled.View`
    margin-top: 16px;
    margin-bottom: 24px;
`;

export const ActionButton = styled.TouchableOpacity`
    background-color: #CB2921;
    border-radius: 8px;
    padding: 16px;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    flex-direction: row;
`;

export const ActionButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

export const LogoutButton = styled.TouchableOpacity`
    background-color: #333;
    border-radius: 8px;
    padding: 16px;
    align-items: center;
    justify-content: center;
    flex-direction: row;
`;

export const LogoutText = styled.Text`
    color: #FFFFFF;
    font-size: 16px;
    font-weight: bold;
    margin-left: 8px;
`;

export const LoadingContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

export const RefreshButton = styled.TouchableOpacity`
    background-color: #3498db;
    border-radius: 8px;
    padding: 16px;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    width: ${isMobile ? '100%' : '100%'};
`;

export const RefreshButtonText = styled.Text`
    color: #FFFFFF;
    font-size: 14px;
    font-weight: bold;
    margin-left: 8px;
`;

