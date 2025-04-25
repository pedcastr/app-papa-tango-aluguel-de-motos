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
                name="Manutencao" 
                component={Manutencao}
                options={{ headerShown: false }}
            />

            <Stack.Screen 
                name="ListaTrocasOleo" 
                component={ListaTrocasOleo}
                options={{ headerShown: false }}
            />

            <Stack.Screen 
                name="TrocaOleo" 
                component={TrocaOleo}
                options={{ headerShown: false }}
            />

            <Stack.Screen 
                name="DetalhesTrocaOleo" 
                component={DetalhesTrocaOleo}
                options={{ headerShown: false }}
            />

        </Stack.Navigator>
    );
}
