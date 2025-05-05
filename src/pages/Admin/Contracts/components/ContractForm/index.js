import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, Switch, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { storage, db } from '../../../../../services/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp, updateDoc, doc, getDocs, query, where, orderBy, limit, setDoc } from 'firebase/firestore';
import PdfViewer from '../../../../../components/PdfViewerAdmin';
import DatePickerMultiplatform from '../../../../../components/DatePickerMultiplatform';
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
    FileSection,
    FileButton,
    FileButtonText,
    FilePreviewText,
    PdfContainer,
    DocumentTitle,
    ChangeFileButton,
    ChangeFileButtonText,
    SubmitButton,
    SubmitButtonText,
    ErrorText,
    SelectionList,
    SelectionItem,
    SelectionItemText,
    SelectionItemEmail,
    SelectButton,
    SelectButtonText,
    SelectedItemContainer,
    SelectedItemTitle,
    SelectedItemDetail,
    UserInfoContainer,
    UserInfoTitle,
    UserInfoText,
    Divider,
    CheckboxContainer,
    CheckboxWrapper,
    Checkbox,
    CheckboxInner,
    CheckboxLabel,
} from './styles';

export default function ContractForm({ navigation }) {
    const [contractData, setContractData] = useState({
        contratoId: '',
        cliente: '',
        aluguelId: '',
        motoId: '',
        mesesContratados: '',
        tipoRecorrenciaPagamento: '',
        statusContrato: true,
        renovacaoAutomatica: false,
        dataInicio: new Date(),
    });

    const [pdfFile, setPdfFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    
    // Novos estados para as listas de seleção
    const [users, setUsers] = useState([]);
    const [motos, setMotos] = useState([]);
    const [alugueis, setAlugueis] = useState([]);
    const [nextContratoId, setNextContratoId] = useState('');
    
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

    // Carregar dados iniciais
    useEffect(() => {
        loadUsers();
        loadMotos();
        loadAlugueis();
        getNextContratoId();
    }, []);

    // Função para obter o próximo ID de contrato
    const getNextContratoId = async () => {
        try {
            const contratosRef = collection(db, "contratos");
            const q = query(contratosRef, orderBy("contratoId", "desc"), limit(1));
            const querySnapshot = await getDocs(q);
            
            let nextId = "contrato1";
            
            if (!querySnapshot.empty) {
                const lastDoc = querySnapshot.docs[0];
                const lastId = lastDoc.data().contratoId;
                
                if (lastId && lastId.startsWith("contrato")) {
                    const lastNumber = parseInt(lastId.replace("contrato", ""), 10);
                    if (!isNaN(lastNumber)) {
                        nextId = `contrato${lastNumber + 1}`;
                    }
                }
            }
            
            setNextContratoId(nextId);
            setContractData(prev => ({ ...prev, contratoId: nextId }));
        } catch (error) {
            console.error("Erro ao obter próximo ID de contrato:", error);
            Alert.alert("Erro", "Não foi possível gerar o ID do contrato");
        }
    };

    // Carregar usuários do Firestore
    const loadUsers = async () => {
        try {
            const usersRef = collection(db, "users");
            const querySnapshot = await getDocs(usersRef);
            const usersList = [];
            
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                usersList.push({
                    id: doc.id,
                    email: userData.email,
                    nome: userData.nome,
                    motoAlugadaId: userData.motoAlugadaId,
                    aluguelAtivoId: userData.aluguelAtivoId,
                    contratoId: userData.contratoId,
                    aprovado: userData.aprovado,
                });
            });
            
            setUsers(usersList);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            Alert.alert("Erro", "Não foi possível carregar a lista de usuários");
        }
    };

    // Carregar motos do Firestore
    const loadMotos = async () => {
        try {
            const motosRef = collection(db, "motos");
            const querySnapshot = await getDocs(motosRef);
            const motosList = [];
            
            querySnapshot.forEach((doc) => {
                const motoData = doc.data();
                motosList.push({
                    id: doc.id,
                    marca: motoData.marca,
                    modelo: motoData.modelo,
                    placa: motoData.placa,
                    anoModelo: motoData.anoModelo,
                    fotoUrl: motoData.fotoUrl,
                    disponivel: !motoData.alugada, // Assumindo que existe um campo 'alugada'
                });
            });
            
            setMotos(motosList);
        } catch (error) {
            console.error("Erro ao carregar motos:", error);
            Alert.alert("Erro", "Não foi possível carregar a lista de motos");
        }
    };

    // Carregar aluguéis do Firestore
    const loadAlugueis = async () => {
        try {
            const alugueisRef = collection(db, "alugueis");
            const querySnapshot = await getDocs(alugueisRef);
            const aluguelList = [];
            
            querySnapshot.forEach((doc) => {
                const aluguelData = doc.data();
                aluguelList.push({
                    id: doc.id,
                    motoId: aluguelData.motoId,
                    valorMensal: aluguelData.valorMensal,
                    valorSemanal: aluguelData.valorSemanal,
                    valorCaucao: aluguelData.valorCaucao,
                    ativo: aluguelData.ativo || true, // Valor padrão caso não exista
                });
            });
            
            setAlugueis(aluguelList);
        } catch (error) {
            console.error("Erro ao carregar aluguéis:", error);
            Alert.alert("Erro", "Não foi possível carregar a lista de aluguéis");
        }
    };

    // Função para selecionar um usuário
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setContractData(prev => ({ ...prev, cliente: user.email }));
        setShowUsersList(false);
        
        // Limpar erro se existir
        if (errors.cliente) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.cliente;
                return newErrors;
            });
        }
    };

    // Função para selecionar uma moto
    const handleSelectMoto = (moto) => {
        setSelectedMoto(moto);
        setContractData(prev => ({ ...prev, motoId: moto.id }));
        setShowMotosList(false);
        
        // Limpar erro se existir
        if (errors.motoId) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.motoId;
                return newErrors;
            });
        }
        
        // Filtrar aluguéis relacionados a esta moto
        const motosAlugueis = alugueis.filter(aluguel => aluguel.motoId === moto.id);
        if (motosAlugueis.length > 0) {
            handleSelectAluguel(motosAlugueis[0]);
        }
    };

    // Função para selecionar um aluguel
    const handleSelectAluguel = (aluguel) => {
        setSelectedAluguel(aluguel);
        setContractData(prev => ({ ...prev, aluguelId: aluguel.id }));
        setShowAluguelsList(false);
        
        // Limpar erro se existir
        if (errors.aluguelId) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.aluguelId;
                return newErrors;
            });
        }
    };

    // Função para validar os campos do formulário
    const validateForm = () => {
        const newErrors = {};
        
        if (!contractData.contratoId.trim()) newErrors.contratoId = 'ID do contrato é obrigatório';
        if (!contractData.cliente.trim()) newErrors.cliente = 'Cliente é obrigatório';
        if (!contractData.aluguelId.trim()) newErrors.aluguelId = 'ID do aluguel é obrigatório';
        if (!contractData.motoId.trim()) newErrors.motoId = 'ID da moto é obrigatório';
        if (!contractData.mesesContratados.trim()) newErrors.mesesContratados = 'Meses contratados é obrigatório';
        if (!contractData.tipoRecorrenciaPagamento.trim()) newErrors.tipoRecorrenciaPagamento = 'Tipo de recorrência de pagamento é obrigatório (semanal ou mensal)';
        else if (isNaN(contractData.mesesContratados) || parseInt(contractData.mesesContratados) <= 0) {
            newErrors.mesesContratados = 'Meses contratados deve ser um número positivo';
        }
        if (!pdfFile) newErrors.pdf = 'Arquivo do contrato é obrigatório';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Função para lidar com a mudança de data
    const handleDateChange = (selectedDate) => {
        if (selectedDate) {
            setContractData(prev => ({...prev, dataInicio: selectedDate}));
        }
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

    // Função para selecionar e fazer upload do PDF
    const handleFileUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });
            
            if (result.canceled) {
                return; // Usuário cancelou a seleção
            }
            
            const file = result.assets[0];
            
            if (!file) {
                throw new Error('Nenhum arquivo selecionado');
            }
            
            setPdfFile({
                uri: file.uri,
                name: file.name || `contrato_${Date.now()}.pdf`,
                size: file.size,
                type: 'application/pdf'
            });
            
            // Limpar erro se existir
            if (errors.pdf) {
                setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors.pdf;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Erro ao selecionar PDF:', error);
            Alert.alert('Erro', 'Falha ao selecionar o arquivo PDF');
        }
    };

    // Função para remover o PDF selecionado
    const handleRemovePdf = () => {
        setPdfFile(null);
    };

    // Função para enviar o formulário
    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Erro', 'Por favor, corrija os erros no formulário');
            return;
        }
        
        setUploading(true);
        
        try {
            // 1. Fazer upload do PDF para o Storage
            let downloadUrl = '';
            let fileName = '';
            
            if (pdfFile) {
                // Obter o blob usando fetch
                const response = await fetch(pdfFile.uri);
                const blob = await response.blob();
                
                // Nome do arquivo com o ID do contrato para melhor organização
                fileName = `${contractData.contratoId}.pdf`;
                
                // Criar o documento no Firestore com o ID personalizado
                const contratoRef = doc(db, "contratos", contractData.contratoId);
                await setDoc(contratoRef, {
                    contratoId: contractData.contratoId,
                    cliente: contractData.cliente,
                    aluguelId: contractData.aluguelId,
                    motoId: contractData.motoId,
                    tipoRecorrenciaPagamento: contractData.tipoRecorrenciaPagamento,
                    mesesContratados: Number(contractData.mesesContratados),
                    statusContrato: contractData.statusContrato,
                    renovacaoAutomatica: contractData.renovacaoAutomatica,
                    dataInicio: Timestamp.fromDate(contractData.dataInicio),
                    dataCriacao: Timestamp.fromDate(new Date()),
                });
                
                // Caminho para o storage usando o ID do contrato
                const storagePath = `contratos/${contractData.contratoId}/${fileName}`;
                
                // Referência para o local de armazenamento
                const storageRef = ref(storage, storagePath);
                
                // Fazer upload do arquivo
                await uploadBytes(storageRef, blob);
                
                // Obter a URL de download
                downloadUrl = await getDownloadURL(storageRef);
                
                // Atualizar o documento com a URL do contrato
                await updateDoc(contratoRef, {
                    urlContrato: downloadUrl,
                    nomeArquivoContrato: fileName
                });
                
                // Atualizar o usuário com o ID do contrato
                if (selectedUser) {
                    const userRef = doc(db, "users", selectedUser.id);
                    await updateDoc(userRef, {
                        contratoId: contractData.contratoId
                    });
                }
            }
            
            Alert.alert('Sucesso', 'Contrato cadastrado com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao cadastrar contrato:', error);
            Alert.alert('Erro', 'Falha ao cadastrar contrato: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Renderizar informações do usuário selecionado
    const renderUserInfo = () => {
        if (!selectedUser) return null;
        
        const motoAlugada = motos.find(m => m.id === selectedUser.motoAlugadaId);
        const aluguelAtivo = alugueis.find(a => a.id === selectedUser.aluguelAtivoId);
        
        return (
            <UserInfoContainer>
                <UserInfoTitle>Informações do Usuário</UserInfoTitle>
                <UserInfoText>Status: {selectedUser.aprovado ? 'Aprovado' : 'Pendente'}</UserInfoText>
                
                {selectedUser.motoAlugadaId ? (
                    <>
                        <UserInfoText>Moto Alugada: {motoAlugada ? `${motoAlugada.marca} ${motoAlugada.modelo} (${motoAlugada.placa})` : selectedUser.motoAlugadaId}</UserInfoText>
                    </>
                ) : (
                    <UserInfoText>Moto Alugada: Nenhuma</UserInfoText>
                )}
                
                {selectedUser.aluguelAtivoId ? (
                    <>
                        <UserInfoText>Aluguel Ativo: {aluguelAtivo ? `${aluguelAtivo.id} - R$ ${aluguelAtivo.valorMensal}/mês` : selectedUser.aluguelAtivoId}</UserInfoText>
                    </>
                ) : (
                    <UserInfoText>Aluguel Ativo: Nenhum</UserInfoText>
                )}
                
                {selectedUser.contratoId ? (
                    <UserInfoText>Contrato Ativo: {selectedUser.contratoId}</UserInfoText>
                ) : (
                    <UserInfoText>Contrato Ativo: Nenhum</UserInfoText>
                )}
            </UserInfoContainer>
        );
    };

    return (
        <Container>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Form>
                    <Section>
                        <SectionTitle>Dados do Contrato</SectionTitle>
                        
                        <InputGroup>
                            <Label>ID do Contrato</Label>
                            <Input
                                value={contractData.contratoId}
                                onChangeText={(text) => setContractData(prev => ({...prev, contratoId: text}))}
                                placeholder="Digite o ID do contrato"
                                error={errors.contratoId}
                                autoCapitalize="none"
                                editable={false} // Tornando o campo não editável
                            />
                            {errors.contratoId && <ErrorText>{errors.contratoId}</ErrorText>}
                        </InputGroup>
                        
                        <InputGroup>
                            <Label>Cliente</Label>
                            {selectedUser ? (
                                <SelectedItemContainer>
                                    <SelectedItemTitle>{selectedUser.nome}</SelectedItemTitle>
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
                            {errors.cliente && <ErrorText>{errors.cliente}</ErrorText>}
                            
                            {showUsersList && (
                                <SelectionList>
                                    {users.map((user) => (
                                        <SelectionItem 
                                            key={user.id} 
                                            onPress={() => handleSelectUser(user)}
                                            approved={user.aprovado}
                                        >
                                            <SelectionItemText>{user.nome}</SelectionItemText>
                                            <SelectionItemEmail>{user.email}</SelectionItemEmail>
                                        </SelectionItem>
                                    ))}
                                </SelectionList>
                            )}
                        </InputGroup>
                        
                        {renderUserInfo()}
                        
                        <Divider />
                        
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
                            {errors.motoId && <ErrorText>{errors.motoId}</ErrorText>}
                            
                            {showMotosList && (
                                <SelectionList>
                                    {motos.map((moto) => (
                                        <SelectionItem 
                                            key={moto.id} 
                                            onPress={() => handleSelectMoto(moto)}
                                            available={moto.disponivel}
                                        >
                                            <SelectionItemText>{moto.marca} {moto.modelo}</SelectionItemText>
                                            <SelectionItemEmail>Placa: {moto.placa} | Ano: {moto.anoModelo}</SelectionItemEmail>
                                        </SelectionItem>
                                    ))}
                                </SelectionList>
                            )}
                        </InputGroup>
                        
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
                            {errors.aluguelId && <ErrorText>{errors.aluguelId}</ErrorText>}
                            
                            {showAluguelsList && (
                                <SelectionList>
                                    {alugueis
                                        .filter(aluguel => !selectedMoto || aluguel.motoId === selectedMoto.id)
                                        .map((aluguel) => (
                                            <SelectionItem 
                                                key={aluguel.id} 
                                                onPress={() => handleSelectAluguel(aluguel)}
                                            >
                                                <SelectionItemText>Aluguel: {aluguel.id}</SelectionItemText>
                                                <SelectionItemEmail>
                                                    Mensal: R$ {aluguel.valorMensal} | Semanal: R$ {aluguel.valorSemanal}
                                                </SelectionItemEmail>
                                            </SelectionItem>
                                        ))
                                    }
                                </SelectionList>
                            )}
                        </InputGroup>
                        
                        <InputGroup>
                            <Label>Meses Contratados</Label>
                            <Input
                                value={contractData.mesesContratados}
                                onChangeText={(text) => setContractData(prev => ({...prev, mesesContratados: text}))}
                                placeholder="Digite o número de meses"
                                keyboardType="numeric"
                                error={errors.mesesContratados}
                            />
                            {errors.mesesContratados && <ErrorText>{errors.mesesContratados}</ErrorText>}
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
                        
                        <InputGroup>
                            <DatePickerMultiplatform
                                label="Data de Início"
                                value={contractData.dataInicio}
                                onChange={handleDateChange}
                                placeholder="Selecione a data de início"
                            />
                        </InputGroup>
                        
                        <SwitchContainer>
                            <SwitchLabel>Status do Contrato (Ativo)</SwitchLabel>
                            <Switch
                                value={contractData.statusContrato}
                                onValueChange={(value) => setContractData(prev => ({ ...prev, statusContrato: value }))}
                                trackColor={{ false: '#767577', true: '#CB2921' }}
                                thumbColor={contractData.statusContrato ? '#CB2921' : '#767577'}
                            />
                        </SwitchContainer>
                        
                        <SwitchContainer>
                            <SwitchLabel>Renovação Automática</SwitchLabel>
                            <Switch
                                value={contractData.renovacaoAutomatica}
                                onValueChange={(value) => setContractData(prev => ({ ...prev, renovacaoAutomatica: value }))}
                                trackColor={{ false: '#767577', true: '#CB2921' }}
                                thumbColor={contractData.renovacaoAutomatica ? '#CB2921' : '#767577'}
                            />
                        </SwitchContainer>
                    </Section>
                    
                    <FileSection>
                        {!pdfFile ? (
                            <>
                                <FileButton onPress={handleFileUpload}>
                                    <FileButtonText>Upload do Contrato (PDF)</FileButtonText>
                                </FileButton>
                                {errors.pdf && <ErrorText>{errors.pdf}</ErrorText>}
                            </>
                        ) : (
                            <>
                                <DocumentTitle>
                                    Contrato (PDF)
                                </DocumentTitle>
                                
                                <FilePreviewText>Arquivo: {pdfFile.name}</FilePreviewText>
                                <FilePreviewText>Tamanho: {(pdfFile.size / 1024).toFixed(2)} KB</FilePreviewText>
                                
                                <PdfContainer>
                                    <PdfViewer
                                        uri={pdfFile.uri}
                                        fileName={pdfFile.name}
                                        onRemove={handleRemovePdf}
                                        height={300}
                                    />
                                </PdfContainer>
                                
                                <ChangeFileButton onPress={handleFileUpload}>
                                    <ChangeFileButtonText>Trocar Arquivo</ChangeFileButtonText>
                                </ChangeFileButton>
                            </>
                        )}
                    </FileSection>
                    
                    <SubmitButton onPress={handleSubmit} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <SubmitButtonText>Cadastrar Contrato</SubmitButtonText>
                        )}
                    </SubmitButton>
                </Form>
            </ScrollView>
        </Container>
    );
}
