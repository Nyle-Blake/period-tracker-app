import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors } from '../../constants/colors';
import { getCycles, CycleEntry } from '../../services/cycles';

// ─── helpers ────────────────────────────────────────────────────────────────

const addDays = (dateStr: string, n: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
};

type MarkedDates = Record<string, {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
}>;

function buildMarkedDates(cycles: CycleEntry[]): MarkedDates {
    const marked: MarkedDates = {};

    const mark = (dateStr: string, bgColor: string, txtColor: string) => {
        marked[dateStr] = { selected: true, selectedColor: bgColor, selectedTextColor: txtColor };
    };

    if (cycles.length === 0) return marked;

    // Mark actual period days
    cycles.forEach((c) => {
        const end = c.end_date ?? c.start_date;
        let cur = c.start_date;
        while (cur <= end) {
            mark(cur, colors.primary, colors.white);
            cur = addDays(cur, 1);
        }
    });

    // Sort cycles descending to find latest
    const sorted = [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date));
    const latest = sorted[0];

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
    const [cycles, setCycles] = useState<CycleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCycles = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCycles();
            setCycles(data);
        } catch {
            Alert.alert('Error', 'Could not load cycle data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCycles();
    }, [fetchCycles]);

    const markedDates = buildMarkedDates(cycles);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
                directionalLockEnabled={true}
            >
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, paddingHorizontal: 20, marginBottom: 16 }}>
                    Your Cycle
                </Text>

                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <Calendar
                        style={{ minHeight: 300 }}
                        markedDates={markedDates}
                        enableSwipeMonths={false}
                        theme={{
                            backgroundColor: colors.background,
                            calendarBackground: colors.background,
                            todayTextColor: colors.primary,
                            arrowColor: colors.primary,
                            monthTextColor: colors.text,
                            textMonthFontWeight: '600',
                            textMonthFontSize: 16,
                            textDayFontSize: 14,
                            textDayHeaderFontSize: 12,
                            dayTextColor: colors.text,
                            textSectionTitleColor: colors.textLight,
                        }}
                    />
                )}

                {/* Legend */}
                <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: 4 }}>
                        LEGEND
                    </Text>
                    {[
                        { color: colors.primary, label: 'Period' },
                        { color: colors.primaryLight, label: 'Predicted period' },
                        { color: colors.ovulationLight, label: 'Ovulation window' },
                    ].map(({ color, label }) => (
                        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color }} />
                            <Text style={{ color: colors.text, fontSize: 14 }}>{label}</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}