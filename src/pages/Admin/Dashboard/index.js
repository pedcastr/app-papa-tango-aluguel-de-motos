import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from './components/Panel';
import BulkMessages from './components/BulkMessages';
import Costs from '../Costs';

const Stack = createNativeStackNavigator();

export default function Dashboard() {
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
                name="DashboardScreen" 
                component={DashboardScreen}
                options={{
                    title: 'Dashboard',
                    headerShown: false,
                }}
            />
            <Stack.Screen 
                name="BulkMessages" 
                component={BulkMessages}
                options={{ title: 'Enviar Mensagens em Massa' }}
            />
            <Stack.Screen 
                name="Costs" 
                component={Costs}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
}