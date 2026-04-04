import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList } from 'react-native';
import { getSymptoms, getSymptomEntries, createSymptomEntry, deleteSymptomEntry, Symptom, SymptomEntry } from '../../services/symptoms';
import { colors } from '../../constants/colors';
import { useLayout } from '../../constants/layout';
import { CornerFlowers } from '../../components/Flowers';

const SEVERITY_LABELS: Record<number, string> = { 1: 'Mild', 2: 'Moderate', 3: 'Severe' };
const SEVERITY_COLORS: Record<number, string> = { 1: colors.ovulation, 2: colors.accent, 3: colors.primary };

export default function LogScreen() {
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);
    const [entries, setEntries] = useState<SymptomEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedSymptom, setSelectedSymptom] = useState<number | null>(null);
    const [selectedSeverity, setSelectedSeverity] = useState<number>(1);
    const [error, setError] = useState<string | null>(null);
    const layout = useLayout();

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
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: layout.isWide ? 'center' : 'stretch' }}>
            <CornerFlowers />
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: layout.padding, paddingTop: 120, paddingBottom: 40, width: layout.isWide ? 540 : undefined, maxWidth: '100%' }}
                ListHeaderComponent={
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: layout.fontSize.title, fontWeight: 'bold', marginBottom: 16, color: colors.text }}>
                            Symptoms
                        </Text>

                        {error && (
                            <View style={{ backgroundColor: colors.errorBg, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                <Text style={{ color: colors.error, fontSize: layout.fontSize.body }}>{error}</Text>
                            </View>
                        )}

                        <Text style={{ color: colors.textLight, marginBottom: 8, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Log a symptom for today
                        </Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {symptoms.map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    onPress={() => setSelectedSymptom(s.id)}
                                    style={{
                                        paddingHorizontal: layout.isWide ? 18 : 14,
                                        paddingVertical: layout.isWide ? 10 : 8,
                                        borderRadius: 20,
                                        backgroundColor: selectedSymptom === s.id ? colors.primary : colors.white,
                                        borderWidth: 1,
                                        borderColor: selectedSymptom === s.id ? colors.primary : colors.border,
                                    }}
                                >
                                    <Text style={{ color: selectedSymptom === s.id ? colors.white : colors.text, fontSize: layout.fontSize.body }}>
                                        {s.icon} {s.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                            {[1, 2, 3].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    onPress={() => setSelectedSeverity(level)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: layout.isWide ? 10 : 8,
                                        borderRadius: 8,
                                        marginRight: level < 3 ? 8 : 0,
                                        backgroundColor: selectedSeverity === level ? SEVERITY_COLORS[level] : colors.white,
                                        borderWidth: 1,
                                        borderColor: selectedSeverity === level ? SEVERITY_COLORS[level] : colors.border,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: selectedSeverity === level ? colors.white : colors.text, fontWeight: '600', fontSize: layout.fontSize.body }}>
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
                                padding: layout.buttonPadding,
                                borderRadius: 8,
                                alignItems: 'center',
                            }}
                        >
                            {saving
                                ? <ActivityIndicator color={colors.white} />
                                : <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: layout.fontSize.body }}>Log symptom</Text>
                            }
                        </TouchableOpacity>
                    </View>
                }
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={{ color: colors.textLight, fontSize: layout.fontSize.small, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 }}>
                        {title}
                    </Text>
                )}
                renderItem={({ item }) => (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.white,
                        borderRadius: 8,
                        padding: layout.inputPadding,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '600', fontSize: layout.fontSize.body }}>{item.symptom_name}</Text>
                            {item.severity && (
                                <Text style={{ color: SEVERITY_COLORS[item.severity], fontSize: layout.fontSize.small, marginTop: 2 }}>
                                    {SEVERITY_LABELS[item.severity]}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(item.id)}>
                            <Text style={{ color: colors.textLight, fontSize: layout.isWide ? 20 : 18 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ color: colors.textLight, textAlign: 'center', marginTop: 32, fontSize: layout.fontSize.body }}>
                        No symptoms logged yet
                    </Text>
                }
            />
        </View>
    );
}