import React, { useState, useEffect } from 'react';
import { Alert, Platform, View, ActivityIndicator, ScrollView } from 'react-native';
import { db, storage } from '../../../../../services/firebaseConfig';
import { doc, updateDoc, Timestamp, collection, getDocs, query, orderBy, deleteDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import PdfViewer from '../../../../../components/PdfViewerAdmin';
import DatePickerMultiplatform from '../../../../../components/DatePickerMultiplatform';
import {
    Container,
    Form,
    Section,
    Switch,
    SectionTitle,
    InputGroup,
    Label,
    Input,
    UpdateButton,
    UpdateButtonText,
    PdfContainer,
    DocumentTitle,
    PdfActionButton,
    PdfActionButtonText,
    PdfActionsContainer,
    DeleteButton,
    DeleteButtonText,
    SelectionList,
    SelectionItem,
    SelectionItemText,
    SelectionItemEmail,
    SelectButton,
    SelectButtonText,
    SelectedItemContainer,
    SelectedItemTitle,
    SelectedItemDetail,
    CheckboxContainer,
    CheckboxLabel,
    CheckboxWrapper,
    Checkbox,
    CheckboxInner
} from './styles';

export default function ContractEdit({ route, navigation }) {
    const { contract } = route.params;
    const [contractData, setContractData] = useState(contract);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Estados para as listas de seleção
    const [users, setUsers] = useState([]);
    const [motos, setMotos] = useState([]);
    const [alugueis, setAlugueis] = useState([]);
    
    // Estados para controlar o que está selecionado
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedMoto, setSelectedMoto] = useState(null);
    const [selectedAluguel, setSelectedAluguel] = useState(null);
    
    // Estados para controlar a visibilidade das listas
    const [showUsersList, setShowUsersList] = useState(false);
    const [showMotosList, setShowMotosList] = useState(false);
    const [showAluguelsList, setShowAluguelsList] = useState(false);
    
    // Estado para tipo de recorrência
    const [recorrenciaTipo, setRecorrenciaTipo] = useState({
        semanal: contractData.tipoRecorrenciaPagamento === 'semanal',
        mensal: contractData.tipoRecorrenciaPagamento === 'mensal'
    });

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
    
    // Carregar dados iniciais
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    loadUsers(),
                    loadMotos(),
                    loadAlugueis()
                ]);
            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error);
                showMessage("Erro", "Não foi possível carregar todos os dados necessários");
            } finally {
                setLoading(false);
            }
        };
        
        loadInitialData();
    }, []);
    
    // Carregar usuários do Firestore
    const loadUsers = async () => {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("email"));
            const querySnapshot = await getDocs(q);
            const usersList = [];
            
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                usersList.push({
                    id: doc.id,
                    email: userData.email,
                    nome: userData.nome || userData.nomeCompleto || 'Usuário',
                    contratoId: userData.contratoId,
                    dataCriacao: userData.dataCriacao,
                    // Consideramos disponível se não tiver contrato ou se for o contrato atual
                    disponivel: !userData.contratoId || userData.contratoId === contractData.id
                });
            });
            
            setUsers(usersList);
            
            // Atualizar o usuário selecionado com dados completos
            if (contractData.cliente) {
                const user = usersList.find(u => u.email === contractData.cliente);
                if (user) setSelectedUser(user);
            }
            
            return usersList;
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            showMessage("Erro", "Não foi possível carregar a lista de usuários");
            return [];
        }
    };

    // Carregar motos do Firestore
    const loadMotos = async () => {
        try {
            const motosRef = collection(db, "motos");
            const q = query(motosRef, orderBy("marca"));
            const querySnapshot = await getDocs(q);
            const motosList = [];
            
            querySnapshot.forEach((doc) => {
                const motoData = doc.data();
                motosList.push({
                    id: doc.id,
                    marca: motoData.marca || 'Marca não informada',
                    modelo: motoData.modelo || 'Modelo não informado',
                    placa: motoData.placa || 'Placa não informada',
                    anoModelo: motoData.anoModelo || 'Ano não informado',
                    fotoUrl: motoData.fotoUrl,
                    // Consideramos disponível se não estiver alugada ou se for a moto do contrato atual
                    disponivel: !motoData.alugada || motoData.id === contractData.motoId,
                    dataCriacao: motoData.dataCriacao
                });
            });
            
            setMotos(motosList);
            
            // Atualizar a moto selecionada com dados completos
            if (contractData.motoId) {
                const moto = motosList.find(m => m.id === contractData.motoId);
                if (moto) setSelectedMoto(moto);
            }
            
            return motosList;
        } catch (error) {
            console.error("Erro ao carregar motos:", error);
            showMessage("Erro", "Não foi possível carregar a lista de motos");
            return [];
        }
    };

    // Carregar aluguéis do Firestore
    const loadAlugueis = async () => {
        try {
            const alugueisRef = collection(db, "alugueis");
            const q = query(alugueisRef);
            const querySnapshot = await getDocs(q);
            const aluguelList = [];
            
            querySnapshot.forEach((doc) => {
                const aluguelData = doc.data();
                aluguelList.push({
                    id: doc.id,
                    motoId: aluguelData.motoId || '',
                    valorMensal: aluguelData.valorMensal || '0',
                    valorSemanal: aluguelData.valorSemanal || '0',
                    valorCaucao: aluguelData.valorCaucao || '0',
                    ativo: aluguelData.ativo !== false, // Consideramos ativo por padrão
                    dataCriacao: aluguelData.dataCriacao,
                    // Consideramos disponível se estiver relacionado à moto do contrato atual
                    disponivel: !aluguelData.motoId || aluguelData.motoId === contractData.motoId
                });
            });
            
            setAlugueis(aluguelList);
            
            // Atualizar o aluguel selecionado com dados completos
            if (contractData.aluguelId) {
                const aluguel = aluguelList.find(a => a.id === contractData.aluguelId);
                if (aluguel) {
                    console.log("Aluguel encontrado e selecionado:", aluguel);
                    setSelectedAluguel(aluguel);
                } else {
                    console.log("Aluguel não encontrado na lista:", contractData.aluguelId);
                }
            }
            
            return aluguelList;
        } catch (error) {
            console.error("Erro ao carregar aluguéis:", error);
            showMessage("Erro", "Não foi possível carregar a lista de aluguéis");
            return [];
        }
    };
    
    // Função para selecionar um usuário
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setContractData(prev => ({ ...prev, cliente: user.email }));
        setShowUsersList(false);
    };

    // Função para selecionar uma moto
    const handleSelectMoto = (moto) => {
        setSelectedMoto(moto);
        setContractData(prev => ({ ...prev, motoId: moto.id }));
        setShowMotosList(false);
        
        // Filtrar aluguéis relacionados a esta moto
        const motosAlugueis = alugueis.filter(aluguel => aluguel.motoId === moto.id);
        if (motosAlugueis.length > 0 && !selectedAluguel) {
            handleSelectAluguel(motosAlugueis[0]);
        }
    };

    // Função para selecionar um aluguel
    const handleSelectAluguel = (aluguel) => {
        setSelectedAluguel(aluguel);
        setContractData(prev => ({ ...prev, aluguelId: aluguel.id }));
        setShowAluguelsList(false);
    };
    
    // Converter o timestamp do Firestore para Date
    const getDateFromTimestamp = () => {
        if (contractData.dataInicio && contractData.dataInicio.seconds) {
            return new Date(contractData.dataInicio.seconds * 1000);
        }
        return new Date(); // Data padrão se não houver timestamp
    };
    
    const [selectedDate, setSelectedDate] = useState(getDateFromTimestamp());

    // Verificar se o dispositivo é um desktop web
    const isWebDesktop = Platform.OS === 'web' && window.innerWidth > 768;
    
    // Função para atualizar a data
    const handleDateChange = (date) => {
        setSelectedDate(date);
        // Atualizar o estado com o novo timestamp
        setContractData(prev => ({
            ...prev,
            dataInicio: Timestamp.fromDate(date)
        }));
    };
    
    // Função para lidar com a mudança de tipo de recorrência
    const handleRecorrenciaChange = (tipo) => {
        // Se o tipo já está selecionado, desmarque-o
        if (recorrenciaTipo[tipo]) {
            setRecorrenciaTipo({
                semanal: false,
                mensal: false
            });
            setContractData(prev => ({
                ...prev,
                tipoRecorrenciaPagamento: ''
            }));
        } else {
            // Caso contrário, selecione apenas este tipo
            setRecorrenciaTipo({
                semanal: tipo === 'semanal',
                mensal: tipo === 'mensal'
            });
            setContractData(prev => ({
                ...prev,
                tipoRecorrenciaPagamento: tipo
            }));
        }
    };

    const handleUpdate = async () => {
        try {
            setLoading(true);
            await updateDoc(doc(db, "contratos", contractData.id), contractData);
            showMessage('Sucesso', 'Contrato atualizado com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao atualizar contrato:', error);
            showMessage('Erro', 'Falha ao atualizar contrato');
        } finally {
            setLoading(false);
        }
    };
    
    // Função para excluir o contrato
    const handleDeleteContract = async () => {
        showConfirmation(
            'Confirmar exclusão',
            'Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.',
            async () => {
                try {
                    setLoading(true);
                    
                    // 1. Excluir o PDF do Storage
                    if (contractData.urlContrato) {
                        await tryMultipleDeleteApproaches(contractData);
                    }
                    
                    // 2. Remover referência do contrato no usuário
                    if (contractData.cliente) {
                        try {
                            const userQuery = query(collection(db, "users"), where("contratoId", "==", contractData.id));
                            const userSnapshot = await getDocs(userQuery);
                            
                            if (!userSnapshot.empty) {
                                userSnapshot.forEach(async (userDoc) => {
                                    await updateDoc(doc(db, "users", userDoc.id), {
                                        contratoId: null
                                    });
                                    console.log("Referência de contrato removida do usuário:", userDoc.id);
                                });
                            }
                        } catch (userError) {
                            console.error("Erro ao atualizar usuário:", userError);
                        }
                    }
                    
                    // 3. Excluir o documento do contrato do Firestore
                    await deleteDoc(doc(db, "contratos", contractData.id));
                    
                    showMessage('Sucesso', 'Contrato excluído com sucesso!');
                    navigation.goBack();
                } catch (error) {
                    console.error('Erro ao excluir contrato:', error);
                    showMessage('Erro', 'Falha ao excluir o contrato. Por favor, tente novamente.');
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    // Função para excluir o PDF
    const handleDeletePdf = async () => {
        if (!contractData.urlContrato) {
            showMessage('Erro', 'Não há contrato para excluir');
            return;
        }
        
        showConfirmation(
            'Confirmar exclusão',
            'Tem certeza que deseja excluir este contrato?',
            async () => {
                try {
                    // Tentar múltiplas abordagens para excluir o arquivo
                    await tryMultipleDeleteApproaches(contractData);
                    
                    // Independentemente do resultado da exclusão do arquivo,
                    // atualizar o Firestore removendo a URL
                    const updatedData = { ...contractData, urlContrato: null };
                    await updateDoc(doc(db, "contratos", contractData.id), updatedData);
                    console.log("Firestore atualizado com sucesso");
                    
                    // Atualizar o estado local
                    setContractData(updatedData);
                    
                    showMessage('Sucesso', 'PDF do contrato removido com sucesso!');
                } catch (error) {
                    console.error('Erro ao excluir contrato:', error);
                    showMessage('Erro', 'Falha ao excluir o contrato. por favor, tente novamente.');
                }
            }
        );
    };

    // Função para tentar múltiplas abordagens de exclusão
    const tryMultipleDeleteApproaches = async (contractData) => {
        const approaches = [];
        
        // Abordagem 1: Caminho padrão
        approaches.push(`contratos/${contractData.id}/pdf`);
        
        // Abordagem 2: Com nome do contrato
        approaches.push(`contratos/${contractData.contratoId}/pdf`);
        
        // Abordagem 3: Extrair nome do arquivo da URL
        if (contractData.urlContrato) {
            const urlParts = contractData.urlContrato.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            approaches.push(`contratos/${contractData.id}/${fileName}`);
            approaches.push(`contratos/${contractData.contratoId}/${fileName}`);
        }
        
        // Abordagem 4: Tentar extrair o caminho completo da URL
        if (contractData.urlContrato) {
            const urlString = contractData.urlContrato;
            const match = urlString.match(/\/o\/([^?]+)/);
            if (match && match[1]) {
                const path = decodeURIComponent(match[1]);
                approaches.push(path);
            }
        }
        
        // Abordagem 5: Usar o nome do arquivo armazenado
        if (contractData.nomeArquivoContrato) {
            approaches.push(`contratos/${contractData.id}/${contractData.nomeArquivoContrato}`);
        }
        
        // Tentar cada abordagem
        let success = false;
        for (const path of approaches) {
            try {
                console.log("Tentando excluir arquivo do Storage com caminho:", path);
                const fileRef = ref(storage, path);
                await deleteObject(fileRef);
                console.log("Arquivo excluído com sucesso do Storage:", path);
                success = true;
                break; // Sair do loop se uma abordagem funcionar
            } catch (error) {
                console.log(`Erro ao excluir com caminho ${path}:`, error.message);
            }
        }
        
        if (!success) {
            console.log("Nenhuma abordagem de exclusão funcionou. Arquivos podem precisar ser limpos manualmente.");
        }
        
        return success;
    };

    // Função para fazer upload de um novo PDF
    const handleUploadPdf = async () => {
        try {
            setUploading(true);
            
            // Selecionar documento usando expo-document-picker
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });
            
            if (result.canceled) {
                setUploading(false);
                return;
            }
            
            const file = result.assets[0];
            
            console.log("Arquivo selecionado:", file);
            
            // Obter o blob usando fetch
            const response = await fetch(file.uri);
            const blob = await response.blob();
            
            console.log("Blob obtido com sucesso, tamanho:", blob.size);
            
            // Nome do arquivo com timestamp para evitar colisões
            const fileName = `contrato_${Date.now()}.pdf`;
            
            // Caminho para o storage
            const storagePath = `contratos/${contractData.id}/${fileName}`;
            console.log("Fazendo upload para:", storagePath);
            
            // Referência para o local de armazenamento
            const storageRef = ref(storage, storagePath);
            
            // Fazer upload do arquivo
            await uploadBytes(storageRef, blob);
            console.log("Upload concluído com sucesso");
            
            // Obter a URL de download
            const downloadUrl = await getDownloadURL(storageRef);
            console.log("URL de download obtida:", downloadUrl);
            
            // Atualizar o Firestore com a nova URL
            const updatedData = {
                ...contractData,
                urlContrato: downloadUrl,
                nomeArquivoContrato: fileName // Armazenar o nome do arquivo para facilitar exclusão futura
            };
            await updateDoc(doc(db, "contratos", contractData.id), updatedData);
            console.log("Firestore atualizado com sucesso");
            
            // Atualizar o estado local
            setContractData(updatedData);
            
            showMessage('Sucesso', 'PDF do contrato enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao fazer upload do contrato:', error);
            showMessage('Erro', 'Falha ao enviar o contrato: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Container>
            {loading && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 999
                }}>
                    <ActivityIndicator size="large" color="#CB2921" />
                </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
                <Form>
                    <Section>
                        <SectionTitle>Dados do Contrato</SectionTitle>
                        <InputGroup style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Label>Status</Label>
                            <Switch
                                value={contractData.statusContrato}
                                onValueChange={(value) => setContractData(prev => ({ ...prev, statusContrato: value }))}
                                trackColor={{ false: '#767577', true: '#CB2921' }}
                                thumbColor={contractData.statusContrato ? '#CB2921' : '#767577'}
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Id do Contrato</Label>
                            <Input
                                value={contractData.contratoId}
                                onChangeText={(text) => setContractData(prev => ({...prev, contratoId: text}))}
                                editable={false} // ID não deve ser editável
                            />
                        </InputGroup>
                        
                        {/* Seleção de Cliente */}
                        <InputGroup>
                            <Label>Cliente</Label>
                            {selectedUser ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>{selectedUser.nome || selectedUser.email}</SelectedItemTitle>
                                    <SelectedItemDetail>{selectedUser.email}</SelectedItemDetail>
                                    <SelectButton onPress={() => setShowUsersList(!showUsersList)}>
                                        <SelectButtonText>Trocar Cliente</SelectButtonText>
                                    </SelectButton>
                                </SelectedItemContainer>
                            ) : (
                                <SelectButton onPress={() => setShowUsersList(!showUsersList)}>
                                    <SelectButtonText>Selecionar Cliente</SelectButtonText>
                                </SelectButton>
                            )}
                            
                            {showUsersList && (
                                <SelectionList>
                                    {users.length > 0 ? (
                                        users
                                            .sort((a, b) => {
                                                // Primeiro os disponíveis, depois por data de criação (mais recentes primeiro)
                                                if (a.disponivel && !b.disponivel) return -1;
                                                if (!a.disponivel && b.disponivel) return 1;
                                                return 0;
                                            })
                                            .map((user) => (
                                                <SelectionItem 
                                                    key={user.id} 
                                                    onPress={() => handleSelectUser(user)}
                                                    available={user.disponivel}
                                                >
                                                    <SelectionItemText>{user.nome || user.email}</SelectionItemText>
                                                    <SelectionItemEmail>
                                                        {user.email} {!user.disponivel && user.contratoId !== contractData.id ? '(Já possui contrato)' : ''}
                                                    </SelectionItemEmail>
                                                </SelectionItem>
                                            ))
                                    ) : (
                                        <SelectionItem>
                                            <SelectionItemText>Nenhum usuário disponível</SelectionItemText>
                                        </SelectionItem>
                                    )}
                                </SelectionList>
                            )}
                        </InputGroup>
                        
                        {/* Seleção de Moto */}
                        <InputGroup>
                            <Label>Moto</Label>
                            {selectedMoto ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>{selectedMoto.marca} {selectedMoto.modelo}</SelectedItemTitle>
                                    <SelectedItemDetail>Placa: {selectedMoto.placa} | Ano: {selectedMoto.anoModelo}</SelectedItemDetail>
                                    <SelectButton onPress={() => setShowMotosList(!showMotosList)}>
                                        <SelectButtonText>Trocar Moto</SelectButtonText>
                                    </SelectButton>
                                </SelectedItemContainer>
                            ) : (
                                <SelectButton onPress={() => setShowMotosList(!showMotosList)}>
                                    <SelectButtonText>Selecionar Moto</SelectButtonText>
                                </SelectButton>
                            )}
                            
                            {showMotosList && (
                                <SelectionList>
                                    {motos.length > 0 ? (
                                        motos
                                            .sort((a, b) => {
                                                // Primeiro as disponíveis, depois por data de criação (mais recentes primeiro)
                                                if (a.disponivel && !b.disponivel) return -1;
                                                if (!a.disponivel && b.disponivel) return 1;
                                                return 0;
                                            })
                                            .map((moto) => (
                                                <SelectionItem 
                                                    key={moto.id} 
                                                    onPress={() => handleSelectMoto(moto)}
                                                    available={moto.disponivel}
                                                >
                                                    <SelectionItemText>{moto.marca} {moto.modelo}</SelectionItemText>
                                                    <SelectionItemEmail>
                                                        Placa: {moto.placa} | Ano: {moto.anoModelo} {!moto.disponivel && moto.id !== contractData.motoId ? '(Já alugada)' : ''}
                                                    </SelectionItemEmail>
                                                </SelectionItem>
                                            ))
                                    ) : (
                                        <SelectionItem>
                                            <SelectionItemText>Nenhuma moto disponível</SelectionItemText>
                                        </SelectionItem>
                                    )}
                                </SelectionList>
                            )}
                        </InputGroup>
                        
                        {/* Seleção de Aluguel */}
                        <InputGroup>
                            <Label>Aluguel</Label>
                            {selectedAluguel ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>Aluguel: {selectedAluguel.id}</SelectedItemTitle>
                                    <SelectedItemDetail>
                                        Mensal: R$ {selectedAluguel.valorMensal} | Semanal: R$ {selectedAluguel.valorSemanal} | Caução: R$ {selectedAluguel.valorCaucao}
                                    </SelectedItemDetail>
                                    <SelectButton onPress={() => setShowAluguelsList(!showAluguelsList)}>
                                        <SelectButtonText>Trocar Aluguel</SelectButtonText>
                                    </SelectButton>
                                </SelectedItemContainer>
                            ) : (
                                <SelectButton onPress={() => setShowAluguelsList(!showAluguelsList)}>
                                    <SelectButtonText>Selecionar Aluguel</SelectButtonText>
                                </SelectButton>
                            )}
                            
                            {showAluguelsList && (
                                <SelectionList>
                                    {alugueis.length > 0 ? (
                                        alugueis
                                            .sort((a, b) => {
                                                // Primeiro o aluguel atual do contrato
                                                if (a.id === contractData.aluguelId) return -1;
                                                if (b.id === contractData.aluguelId) return 1;
                                                
                                                // Depois os aluguéis da moto selecionada
                                                if (selectedMoto) {
                                                    if (a.motoId === selectedMoto.id && b.motoId !== selectedMoto.id) return -1;
                                                    if (a.motoId !== selectedMoto.id && b.motoId === selectedMoto.id) return 1;
                                                }
                                                
                                                // Por fim, os aluguéis ativos
                                                if (a.ativo && !b.ativo) return -1;
                                                if (!a.ativo && b.ativo) return 1;
                                                
                                                return 0;
                                            })
                                            .map((aluguel) => (
                                                <SelectionItem 
                                                    key={aluguel.id} 
                                                    onPress={() => handleSelectAluguel(aluguel)}
                                                    available={aluguel.id === contractData.aluguelId || !selectedMoto || aluguel.motoId === selectedMoto.id}
                                                >
                                                    <SelectionItemText>Aluguel: {aluguel.id}</SelectionItemText>
                                                    <SelectionItemEmail>
                                                        Mensal: R$ {aluguel.valorMensal} | Semanal: R$ {aluguel.valorSemanal}
                                                        {selectedMoto && aluguel.motoId && aluguel.motoId !== selectedMoto.id ? 
                                                            ' (Moto diferente da selecionada)' : ''}
                                                    </SelectionItemEmail>
                                                </SelectionItem>
                                            ))
                                    ) : (
                                        <SelectionItem>
                                            <SelectionItemText>Nenhum aluguel disponível</SelectionItemText>
                                        </SelectionItem>
                                    )}
                                </SelectionList>
                            )}
                        </InputGroup>
                        
                        <InputGroup>
                            <Label>Data de Início</Label>
                            <DatePickerMultiplatform
                                value={selectedDate}
                                onChange={handleDateChange}
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Meses Contratados</Label>
                            <Input
                                value={contractData.mesesContratados !== undefined ? String(contractData.mesesContratados) : ''}
                                onChangeText={(text) => setContractData(prev => ({...prev, mesesContratados: Number(text)}))}
                                keyboardType="numeric"
                            />
                        </InputGroup>
                        
                        {/* Tipo de Recorrência com Checkboxes */}
                        <InputGroup>
                            <Label>Tipo de Recorrência de Pagamento</Label>
                            <CheckboxContainer>
                                <CheckboxWrapper onPress={() => handleRecorrenciaChange('semanal')}>
                                    <Checkbox>
                                        {recorrenciaTipo.semanal && <CheckboxInner />}
                                    </Checkbox>
                                    <CheckboxLabel>Semanal</CheckboxLabel>
                                </CheckboxWrapper>
                                
                                <CheckboxWrapper onPress={() => handleRecorrenciaChange('mensal')}>
                                    <Checkbox>
                                        {recorrenciaTipo.mensal && <CheckboxInner />}
                                    </Checkbox>
                                    <CheckboxLabel>Mensal</CheckboxLabel>
                                </CheckboxWrapper>
                            </CheckboxContainer>
                        </InputGroup>
                    </Section>
                    
                    {/* Seção do PDF */}
                    <Section>
                        <SectionTitle>Contrato (PDF)</SectionTitle>
                        
                        {contractData.urlContrato ? (
                            <>
                                <DocumentTitle>
                                    Contrato atual
                                </DocumentTitle>
                                
                                <PdfContainer>
                                    <PdfViewer
                                        uri={contractData.urlContrato}
                                        fileName={`Contrato-${contractData.contratoId || contractData.id}.pdf`}
                                        height={isWebDesktop ? 600 : 300}
                                    />
                                </PdfContainer>
                                
                                <PdfActionsContainer>
                                    <PdfActionButton onPress={handleDeletePdf} color="#FF3B30">
                                        <MaterialIcons name="delete" size={20} color="#FFFFFF" />
                                        <PdfActionButtonText>Excluir PDF</PdfActionButtonText>
                                    </PdfActionButton>
                                    
                                    <PdfActionButton onPress={handleUploadPdf} color="#007AFF">
                                        <MaterialIcons name="file-upload" size={20} color="#FFFFFF" />
                                        <PdfActionButtonText>Substituir</PdfActionButtonText>
                                    </PdfActionButton>
                                </PdfActionsContainer>
                            </>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                {uploading ? (
                                    <ActivityIndicator size="large" color="#CB2921" />
                                ) : (
                                    <PdfActionButton onPress={handleUploadPdf} color="#007AFF">
                                        <MaterialIcons name="file-upload" size={20} color="#FFFFFF" />
                                        <PdfActionButtonText>Fazer Upload do Contrato</PdfActionButtonText>
                                    </PdfActionButton>
                                )}
                            </View>
                        )}
                    </Section>
                    
                    <UpdateButton onPress={handleUpdate}>
                        <UpdateButtonText>Atualizar Contrato</UpdateButtonText>
                    </UpdateButton>
                    
                    {/* Botão para excluir o contrato */}
                    <DeleteButton onPress={handleDeleteContract}>
                        <DeleteButtonText>Excluir Contrato</DeleteButtonText>
                    </DeleteButton>
                </Form>
            </ScrollView>
        </Container>
    );
}
