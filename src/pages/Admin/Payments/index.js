import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminPayments from './AdminPayments';
import AdminPaymentDetails from './AdminPaymentDetails';
import AdminUserPayments from './AdminUserPayments';

const Stack = createNativeStackNavigator();

export default function Payments() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="AdminPaymentsScreen"
                component={AdminPayments}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AdminPaymentDetails"
                component={AdminPaymentDetails}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AdminUserPayments"
                component={AdminUserPayments}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
