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
                name="FinanceiroScreen"
                component={Financeiro}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Payment"
                component={Payment}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PaymentSuccess"
                component={PaymentSuccess}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}