import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Manutencao from '../../pages/Manutencao';
import TrocaOleo from '../../pages/Manutencao/trocaOleo';
import ListaTrocasOleo from '../../pages/Manutencao/ListaTrocasOleo';
import DetalhesTrocaOleo from '../../pages/Manutencao/DetalhesTrocaOleo';

const Stack = createNativeStackNavigator();

export default function ManutencaoStack() {
    return (
        <Stack.Navigator>

            <Stack.Screen 
                name="Manutenção Screen" 
                component={Manutencao}
                options={{ 
                    headerShown: false,
                    title: 'Manutenção',
                }}
            />

            <Stack.Screen 
                name="Lista de Trocas de Óleo" 
                component={ListaTrocasOleo}
                options={{ headerShown: false }}
            />

            <Stack.Screen 
                name="Troca de Óleo" 
                component={TrocaOleo}
                options={{ headerShown: false }}
            />

            <Stack.Screen 
                name="Detalhes da Troca de Óleo" 
                component={DetalhesTrocaOleo}
                options={{ headerShown: false }}
            />

        </Stack.Navigator>
    );
}
