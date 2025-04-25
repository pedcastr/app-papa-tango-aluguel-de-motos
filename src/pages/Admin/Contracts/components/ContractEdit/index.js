import React, { useState } from 'react';
import { Alert, Platform, View, ActivityIndicator, ScrollView } from 'react-native';
import { db, storage } from '../../../../../services/firebaseConfig';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
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
    PdfActionsContainer
} from './styles';

export default function ContractEdit({ route, navigation }) {
    const { contract } = route.params;
    const [contractData, setContractData] = useState(contract);
    const [uploading, setUploading] = useState(false);

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

    const handleUpdate = async () => {
        try {
            await updateDoc(doc(db, "contratos", contractData.id), contractData);
            showMessage('Sucesso', 'Contrato atualizado com sucesso!');
            navigation.goBack();
        } catch (error) {
            showMessage('Erro', 'Falha ao atualizar contrato');
        }
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
                        <InputGroup>
                            <Label>Cliente</Label>
                            <Input
                                value={contractData.cliente}
                                onChangeText={(text) => setContractData(prev => ({...prev, cliente: text}))}
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Aluguel</Label>
                            <Input
                                value={contractData.aluguelId}
                                onChangeText={(text) => setContractData(prev => ({...prev, aluguelId: text}))}
                                autoCapitalize="none"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Label>Moto</Label>
                            <Input
                                value={contractData.motoId}
                                onChangeText={(text) => setContractData(prev => ({...prev, motoId: text}))}
                                autoCapitalize="none"
                            />
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
                        <InputGroup>
                            <Label>Tipo de Recorrência de Pagamento</Label>
                            <Input
                                value={contractData.tipoRecorrenciaPagamento}
                                onChangeText={(text) => setContractData(prev => ({...prev, tipoRecorrenciaPagamento: text}))}
                                autoCapitalize="none"
                            />
                        </InputGroup>
                    </Section>
                    
                    {/* Seção do PDF - ATUALIZADA PARA USAR O NOVO COMPONENTE */}
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
                                        <PdfActionButtonText>Excluir Contrato</PdfActionButtonText>
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
                </Form>
            </ScrollView>
        </Container>
    );
}
