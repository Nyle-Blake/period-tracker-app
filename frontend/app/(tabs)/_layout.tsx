import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, useWindowDimensions } from 'react-native';
import { colors } from '../../constants/colors';

export default function TabsLayout() {
    const { width } = useWindowDimensions();
    const isWide = Platform.OS === 'web' && width > 600;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarPosition: isWide ? 'left' : 'bottom',
                tabBarStyle: isWide ? {
                    width: 200,
                    backgroundColor: colors.white,
                    borderRightWidth: 1,
                    borderRightColor: colors.border,
                    paddingTop: 40,
                } : {
                    backgroundColor: colors.white,
                    borderTopColor: colors.border,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textLight,
                tabBarLabelStyle: isWide ? {
                    fontSize: 14,
                    fontWeight: '600',
                } : undefined,
            }}
        >
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
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
                    ),
                }} />
        </Tabs>
    );
}