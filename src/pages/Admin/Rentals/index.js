import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RentalList from './components/RentalList';
import RentalForm from './components/RentalForm';
import RentalEdit from './components/RentalEdit';

const Stack = createNativeStackNavigator();

export default function Rentals() {
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
                name="RentalList" 
                component={RentalList}
                options={{ title: 'Aluguéis' }}
            />
            <Stack.Screen 
                name="RentalForm" 
                component={RentalForm}
                options={{ title: 'Novo Aluguel' }}
            />
            <Stack.Screen 
                name="RentalEdit" 
                component={RentalEdit}
                options={{ title: 'Editar Aluguel' }}
            />
        </Stack.Navigator>
    );
}
