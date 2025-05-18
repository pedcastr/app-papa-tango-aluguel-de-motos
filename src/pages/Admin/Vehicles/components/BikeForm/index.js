import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, ScrollView, View, Platform } from 'react-native';
import { db, storage } from '../../../../../services/firebaseConfig';
import { doc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    Container,
    Form,
    Section,
    Switch,
    SectionTitle,
    InputGroup,
    Label,
    Input,
    ImagePreviewContainer,
    MotoImage,
    ImagePlaceholder,
    ImageActions,
    ActionButton,
    ActionButtonText,
    SubmitButton,
    SubmitButtonText,
    ErrorText,
    StatusContainer,
    StatusOption,
    StatusLabel,
    RemoveImageButton,
    RemoveImageIcon,
    NoImageText
} from './styles';

/**
 * Componente para cadastro de motos por administradores
 * @param {Object} navigation - Objeto de navegação
 */
export default function CadastroMoto({ navigation }) {
    // Estados para armazenar dados da moto
    const [motoId, setMotoId] = useState('');
    const [modelo, setModelo] = useState('');
    const [anoModelo, setAnoModelo] = useState('');
    const [placa, setPlaca] = useState('');
    const [marca, setMarca] = useState('');
    const [renavam, setRenavam] = useState('');
    const [chassi, setChassi] = useState('');
    const [alugada, setAlugada] = useState(false);
    const [status, setStatus] = useState('disponível');

    // Estados para validação e UI
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [fotoUri, setFotoUri] = useState(null);
    const [fotoTempInfo, setFotoTempInfo] = useState(null);

    // Opções de status
    const statusOptions = [
        { label: 'Disponível', value: 'disponível' },
        { label: 'Alugada', value: 'alugada' },
        { label: 'Em manutenção', value: 'manutenção' },
        { label: 'Reservada', value: 'reservada' },
    ];

    // Estado para o próximo ID da moto
    useEffect(() => {
        getNextMotoId();
    }, []);

    // Função para mostrar mensagem (alerta) de sucesso/erro (em todas as plataformas)
    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    // Função para obter o próximo ID da moto automaticamente e seguindo uma sequência
    const getNextMotoId = async () => {
        try {
            const motosRef = collection(db, "motos");

            // Buscar todas as motos para garantir que temos o maior ID
            const querySnapshot = await getDocs(motosRef);

            let maxNumber = 0;

            // Iterar por todos os documentos para encontrar o maior número
            querySnapshot.forEach((doc) => {
                const motoId = doc.data().id;
                if (motoId && motoId.startsWith("moto")) {
                    const numberPart = motoId.substring(4); // Remove "moto"
                    const number = parseInt(numberPart, 10);
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            });

            // Incrementar o maior número encontrado
            const nextNumber = maxNumber + 1;
            const nextId = `moto${nextNumber}`;

            setMotoId(nextId);
        } catch (error) {
            console.error("Erro ao obter próximo ID de moto:", error);
            showMessage("Erro", "Não foi possível gerar o ID da moto");
        }
    };


    /**
     * Função para selecionar imagem da galeria
     */
    const handleSelectImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1200,
                maxHeight: 1200,
            });

            if (result.didCancel) return;

            if (result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                setFotoUri(selectedImage.uri);
                setFotoTempInfo({
                    uri: selectedImage.uri,
                    type: selectedImage.type,
                    name: selectedImage.fileName || `photo_${Date.now()}.jpg`,
                    size: selectedImage.fileSize,
                });

                // Limpa erro de foto se existir
                if (errors.foto) {
                    setErrors({ ...errors, foto: null });
                }
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            showMessage('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
        }
    };

    /**
     * Função para remover a foto selecionada
     */
    const handleRemoveImage = (e) => {
        e.stopPropagation(); // Impede que o evento se propague para o container
        setFotoUri(null);
        setFotoTempInfo(null);
    };

    /**
     * Função para validar os campos do formulário
     * @returns {boolean} - Retorna true se todos os campos forem válidos
     */
    const validateForm = () => {
        const newErrors = {};

        if (!motoId.trim()) newErrors.motoId = 'ID da moto é obrigatório';
        if (!modelo.trim()) newErrors.modelo = 'Modelo é obrigatório';
        if (!anoModelo.trim()) newErrors.anoModelo = 'Ano do modelo é obrigatório';
        if (!placa.trim()) newErrors.placa = 'Placa é obrigatória';
        if (!marca.trim()) newErrors.marca = 'Marca é obrigatória';
        if (!renavam.trim()) newErrors.renavam = 'Renavam é obrigatório';
        if (!chassi.trim()) newErrors.chassi = 'Chassi é obrigatório';
        if (!fotoUri) newErrors.foto = 'A foto da moto é obrigatória';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Função para fazer upload da foto para o Firebase Storage
     * @returns {Promise<Object>} - Objeto com URL e caminho da foto enviada
     */
    const uploadFoto = async () => {
        if (!fotoTempInfo) return null;

        const response = await fetch(fotoTempInfo.uri);
        const blob = await response.blob();

        // Cria um nome de arquivo único
        const fileName = `foto_principal_${Date.now()}.jpg`;
        const storagePath = `motos/${motoId}/fotos/${fileName}`;

        // Referência para o arquivo no Storage
        const fileRef = ref(storage, storagePath);

        // Upload do arquivo
        await uploadBytes(fileRef, blob);

        // Obtém a URL do arquivo
        const downloadURL = await getDownloadURL(fileRef);

        return {
            url: downloadURL,
            path: storagePath,
            nome: fileName
        };
    };

    /**
     * Função para cadastrar a moto no Firestore
     */
    const handleCadastrarMoto = async () => {
        if (!validateForm()) {
            showMessage('Erro', 'Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            setLoading(true);

            // Faz upload da foto
            const fotoInfo = await uploadFoto();

            // Prepara os dados da moto
            const motoData = {
                id: motoId,
                modelo,
                anoModelo: parseInt(anoModelo),
                placa: placa.toUpperCase(),
                marca,
                renavam,
                chassi,
                alugada: false,
                status,
                fotoUrl: fotoInfo ? fotoInfo.url : null,
                fotoPath: fotoInfo ? fotoInfo.path : null,
                dataCadastro: new Date().toISOString(),
            };

            // Adiciona a moto ao Firestore usando o ID personalizado
            await setDoc(doc(db, "motos", motoId), motoData);

            // Limpa o formulário
            setMotoId('');
            setModelo('');
            setAnoModelo('');
            setPlaca('');
            setMarca('');
            setRenavam('');
            setChassi('');
            setAlugada(false);
            setStatus('disponível');
            setFotoUri(null);
            setFotoTempInfo(null);
            setErrors({});

            // Navega de volta para a lista de motos
            navigation.goBack();

        } catch (error) {
            console.error('Erro ao cadastrar moto:', error);
            showMessage('Erro', 'Não foi possível cadastrar a moto. Tente novamente.');
        } finally {
            setLoading(false);
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
                    {/* Seção de Informações Básicas */}
                    <Section>
                        <SectionTitle>Informações da Moto</SectionTitle>

                        <InputGroup style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Label>Moto Alugada?</Label>
                            <Switch
                                value={alugada}
                                onValueChange={value => setAlugada(value)}
                                trackColor={{ false: '#767577', true: '#CB2921' }}
                                thumbColor={alugada ? '#CB2921' : '#767577'}
                            />
                        </InputGroup>

                        <InputGroup>
                            <Label>ID da Moto*</Label>
                            <Input
                                placeholder="Gerando ID automaticamente..."
                                placeholderTextColor="#999"
                                value={motoId}
                                onChangeText={text => {
                                    // Remove espaços e caracteres especiais
                                    const formattedText = text.replace(/[^a-zA-Z0-9]/g, '');
                                    setMotoId(formattedText);
                                    if (errors.motoId) {
                                        setErrors({ ...errors, motoId: null });
                                    }
                                }}
                                error={errors.motoId}
                                autoCapitalize="none"
                                editable={false} // Tornando o campo não editável
                            />
                            {errors.motoId && <ErrorText>{errors.motoId}</ErrorText>}
                        </InputGroup>

                        <InputGroup>
                            <Label>Modelo*</Label>
                            <Input
                                placeholder="Ex: FAN 160"
                                placeholderTextColor="#999"
                                value={modelo}
                                onChangeText={text => {
                                    setModelo(text);
                                    if (errors.modelo) {
                                        setErrors({ ...errors, modelo: null });
                                    }
                                }}
                                error={errors.modelo}
                                maxLength={12}
                                autoCapitalize="characters"
                            />
                            {errors.modelo && <ErrorText>{errors.modelo}</ErrorText>}
                        </InputGroup>

                        <InputGroup>
                            <Label>Ano do Modelo*</Label>
                            <Input
                                value={anoModelo}
                                onChangeText={text => {
                                    // Permite apenas números
                                    const numericValue = text.replace(/[^0-9]/g, '');
                                    setAnoModelo(numericValue);
                                    if (errors.anoModelo) {
                                        setErrors({ ...errors, anoModelo: null });
                                    }
                                }}
                                keyboardType="numeric"
                                maxLength={4}
                                error={errors.anoModelo}
                            />
                            {errors.anoModelo && <ErrorText>{errors.anoModelo}</ErrorText>}
                        </InputGroup>

                        <InputGroup>
                            <Label>Placa*</Label>
                            <Input
                                value={placa}
                                onChangeText={text => {
                                    // Converte para maiúsculas e limita a 7 caracteres
                                    const formattedText = text.toUpperCase().slice(0, 7);
                                    setPlaca(formattedText);
                                    if (errors.placa) {
                                        setErrors({ ...errors, placa: null });
                                    }
                                }}
                                autoCapitalize="characters"
                                maxLength={7}
                                error={errors.placa}
                            />
                            {errors.placa && <ErrorText>{errors.placa}</ErrorText>}
                        </InputGroup>

                        <InputGroup>
                            <Label>Marca*</Label>
                            <Input
                                placeholder="Ex: Honda/Yamaha/Suzuki..."
                                placeholderTextColor="#999"
                                value={marca}
                                onChangeText={text => {
                                    setMarca(text);
                                    if (errors.marca) {
                                        setErrors({ ...errors, marca: null });
                                    }
                                }}
                                error={errors.marca}
                            />
                            {errors.marca && <ErrorText>{errors.marca}</ErrorText>}
                        </InputGroup>

                        <InputGroup>
                            <Label>Renavam*</Label>
                            <Input
                                placeholder="Ex: 12345678901"
                                placeholderTextColor="#999"
                                value={renavam}
                                onChangeText={text => {
                                    // Permite apenas números
                                    const numericValue = text.replace(/[^0-9]/g, '');
                                    setRenavam(numericValue);
                                    if (errors.renavam) {
                                        setErrors({ ...errors, renavam: null });
                                    }
                                }}
                                keyboardType="numeric"
                                maxLength={11}
                                error={errors.renavam}
                            />
                            {errors.renavam && <ErrorText>{errors.renavam}</ErrorText>}
                        </InputGroup>

                        <InputGroup>
                            <Label>Chassi*</Label>
                            <Input
                                placeholder="Ex: 9BWHE21JX24060960"
                                placeholderTextColor="#999"
                                value={chassi}
                                maxLength={17}
                                onChangeText={text => {
                                    // Converte para maiúsculas
                                    const formattedText = text.toUpperCase();
                                    setChassi(formattedText);
                                    if (errors.chassi) {
                                        setErrors({ ...errors, chassi: null });
                                    }
                                }}
                                autoCapitalize="characters"
                                error={errors.chassi}
                            />
                            {errors.chassi && <ErrorText>{errors.chassi}</ErrorText>}
                        </InputGroup>
                    </Section>

                    {/* Seção de Status - COMPLETAMENTE SEPARADA */}
                    <Section>
                        <SectionTitle>Status da Moto</SectionTitle>
                        <StatusContainer>
                            {statusOptions.map(option => (
                                <StatusOption
                                    key={option.value}
                                    selected={status === option.value}
                                    onPress={() => setStatus(option.value)}
                                >
                                    <StatusLabel selected={status === option.value}>
                                        {option.label}
                                    </StatusLabel>
                                </StatusOption>
                            ))}
                        </StatusContainer>
                    </Section>

                    {/* Seção de Foto - COMPLETAMENTE SEPARADA */}
                    <Section>
                        <SectionTitle>Foto da Moto</SectionTitle>

                        <ImagePreviewContainer onPress={handleSelectImage}>
                            {fotoUri ? (
                                <>
                                    <MotoImage source={{ uri: fotoUri }} resizeMode="contain" />
                                    <RemoveImageButton onPress={handleRemoveImage}>
                                        <RemoveImageIcon name="close-circle" size={24} color="#CB2921" />
                                    </RemoveImageButton>
                                </>
                            ) : (
                                <ImagePlaceholder>
                                    <MaterialCommunityIcons name="camera-plus" size={50} color="#999" />
                                    <NoImageText>Adicionar foto</NoImageText>
                                </ImagePlaceholder>
                            )}
                        </ImagePreviewContainer>

                        <ImageActions>
                            <ActionButton onPress={handleSelectImage}>
                                <ActionButtonText>
                                    {fotoUri ? 'Trocar Foto' : 'Selecionar Foto'}
                                </ActionButtonText>
                            </ActionButton>
                        </ImageActions>
                        {errors.foto && <ErrorText>{errors.foto}</ErrorText>}
                    </Section>

                    <SubmitButton onPress={handleCadastrarMoto}>
                        <SubmitButtonText>Cadastrar Moto</SubmitButtonText>
                    </SubmitButton>
                </Form>
            </ScrollView>
        </Container>
    );
}
