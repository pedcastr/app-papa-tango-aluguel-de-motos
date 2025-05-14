import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Financeiro from '../../pages/Financeiro';
import Payment from '../../pages/Payment';
import PaymentSuccess from '../../pages/PaymentSuccess';

const Stack = createNativeStackNavigator();

export default function FinanceiroStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Financeiro Screen"
                component={Financeiro}
                options={{ 
                    headerShown: false,
                    title: 'Financeiro',
                }}
            />
            <Stack.Screen
                name="Pagamento"
                component={Payment}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Detalhes do Pagamento"
                component={PaymentSuccess}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}