import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import {
    FilterContainer,
    SearchInput,
    SearchButton,
    FilterOptionsContainer,
    FilterSection,
    FilterTitle,
    FilterOption,
    FilterOptionText,
    FilterBadge,
    FilterBadgeText,
    FilterScrollView
} from './styles';

/**
 * Componente reutilizável para filtros
 * @param {Object} props - Propriedades do componente
 * @param {string} props.searchTerm - Termo de busca atual
 * @param {Function} props.onSearchChange - Função chamada quando o termo de busca muda
 * @param {Function} props.onSearch - Função chamada quando o usuário confirma a busca
 * @param {Object[]} props.filterSections - Seções de filtro a serem exibidas
 * @param {string} props.filterSections[].title - Título da seção de filtro
 * @param {Object[]} props.filterSections[].options - Opções de filtro na seção
 * @param {string} props.filterSections[].options[].id - ID único da opção
 * @param {string} props.filterSections[].options[].label - Texto da opção
 * @param {boolean} props.filterSections[].options[].active - Se a opção está ativa
 * @param {Function} props.filterSections[].options[].onSelect - Função chamada quando a opção é selecionada
 * @param {number} props.activeFiltersCount - Número de filtros ativos
 * @param {Function} props.onAddButtonPress - Função chamada quando o botão de adicionar é pressionado
 * @param {string} props.addButtonIcon - Nome do ícone para o botão de adicionar (padrão: "add")
 * @param {string} props.searchPlaceholder - Texto de placeholder para o campo de busca
 */
const FilterPanel = ({
    searchTerm,
    onSearchChange,
    onSearch,
    filterSections,
    activeFiltersCount,
    onAddButtonPress,
    addButtonIcon = "add",
    searchPlaceholder = "Buscar..."
}) => {
    const [showFilterOptions, setShowFilterOptions] = useState(false);

    const isWebMobile = Platform.OS === 'web' && window.innerWidth < 768;

    return (
        <>
            <FilterContainer>
                {/* Campo de busca */}
                <SearchInput
                    placeholder={searchPlaceholder}
                    placeholderTextColor="#666"
                    value={searchTerm}
                    onChangeText={onSearchChange}
                    onSubmitEditing={onSearch}
                    returnKeyType="search"
                />
                
                {/* Botão de busca */}
                <SearchButton onPress={onSearch} style={{ marginLeft: isWebMobile ? -16 : 0 }}>
                    <MaterialIcons name="search" size={24} color="#666" />
                </SearchButton>
                
                {/* Botão de filtro */}
                <SearchButton onPress={() => setShowFilterOptions(!showFilterOptions)} style={{ marginLeft: isWebMobile ? -12 : 0 }}>
                    <MaterialIcons
                        name="filter-list"
                        size={24}
                        color={activeFiltersCount > 0 ? "#CB2921" : "#666"}
                    />
                    {activeFiltersCount > 0 && (
                        <FilterBadge>
                            <FilterBadgeText>{activeFiltersCount}</FilterBadgeText>
                        </FilterBadge>
                    )}
                </SearchButton>
                
                {/* Botão de adicionar */}
                {onAddButtonPress && (
                    <SearchButton onPress={onAddButtonPress} style={{ backgroundColor: "green", marginLeft: isWebMobile ? 0 : 20 }}>
                        <MaterialIcons name={addButtonIcon} size={24} color="#FFF" />
                    </SearchButton>
                )}
            </FilterContainer>

            {/* Painel de opções de filtro */}
            {showFilterOptions && (
                <FilterOptionsContainer>
                    <FilterScrollView>
                        {filterSections.map((section, sectionIndex) => (
                            <FilterSection key={`section-${sectionIndex}`}>
                                <FilterTitle>{section.title}</FilterTitle>
                                
                                {section.options.map((option) => (
                                    <FilterOption
                                        key={option.id}
                                        active={option.active}
                                        onPress={() => {
                                            option.onSelect();
                                            setShowFilterOptions(false);
                                        }}
                                    >
                                        <MaterialIcons
                                            name="check"
                                            size={20}
                                            color={option.active ? "#CB2921" : "transparent"}
                                        />
                                        <FilterOptionText>{option.label}</FilterOptionText>
                                    </FilterOption>
                                ))}
                            </FilterSection>
                        ))}
                    </FilterScrollView>
                </FilterOptionsContainer>
            )}
        </>
    );
};

export default FilterPanel;
