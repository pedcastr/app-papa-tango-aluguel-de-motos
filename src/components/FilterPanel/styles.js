import styled from 'styled-components/native';
import { Platform } from 'react-native';

const isWebMobile = Platform.OS === 'web' && window.innerWidth < 768;

export const FilterContainer = styled.View`
    flex-direction: row;
    padding: 10px;
    background-color: #FFF;
    border-bottom-width: 1px;
    border-bottom-color: #EEE;
    align-items: center;
    margin-bottom: 20px;
    border-radius: 20px;
`;

export const SearchInput = styled.TextInput`
    flex: 1;
    height: 40px;
    background-color: #F5F5F5;
    border-radius: 20px;
    padding: 0 15px;
    margin-right: 10px;
    color: #333;
`;

export const SearchButton = styled.TouchableOpacity`
    width: 40px;
    height: 40px;
    border-radius: 20px;
    justify-content: center;
    align-items: center;
    margin-left: 5px;
    position: relative;
`;

export const FilterOptionsContainer = styled.View`
    background-color: #fff;
    border-radius: 10px;
    margin-bottom: 15px;
    padding: 10px;
    elevation: 3;
    max-height: 300px;
`;

export const FilterScrollView = styled.ScrollView.attrs({
    contentContainerStyle: {
        paddingBottom: 10
    },
    showsVerticalScrollIndicator: true,
    nestedScrollEnabled: true,
})``;

export const FilterSection = styled.View`
    margin-bottom: 15px;
`;

export const FilterTitle = styled.Text`
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
`;

export const FilterOption = styled.TouchableOpacity`
    flex-direction: row;
    align-items: center;
    padding: 8px 5px;
    background-color: ${props => props.active ? '#F5F5F5' : 'transparent'};
    border-radius: 5px;
`;

export const FilterOptionText = styled.Text`
    font-size: 14px;
    color: #333;
    margin-left: 10px;
`;

export const FilterBadge = styled.View`
    position: absolute;
    top: 0;
    right: 0;
    background-color: #CB2921;
    width: 18px;
    height: 18px;
    border-radius: 9px;
    justify-content: center;
    align-items: center;
`;

export const FilterBadgeText = styled.Text`
    color: #FFF;
    font-size: 10px;
    font-weight: bold;
`;
