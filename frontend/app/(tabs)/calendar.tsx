import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useFocusEffect } from 'expo-router';
import { colors } from '../../constants/colors';
import { getPeriods, updatePeriod, deletePeriod, PeriodEntry } from '../../services/cycles';
import { useLayout } from '../../constants/layout';
import { CornerFlowers } from '../../components/Flowers';
import { CornerPet } from '../../components/Pet';
import usePetStore from '../../store/petStore';

// ─── helpers ────────────────────────────────────────────────────────────────

const addDays = (dateStr: string, n: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
};

const getToday = () => new Date().toISOString().split('T')[0];

const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const getLatest = (cycles: PeriodEntry[]) =>
    cycles.reduce<PeriodEntry | undefined>((a, c) => (!a || c.start_date > a.start_date ? c : a), undefined);

// The last day a logged period covers. The latest open period runs through today until the
// user ends it; an older one that was never ended only shows its start day.
function getPeriodEnd(c: PeriodEntry, latest: PeriodEntry | undefined): string {
    if (c.end_date) return c.end_date;
    const today = getToday();
    if (c.id === latest?.id && today > c.start_date) return today;
    return c.start_date;
}

function getErrorMessage(err: unknown): string {
    const data = (err as { response?: { data?: unknown } })?.response?.data as
        | Record<string, string[] | string>
        | undefined;
    if (!data) return 'Something went wrong. Please try again.';
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === 'string') return firstValue;
    return 'Something went wrong. Please try again.';
}

type MarkedDates = Record<string, {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
}>;

function buildMarkedDates(cycles: PeriodEntry[], selectedId: number | null): MarkedDates {
    const marked: MarkedDates = {};

    const mark = (dateStr: string, bgColor: string, txtColor: string) => {
        marked[dateStr] = { selected: true, selectedColor: bgColor, selectedTextColor: txtColor };
    };

    if (cycles.length === 0) return marked;

    // Sort cycles descending to find latest
    const sorted = [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date));
    const latest = sorted[0];

    // Mark actual period days, highlighting the one being edited
    cycles.forEach((c) => {
        const end = getPeriodEnd(c, latest);
        const bgColor = c.id === selectedId ? colors.ovulation : colors.primary;
        let cur = c.start_date;
        while (cur <= end) {
            mark(cur, bgColor, colors.white);
            cur = addDays(cur, 1);
        }
    });

    // Average cycle length
    let avgLength = 28;
    if (sorted.length >= 2) {
        const lengths: number[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
            const a = new Date(sorted[i].start_date);
            const b = new Date(sorted[i + 1].start_date);
            const diff = Math.round((a.getTime() - b.getTime()) / 86400000);
            if (diff > 0 && diff < 60) lengths.push(diff);
        }
        if (lengths.length > 0) {
            avgLength = Math.round(lengths.reduce((s, v) => s + v, 0) / lengths.length);
        }
    }

    // Average period length from actual data
    let avgPeriod = 5;
    const periodLengths = sorted.filter(c => c.end_date).map(c => {
        return Math.round((new Date(c.end_date!).getTime() - new Date(c.start_date).getTime()) / 86400000) + 1;
    }).filter(d => d > 0 && d < 15);
    if (periodLengths.length > 0) {
        avgPeriod = Math.round(periodLengths.reduce((s, v) => s + v, 0) / periodLengths.length);
    }

    // Predict future cycles
    const PREDICTIONS = 2;
    let prevStart = latest.start_date;
    for (let n = 0; n < PREDICTIONS; n++) {
        const nextStart = addDays(prevStart, avgLength);

        // Predicted period days
        for (let i = 0; i < avgPeriod; i++) {
            const d = addDays(nextStart, i);
            if (!marked[d]) {
                mark(d, colors.primaryLight, colors.primary);
            }
        }

        // Ovulation window for this predicted cycle
        const nextNextStart = addDays(nextStart, avgLength);
        const ovulationMid = addDays(nextNextStart, -14);
        for (let j = -2; j <= 2; j++) {
            const d = addDays(ovulationMid, j);
            if (!marked[d]) {
                mark(d, colors.ovulationLight, colors.ovulation);
            }
        }

        prevStart = nextStart;
    }

    // Ovulation window for each past cycle
    sorted.forEach((c, i) => {
        const nextCycleStart = i === 0
            ? addDays(latest.start_date, avgLength)
            : sorted[i - 1].start_date;

        const ovulationMid = addDays(nextCycleStart, -14);
        for (let j = -2; j <= 2; j++) {
            const d = addDays(ovulationMid, j);
            if (!marked[d]) {
                mark(d, colors.ovulationLight, colors.ovulation);
            }
        }
    });

    return marked;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function CalendarScreen() {
    const [cycles, setCycles] = useState<PeriodEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [picking, setPicking] = useState<'start_date' | 'end_date' | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const layout = useLayout();
    const { pet } = usePetStore();

    const fetchCycles = useCallback(async () => {
        try {
            const data = await getPeriods();
            setCycles(data);
        } catch {
            Alert.alert('Error', 'Could not load cycle data.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Refetch whenever the tab is shown so changes made on other tabs appear
    useFocusEffect(useCallback(() => {
        fetchCycles();
    }, [fetchCycles]));

    const latest = getLatest(cycles);
    const selected = cycles.find(c => c.id === selectedId) ?? null;
    const markedDates = buildMarkedDates(cycles, selectedId);

    const selectPeriod = (id: number | null) => {
        setSelectedId(id);
        setPicking(null);
        setConfirmingDelete(false);
        setEditError(null);
    };

    const saveChange = async (change: { start_date?: string; end_date?: string | null }) => {
        if (!selected?.id) return;
        setSaving(true);
        setEditError(null);
        try {
            await updatePeriod(selected.id, change);
            await fetchCycles();
            setPicking(null);
        } catch (err) {
            setEditError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selected?.id) return;
        setSaving(true);
        setEditError(null);
        try {
            await deletePeriod(selected.id);
            await fetchCycles();
            selectPeriod(null);
        } catch (err) {
            setEditError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDayPress = (day: DateData) => {
        if (saving) return;
        if (picking) {
            saveChange({ [picking]: day.dateString });
            return;
        }
        const tapped = cycles.find(c => c.start_date <= day.dateString && day.dateString <= getPeriodEnd(c, latest));
        selectPeriod(tapped?.id ?? null);
    };

    const actionButton = (label: string, onPress: () => void, filled = false) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={saving}
            style={{
                backgroundColor: filled ? colors.primary : colors.white,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.primary,
            }}
        >
            <Text style={{ color: filled ? '#fff' : colors.primary, fontWeight: '600', fontSize: layout.fontSize.small + 2 }}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderEditPanel = () => {
        if (!selected) {
            return cycles.length > 0 ? (
                <Text style={{ color: colors.textLight, paddingHorizontal: 20, marginTop: 12, fontSize: layout.fontSize.small + 2 }}>
                    Tap a period day to edit it.
                </Text>
            ) : null;
        }

        const isOpen = !selected.end_date;
        const days = Math.round(
            (new Date(getPeriodEnd(selected, latest)).getTime() - new Date(selected.start_date).getTime()) / 86400000
        ) + 1;

        let body;
        if (saving) {
            body = <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />;
        } else if (picking) {
            body = (
                <>
                    <Text style={{ color: colors.text, fontSize: layout.fontSize.body }}>
                        Tap the new {picking === 'start_date' ? 'start' : 'end'} date on the calendar.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {actionButton('Cancel', () => setPicking(null))}
                    </View>
                </>
            );
        } else if (confirmingDelete) {
            body = (
                <>
                    <Text style={{ color: colors.text, fontSize: layout.fontSize.body }}>Delete this period?</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {actionButton('Delete', handleDelete, true)}
                        {actionButton('Keep', () => setConfirmingDelete(false))}
                    </View>
                </>
            );
        } else {
            body = (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {actionButton('Change start', () => setPicking('start_date'))}
                    {actionButton(isOpen ? 'Set end date' : 'Change end', () => setPicking('end_date'))}
                    {!isOpen && selected.id === latest?.id &&
                        actionButton('Mark as ongoing', () => saveChange({ end_date: null }))}
                    {actionButton('Delete', () => setConfirmingDelete(true))}
                    {actionButton('Done', () => selectPeriod(null))}
                </View>
            );
        }

        return (
            <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                padding: 16,
                gap: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundLight,
            }}>
                <View>
                    <Text style={{ fontSize: layout.fontSize.body, fontWeight: '600', color: colors.text }}>
                        {formatDate(selected.start_date)} – {isOpen ? 'ongoing' : formatDate(selected.end_date!)}
                    </Text>
                    <Text style={{ color: colors.textLight, fontSize: layout.fontSize.small + 2, marginTop: 2 }}>
                        {days} day{days !== 1 ? 's' : ''}{isOpen && selected.id !== latest?.id ? ' · never ended' : ''}
                    </Text>
                </View>
                {body}
                {editError && (
                    <Text style={{ color: colors.error, fontSize: layout.fontSize.small + 2 }}>{editError}</Text>
                )}
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: layout.isWide ? 'center' : 'stretch' }}>
            <CornerFlowers />
            {pet && <CornerPet emoji={pet} />}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40, width: layout.isWide ? 540 : undefined, maxWidth: '100%' }}
                directionalLockEnabled={true}
            >
                <Text style={{ fontSize: layout.fontSize.title - 4, fontWeight: 'bold', color: colors.text, paddingHorizontal: 20, marginBottom: 16 }}>
                    Your Cycle
                </Text>

                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <Calendar
                        style={{ minHeight: 300 }}
                        markedDates={markedDates}
                        onDayPress={handleDayPress}
                        enableSwipeMonths={true}
                        theme={{
                            backgroundColor: colors.background,
                            calendarBackground: colors.background,
                            todayTextColor: colors.primary,
                            arrowColor: colors.primary,
                            monthTextColor: colors.text,
                            textMonthFontWeight: '600',
                            textMonthFontSize: layout.isWide ? 18 : 16,
                            textDayFontSize: layout.isWide ? 16 : 14,
                            textDayHeaderFontSize: layout.isWide ? 14 : 12,
                            dayTextColor: colors.text,
                            textSectionTitleColor: colors.textLight,
                        }}
                    />
                )}

                {!loading && renderEditPanel()}

                {/* Legend */}
                <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 10 }}>
                    <Text style={{ fontSize: layout.fontSize.small + 1, fontWeight: '600', color: colors.textLight, marginBottom: 4 }}>
                        LEGEND
                    </Text>
                    {[
                        { color: colors.primary, label: 'Period' },
                        { color: colors.primaryLight, label: 'Predicted period' },
                        { color: colors.ovulationLight, label: 'Ovulation window' },
                    ].map(({ color, label }) => (
                        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color }} />
                            <Text style={{ color: colors.text, fontSize: layout.fontSize.small + 2 }}>{label}</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}
