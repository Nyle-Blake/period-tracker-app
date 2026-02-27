import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen
                name="index" 
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                    ),
                }} />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'Calendar',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
                    ),
                }} />
            <Tabs.Screen
                name="log" 
                options={{
                    title: 'Log', 
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "list" : "list-outline"} size={24} color={color} />
                    ),
                }} />
            <Tabs.Screen
                name="profile"
                options={{ title: 'Profile', tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
                    ),
                }} />
        </Tabs>
    );
}