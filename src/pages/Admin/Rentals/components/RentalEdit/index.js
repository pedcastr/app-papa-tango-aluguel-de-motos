import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { db } from '../../../../../services/firebaseConfig';
import { doc, getDoc, updateDoc, getDocs, collection, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import {
    Container,
    Form,
    Section,
    SectionTitle,
    InputGroup,
    Label,
    Input,
    Switch,
    SwitchContainer,
    SwitchLabel,
    SubmitButton,
    SubmitButtonText,
    ErrorText,
    SelectionList,
    SelectionItem,
    SelectionItemText,
    SelectionItemDetail,
    SelectButton,
    SelectButtonText,
    SelectedItemContainer,
    SelectedItemTitle,
    SelectedItemDetail as SelectedDetail,
    DeleteButton,
    DeleteButtonText
} from './styles';

export default function RentalEdit({ route, navigation }) {
    const { rental } = route.params;
    
    // Estado para os dados do aluguel
    const [rentalData, setRentalData] = useState({
        motoId: rental.motoId || '',
        valorCaucao: rental.valorCaucao ? rental.valorCaucao.toString() : '',
        valorSemanal: rental.valorSemanal ? rental.valorSemanal.toString() : '',
        valorMensal: rental.valorMensal ? rental.valorMensal.toString() : '',
        ativo: rental.ativo !== undefined ? rental.ativo : true
    });
    
    // Estados para controle de UI
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    // Estados para listas de seleção
    const [motos, setMotos] = useState([]);
    const [showMotosList, setShowMotosList] = useState(false);
    const [selectedMoto, setSelectedMoto] = useState(null);

    // Função para mostrar alerta em qualquer plataforma
    const showConfirmation = (title, message, onConfirm) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}\n\n${message}`)) {
                    onConfirm();
            }
        } else {
            Alert.alert(title, message, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sim, excluir', onPress: onConfirm }
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
    
    // Carregar motos disponíveis e a moto atual
    useEffect(() => {
        const fetchMotos = async () => {
            try {
                setLoading(true);
                
                // Primeiro, buscar a moto atual
                if (rental.motoId) {
                    const motoDoc = await getDoc(doc(db, "motos", rental.motoId));
                    if (motoDoc.exists()) {
                        const motoData = { id: motoDoc.id, ...motoDoc.data() };
                        setSelectedMoto(motoData);
                    }
                }
                
                // Buscar todas as motos disponíveis
                const motosQuery = query(
                    collection(db, "motos"),
                    orderBy("marca") // Manter a ordenação
                );
                
                const motosSnapshot = await getDocs(motosQuery);
                const motosData = motosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Adicionar a moto atual à lista se não estiver disponível
                if (selectedMoto && !selectedMoto.disponivel) {
                    const motoExists = motosData.some(moto => moto.id === selectedMoto.id);
                    if (!motoExists) {
                        motosData.push(selectedMoto);
                    }
                }
                
                setMotos(motosData);
            } catch (error) {
                console.error("Erro ao carregar motos:", error);
                showMessage("Erro", "Falha ao carregar motos");
            } finally {
                setLoading(false);
            }
        };
        
        fetchMotos();
    }, [rental.motoId]);
    
    // Função para validar o formulário
    const validateForm = () => {
        const newErrors = {};
        
        if (!selectedMoto) {
            newErrors.motoId = "Selecione uma moto";
        }
        
        if (!rentalData.valorCaucao) {
            newErrors.valorCaucao = "Valor da caução é obrigatório";
        } else if (isNaN(rentalData.valorCaucao) || parseFloat(rentalData.valorCaucao) <= 0) {
            newErrors.valorCaucao = "Valor da caução deve ser um número positivo";
        }
        
        if (!rentalData.valorSemanal) {
            newErrors.valorSemanal = "Valor semanal é obrigatório";
        } else if (isNaN(rentalData.valorSemanal) || parseFloat(rentalData.valorSemanal) <= 0) {
            newErrors.valorSemanal = "Valor semanal deve ser um número positivo";
        }
        
        if (!rentalData.valorMensal) {
            newErrors.valorMensal = "Valor mensal é obrigatório";
        } else if (isNaN(rentalData.valorMensal) || parseFloat(rentalData.valorMensal) <= 0) {
            newErrors.valorMensal = "Valor mensal deve ser um número positivo";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Função para selecionar uma moto
    const handleSelectMoto = (moto) => {
        setSelectedMoto(moto);
        setRentalData(prev => ({...prev, motoId: moto.id}));
        setShowMotosList(false);
        
        // Limpar erro se existir
        if (errors.motoId) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.motoId;
                return newErrors;
            });
        }
    };
    
    // Função para atualizar o aluguel
    const handleUpdate = async () => {
        if (!validateForm()) {
            showMessage("Erro", "Por favor, corrija os erros no formulário");
            return;
        }
        
        try {
            setLoading(true);
            
            // Preparar dados para atualizar
            const dataToUpdate = {
                motoId: rentalData.motoId,
                valorCaucao: parseFloat(rentalData.valorCaucao),
                valorSemanal: parseFloat(rentalData.valorSemanal),
                valorMensal: parseFloat(rentalData.valorMensal),
                ativo: rentalData.ativo,
                dataAtualizacao: new Date()
            };
            
            // Atualizar documento no Firestore
            await updateDoc(doc(db, "alugueis", rental.id), dataToUpdate);
            
            showMessage("Sucesso", "Aluguel atualizado com sucesso!");
            navigation.goBack();
        } catch (error) {
            console.error("Erro ao atualizar aluguel:", error);
            showMessage("Erro", "Falha ao atualizar aluguel");
        } finally {
            setLoading(false);
        }
    };
    
    // Função para excluir o aluguel
    const handleDelete = () => {
        showConfirmation(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir permanentemente este aluguel? Esta ação não pode ser desfeita.",
            async () => {
                try {
                    setLoading(true);
                    
                    // 1. Verificar se o aluguel está associado a contratos
                    const contratosRef = collection(db, "contratos");
                    const contratosQuery = query(contratosRef, where("aluguelId", "==", rental.id));
                    const contratosSnapshot = await getDocs(contratosQuery);
                    
                    // 2. Verificar se o aluguel está associado a usuários
                    const usersRef = collection(db, "users");
                    const usersQuery = query(usersRef, where("aluguelAtivoId", "==", rental.id));
                    const usersSnapshot = await getDocs(usersQuery);
                    
                    // Se o aluguel estiver associado a contratos ou usuários, perguntar se deseja continuar
                    if (!contratosSnapshot.empty || !usersSnapshot.empty) {
                        setLoading(false); // Desativar o loading enquanto aguarda a confirmação
                        
                        showConfirmation(
                            "Atenção",
                            `Este aluguel está associado a ${contratosSnapshot.size} contrato(s) e ${usersSnapshot.size} usuário(s). Excluir o aluguel removerá essas associações. Deseja continuar?`,
                            async () => {
                                await realizarExclusaoCompleta(rental.id, contratosSnapshot, usersSnapshot);
                            }
                        );
                    } else {
                        // Não há associações, prosseguir com a exclusão direta
                        await realizarExclusaoCompleta(rental.id);
                    }
                } catch (error) {
                    console.error("Erro ao verificar associações do aluguel:", error);
                    showMessage("Erro", "Falha ao excluir aluguel. Tente novamente.");
                    setLoading(false);
                }
            }
        );
    };

    // Função auxiliar para realizar a exclusão completa
    const realizarExclusaoCompleta = async (aluguelId, contratosSnapshot = null, usersSnapshot = null) => {
        try {
            setLoading(true);
            
            // 1. Remover associações com contratos
            if (contratosSnapshot && !contratosSnapshot.empty) {
                const atualizacoesContratos = [];
                contratosSnapshot.forEach(contratoDoc => {
                    atualizacoesContratos.push(
                        updateDoc(doc(db, "contratos", contratoDoc.id), {
                            aluguelId: null
                        })
                    );
                });
                
                if (atualizacoesContratos.length > 0) {
                    await Promise.all(atualizacoesContratos);
                }
            }
            
            // 2. Remover associações com usuários
            if (usersSnapshot && !usersSnapshot.empty) {
                const atualizacoesUsuarios = [];
                usersSnapshot.forEach(userDoc => {
                    atualizacoesUsuarios.push(
                        updateDoc(doc(db, "users", userDoc.id), {
                            aluguelAtivoId: null
                        })
                    );
                });
                
                if (atualizacoesUsuarios.length > 0) {
                    await Promise.all(atualizacoesUsuarios);
                }
            }
            
            // 3. Finalmente, excluir o documento do aluguel do Firestore
            await deleteDoc(doc(db, "alugueis", aluguelId));
            
            showMessage("Sucesso", "Aluguel excluído permanentemente com sucesso!");
            navigation.goBack();
        } catch (error) {
            console.error("Erro ao excluir aluguel:", error);
            showMessage("Erro", "Falha ao excluir aluguel. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Container>
            <ScrollView>
                <Form>
                    <Section>
                        <SectionTitle>Dados do Aluguel</SectionTitle>
                        
                        <InputGroup>
                            <Label>ID do Aluguel</Label>
                            <Input
                                value={rental.id}
                                editable={false}
                                style={{ backgroundColor: '#EEEEEE' }}
                            />
                        </InputGroup>
                        
                        <InputGroup>
                            <Label>Moto</Label>
                            {selectedMoto ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>
                                        {selectedMoto.marca} {selectedMoto.modelo}
                                    </SelectedItemTitle>
                                    <SelectedDetail>
                                        Placa: {selectedMoto.placa} | Ano: {selectedMoto.ano}
                                    </SelectedDetail>
                                    <SelectButton onPress={() => setShowMotosList(true)}>
                                        <SelectButtonText>Trocar Moto</SelectButtonText>
                                    </SelectButton>
                                </SelectedItemContainer>
                            ) : (
                                <SelectButton onPress={() => setShowMotosList(true)}>
                                    <SelectButtonText>Selecionar Moto</SelectButtonText>
                                </SelectButton>
                            )}
                            {errors.motoId && <ErrorText>{errors.motoId}</ErrorText>}
                            
                            {showMotosList && (
                                <SelectionList>
                                    {motos.length === 0 ? (
                                        <SelectionItem>
                                            <SelectionItemText>
                                                Nenhuma moto disponível
                                            </SelectionItemText>
                                        </SelectionItem>
                                    ) : (
                                        motos.map(moto => (
                                            <SelectionItem 
                                                key={moto.id} 
                                                onPress={() => handleSelectMoto(moto)}
                                                available={moto.disponivel}
                                            >
                                                <SelectionItemText>
                                                    {moto.marca} {moto.modelo}
                                                </SelectionItemText>
                                                <SelectionItemDetail>
                                                    Placa: {moto.placa} | Ano: {moto.ano}
                                                    {!moto.disponivel && moto.id !== rental.motoId && 
                                                        " (Indisponível)"}
                                                    {moto.id === rental.motoId && 
                                                        " (Moto atual)"}
                                                </SelectionItemDetail>
                                            </SelectionItem>
                                        ))
                                    )}
                                </SelectionList>
                            )}
                        </InputGroup>
                        
                        <InputGroup>
                            <Label>Valor da Caução (R$)</Label>
                            <Input
                                value={rentalData.valorCaucao}
                                onChangeText={(text) => setRentalData(prev => ({...prev, valorCaucao: text}))}
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
                                onChangeText={(text) => setRentalData(prev => ({...prev, valorSemanal: text}))}
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
                                onChangeText={(text) => setRentalData(prev => ({...prev, valorMensal: text}))}
                                placeholder="Digite o valor mensal"
                                keyboardType="numeric"
                                error={errors.valorMensal}
                            />
                            {errors.valorMensal && <ErrorText>{errors.valorMensal}</ErrorText>}
                        </InputGroup>
                        
                        <SwitchContainer>
                            <SwitchLabel>Ativo</SwitchLabel>
                            <Switch
                                value={rentalData.ativo}
                                onValueChange={(value) => setRentalData(prev => ({...prev, ativo: value}))}
                                trackColor={{ false: '#767577', true: '#CB2921' }}
                                thumbColor={rentalData.ativo ? '#CB2921' : '#767577'}
                            />
                        </SwitchContainer>
                    </Section>
                    
                    <SubmitButton onPress={handleUpdate} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <SubmitButtonText>Atualizar Aluguel</SubmitButtonText>
                        )}
                    </SubmitButton>
                    
                    <DeleteButton onPress={handleDelete} disabled={loading}>
                        <DeleteButtonText>Excluir Aluguel</DeleteButtonText>
                    </DeleteButton>
                </Form>
            </ScrollView>
        </Container>
    );
}
