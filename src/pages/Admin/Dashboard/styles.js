import styled from 'styled-components/native';

export const Container = styled.SafeAreaView`
    flex: 1;
    background-color: #F5F5F5;
    padding: 20px;
`;

export const StatsContainer = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-bottom: 30px;
`;

export const StatCard = styled.View`
    width: 48%;
    background-color: #FFF;
    padding: 20px;
    border-radius: 10px;
    elevation: 3;
    margin-bottom: 15px;
`;

export const StatTitle = styled.Text`
    font-size: 16px;
    color: #666;
`;

export const StatNumber = styled.Text`
    font-size: 24px;
    font-weight: bold;
    color: #CB2921;
    margin-top: 5px;
`;

export const LogoutButton = styled.TouchableOpacity`
    background-color: #CB2921;
    padding: 15px 30px;
    border-radius: 25px;
    elevation: 3;
    width: 50%;
    max-width: 400px;
    align-self: center;
    align-items: center;
    justify-content: center;
    margin-top: 90px;
`;

export const LogoutText = styled.Text`
    color: #fff;
    font-size: 16px;
    font-weight: bold;
`;