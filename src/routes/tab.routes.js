import React, { useState } from 'react';
import { Text, Linking, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { FeedbackModal } from '../components/FeedbackModal';

import Home from '../pages/Home';
import FinanceiroStack from './stacks/FinanceiroStack';
import ManutencaoStack from './stacks/manutencaoStack';

const Tab = createBottomTabNavigator();
const SuporteEmpty = () => null; // Página vazia para o botão de suporte

export default function TabRoutes() {

    // Estado para controlar a visibilidade do modal de feedback
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', title: '', message: '' })

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
                    setFeedback({
                        type: 'error',
                        title: 'WhatsApp não está instalado',
                        message: 'Não foi possível abrir o WhatsApp\nSe o problema persistir, entre em contato por WhatsApp com o suporte no número (85) 99268-4035 ou envie um e-mail para papatangoalugueldemotos@gmail.com'
                    });
                    setFeedbackVisible(true);
                }
            })
            .catch(erro => {
                console.error('Erro ao abrir WhatsApp:', erro);
                setFeedback({
                    type: 'error',
                    title: 'Erro ao abrir o WhatsApp',
                    message: 'Não foi possível abrir o WhatsApp\nSe o problema persistir, entre em contato por WhatsApp com o suporte no número (85) 99268-4035 ou envie um e-mail para papatangoalugueldemotos@gmail.com'
                });
                setFeedbackVisible(true);
            });
    };

    return (
        <>
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

            {feedbackVisible && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}
                >
                    <FeedbackModal
                        visible={feedbackVisible}
                        {...feedback}
                        onClose={() => setFeedbackVisible(false)}
                    />
                </View>
            )}

        </>
    );
}