import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { db, auth } from '../../../services/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import NotificationBell from '../../../components/NotificationBell';
import {
    Container,
    StatsContainer,
    StatCard,
    StatTitle, 
    StatNumber,
    LogoutButton,
    LogoutText,
} from './styles';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        notApprovedUsers: 0,
        approvedUsers: 0,
        totalBikes: 0,
        activeContracts: 0,
        totalRentals: 0
    });

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const totalUsers = snapshot.size;
            const approvedUsers = snapshot.docs.filter(doc => doc.data().aprovado === true).length;
            const notApprovedUsers = snapshot.docs.filter(doc => doc.data().aprovado === false).length;
            
            setStats(prev => ({
                ...prev,
                totalUsers,
                approvedUsers,
                notApprovedUsers
            }));
        });

        const unsubscribeBikes = onSnapshot(collection(db, "motos"), (snapshot) => {
            setStats(prev => ({
                ...prev,
                totalBikes: snapshot.size
            }));
        });

        const unsubscribeContracts = onSnapshot(
            query(collection(db, "contratos"), where("statusContrato", "==", true)),
            (snapshot) => {
                setStats(prev => ({
                    ...prev,
                    activeContracts: snapshot.size
                }));
            }
        );

        const unsubscribeRentals = onSnapshot(collection(db, "alugueis"), (snapshot) => {
            setStats(prev => ({
                ...prev,
                totalRentals: snapshot.size
            }));
        });

        return () => {
            unsubscribeUsers();
            unsubscribeBikes();
            unsubscribeContracts();
            unsubscribeRentals();
        };
    }, []);

    // Função para fazer logout
    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    return (
        <Container>
            <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end', marginRight: - 25, marginBottom: 10 }}>
                <NotificationBell userType="admin" />
            </View>
            <StatsContainer>
                <StatCard>
                    <StatTitle>Total de Usuários</StatTitle>
                    <StatNumber>{stats.totalUsers}</StatNumber>
                </StatCard>
                <StatCard>
                    <StatTitle>Usuários Aprovados</StatTitle>
                    <StatNumber>{stats.approvedUsers}</StatNumber>
                </StatCard>
                <StatCard>
                    <StatTitle>Usuários Não Aprovados</StatTitle>
                    <StatNumber>{stats.notApprovedUsers}</StatNumber>
                </StatCard>
                <StatCard>
                    <StatTitle>Total de Motos</StatTitle>
                    <StatNumber>{stats.totalBikes}</StatNumber>
                </StatCard>
                <StatCard>
                    <StatTitle>Contratos Ativos</StatTitle>
                    <StatNumber>{stats.activeContracts}</StatNumber>
                </StatCard>
                <StatCard>
                    <StatTitle>Total de Aluguéis</StatTitle>
                    <StatNumber>{stats.totalRentals}</StatNumber>
                </StatCard>
            </StatsContainer>
            <LogoutButton onPress={handleLogout}>
                <LogoutText>Sair da Conta</LogoutText>
            </LogoutButton>
        </Container>
    );
}