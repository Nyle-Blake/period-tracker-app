import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import useAuthStore from '../../store/authStore';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        await login(email, password);
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
                Welcome back
            </Text>
            <Text style={{ color: 'gray', marginBottom: 32 }}>
                Log in to your account
            </Text>

            {error && (
                <Text style={{ color: 'red', marginBottom: 16 }}>
                    {error}
                </Text>
            )}

            <TextInput
                style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
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
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 24,
                }}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={{
                    backgroundColor: '#e85d8a',
                    padding: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                }}
                onPress={handleLogin}
                disabled={isLoading}
            >
                {isLoading
                    ? <ActivityIndicator color="white" />
                    : <Text style={{ color: 'white', fontWeight: 'bold' }}>Log in</Text>
                }
            </TouchableOpacity>
        </View>
    );
}