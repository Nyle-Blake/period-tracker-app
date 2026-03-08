import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { getProfile, updateProfile, UserProfile } from '../../services/profile';
import useAuthStore from '../../store/authStore';
import { colors } from '../../constants/colors';

const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: colors.white,
    color: colors.text,
};

export default function ProfileScreen() {
    const { logout } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [username, setUsername] = useState('');
    const [cycleLength, setCycleLength] = useState('');
    const [periodLength, setPeriodLength] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const data = await getProfile();
            setProfile(data);
            setUsername(data.username);
            setCycleLength(data.cycle_length?.toString() ?? '');
            setPeriodLength(data.period_length?.toString() ?? '');
        } catch {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setError(null);
        setSuccess(false);

        if (!username.trim()) {
            setError('Username is required');
            return;
        }
        const cl = cycleLength ? parseInt(cycleLength) : null;
        if (cl !== null && (cl < 15 || cl > 60)) {
            setError('Cycle length must be between 15 and 60 days');
            return;
        }
        const pl = periodLength ? parseInt(periodLength) : null;
        if (pl !== null && (pl < 1 || pl > 15)) {
            setError('Period length must be between 1 and 15 days');
            return;
        }
        if (cl !== null && pl !== null && pl >= cl) {
            setError('Period length must be shorter than cycle length');
            return;
        }

        setSaving(true);
        try {
            await updateProfile({
                username: username.trim(),
                cycle_length: cl,
                period_length: pl,
            });
            setSuccess(true);
        } catch {
            setError('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 4, color: colors.text }}>
                Profile
            </Text>
            <Text style={{ color: colors.textLight, marginBottom: 32 }}>
                {profile?.email}
            </Text>

            {error && (
                <View style={{ backgroundColor: '#fff0f0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <Text style={{ color: colors.error }}>{error}</Text>
                </View>
            )}
            {success && (
                <View style={{ backgroundColor: '#edfff4', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <Text style={{ color: colors.success }}>Changes saved</Text>
                </View>
            )}

            <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Username
            </Text>
            <TextInput
                style={inputStyle}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Cycle Length (days)
            </Text>
            <TextInput
                style={inputStyle}
                value={cycleLength}
                onChangeText={(v) => setCycleLength(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="e.g. 28"
                placeholderTextColor={colors.textLight}
            />

            <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Period Length (days)
            </Text>
            <TextInput
                style={inputStyle}
                value={periodLength}
                onChangeText={(v) => setPeriodLength(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="e.g. 5"
                placeholderTextColor={colors.textLight}
            />

            <TouchableOpacity
                style={{
                    backgroundColor: colors.primary,
                    padding: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 16,
                }}
                onPress={handleSave}
                disabled={saving}
            >
                {saving
                    ? <ActivityIndicator color={colors.white} />
                    : <Text style={{ color: colors.white, fontWeight: 'bold' }}>Save changes</Text>
                }
            </TouchableOpacity>

            <TouchableOpacity
                style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                }}
                onPress={logout}
            >
                <Text style={{ color: colors.textLight, fontWeight: 'bold' }}>Log out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}