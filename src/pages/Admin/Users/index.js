import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import UserEdit from './components/UserEdit';
import UserDetails from './components/UserDetails';
import UserTrocaOleo from './components/UserTrocasOleo';
import TrocaOleo from './components/UserTrocasOleo/trocaOleo';
import DetalhesTrocaOleo from './components/UserTrocasOleo/DetalhesTrocaOleo';

const Stack = createNativeStackNavigator();

export default function Users() {
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
                name="UserList" 
                component={UserList}
                options={{ title: 'Usuários' }}
            />
            <Stack.Screen 
                name="UserForm" 
                component={UserForm}
                options={{ title: 'Novo Usuário' }}
            />
            <Stack.Screen 
                name="UserEdit" 
                component={UserEdit}
                options={{ title: 'Editar Usuário' }}
            />
            <Stack.Screen 
                name="UserDetails" 
                component={UserDetails}
                options={{ title: 'Informações do Usuário' }}
            />
            <Stack.Screen 
                name="UserTrocaOleo" 
                component={UserTrocaOleo}
                options={{ title: 'Última(s) Trocas' }}
            />
            <Stack.Screen 
                name="TrocaOleo" 
                component={TrocaOleo}
                options={{ 
                    title: 'Nova Troca de Óleo',
                }}
            />
            <Stack.Screen 
                name="DetalhesTrocaOleo" 
                component={DetalhesTrocaOleo}
                options={{ 
                    title: 'Detalhes da Troca de Óleo',
                }}
            />
        </Stack.Navigator>
    );
}
