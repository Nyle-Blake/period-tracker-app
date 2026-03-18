import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { colors } from '../../constants/colors';
import { useLayout } from '../../constants/layout';

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const toYMD = (date: Date) => date.toISOString().split('T')[0];

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [cycleLength, setCycleLength] = useState('28');
    const [periodLength, setPeriodLength] = useState('5');
    const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null);
    const [dateText, setDateText] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { register, isLoading, error, clearError } = useAuthStore();
    const layout = useLayout();

    const inputStyle = {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: layout.inputPadding,
        marginBottom: 16,
        backgroundColor: colors.white,
        fontSize: layout.fontSize.body,
    };

    useEffect(() => {
        clearError();
    }, []);

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        const cl = parseInt(cycleLength);
        if (!cl || cl < 15 || cl > 60) {
            alert('Cycle length must be between 15 and 60 days');
            return;
        }
        const pl = parseInt(periodLength);
        if (!pl || pl < 1 || pl > 15) {
            alert('Period length must be between 1 and 15 days');
            return;
        }
        if (pl >= cl) {
            alert('Period length must be shorter than cycle length');
            return;
        }
        if (!lastPeriodStart) {
            alert('Please select when your last period started');
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(lastPeriodStart);
        selected.setHours(0, 0, 0, 0);
        if (selected > today) {
            alert('Last period start date cannot be in the future');
            return;
        }
        await register({
            username,
            email,
            password,
            cycle_length: cl,
            period_length: pl,
            last_period_start: toYMD(lastPeriodStart),
        });
        const { error } = useAuthStore.getState();
        if (!error) {
            router.replace('/(auth)/login');
        }
    };

    const renderDatePicker = () => {
        if (Platform.OS === 'web') {
            return (
                <TextInput
                    style={inputStyle}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textLight}
                    value={dateText}
                    onChangeText={(v) => {
                        const cleaned = v.replace(/[^0-9-]/g, '');
                        setDateText(cleaned);
                        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
                            const parsed = new Date(cleaned + 'T00:00:00');
                            if (!isNaN(parsed.getTime())) {
                                setLastPeriodStart(parsed);
                            }
                        } else {
                            setLastPeriodStart(null);
                        }
                    }}
                />
            );
        }

        return (
            <>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={inputStyle}
                >
                    <Text style={{ color: lastPeriodStart ? colors.text : colors.textLight }}>
                        {lastPeriodStart ? toYMD(lastPeriodStart) : 'Select date'}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && DateTimePicker && (
                    <DateTimePicker
                        value={lastPeriodStart ?? new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()}
                        onChange={(_event: any, date?: Date) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (date) setLastPeriodStart(date);
                        }}
                    />
                )}
            </>
        );
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: layout.isWide ? 'center' : 'stretch', padding: layout.padding, backgroundColor: colors.background }}
        >
            <View style={{ width: layout.contentWidth, maxWidth: '100%' }}>
                <Text style={{ fontSize: layout.fontSize.title, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
                    Create account
                </Text>
                <Text style={{ color: colors.textLight, marginBottom: 32, fontSize: layout.fontSize.body }}>
                    Start tracking your cycle
                </Text>

                {error && (
                    <View style={{ backgroundColor: colors.errorBg, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                        <Text style={{ color: colors.error, fontSize: layout.fontSize.body }}>{error}</Text>
                    </View>
                )}

                <TextInput style={inputStyle} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                <TextInput style={inputStyle} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={inputStyle} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
                <TextInput style={inputStyle} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Cycle length (days)
                </Text>
                <TextInput style={inputStyle} value={cycleLength} onChangeText={(v) => setCycleLength(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="e.g. 28" />

                <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Period length (days)
                </Text>
                <TextInput style={inputStyle} value={periodLength} onChangeText={(v) => setPeriodLength(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="e.g. 5" />

                <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1 }}>
                    When did your last period start?
                </Text>
                {renderDatePicker()}

                <TouchableOpacity
                    style={{
                        backgroundColor: colors.primary,
                        padding: layout.buttonPadding,
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
                        : <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: layout.fontSize.body }}>Create account</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                    <Text style={{ color: colors.primary, textAlign: 'center', fontSize: layout.fontSize.body }}>
                        Already have an account? Log in
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}