import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import { colors } from '../../constants/colors';

const tabs = [
    { name: 'index', title: 'Home', icon: 'home', iconOutline: 'home-outline' },
    { name: 'calendar', title: 'Calendar', icon: 'calendar', iconOutline: 'calendar-outline' },
    { name: 'log', title: 'Log', icon: 'list', iconOutline: 'list-outline' },
    { name: 'profile', title: 'Profile', icon: 'person', iconOutline: 'person-outline' },
] as const;

export default function TabsLayout() {
    const { width } = useWindowDimensions();
    const isWide = Platform.OS === 'web' && width > 1024;

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
            {tabs.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? tab.icon : tab.iconOutline}
                                size={isWide ? 28 : 24}
                                color={color}
                            />
                        ),
                        tabBarButton: isWide ? (props) => {
                            const focused = (props as any).accessibilityState?.selected;
                            return (
                                <TouchableOpacity
                                    onPress={props.onPress}
                                    style={{
                                        width: 160,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: focused ? colors.primaryLight : colors.background,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 12,
                                        alignSelf: 'center',
                                        borderWidth: focused ? 2 : 1,
                                        borderColor: focused ? colors.primary : colors.border,
                                    }}
                                >
                                    <Ionicons
                                        name={focused ? tab.icon : tab.iconOutline}
                                        size={28}
                                        color={focused ? colors.primary : colors.textLight}
                                    />
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: focused ? '700' : '500',
                                        color: focused ? colors.primary : colors.textLight,
                                        marginTop: 4,
                                    }}>
                                        {tab.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        } : undefined,
                    }}
                />
            ))}
        </Tabs>
    );
}