import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Dashboard from '../pages/Admin/Dashboard';
import Users from '../pages/Admin/Users';
import Vehicles from '../pages/Admin/Vehicles';
import Contracts from '../pages/Admin/Contracts';
import Rentals from '../pages/Admin/Rentals';
import Payments from '../pages/Admin/Payments';

const Tab = createBottomTabNavigator();

export default function AdminRoutes() {
  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ddd',
        },
        tabBarActiveTintColor: '#CB2921',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Usuários" 
        component={Users}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="people" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Motos" 
        component={Vehicles}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="two-wheeler" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Contratos" 
        component={Contracts}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="description" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Aluguéis" 
        component={Rentals}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="assignment" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Pagamentos" 
        component={Payments}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="payments" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}