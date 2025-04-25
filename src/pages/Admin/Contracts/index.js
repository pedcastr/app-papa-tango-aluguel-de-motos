import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ContractList from './components/ContractList';
import ContractForm from './components/ContractForm';
import ContractEdit from './components/ContractEdit';

const Stack = createNativeStackNavigator();

export default function Contracts() {
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
                name="ContractList" 
                component={ContractList}
                options={{ title: 'Contratos' }}
            />
            <Stack.Screen 
                name="ContractForm" 
                component={ContractForm}
                options={{ title: 'Novo Contrato' }}
            />
            <Stack.Screen 
                name="ContractEdit" 
                component={ContractEdit}
                options={{ title: 'Editar Contrato' }}
            />
        </Stack.Navigator>
    );
}
