import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { colors } from '../../constants/colors';
import { useLayout } from '../../constants/layout';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();
    const layout = useLayout();

    useEffect(() => {
        clearError();
    }, []);

    const handleLogin = async () => {
        await login(email, password);
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: layout.isWide ? 'center' : 'stretch', padding: layout.padding, backgroundColor: colors.background }}>
            <View style={{ width: layout.contentWidth, maxWidth: '100%' }}>
                <Text style={{ fontSize: layout.fontSize.title, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
                    Welcome back
                </Text>
                <Text style={{ color: colors.textLight, marginBottom: 32, fontSize: layout.fontSize.body }}>
                    Log in to your account
                </Text>

                {error && (
                    <Text style={{ color: colors.error, marginBottom: 16, fontSize: layout.fontSize.body }}>
                        {error}
                    </Text>
                )}

                <TextInput
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        padding: layout.inputPadding,
                        marginBottom: 16,
                        backgroundColor: colors.white,
                        fontSize: layout.fontSize.body,
                    }}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        padding: layout.inputPadding,
                        marginBottom: 24,
                        backgroundColor: colors.white,
                        fontSize: layout.fontSize.body,
                    }}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={{
                        backgroundColor: colors.primary,
                        padding: layout.buttonPadding,
                        borderRadius: 8,
                        alignItems: 'center',
                    }}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: layout.fontSize.body }}>Log in</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                    <Text style={{ color: colors.primary, textAlign: 'center', marginTop: 16, fontSize: layout.fontSize.body }}>
                        Don't have an account? Register
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}