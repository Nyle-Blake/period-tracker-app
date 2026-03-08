import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, ScrollView } from 'react-native';
import { getSymptoms, getSymptomEntries, createSymptomEntry, deleteSymptomEntry, Symptom, SymptomEntry } from '../../services/symptoms';
import { colors } from '../../constants/colors';

const SEVERITY_LABELS: Record<number, string> = { 1: 'Mild', 2: 'Moderate', 3: 'Severe' };
const SEVERITY_COLORS: Record<number, string> = { 1: '#44bb77', 2: '#f0a500', 3: '#ff4444' };

export default function LogScreen() {
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);
    const [entries, setEntries] = useState<SymptomEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedSymptom, setSelectedSymptom] = useState<number | null>(null);
    const [selectedSeverity, setSelectedSeverity] = useState<number>(1);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [symptomsData, entriesData] = await Promise.all([getSymptoms(), getSymptomEntries()]);
            setSymptoms(symptomsData);
            setEntries(entriesData);
        } catch {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async () => {
        if (!selectedSymptom) return;
        setSaving(true);
        setError(null);
        try {
            const today = new Date().toISOString().split('T')[0];
            const newEntry = await createSymptomEntry({
                symptom: selectedSymptom,
                date: today,
                severity: selectedSeverity,
            });
            setEntries((prev) => [newEntry, ...prev]);
            setSelectedSymptom(null);
        } catch {
            setError('Failed to log symptom. You may have already logged this symptom today.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteSymptomEntry(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
        } catch {
            setError('Failed to delete entry');
        }
    };

    const sections = useMemo(() => {
        const grouped: Record<string, SymptomEntry[]> = {};
        for (const entry of entries) {
            if (!grouped[entry.date]) grouped[entry.date] = [];
            grouped[entry.date].push(entry);
        }
        return Object.keys(grouped)
            .sort((a, b) => b.localeCompare(a))
            .map((date) => ({ title: date, data: grouped[date] }));
    }, [entries]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                ListHeaderComponent={
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: colors.text }}>
                            Symptoms
                        </Text>

                        {error && (
                            <View style={{ backgroundColor: '#fff0f0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                <Text style={{ color: colors.error }}>{error}</Text>
                            </View>
                        )}

                        <Text style={{ color: colors.textLight, marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Log a symptom for today
                        </Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                            {symptoms.map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    onPress={() => setSelectedSymptom(s.id)}
                                    style={{
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        marginRight: 8,
                                        backgroundColor: selectedSymptom === s.id ? colors.primary : colors.white,
                                        borderWidth: 1,
                                        borderColor: selectedSymptom === s.id ? colors.primary : colors.border,
                                    }}
                                >
                                    <Text style={{ color: selectedSymptom === s.id ? colors.white : colors.text }}>
                                        {s.icon} {s.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                            {[1, 2, 3].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    onPress={() => setSelectedSeverity(level)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        borderRadius: 8,
                                        marginRight: level < 3 ? 8 : 0,
                                        backgroundColor: selectedSeverity === level ? SEVERITY_COLORS[level] : colors.white,
                                        borderWidth: 1,
                                        borderColor: selectedSeverity === level ? SEVERITY_COLORS[level] : colors.border,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: selectedSeverity === level ? colors.white : colors.text, fontWeight: '600' }}>
                                        {SEVERITY_LABELS[level]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={handleAdd}
                            disabled={!selectedSymptom || saving}
                            style={{
                                backgroundColor: selectedSymptom ? colors.primary : colors.border,
                                padding: 14,
                                borderRadius: 8,
                                alignItems: 'center',
                            }}
                        >
                            {saving
                                ? <ActivityIndicator color={colors.white} />
                                : <Text style={{ color: colors.white, fontWeight: 'bold' }}>Log symptom</Text>
                            }
                        </TouchableOpacity>
                    </View>
                }
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={{ color: colors.textLight, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 }}>
                        {title}
                    </Text>
                )}
                renderItem={({ item }) => (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.white,
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '600' }}>{item.symptom_name}</Text>
                            {item.severity && (
                                <Text style={{ color: SEVERITY_COLORS[item.severity], fontSize: 12, marginTop: 2 }}>
                                    {SEVERITY_LABELS[item.severity]}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(item.id)}>
                            <Text style={{ color: colors.textLight, fontSize: 18 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ color: colors.textLight, textAlign: 'center', marginTop: 32 }}>
                        No symptoms logged yet
                    </Text>
                }
            />
        </View>
    );
}