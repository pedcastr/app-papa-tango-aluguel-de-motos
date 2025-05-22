import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, FlatList, Alert, Platform, TouchableOpacity, Text, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { db } from '../../../services/firebaseConfig';
import { collection, query, orderBy, where, addDoc, Timestamp, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

import {
    Container,
    Header,
    BackButton,
    HeaderTitle,
    UserInfo,
    UserName,
    UserEmail,
    PaymentCard,
    PaymentHeader,
    PaymentTitle,
    StatusBadge,
    StatusText,
    PaymentAmount,
    PaymentInfo,
    PaymentInfoRow,
    PaymentInfoLabel,
    PaymentInfoValue,
    PaymentActions,
    ActionButton,
    ActionButtonText,
    EmptyContainer,
    EmptyText,
    LoadingContainer,
    Divider,
} from './styles';

export default function AdminUserPayments() {
    const navigation = useNavigation();
    const route = useRoute();
    const { userEmail, userName } = route.params;

    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [userContract, setUserContract] = useState(null);
    const [pendingPixPayments, setPendingPixPayments] = useState([]);

    // Estados para controlar os modais de pagamento parcial e total manuais
    const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
    const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
    const [partialPaymentValue, setPartialPaymentValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showLatePaymentModal, setShowLatePaymentModal] = useState(false);
    const [latePaymentValue, setLatePaymentValue] = useState('');
    const [latePaymentReason, setLatePaymentReason] = useState('');

    // Substitua o useEffect atual por este
    useEffect(() => {
        let paymentsUnsubscribe = () => { };
        let contractUnsubscribe = () => { };

        const loadUserData = async () => {
            setLoading(true);

            try {
                // Configurar listener para contratos do usuário
                const contratosRef = collection(db, 'contratos');
                const contratoQuery = query(contratosRef, where('cliente', '==', userEmail));

                contractUnsubscribe = onSnapshot(contratoQuery, async (contratoSnapshot) => {
                    if (!contratoSnapshot.empty) {
                        const contratoData = contratoSnapshot.docs[0].data();
                        // Inicializar a variável aqui, antes de usá-la
                        let tipoRecorrencia = contratoData.tipoRecorrenciaPagamento || 'mensal';

                        // Buscar aluguel associado ao contrato
                        let valorMensal = 0;
                        let valorSemanal = 0;

                        if (contratoData.aluguelId) {
                            const aluguelRef = doc(db, 'alugueis', contratoData.aluguelId);
                            const aluguelSnapshot = await getDoc(aluguelRef);

                            if (aluguelSnapshot.exists()) {
                                const aluguelData = aluguelSnapshot.data();
                                valorMensal = aluguelData.valorMensal || 0;
                                valorSemanal = aluguelData.valorSemanal || 0;

                                // Buscar moto associada ao aluguel
                                let motoModelo = 'N/A';
                                let motoPlaca = 'N/A';

                                if (contratoData.motoId) {
                                    const motoRef = doc(db, 'motos', contratoData.motoId);
                                    const motoSnapshot = await getDoc(motoRef);

                                    if (motoSnapshot.exists()) {
                                        const motoData = motoSnapshot.data();
                                        motoModelo = motoData.modelo || 'N/A';
                                        motoPlaca = motoData.placa || 'N/A';
                                    }
                                }

                                setUserContract({
                                    dataInicio: contratoData.dataInicio,
                                    dataFim: contratoData.dataFim || null,
                                    valorMensal: aluguelData.valorMensal || 0,
                                    valorSemanal: aluguelData.valorSemanal || 0,
                                    tipoRecorrencia,
                                    modeloMoto: motoModelo,
                                    placaMoto: motoPlaca
                                });
                            }
                        }
                    }

                    // Configurar listener para pagamentos do usuário
                    const paymentsRef = collection(db, 'payments');
                    const paymentsQuery = query(
                        paymentsRef,
                        where('userEmail', '==', userEmail),
                        orderBy('dateCreated', 'desc')
                    );

                    paymentsUnsubscribe = onSnapshot(paymentsQuery, (paymentsSnapshot) => {
                        // Mapear documentos para o formato necessário
                        const paymentsData = paymentsSnapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                status: data.status || 'pending',
                                payment_type_id: data.paymentMethod || 'pix',
                                transaction_amount: data.amount || 0,
                                date_created: data.dateCreated || null,
                                dateApproved: data.dateApproved || null,
                                description: data.description || 'Pagamento',
                                createdAt: data.dateCreated ? data.dateCreated.toDate() : null,
                                userEmail: data.userEmail,
                                userName: data.userName,
                                paymentDetails: data.paymentDetails || null
                            };
                        });

                        setPayments(paymentsData);

                        // Filtrar pagamentos PIX pendentes
                        const pixPendingPayments = paymentsData.filter(
                            payment => payment.status === 'pending' && payment.payment_type_id === 'pix'
                        );
                        setPendingPixPayments(pixPendingPayments);

                        setLoading(false);
                    }, (error) => {
                        console.error('Erro ao observar pagamentos:', error);
                        setLoading(false);
                    });
                }, (error) => {
                    console.error('Erro ao observar contrato:', error);
                    setLoading(false);
                });
            } catch (error) {
                console.error('Erro ao carregar dados do usuário:', error);
                showMessage('Erro', 'Não foi possível carregar os pagamentos deste usuário.');
                setLoading(false);
            }
        };

        // Iniciar carregamento
        loadUserData();

        // Limpar listeners ao desmontar o componente
        return () => {
            if (typeof paymentsUnsubscribe === 'function') {
                paymentsUnsubscribe();
            }
            if (typeof contractUnsubscribe === 'function') {
                contractUnsubscribe();
            }
        };
    }, [userEmail]);


    // Função para mostrar alerta em qualquer plataforma
    const showConfirmation = (title, message, onConfirm) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}\n\n${message}`)) {
                onConfirm();
            }
        } else {
            Alert.alert(title, message, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sim', onPress: onConfirm }
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

    // Função para enviar notificação pelo Firestore
    const enviarNotificacaoPeloFirestore = async (userEmail, payment, title, body, data) => {
        try {
            // Gerar um ID único para a solicitação
            const requestId = `payment_${payment.id || 'admin'}_${Date.now()}`;

            // Criar um documento de solicitação de notificação no Firestore
            await setDoc(doc(db, 'notificationRequests', requestId), {
                userEmail: userEmail,
                title: title,
                body: body,
                data: data,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error(`Erro ao criar solicitação de notificação: ${error.message}`);
            return false;
        }
    };

    // Função para enviar email pelo Firestore
    const enviarEmailPeloFirestore = async (userEmail, subject, body, paymentInfo) => {
        try {
            // Gerar um ID único para a solicitação
            const requestId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

            // Criar um documento de solicitação de email no Firestore
            await setDoc(doc(db, 'emailRequests', requestId), {
                to: userEmail,
                subject: subject,
                html: body,
                paymentInfo: paymentInfo || null,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error(`Erro ao criar solicitação de email: ${error.message}`);
            return false;
        }
    };

    // Função para formatar data
    const formatDate = (date) => {
        if (!date) return 'N/A';

        // Verificar se é um objeto Timestamp do Firestore
        if (date && typeof date === 'object' && date.seconds !== undefined && date.nanoseconds !== undefined) {
            // Converter Timestamp para Date
            date = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
        }

        // Verificar se date é um objeto Date
        if (!(date instanceof Date)) {
            console.warn('formatDate recebeu um valor que não é Date:', date);
            return 'Data inválida';
        }

        try {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Erro na data';
        }
    };

    // Função para formatar valor
    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return `R$ ${parseFloat(value).toFixed(2)}`;
    };

    // Função para obter cor do status
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return '#28a745';
            case 'pending':
            case 'in_process':
                return '#ffc107';
            case 'rejected':
            case 'cancelled':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    // Função para formatar status do pagamento
    const formatStatus = (status) => {
        switch (status) {
            case 'approved':
                return 'Aprovado';
            case 'pending':
                return 'Pendente';
            case 'in_process':
                return 'Em processamento';
            case 'rejected':
                return 'Rejeitado';
            case 'cancelled':
                return 'Cancelado';
            default:
                return status || 'N/A';
        }
    };

    // Função para formatar tipo de pagamento
    const formatPaymentType = (type) => {
        switch (type) {
            case 'credit_card':
                return 'Cartão de Crédito';
            case 'debit_card':
                return 'Cartão de Débito';
            case 'pix':
                return 'PIX';
            case 'ticket':
            case 'boleto':
                return 'Boleto';
            case 'manual':
                return 'Manual (Admin)';
            default:
                return type || 'N/A';
        }
    };

    // Função para ver detalhes de um pagamento
    const viewPaymentDetails = (payment) => {
        // Criar uma versão serializável do objeto de pagamento
        const serializablePaymentInfo = {
            ...payment,
            createdAt: payment.createdAt ?
                (payment.createdAt instanceof Date ?
                    payment.createdAt.toISOString() : payment.createdAt) : null,
            date_approved: payment.date_approved ?
                (payment.date_approved instanceof Date ?
                    payment.date_approved.toISOString() : payment.date_approved) : null,
        };

        // Navegar para a tela de detalhes com o objeto serializável
        navigation.navigate('AdminPaymentDetails', { paymentInfo: serializablePaymentInfo });
    };

    // Função para enviar lembrete de pagamento
    const sendPaymentReminder = async () => {
        try {
            if (!userContract) {
                showMessage('Erro', 'Não foi possível encontrar um contrato ativo para este usuário.');
                return;
            }

            // Determinar qual valor usar baseado no tipo de recorrência
            const valorPagamento = userContract.tipoRecorrencia === 'semanal'
                ? userContract.valorSemanal
                : userContract.valorMensal;

            // Criar um objeto de pagamento fictício para a função de notificação
            const paymentInfo = {
                id: `reminder_${Date.now()}`,
                transaction_amount: valorPagamento
            };

            // Preparar dados para a notificação
            const title = 'Lembrete de Pagamento';
            const body = `Seu pagamento de ${formatCurrency(valorPagamento)} está pendente. Clique para efetuar o pagamento.`;
            const data = {
                screen: 'Financeiro',
                type: 'payment_reminder'
            };

            // Enviar notificação
            await enviarNotificacaoPeloFirestore(
                userEmail,
                paymentInfo,
                title,
                body,
                data
            );

            // Enviar email de lembrete
            const emailSubject = 'Lembrete de Pagamento - Papa Tango';
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                    </div>
                    <h2 style="color: #CB2921; text-align: center;">Lembrete de Pagamento</h2>
                    <p>Olá ${userName || 'Cliente'},</p>
                    <p>Gostaríamos de lembrá-lo que seu pagamento no valor de <strong>${formatCurrency(valorPagamento)}</strong> está pendente.</p>
                    <p>Para sua comodidade, você pode realizar o pagamento diretamente pelo aplicativo Papa Tango.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="papamotors://financeiro" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Abrir no Aplicativo
                        </a>
                    </div>
                    <p>Caso prefira, você também pode entrar em contato com nosso suporte no WhatsApp (85) 99268-4035 para mais informações.</p>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                        Este é um email automático. Por favor, não responda a este email.
                    </p>
                </div>
            `;

            await enviarEmailPeloFirestore(
                userEmail,
                emailSubject,
                emailBody,
                {
                    amount: valorPagamento,
                    type: 'reminder'
                }
            );

            // Registrar no Firestore que o lembrete foi enviado
            const reminderRef = doc(db, 'paymentReminders', `${userEmail}_${new Date().toISOString().split('T')[0]}`);
            await setDoc(reminderRef, {
                userEmail: userEmail,
                userName: userName,
                paymentAmount: valorPagamento,
                sentAt: serverTimestamp(),
                sentBy: 'admin'
            });

            showMessage('Sucesso', 'Lembrete de pagamento enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar lembrete:', error);
            showMessage('Erro', 'Não foi possível enviar o lembrete de pagamento.');
        }
    };

    // Função para enviar lembrete de pagamento PIX pendente
    const sendPendingPixReminder = async () => {
        try {
            if (pendingPixPayments.length === 0) {
                showMessage('Informação', 'Não há pagamentos PIX pendentes para este usuário.');
                return;
            }

            // Pegar o pagamento PIX pendente mais recente
            const payment = pendingPixPayments[0];

            // Preparar dados para a notificação
            const title = 'Pagamento PIX Pendente';
            const body = `Você tem um pagamento PIX de ${formatCurrency(payment.transaction_amount)} pendente. Clique para concluir.`;
            const data = {
                screen: 'PaymentSuccess',
                paymentId: payment.id
            };

            // Enviar notificação
            await enviarNotificacaoPeloFirestore(
                userEmail,
                payment,
                title,
                body,
                data
            );

            // Enviar email de lembrete
            const emailSubject = 'Lembrete de Pagamento Pendente - Papa Tango';
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                    </div>
                    <h2 style="color: #CB2921; text-align: center;">Pagamento Pendente</h2>
                    <p>Olá ${userName || 'Cliente'},</p>
                    <p>Notamos que você iniciou um pagamento via PIX no valor de <strong>${formatCurrency(payment.transaction_amount)}</strong>, mas ainda não o concluiu.</p>
                    <p>Para sua comodidade, você pode finalizar o pagamento diretamente pelo aplicativo ou utilizando o código PIX abaixo:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Copie o código PIX abaixo:</p>
                        <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px dashed #ccc; font-family: monospace; font-size: 12px;">
                            ${payment.paymentDetails?.point_of_interaction?.transaction_data?.qr_code || 'Código PIX não disponível'}
                        </p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="papamotors://payment/${payment.id}" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Abrir no Aplicativo
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                        Este é um email automático. Por favor, não responda a este email.
                    </p>
                </div>
            `;

            await enviarEmailPeloFirestore(
                userEmail,
                emailSubject,
                emailBody,
                {
                    id: payment.id,
                    amount: payment.transaction_amount,
                    paymentMethod: payment.payment_type_id,
                    qrCode: payment.paymentDetails?.point_of_interaction?.transaction_data?.qr_code
                }
            );

            // Atualizar o documento do pagamento para indicar que uma notificação foi enviada
            const paymentRef = doc(db, 'payments', payment.id);
            await setDoc(paymentRef, {
                notificationSent: true,
                notificationSentAt: serverTimestamp(),
                notificationSentBy: 'admin'
            }, { merge: true });

            showMessage('Sucesso', 'Lembrete de pagamento PIX pendente enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar lembrete de PIX pendente:', error);
            showMessage('Erro', 'Não foi possível enviar o lembrete de pagamento PIX pendente.');
        }
    };

    // Função para registrar pagamento manual
    const registerManualPayment = () => {
        if (!userContract) {
            showMessage('Erro', 'Não foi possível encontrar um contrato ativo para este usuário.');
            return;
        }

        // Abrir o modal de seleção de tipo de pagamento
        setShowPaymentTypeModal(true);
    };

    // Função para registrar pagamento total
    const registrarPagamentoTotal = async (valorPagamento) => {
        try {
            setIsProcessing(true);

            // Adicionar pagamento ao Firestore
            const paymentsRef = collection(db, 'payments');
            const now = new Date();

            const paymentDoc = await addDoc(paymentsRef, {
                userEmail: userEmail,
                userName: userName,
                status: 'approved',
                paymentMethod: 'manual',
                amount: valorPagamento,
                description: `Pagamento ${userContract.tipoRecorrencia}`,
                dateCreated: Timestamp.fromDate(now),
                date_approved: Timestamp.fromDate(now),
                registeredBy: 'admin',
                isPagamentoParcial: false
            });

            // Enviar notificação ao usuário
            const paymentInfo = {
                id: paymentDoc.id,
                transaction_amount: valorPagamento
            };

            const title = 'Pagamento Registrado';
            const body = `Um pagamento de ${formatCurrency(valorPagamento)} foi recebido.`;
            const data = {
                screen: 'Financeiro',
                paymentId: paymentDoc.id
            };

            await enviarNotificacaoPeloFirestore(
                userEmail,
                paymentInfo,
                title,
                body,
                data
            );

            // Enviar email de confirmação
            const emailSubject = 'Confirmação de Pagamento - Papa Tango';
            const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                </div>
                <h2 style="color: #28a745; text-align: center;">Pagamento Confirmado</h2>
                <p>Olá, ${userName || 'Cliente'},</p>
                <p>Um pagamento no valor de <strong>${formatCurrency(valorPagamento)}</strong> foi recebido.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Detalhes do Pagamento:</strong></p>
                    <p>Data: ${formatDate(now)}</p>
                    <p>Valor: ${formatCurrency(valorPagamento)}</p>
                    <p>Método: Manual (registrado pelo administrador)</p>
                    <p>ID: ${paymentDoc.id}</p>
                </div>
                <p>Você pode verificar este pagamento no histórico do seu aplicativo.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://papatangoalugueldemotos.com.br/Financeiro" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Abrir no Aplicativo
                    </a>
                </div>
                <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                    Este é um email automático. Por favor, não responda a este email.
                </p>
            </div>
        `;

            await enviarEmailPeloFirestore(
                userEmail,
                emailSubject,
                emailBody,
                {
                    id: paymentDoc.id,
                    amount: valorPagamento,
                    paymentMethod: 'manual',
                    date: now
                }
            );

            showMessage('Sucesso', 'Pagamento registrado com sucesso!');
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            showMessage('Erro', 'Não foi possível registrar o pagamento.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Função para registrar pagamento parcial
    const registrarPagamentoParcial = async (valorTotal, valorParcial) => {
        try {
            setIsProcessing(true);

            // Adicionar pagamento ao Firestore
            const paymentsRef = collection(db, 'payments');
            const now = new Date();

            // Calcular valor restante
            const valorRestante = valorTotal - valorParcial;

            // Calcular data limite para pagamento restante (3 dias a partir de hoje)
            const dataLimite = new Date(now);
            dataLimite.setDate(dataLimite.getDate() + 3);

            // Calcular multa (2% do valor total)
            const valorMultaPercentual = valorTotal * 0.02;
            const valorMultaDiaria = 10; // R$10 por dia

            const paymentDoc = await addDoc(paymentsRef, {
                userEmail: userEmail,
                userName: userName,
                status: 'approved',
                paymentMethod: 'manual',
                amount: valorParcial,
                description: `Pagamento Parcial ${userContract.tipoRecorrencia === 'mensal' ? 'Mensal' : 'Semanal'}`,
                dateCreated: Timestamp.fromDate(now),
                date_approved: Timestamp.fromDate(now),
                registeredBy: 'admin',
                isPagamentoParcial: true,
                pagamentoParcialInfo: {
                    valorTotal: valorTotal,
                    valorParcial: valorParcial,
                    valorRestante: valorRestante,
                    dataLimite: Timestamp.fromDate(dataLimite),
                    valorMultaPercentual: valorMultaPercentual,
                    valorMultaDiaria: valorMultaDiaria,
                    statusPagamentoRestante: 'pendente'
                }
            });

            // Enviar notificação ao usuário
            const paymentInfo = {
                id: paymentDoc.id,
                transaction_amount: valorParcial
            };

            const title = 'Pagamento Parcial Registrado';
            const body = `Um pagamento parcial de ${formatCurrency(valorParcial)} foi recebido. Restante: ${formatCurrency(valorRestante)} sofrerá multa de 2% sobre o pagamento ${userContract.tipoRecorrencia} + R$10 ao dia de atraso. Você tem até ${formatDate(dataLimite)} para realizar o restante do pagamento.`;
            const data = {
                screen: 'Financeiro',
                paymentId: paymentDoc.id,
                isPagamentoParcial: true
            };

            await enviarNotificacaoPeloFirestore(
                userEmail,
                paymentInfo,
                title,
                body,
                data
            );

            // Enviar email de confirmação para pagamento parcial
            const emailSubject = 'Confirmação de Pagamento Parcial - Papa Tango';
            const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.firebasestorage.app/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
                </div>
                <h2 style="color: #ffc107; text-align: center;">Pagamento Parcial Registrado</h2>
                <p>Olá, ${userName || 'Cliente'},</p>
                <p>Um pagamento parcial no valor de <strong>${formatCurrency(valorParcial)}</strong> foi recebido.</p>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeeba;">
                    <p style="font-weight: bold; color: #856404;">Atenção: Pagamento Parcial</p>
                    <p>Valor total devido: ${formatCurrency(valorTotal)}</p>
                    <p>Valor pago: ${formatCurrency(valorParcial)}</p>
                    <p>Valor restante: ${formatCurrency(valorRestante)}</p>
                    <p>Data limite para pagamento do restante: ${formatDate(dataLimite)}</p>
                    <p style="color: #dc3545;">Após a data de hoje, será aplicada multa de 2% (R$ ${valorMultaPercentual.toFixed(2)}) + R$ 10,00 por dia de atraso.</p>
                </div>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Detalhes do Pagamento Parcial:</strong></p>
                    <p>Data: ${formatDate(now)}</p>
                    <p>Valor Pago: ${formatCurrency(valorParcial)}</p>
                    <p>Método: Manual (registrado pelo administrador)</p>
                    <p>ID: ${paymentDoc.id}</p>
                </div>
                
                <p>Para realizar o pagamento do valor restante, entre em contato com nossa equipe no WhatsApp (85) 99268-4035 ou utilize o aplicativo.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://papatangoalugueldemotos.com.br/Financeiro" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Abrir no Aplicativo
                    </a>
                </div>
                
                <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                    Este é um email automático. Por favor, não responda a este email.
                </p>
            </div>
        `;

            await enviarEmailPeloFirestore(
                userEmail,
                emailSubject,
                emailBody,
                {
                    id: paymentDoc.id,
                    amount: valorParcial,
                    paymentMethod: 'manual',
                    date: now,
                    isPagamentoParcial: true,
                    valorTotal: valorTotal,
                    valorRestante: valorRestante,
                    dataLimite: dataLimite.toISOString()
                }
            );

            showMessage('Sucesso', 'Pagamento parcial registrado com sucesso!');
        } catch (error) {
            console.error('Erro ao registrar pagamento parcial:', error);
            showMessage('Erro', 'Não foi possível registrar o pagamento parcial.');
        }
    };

    // Função para registrar pagamento com atraso
    const registrarPagamentoComAtraso = async (valorRegular, valorComAtraso, motivoAtraso) => {
        try {
            setIsProcessing(true);

            // Calcular o valor da multa adicional
            const valorAdicional = valorComAtraso - valorRegular;

            // Adicionar pagamento ao Firestore
            const paymentsRef = collection(db, 'payments');
            const now = new Date();

            const paymentDoc = await addDoc(paymentsRef, {
                userEmail: userEmail,
                userName: userName,
                status: 'approved',
                paymentMethod: 'manual',
                amount: valorComAtraso,
                description: `Pagamento ${userContract.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'} com Atraso`,
                dateCreated: Timestamp.fromDate(now),
                date_approved: Timestamp.fromDate(now),
                registeredBy: 'admin',
                isPagamentoComAtraso: true,
                pagamentoAtrasoInfo: {
                    valorRegular: valorRegular,
                    valorComAtraso: valorComAtraso,
                    valorAdicional: valorAdicional,
                    motivoAtraso: motivoAtraso || 'Multa por atraso'
                }
            });

            // Enviar notificação ao usuário
            const paymentInfo = {
                id: paymentDoc.id,
                transaction_amount: valorComAtraso
            };

            const title = 'Pagamento com Atraso Registrado';
            const body = `Um pagamento de ${formatCurrency(valorComAtraso)} foi recebido, incluindo ${formatCurrency(valorAdicional)} de multa adicional.`;
            const data = {
                screen: 'Financeiro',
                paymentId: paymentDoc.id
            };

            await enviarNotificacaoPeloFirestore(
                userEmail,
                paymentInfo,
                title,
                body,
                data
            );

            // Enviar email de confirmação para pagamento com atraso
            const emailSubject = 'Confirmação de Recebimento de Pagamento com Atraso - Papa Tango';
            const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://firebasestorage.googleapis.com/v0/b/papamotos-2988e.appspot.com/o/Logo%2FLogo.png?alt=media&token=08eadf37-3a78-4c7e-8777-4ab2e6668b14" alt="Papa Tango Logo" style="width: 70px; margin-bottom: 20px;">
            </div>
            <h2 style="color: #dc3545; text-align: center;">Pagamento com Atraso Registrado</h2>
            <p>Olá, ${userName || 'Cliente'},</p>
            <p>Um pagamento no valor de <strong>${formatCurrency(valorComAtraso)}</strong> foi recebido.</p>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f5c6cb;">
                <p style="font-weight: bold; color: #721c24;">Detalhes do Pagamento com Atraso:</p>
                <p>Valor regular: ${formatCurrency(valorRegular)}</p>
                <p>Valor adicional: ${formatCurrency(valorAdicional)}</p>
                <p>Motivo: ${motivoAtraso || 'Multa por atraso'}</p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Detalhes do Pagamento:</strong></p>
                <p>Data: ${formatDate(now)}</p>
                <p>Valor Total: ${formatCurrency(valorComAtraso)}</p>
                <p>Método: Manual (registrado pelo administrador)</p>
                <p>ID: ${paymentDoc.id}</p>
            </div>
            
            <p>Você pode verificar este pagamento no histórico do seu aplicativo.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://papatangoalugueldemotos.com.br/Financeiro" style="background-color: #CB2921; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Abrir no Aplicativo
                </a>
            </div>
            <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                Este é um email automático. Por favor, não responda a este email.
            </p>
        </div>
    `;

            await enviarEmailPeloFirestore(
                userEmail,
                emailSubject,
                emailBody,
                {
                    id: paymentDoc.id,
                    amount: valorComAtraso,
                    paymentMethod: 'manual',
                    date: now,
                    isPagamentoComAtraso: true,
                    valorRegular: valorRegular,
                    valorAdicional: valorAdicional,
                    motivoAtraso: motivoAtraso
                }
            );

            showMessage('Sucesso', 'Pagamento com atraso registrado com sucesso!');
        } catch (error) {
            console.error('Erro ao registrar pagamento com atraso:', error);
            showMessage('Erro', 'Não foi possível registrar o pagamento com atraso.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Renderizar item da lista
    const renderPaymentItem = ({ item }) => (
        <PaymentCard>
            <StatusBadge style={{ backgroundColor: getStatusColor(item.status), marginTop: 5 }}>
                <StatusText>{formatStatus(item.status)}</StatusText>
            </StatusBadge>
            <PaymentHeader>
                <PaymentTitle>{item.description || 'Pagamento'}</PaymentTitle>
            </PaymentHeader>

            <PaymentAmount>{formatCurrency(item.transaction_amount)}</PaymentAmount>

            <PaymentInfo>
                <PaymentInfoRow>
                    <PaymentInfoLabel>Data de Criação do Pagamento:</PaymentInfoLabel>
                    <PaymentInfoValue>{item.createdAt ? formatDate(item.createdAt) : 'N/A'}</PaymentInfoValue>
                </PaymentInfoRow>
                <Divider style={{ marginTop: -5, marginBottom: 5 }} />

                <PaymentInfoRow>
                    <PaymentInfoLabel>Método:</PaymentInfoLabel>
                    <PaymentInfoValue>{formatPaymentType(item.payment_type_id)}</PaymentInfoValue>
                </PaymentInfoRow>
                <Divider style={{ marginTop: -5, marginBottom: 5 }} />

                {item.status === 'approved' && item.dateApproved && (
                    <>
                        <PaymentInfoRow>
                            <PaymentInfoLabel>Aprovado em:</PaymentInfoLabel>
                            <PaymentInfoValue>{formatDate(item.dateApproved)}</PaymentInfoValue>
                        </PaymentInfoRow>
                        <Divider style={{ marginTop: -5, marginBottom: 5 }} />
                    </>
                )}

                <PaymentInfoRow>
                    <PaymentInfoLabel>ID:</PaymentInfoLabel>
                    <PaymentInfoValue>{item.id}</PaymentInfoValue>
                </PaymentInfoRow>
                <Divider style={{ marginTop: -5, marginBottom: 5 }} />
            </PaymentInfo>


            <PaymentActions>
                <ActionButton
                    onPress={() => viewPaymentDetails(item)}
                    style={{ backgroundColor: '#007bff' }}
                >
                    <Feather name="eye" size={16} color="#FFF" />
                    <ActionButtonText>Ver Detalhes</ActionButtonText>
                </ActionButton>

                {item.status === 'pending' && item.payment_type_id === 'pix' && (
                    <ActionButton
                        onPress={sendPendingPixReminder}
                        style={{ backgroundColor: '#ffc107', marginLeft: 8 }}
                    >
                        <Feather name="bell" size={16} color="#FFF" />
                        <ActionButtonText>Lembrar PIX</ActionButtonText>
                    </ActionButton>
                )}
            </PaymentActions>
        </PaymentCard>
    );

    // Renderizar conteúdo vazio
    const renderEmptyContent = () => (
        <EmptyContainer>
            <Feather name="dollar-sign" size={50} color="#CCC" />
            <EmptyText>Nenhum pagamento encontrado para este usuário.</EmptyText>
        </EmptyContainer>
    );

    return (
        <Container>
            <Header>
                <BackButton onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </BackButton>
                <HeaderTitle>Histórico de Pagamentos</HeaderTitle>
                <View style={{ width: 40 }} />
            </Header>

            <UserInfo>
                <UserName>{userName}</UserName>
                <UserEmail>{userEmail}</UserEmail>

                {userContract && (
                    <View style={{ marginTop: 10 }}>
                        <PaymentInfoRow>
                            <PaymentInfoLabel>Contrato:</PaymentInfoLabel>
                            <PaymentInfoValue>
                                {userContract.dataInicio ? formatDate(userContract.dataInicio) : 'N/A'} - {userContract.dataFim ? formatDate(userContract.dataFim) : 'Atual'}
                            </PaymentInfoValue>
                        </PaymentInfoRow>
                        <Divider style={{ marginTop: -5, marginBottom: 5 }} />

                        <PaymentInfoRow>
                            <PaymentInfoLabel>Recorrência:</PaymentInfoLabel>
                            <PaymentInfoValue>
                                {userContract.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'}
                            </PaymentInfoValue>
                        </PaymentInfoRow>
                        <Divider style={{ marginTop: -5, marginBottom: 5 }} />

                        <PaymentInfoRow>
                            <PaymentInfoLabel>
                                Valor {userContract.tipoRecorrencia === 'semanal' ? 'Semanal' : 'Mensal'}:
                            </PaymentInfoLabel>
                            <PaymentInfoValue>
                                {formatCurrency(userContract.tipoRecorrencia === 'semanal' ? userContract.valorSemanal : userContract.valorMensal)}
                            </PaymentInfoValue>
                        </PaymentInfoRow>
                        <Divider style={{ marginTop: -5, marginBottom: 5 }} />

                        <PaymentInfoRow>
                            <PaymentInfoLabel>Moto:</PaymentInfoLabel>
                            <PaymentInfoValue>{userContract.modeloMoto || 'N/A'} ({userContract.placaMoto || 'N/A'})</PaymentInfoValue>
                        </PaymentInfoRow>
                        <Divider style={{ marginTop: -5, marginBottom: 5 }} />
                    </View>
                )}

                <View style={{ flexDirection: 'row', marginTop: 16 }}>
                    <ActionButton
                        onPress={sendPaymentReminder}
                        style={{ backgroundColor: '#ffc107', flex: 1, marginRight: 8 }}
                    >
                        <Feather name="bell" size={16} color="#FFF" />
                        <ActionButtonText>Enviar Lembrete</ActionButtonText>
                    </ActionButton>

                    <ActionButton
                        onPress={registerManualPayment}
                        style={{ backgroundColor: '#28a745', flex: 1, marginLeft: 8 }}
                    >
                        <Feather name="check-circle" size={16} color="#FFF" />
                        <ActionButtonText>Registrar Pagamento</ActionButtonText>
                    </ActionButton>
                </View>
                {pendingPixPayments.length > 0 && (
                    <View style={{ marginTop: 16, height: 50 }}>
                        <ActionButton
                            onPress={sendPendingPixReminder}
                            style={{ backgroundColor: '#17a2b8', flex: 1 }}
                        >
                            <Feather name="refresh-cw" size={16} color="#FFF" />
                            <ActionButtonText>Lembrar PIX Pendente</ActionButtonText>
                        </ActionButton>
                    </View>
                )}
            </UserInfo>

            {loading ? (
                <LoadingContainer>
                    <ActivityIndicator size="large" color="#CB2921" />
                </LoadingContainer>
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPaymentItem}
                    ListEmptyComponent={renderEmptyContent}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 16,
                        paddingBottom: 20
                    }}
                />
            )}
            {/* Modal para selecionar tipo de pagamento */}
            {showPaymentTypeModal && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <View style={{
                        width: '80%',
                        backgroundColor: 'white',
                        borderRadius: 10,
                        padding: 20,
                        maxWidth: 400
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            marginBottom: 20,
                            textAlign: 'center'
                        }}>
                            Tipo de Pagamento
                        </Text>

                        <Text style={{
                            marginBottom: 20,
                            textAlign: 'center'
                        }}>
                            Selecione o tipo de pagamento para {userName}:
                        </Text>

                        <View style={{
                            marginTop: 10
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#28a745',
                                    padding: 10,
                                    borderRadius: 5,
                                    marginBottom: 10,
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setShowPaymentTypeModal(false);
                                    const valorPagamento = userContract.tipoRecorrencia === 'semanal'
                                        ? userContract.valorSemanal
                                        : userContract.valorMensal;
                                    registrarPagamentoTotal(valorPagamento);
                                }}
                            >
                                <Text style={{ color: 'white' }}>Pagamento Total</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#ffc107',
                                    padding: 10,
                                    borderRadius: 5,
                                    marginBottom: 10,
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setShowPaymentTypeModal(false);
                                    setShowPartialPaymentModal(true);
                                    setPartialPaymentValue('');
                                }}
                            >
                                <Text style={{ color: 'white' }}>Pagamento Parcial</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#dc3545',
                                    padding: 10,
                                    borderRadius: 5,
                                    marginBottom: 10,
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setShowPaymentTypeModal(false);
                                    setShowLatePaymentModal(true);
                                    setLatePaymentValue('');
                                    setLatePaymentReason('');
                                }}
                            >
                                <Text style={{ color: 'white' }}>Pagamento com Atraso</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={{
                                marginTop: 15,
                                alignItems: 'center'
                            }}
                            onPress={() => setShowPaymentTypeModal(false)}
                        >
                            <Text style={{ color: '#6c757d' }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Modal para inserir valor do pagamento parcial */}
            {showPartialPaymentModal && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <View style={{
                        width: '80%',
                        backgroundColor: 'white',
                        borderRadius: 10,
                        padding: 20,
                        maxWidth: 400
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            marginBottom: 20,
                            textAlign: 'center'
                        }}>
                            Pagamento Parcial
                        </Text>

                        <Text style={{
                            marginBottom: 10,
                            textAlign: 'center'
                        }}>
                            Digite o valor do pagamento parcial realizado por {userName}:
                        </Text>

                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: '#ced4da',
                                borderRadius: 5,
                                padding: 10,
                                marginBottom: 20,
                                fontSize: 16
                            }}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={partialPaymentValue}
                            onChangeText={setPartialPaymentValue}
                        />

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 10
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#6c757d',
                                    padding: 10,
                                    borderRadius: 5,
                                    flex: 1,
                                    marginRight: 5,
                                    alignItems: 'center'
                                }}
                                onPress={() => setShowPartialPaymentModal(false)}
                            >
                                <Text style={{ color: 'white' }}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#28a745',
                                    padding: 10,
                                    borderRadius: 5,
                                    flex: 1,
                                    marginLeft: 5,
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setShowPartialPaymentModal(false);

                                    const valorTotal = userContract.tipoRecorrencia === 'semanal'
                                        ? userContract.valorSemanal
                                        : userContract.valorMensal;

                                    const valorParcialFloat = parseFloat(partialPaymentValue.replace(',', '.'));

                                    if (isNaN(valorParcialFloat) || valorParcialFloat <= 0 || valorParcialFloat >= valorTotal) {
                                        showMessage('Erro', 'Valor inválido. O pagamento parcial deve ser maior que zero e menor que o valor total.');
                                        return;
                                    }

                                    registrarPagamentoParcial(valorTotal, valorParcialFloat);
                                }}
                                disabled={isProcessing}
                            >
                                <Text style={{ color: 'white' }}>
                                    {isProcessing ? 'Processando...' : 'Registrar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
            {/* Modal para inserir valor do pagamento com atraso */}
            {showLatePaymentModal && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <View style={{
                        width: '80%',
                        backgroundColor: 'white',
                        borderRadius: 10,
                        padding: 20,
                        maxWidth: 400
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            marginBottom: 20,
                            textAlign: 'center'
                        }}>
                            Pagamento com Atraso
                        </Text>

                        <Text style={{
                            marginBottom: 10,
                            textAlign: 'center'
                        }}>
                            Digite o valor total do pagamento com atraso de {userName}:
                        </Text>

                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: '#ced4da',
                                borderRadius: 5,
                                padding: 10,
                                marginBottom: 15,
                                fontSize: 16
                            }}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={latePaymentValue}
                            onChangeText={setLatePaymentValue}
                        />

                        <Text style={{
                            marginBottom: 10,
                            textAlign: 'left'
                        }}>
                            Motivo do atraso/valor adicional:
                        </Text>

                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: '#ced4da',
                                borderRadius: 5,
                                padding: 10,
                                marginBottom: 20,
                                fontSize: 16,
                                height: 80,
                                textAlignVertical: 'top'
                            }}
                            placeholder="Ex: Multa de R$X por 2 dias de atraso"
                            multiline={true}
                            numberOfLines={3}
                            value={latePaymentReason}
                            onChangeText={setLatePaymentReason}
                        />

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 10
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#6c757d',
                                    padding: 10,
                                    borderRadius: 5,
                                    flex: 1,
                                    marginRight: 5,
                                    alignItems: 'center'
                                }}
                                onPress={() => setShowLatePaymentModal(false)}
                            >
                                <Text style={{ color: 'white' }}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#dc3545',
                                    padding: 10,
                                    borderRadius: 5,
                                    flex: 1,
                                    marginLeft: 5,
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setShowLatePaymentModal(false);

                                    const valorTotal = userContract.tipoRecorrencia === 'semanal'
                                        ? userContract.valorSemanal
                                        : userContract.valorMensal;

                                    const valorComAtrasoFloat = parseFloat(latePaymentValue.replace(',', '.'));

                                    if (isNaN(valorComAtrasoFloat) || valorComAtrasoFloat <= 0) {
                                        showMessage('Erro', 'Valor inválido. O pagamento deve ser maior que zero.');
                                        return;
                                    }

                                    if (valorComAtrasoFloat <= valorTotal) {
                                        showMessage('Erro', 'O valor com atraso deve ser maior que o valor regular.');
                                        return;
                                    }

                                    registrarPagamentoComAtraso(valorTotal, valorComAtrasoFloat, latePaymentReason);
                                }}
                                disabled={isProcessing}
                            >
                                <Text style={{ color: 'white' }}>
                                    {isProcessing ? 'Processando...' : 'Registrar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </Container>
    );
}
