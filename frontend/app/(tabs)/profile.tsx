import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { getProfile, updateProfile, UserProfile } from '../../services/profile';
import useAuthStore from '../../store/authStore';
import usePetStore from '../../store/petStore';
import { colors } from '../../constants/colors';
import { useLayout } from '../../constants/layout';
import { CornerFlowers } from '../../components/Flowers';
import { PET_OPTIONS, Pet } from '../../components/Pet';

export default function ProfileScreen() {
    const { logout } = useAuthStore();
    const { setPet: setGlobalPet } = usePetStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [username, setUsername] = useState('');
    const [selectedPet, setSelectedPet] = useState<string | null>(null);
    const [cycleLength, setCycleLength] = useState('');
    const [periodLength, setPeriodLength] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const layout = useLayout();

    const inputStyle = {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: layout.inputPadding,
        marginBottom: 16,
        backgroundColor: colors.white,
        color: colors.text,
        fontSize: layout.fontSize.body,
    };

    const fetchProfile = useCallback(async () => {
        try {
            const data = await getProfile();
            setProfile(data);
            setUsername(data.username);
            setCycleLength(data.cycle_length?.toString() ?? '');
            setPeriodLength(data.period_length?.toString() ?? '');
            setSelectedPet(data.pet ?? null);
            setGlobalPet(data.pet ?? null);
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
                pet: selectedPet,
            });
            setGlobalPet(selectedPet);
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
        <View style={{ flex: 1, backgroundColor: colors.background }}>
        <CornerFlowers />
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: layout.padding, alignItems: layout.isWide ? 'center' : 'stretch' }}
        >
            <View style={{ width: layout.contentWidth, maxWidth: '100%' }}>
                <Text style={{ fontSize: layout.fontSize.title, fontWeight: 'bold', marginBottom: 4, color: colors.text }}>
                    Profile
                </Text>
                <Text style={{ color: colors.textLight, marginBottom: 32, fontSize: layout.fontSize.body }}>
                    {profile?.email}
                </Text>

                {error && (
                    <View style={{ backgroundColor: colors.errorBg, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                        <Text style={{ color: colors.error, fontSize: layout.fontSize.body }}>{error}</Text>
                    </View>
                )}
                {success && (
                    <View style={{ backgroundColor: colors.successBg, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                        <Text style={{ color: colors.success, fontSize: layout.fontSize.body }}>Changes saved</Text>
                    </View>
                )}

                <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Username
                </Text>
                <TextInput style={inputStyle} value={username} onChangeText={setUsername} autoCapitalize="none" />

                <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1 }}>
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

                <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1 }}>
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

                <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Pet companion
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {PET_OPTIONS.map(({ emoji, label }) => (
                        <TouchableOpacity
                            key={emoji}
                            onPress={() => setSelectedPet(selectedPet === emoji ? null : emoji)}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: selectedPet === emoji ? colors.primaryLight : colors.white,
                                borderWidth: selectedPet === emoji ? 2 : 1,
                                borderColor: selectedPet === emoji ? colors.primary : colors.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 28 }}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {selectedPet && (
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                        <Pet emoji={selectedPet} size={48} />
                        <Text style={{ color: colors.textLight, fontSize: layout.fontSize.small, marginTop: 4 }}>
                            {PET_OPTIONS.find(p => p.emoji === selectedPet)?.label}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={{
                        backgroundColor: colors.primary,
                        padding: layout.buttonPadding,
                        borderRadius: 8,
                        alignItems: 'center',
                        marginBottom: 16,
                    }}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: layout.fontSize.body }}>Save changes</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: layout.buttonPadding,
                        borderRadius: 8,
                        alignItems: 'center',
                    }}
                    onPress={logout}
                >
                    <Text style={{ color: colors.textLight, fontWeight: 'bold', fontSize: layout.fontSize.body }}>Log out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
        </View>
    );
}