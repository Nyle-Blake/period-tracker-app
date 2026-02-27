import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { colors } from '../../constants/colors';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register, isLoading, error, clearError } = useAuthStore();

    useEffect(() => {
        clearError();
    }, []);

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        await register(username, email, password);
        const { error } = useAuthStore.getState();
        if (!error) {
            router.replace('/(auth)/login');
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background }}
        >
            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
                Create account
            </Text>
            <Text style={{ color: colors.textLight, marginBottom: 32 }}>
                Start tracking your cycle
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
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

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
                    marginBottom: 16,
                    backgroundColor: colors.white,
                }}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={{
                    backgroundColor: colors.primary,
                    padding: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 16,
                }}
                onPress={handleRegister}
                disabled={isLoading}
            >
                {isLoading
                    ? <ActivityIndicator color={colors.white} />
                    : <Text style={{ color: colors.white, fontWeight: 'bold' }}>Create account</Text>
                }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={{ color: colors.primary, textAlign: 'center' }}>
                    Already have an account? Log in
                </Text>
            </TouchableOpacity>

        </ScrollView>
    );
}