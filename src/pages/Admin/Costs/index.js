import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CostsList from './components/CostsList';
import ClientCostDetails from './components/ClientCostDetails';
import RegisterCost from './components/RegisterCost';

const Stack = createNativeStackNavigator();

export default function Costs() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#CB2921',
                },
                headerTintColor: '#FFF',
            }}
        >
            <Stack.Screen 
                name="CostsList" 
                component={CostsList}
                options={{
                    title: 'Gerenciamento de Custos',
                    headerShown: false,
                }}
            />
            <Stack.Screen 
                name="ClientCostDetails" 
                component={ClientCostDetails}
                options={{
                    title: 'Detalhes de Custos',
                    headerShown: false,
                }}
            />
            <Stack.Screen 
                name="RegisterCost" 
                component={RegisterCost}
                options={{
                    title: 'Registrar Custo',
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
}