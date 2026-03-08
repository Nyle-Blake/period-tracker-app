import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { colors } from '../../constants/colors';

const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: colors.white,
};

const toYMD = (date: Date) => date.toISOString().split('T')[0];

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [cycleLength, setCycleLength] = useState('28');
    const [periodLength, setPeriodLength] = useState('5');
    const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { register, isLoading, error, clearError } = useAuthStore();

    useEffect(() => {
        clearError();
    }, []);

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        if (!lastPeriodStart) {
            alert('Please select when your last period started');
            return;
        }
        await register({
            username,
            email,
            password,
            cycle_length: parseInt(cycleLength) || 28,
            period_length: parseInt(periodLength) || 5,
            last_period_start: toYMD(lastPeriodStart),
        });
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
                <View style={{ backgroundColor: '#fff0f0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <Text style={{ color: colors.error }}>{error}</Text>
                </View>
            )}

            <TextInput
                style={inputStyle}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <TextInput
                style={inputStyle}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={inputStyle}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TextInput
                style={inputStyle}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Cycle length (days)
            </Text>
            <TextInput
                style={inputStyle}
                value={cycleLength}
                onChangeText={setCycleLength}
                keyboardType="numeric"
                placeholder="e.g. 28"
            />

            <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Period length (days)
            </Text>
            <TextInput
                style={inputStyle}
                value={periodLength}
                onChangeText={setPeriodLength}
                keyboardType="numeric"
                placeholder="e.g. 5"
            />

            <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                When did your last period start?
            </Text>
            <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={inputStyle}
            >
                <Text style={{ color: lastPeriodStart ? colors.text : colors.textLight }}>
                    {lastPeriodStart ? toYMD(lastPeriodStart) : 'Select date'}
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={lastPeriodStart ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (date) setLastPeriodStart(date);
                    }}
                />
            )}

            <TouchableOpacity
                style={{
                    backgroundColor: colors.primary,
                    padding: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 16,
                    marginTop: 8,
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