import React from 'react';
import { Text, Linking, Alert, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

import Home from '../pages/Home';
import FinanceiroStack from './stacks/FinanceiroStack';
import ManutencaoStack from './stacks/manutencaoStack';

const Tab = createBottomTabNavigator();
const SuporteEmpty = () => null; // Página vazia para o botão de suporte

export default function TabRoutes() {

    // Verifica se o dispositivo é um desktop web
    const isWebDesktop = Platform.OS === 'web' && window.innerWidth >= 768;

    // Função para abrir o WhatsApp após clicar na Tab de atendimento
    const abrirWhatsApp = () => {
        const telefone = '5585992684035';
        const mensagem = 'Olá! Já estou logado no app da Papa Tango e preciso de ajuda :)';
        const urlWhatsapp = `whatsapp://send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;

        Linking.canOpenURL(urlWhatsapp)
            .then(suportado => {
                if (suportado) {
                    return Linking.openURL(urlWhatsapp);
                } else {
                    Alert.alert('WhatsApp não está instalado');
                }
            })
            .catch(erro => {
                console.error('Erro ao abrir WhatsApp:', erro);
                Alert.alert('Não foi possível abrir o WhatsApp');
            });
    };

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 5,
                },
            }}
        >
            <Tab.Screen
                name="Início"
                component={Home}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Ionicons
                            name="home"
                            size={26} 
                            color={focused ? '#CB2921' : '#000'}
                            style={{ marginLeft: isWebDesktop ? 0 : -10 }}
                        />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <Text style={{
                            fontSize: focused ? 14 : 13,
                            fontWeight: focused ? 'bold' : 'normal',
                            color: focused ? '#CB2921' : '#000',
                            marginTop: 2,
                            marginLeft: isWebDesktop ? 0 : -10
                        }}>
                            Início
                        </Text>
                    ),
                }}
            />

            <Tab.Screen
                name="Financeiro"
                component={FinanceiroStack} // FinanceiroStack é a stack criada em ./stacks/financeiroStack.js responsável por navegar entre as telas do Financeiro
                options={{
                    tabBarIcon: ({ focused }) => (
                        <MaterialIcons 
                            name="request-quote"
                            size={26} 
                            color={focused ? '#CB2921' : '#000'} 
                            style={{ marginLeft: isWebDesktop ? 0 : -13 }}
                        />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <Text style={{
                            fontSize: focused ? 14 : 13,
                            fontWeight: focused ? 'bold' : 'normal',
                            color: focused ? '#CB2921' : '#000',
                            marginTop: 2,
                            marginLeft: isWebDesktop ? 0 : -13
                        }}>
                            Financeiro
                        </Text>
                    )
                }}
            />

            <Tab.Screen
                name="Manutenção"
                component={ManutencaoStack} // ManutencaoStack é a stack criada em ./stacks/manutencaoStack.js responsável por navegar entre as telas do Manutenção
                options={{
                    tabBarIcon: ({ focused }) => (
                        <MaterialIcons 
                            name="build"
                            size={26} 
                            color={focused ? '#CB2921' : '#000'} 
                            style={{ marginLeft: isWebDesktop ? 0 : -15 }}
                        />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <Text style={{
                            fontSize: focused ? 14 : 13,
                            fontWeight: focused ? 'bold' : 'normal',
                            color: focused ? '#CB2921' : '#000',
                            marginTop: 2,
                            marginLeft: isWebDesktop ? 1 : -8
                        }}>
                            Manutenção
                        </Text>
                    ),
                    title: 'Manutenção',
                }}
            />

            <Tab.Screen
                name="Atendimento"
                component={SuporteEmpty}
                listeners={{
                    tabPress: (e) => { // função para abrir o WhatsApp
                        e.preventDefault(); // impede que a tela de atendimento seja aberta
                        abrirWhatsApp(); // abre o whatsapp
                    }
                }}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Ionicons 
                            name="logo-whatsapp"
                            size={26} 
                            color={focused ? '#CB2921' : '#000'}
                            style={{ marginLeft: isWebDesktop ? 0 : -10 }}
                        />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <Text style={{
                            fontSize: focused ? 14 : 13,
                            fontWeight: focused ? 'bold' : 'normal',
                            color: focused ? '#CB2921' : '#000',
                            marginTop: 2,
                            marginLeft: isWebDesktop ? 0 : -10
                        }}>
                            Atendimento
                        </Text>
                    )
                }}
            />
        </Tab.Navigator>
    );
}