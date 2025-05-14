import React, { useState, useEffect } from 'react';
import { Modal, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

import {
  NotificationButton,
  NotificationBadge,
  NotificationBadgeText,
  NotificationModal,
  NotificationHeader,
  NotificationTitle,
  CloseButton,
  NotificationList,
  NotificationItem,
  NotificationItemTitle,
  NotificationItemBody,
  NotificationItemDate,
  EmptyNotificationContainer,
  EmptyNotificationText,
  LoadingContainer
} from './styles';

const NotificationBell = ({ userType = 'client', color = 'rgb(43, 42, 42)' }) => {
  const navigation = useNavigation();

  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Carregar notificações ao montar o componente
  useEffect(() => {
    carregarNotificacoes();
  }, [userType]);

  // Função para carregar notificações do usuário
  const carregarNotificacoes = async () => {
    try {
      setLoadingNotifications(true);
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // Buscar notificações do usuário no Firestore
      const notificationsRef = collection(db, 'notifications');

      // Query diferente dependendo do tipo de usuário
      let q;

      if (userType === 'admin') {
        // Para administradores, buscar notificações marcadas como admin
        q = query(
          notificationsRef,
          where('userType', '==', 'admin')
        );
      } else {
        // Para clientes, buscar notificações específicas do usuário
        q = query(
          notificationsRef,
          where('userId', '==', currentUser.email)
        );
      }

      const querySnapshot = await getDocs(q);

      // Usar um Map para evitar duplicatas, usando título+corpo como chave
      const uniqueNotifications = new Map();
      let naoLidas = 0;

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        const notificacao = {
          id: doc.id,
          ...docData,
          // Garantir que o campo data esteja disponível
          data: docData.data || {},
          // Converter timestamp para Date se existir
          createdAt: docData.createdAt?.toDate() || new Date()
        };

        // Criar uma chave única baseada no título e corpo
        const key = `${notificacao.title}_${notificacao.body}`;

        // Se já temos uma notificação com este título e corpo, verificar qual é mais recente
        if (!uniqueNotifications.has(key) ||
          notificacao.createdAt > uniqueNotifications.get(key).createdAt) {
          uniqueNotifications.set(key, notificacao);

          // Atualizar contagem de não lidas apenas se esta for a notificação que vamos manter
          if (!notificacao.read) {
            naoLidas++;
          }
        }
      });

      // Converter o Map para array e ordenar
      const notificacoesArray = Array.from(uniqueNotifications.values());
      notificacoesArray.sort((a, b) => b.createdAt - a.createdAt);

      setNotifications(notificacoesArray);
      setUnreadCount(naoLidas);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Função para marcar notificação como lida
  const marcarComoLida = async (notificationId) => {
    try {
      // Atualizar no Firestore
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });

      // Atualizar estado local
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );

      // Atualizar contador de não lidas
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Função para formatar data da notificação
  const formatarDataNotificacao = (data) => {
    if (!data) return '';

    const agora = new Date();
    const diff = agora - data;

    // Menos de 24 horas
    if (diff < 24 * 60 * 60 * 1000) {
      const horas = Math.floor(diff / (60 * 60 * 1000));

      if (horas < 1) {
        const minutos = Math.floor(diff / (60 * 1000));
        return minutos <= 1 ? 'Agora mesmo' : `${minutos} minutos atrás`;
      }

      return horas === 1 ? '1 hora atrás' : `${horas} horas atrás`;
    }

    // Menos de 7 dias
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const dias = Math.floor(diff / (24 * 60 * 60 * 1000));
      return dias === 1 ? 'Ontem' : `${dias} dias atrás`;
    }

    // Mais de 7 dias
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Renderizar item da lista de notificações
  const renderNotificationItem = ({ item }) => (
    <NotificationItem
      read={item.read}
      onPress={() => {

        if (!item.read) {
          marcarComoLida(item.id);
        }

        // Se a notificação tiver dados de navegação
        if (item.data && item.data.screen) {

          // Verificar se a tela é PaymentSuccess
          if (item.data.screen === "PaymentSuccess" && item.data.paymentId) {
            // Buscar os dados do pagamento primeiro
            const fetchPaymentData = async () => {
              try {
                const paymentDoc = await getDoc(doc(db, "payments", item.data.paymentId));
                if (paymentDoc.exists()) {
                  const paymentInfo = paymentDoc.data();
                  // Navegar com os dados completos do pagamento
                  // Usar o caminho completo para a navegação aninhada
                  navigation.navigate("Financeiro", {
                    screen: "Detalhes do Pagamento",
                    params: { paymentInfo }
                  });
                } else {
                  // Se o pagamento não existir, apenas navegar para Financeiro
                  navigation.navigate("Financeiro");
                }
              } catch (error) {
                console.error("Erro ao buscar dados do pagamento:", error);
                // Navegar para Financeiro em caso de erro
                navigation.navigate("Financeiro");
              }
            };

            fetchPaymentData();
          } else {
            // Para outras telas, tentar navegação baseada na estrutura
            try {
              // Determinar a navegação com base na tela de destino
              switch (item.data.screen) {
                case "Financeiro Screen":
                case "Pagamento":
                case "Detalhes do Pagamento":
                  // Telas dentro do FinanceiroStack
                  navigation.navigate("Financeiro", {
                    screen: item.data.screen,
                    params: item.data
                  });
                  break;

                case "Início":
                  navigation.navigate("Início", {
                    screen: item.data.screen,
                    params: item.data
                  });
                  break;

                case "Manutenção Screen":
                case "Lista de Trocas de Óleo":
                case "Troca de Óleo":
                case "Detalhes da Troca de Óleo":
                  // Telas dentro do ManutencaoStack
                  navigation.navigate("Manutenção", {
                    screen: item.data.screen,
                    params: item.data
                  });
                  break;

                default:
                  // Tentar navegação direta para outras telas
                  navigation.navigate(item.data.screen, item.data);
              }
            } catch (error) {
              console.error("Erro na navegação:", error);
              // Se falhar, tentar navegar para a tela principal
              navigation.navigate("Início");
            }
          }

          // Fechar o modal após clicar na notificação
          setNotificationModalVisible(false);
        }
      }}
    >
      <NotificationItemTitle>{item.title}</NotificationItemTitle>
      <NotificationItemBody>{item.body}</NotificationItemBody>
      <NotificationItemDate>{formatarDataNotificacao(item.createdAt)}</NotificationItemDate>
    </NotificationItem>
  );

  // Renderizar conteúdo vazio quando não há notificações
  const renderEmptyNotifications = () => (
    <EmptyNotificationContainer>
      <Feather name="bell-off" size={50} color="#CCC" />
      <EmptyNotificationText>Você não tem notificações</EmptyNotificationText>
    </EmptyNotificationContainer>
  );

  return (
    <>
      <NotificationButton onPress={() => {
        setNotificationModalVisible(true);
        // Recarregar notificações ao abrir o modal
        carregarNotificacoes();

      }}>
        <Feather name="bell" size={24} color={color} />
        {unreadCount > 0 && (
          <NotificationBadge>
            <NotificationBadgeText>
              {unreadCount > 99 ? '99+' : unreadCount}
            </NotificationBadgeText>
          </NotificationBadge>
        )}
      </NotificationButton>

      {/* Modal de Notificações */}
      <Modal
        visible={notificationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <NotificationModal>
          <NotificationHeader>
            <NotificationTitle>Notificações</NotificationTitle>
            <CloseButton onPress={() => setNotificationModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </CloseButton>
          </NotificationHeader>

          {loadingNotifications ? (
            <LoadingContainer>
              <ActivityIndicator size="large" color="#CB2921" />
            </LoadingContainer>
          ) : (
            <NotificationList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotificationItem}
              ListEmptyComponent={renderEmptyNotifications}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          )}
        </NotificationModal>
      </Modal>
    </>
  );
};

export default NotificationBell;
