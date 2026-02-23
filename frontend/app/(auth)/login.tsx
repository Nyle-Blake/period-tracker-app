import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { colors } from '../../constants/colors';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        await login(email, password);
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
                Welcome back
            </Text>
            <Text style={{ color: colors.textLight, marginBottom: 32 }}>
                Log in to your account
            </Text>

            {error && (
                <Text style={{ color: colors.error, marginBottom: 16 }}>
                    {error}
                </Text>
            )}

            <TextInput
                style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    backgroundColor: colors.white,
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
                    padding: 12,
                    marginBottom: 24,
                    backgroundColor: colors.white,
                }}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={{
                    backgroundColor: colors.primary,
                    padding: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                }}
                onPress={handleLogin}
                disabled={isLoading}
            >
                {isLoading
                    ? <ActivityIndicator color={colors.white} />
                    : <Text style={{ color: colors.white, fontWeight: 'bold' }}>Log in</Text>
                }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                <Text style={{ color: colors.primary, textAlign: 'center', marginTop: 16 }}>
                    Don't have an account? Register
                </Text>
            </TouchableOpacity>
        </View>
    );
}