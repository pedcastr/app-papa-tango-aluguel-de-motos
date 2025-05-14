import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, ScrollView, Switch, View, Modal, Platform } from 'react-native';
import { db } from '../../../../../services/firebaseConfig';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import {
    Container,
    Form,
    Section,
    SectionTitle,
    InputGroup,
    Label,
    Input,
    SwitchContainer,
    SwitchLabel,
    SubmitButton,
    SubmitButtonText,
    ErrorText,
    SelectButton,
    SelectButtonText,
    SelectedItemContainer,
    SelectedItemTitle,
    SelectedItemDetail,
    SelectionList,
    SelectionItem,
    SelectionItemText,
    SelectionItemDetail,
    ModalContainer,
    ModalContent,
    ModalHeader,
    ModalTitle,
    CloseButton,
    ModalBody,
    ModalSearchContainer,
    ModalSearchInput,
    ModalSearchIcon,
    NoResultsText
} from './styles';

export default function RentalForm({ navigation }) {
    const [rentalData, setRentalData] = useState({
        motoId: '',
        valorCaucao: '',
        valorSemanal: '',
        valorMensal: '',
        ativo: true
    });

    const [selectedMoto, setSelectedMoto] = useState(null);
    const [motos, setMotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [showMotoSelector, setShowMotoSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMotos, setFilteredMotos] = useState([]);

    // Buscar motos disponíveis
    useEffect(() => {
        fetchMotos();
    }, []);

    // Filtrar motos quando a pesquisa mudar
    useEffect(() => {
        if (motos.length > 0) {
            filterMotos(searchQuery);
        }
    }, [searchQuery, motos]);

    // Função para mostrar alerta em qualquer plataforma
    const showConfirmation = (title, message, confirmText = 'Ok', onConfirm) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}\n\n${message}`)) {
                onConfirm();
            }
        } else {
            Alert.alert(title, message, [
                { text: 'Cancelar', style: 'cancel' },
                { text: confirmText, onPress: onConfirm }
            ]);
        }
    };

    // Função para mostrar mensagem de sucesso/erro
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const fetchMotos = async () => {
        try {
            setLoading(true);

            // Buscar todas as motos
            const motosSnapshot = await getDocs(collection(db, "motos"));
            const motosData = motosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Buscar aluguéis ativos para verificar quais motos já estão alugadas
            const alugueisSnapshot = await getDocs(
                query(collection(db, "alugueis"), where("ativo", "==", true))
            );

            const motosAlugadas = new Set(
                alugueisSnapshot.docs.map(doc => doc.data().motoId)
            );

            // Marcar motos como disponíveis ou não
            const motosProcessadas = motosData.map(moto => ({
                ...moto,
                disponivel: !motosAlugadas.has(moto.id)
            }));

            setMotos(motosProcessadas);
            setFilteredMotos(motosProcessadas);
        } catch (error) {
            console.error("Erro ao carregar motos:", error);
            showMessage("Erro", "Falha ao carregar motos disponíveis");
        } finally {
            setLoading(false);
        }
    };

    const filterMotos = (query, motosData = motos) => {
        if (!query.trim()) {
            setFilteredMotos(motosData);
            return;
        }

        const lowercaseQuery = query.toLowerCase();
        const filtered = motosData.filter(moto =>
            (moto.marca && moto.marca.toLowerCase().includes(lowercaseQuery)) ||
            (moto.modelo && moto.modelo.toLowerCase().includes(lowercaseQuery)) ||
            (moto.placa && moto.placa.toLowerCase().includes(lowercaseQuery))
        );

        setFilteredMotos(filtered);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!rentalData.motoId) newErrors.motoId = 'Selecione uma moto';

        if (!rentalData.valorCaucao.trim()) {
            newErrors.valorCaucao = 'Valor da caução é obrigatório';
        } else if (isNaN(rentalData.valorCaucao) || parseFloat(rentalData.valorCaucao) <= 0) {
            newErrors.valorCaucao = 'Valor da caução deve ser um número positivo';
        }

        if (!rentalData.valorSemanal.trim()) {
            newErrors.valorSemanal = 'Valor semanal é obrigatório';
        } else if (isNaN(rentalData.valorSemanal) || parseFloat(rentalData.valorSemanal) <= 0) {
            newErrors.valorSemanal = 'Valor semanal deve ser um número positivo';
        }

        if (!rentalData.valorMensal.trim()) {
            newErrors.valorMensal = 'Valor mensal é obrigatório';
        } else if (isNaN(rentalData.valorMensal) || parseFloat(rentalData.valorMensal) <= 0) {
            newErrors.valorMensal = 'Valor mensal deve ser um número positivo';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSelectMoto = (moto) => {
        if (!moto.disponivel) {
            showConfirmation(
                "Moto Indisponível",
                "Esta moto já está alugada. Deseja selecioná-la mesmo assim?",
                "Selecionar",
                () => {
                    setSelectedMoto(moto);
                    setRentalData(prev => ({ ...prev, motoId: moto.id }));
                    setShowMotoSelector(false);
                    setSearchQuery('');

                    // Limpar erro se existir
                    if (errors.motoId) {
                        setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.motoId;
                            return newErrors;
                        });
                    }
                }
            );
            return;
        }

        setSelectedMoto(moto);
        setRentalData(prev => ({ ...prev, motoId: moto.id }));
        setShowMotoSelector(false);
        setSearchQuery('');

        // Limpar erro se existir
        if (errors.motoId) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.motoId;
                return newErrors;
            });
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            showMessage("Erro", "Por favor, corrija os erros no formulário");
            return;
        }

        try {
            setSubmitting(true);

            // Abordagem alternativa para gerar ID sequencial
            // 1. Buscar todos os aluguéis existentes
            const alugueisSnapshot = await getDocs(collection(db, "alugueis"));

            // 2. Encontrar o maior número de ID existente
            let maxNumber = 0;
            alugueisSnapshot.docs.forEach(doc => {
                const id = doc.id;
                if (id.startsWith('aluguel')) {
                    const numberPart = id.replace('aluguel', '');
                    const number = parseInt(numberPart);
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            });

            // 3. Gerar o próximo ID
            const novoId = `aluguel${maxNumber + 1}`;

            // Preparar dados para salvar
            const dataToSave = {
                motoId: rentalData.motoId,
                valorCaucao: parseFloat(rentalData.valorCaucao),
                valorSemanal: parseFloat(rentalData.valorSemanal),
                valorMensal: parseFloat(rentalData.valorMensal),
                ativo: rentalData.ativo,
                dataCriacao: new Date()
            };

            // Adicionar documento ao Firestore com ID personalizado
            await setDoc(doc(db, "alugueis", novoId), dataToSave);

            showMessage(
                "Sucesso",
                `Aluguel cadastrado com sucesso!\nID: ${novoId}`,
            );

            navigation.goBack()

        } catch (error) {
            console.error("Erro ao cadastrar aluguel:", error);
            showMessage("Erro", "Falha ao cadastrar aluguel: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Form>
                    <Section>
                        <SectionTitle>Dados do Aluguel</SectionTitle>

                        <InputGroup>
                            <Label>Moto</Label>
                            {selectedMoto ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>
                                        {selectedMoto.marca} {selectedMoto.modelo}
                                    </SelectedItemTitle>
                                    <SelectedItemDetail>
                                        Placa: {selectedMoto.placa} | Ano: {selectedMoto.ano}
                                    </SelectedItemDetail>
                                    <SelectButton onPress={() => setShowMotoSelector(true)}>
                                        <SelectButtonText>Trocar Moto</SelectButtonText>
                                    </SelectButton>
                                </SelectedItemContainer>
                            ) : (
                                <>
                                    <SelectButton onPress={() => setShowMotoSelector(true)}>
                                        <SelectButtonText>Selecionar Moto</SelectButtonText>
                                    </SelectButton>
                                    {errors.motoId && <ErrorText>{errors.motoId}</ErrorText>}
                                </>
                            )}
                        </InputGroup>

                        <InputGroup>
                            <Label>Valor da Caução (R$)</Label>
                            <Input
                                value={rentalData.valorCaucao}
                                onChangeText={(text) => {
                                    setRentalData(prev => ({ ...prev, valorCaucao: text }));
                                    if (errors.valorCaucao) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.valorCaucao;
                                            return newErrors;
                                        });
                                    }
                                }}
                                placeholder="Digite o valor da caução"
                                keyboardType="numeric"
                                error={errors.valorCaucao}
                            />
                            {errors.valorCaucao && <ErrorText>{errors.valorCaucao}</ErrorText>}
                        </InputGroup>

                        <InputGroup>
                            <Label>Valor Semanal (R$)</Label>
                            <Input
                                value={rentalData.valorSemanal}
                                onChangeText={(text) => {
                                    setRentalData(prev => ({ ...prev, valorSemanal: text }));
                                    if (errors.valorSemanal) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.valorSemanal;
                                            return newErrors;
                                        });
                                    }
                                }}
                                placeholder="Digite o valor semanal"
                                keyboardType="numeric"
                                error={errors.valorSemanal}
                            />
                            {errors.valorSemanal && <ErrorText>{errors.valorSemanal}</ErrorText>}
                        </InputGroup>

                        <InputGroup>
                            <Label>Valor Mensal (R$)</Label>
                            <Input
                                value={rentalData.valorMensal}
                                onChangeText={(text) => {
                                    setRentalData(prev => ({ ...prev, valorMensal: text }));
                                    if (errors.valorMensal) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.valorMensal;
                                            return newErrors;
                                        });
                                    }
                                }}
                                placeholder="Digite o valor mensal"
                                keyboardType="numeric"
                                error={errors.valorMensal}
                            />
                            {errors.valorMensal && <ErrorText>{errors.valorMensal}</ErrorText>}
                        </InputGroup>

                        <SwitchContainer>
                            <SwitchLabel>Status do Aluguel (Ativo)</SwitchLabel>
                            <Switch
                                value={rentalData.ativo}
                                onValueChange={(value) => setRentalData(prev => ({ ...prev, ativo: value }))}
                                trackColor={{ false: '#767577', true: '#CB2921' }}
                                thumbColor={rentalData.ativo ? '#CB2921' : '#767577'}
                            />
                        </SwitchContainer>
                    </Section>

                    <SubmitButton onPress={handleSubmit} disabled={submitting}>
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <SubmitButtonText>Cadastrar Aluguel</SubmitButtonText>
                        )}
                    </SubmitButton>
                </Form>
            </ScrollView>

            {/* Modal para seleção de moto */}
            <Modal
                visible={showMotoSelector}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMotoSelector(false)}
            >
                <ModalContainer>
                    <ModalContent>
                        <ModalHeader>
                            <ModalTitle>Selecionar Moto</ModalTitle>
                            <CloseButton onPress={() => setShowMotoSelector(false)}>
                                <MaterialIcons name="close" size={24} color="#333" />
                            </CloseButton>
                        </ModalHeader>

                        <ModalBody>
                            <ModalSearchContainer>
                                <ModalSearchIcon>
                                    <MaterialIcons name="search" size={20} color="#999" />
                                </ModalSearchIcon>
                                <ModalSearchInput
                                    placeholder="Buscar por marca, modelo ou placa..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </ModalSearchContainer>

                            {loading ? (
                                <ActivityIndicator size="large" color="#CB2921" style={{ marginTop: 20 }} />
                            ) : filteredMotos.length === 0 ? (
                                <NoResultsText>
                                    Nenhuma moto encontrada
                                </NoResultsText>
                            ) : (
                                <SelectionList
                                    data={filteredMotos}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <SelectionItem
                                            onPress={() => handleSelectMoto(item)}
                                            disabled={!item.disponivel}
                                            unavailable={!item.disponivel}
                                        >
                                            <View>
                                                <SelectionItemText>
                                                    {item.marca} {item.modelo}
                                                </SelectionItemText>
                                                <SelectionItemDetail>
                                                    Placa: {item.placa} | Ano: {item.ano}
                                                </SelectionItemDetail>
                                            </View>
                                            {!item.disponivel && (
                                                <MaterialIcons name="warning" size={20} color="#CB2921" />
                                            )}
                                        </SelectionItem>
                                    )}
                                />
                            )}
                        </ModalBody>
                    </ModalContent>
                </ModalContainer>
            </Modal>
        </Container>
    );
}