import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BikeList from './components/BikeList';
import BikeForm from './components/BikeForm';
import BikeEdit from './components/BikeEdit';

const Stack = createNativeStackNavigator();

export default function Vehicles() {
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
                name="BikeList" 
                component={BikeList}
                options={{ title: 'Motos' }}
            />
            <Stack.Screen 
                name="BikeForm" 
                component={BikeForm}
                options={{ title: 'Nova Moto' }}
            />
            <Stack.Screen 
                name="BikeEdit" 
                component={BikeEdit}
                options={{ title: 'Editar Moto' }}
            />
        </Stack.Navigator>
    );
}
