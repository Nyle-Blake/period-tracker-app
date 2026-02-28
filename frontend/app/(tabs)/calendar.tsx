import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../../constants/colors';
import { getCycles, createCycle, CycleEntry } from '../../services/cycles';

// ─── helpers ────────────────────────────────────────────────────────────────

const toYMD = (date: Date) => date.toISOString().split('T')[0];

const addDays = (dateStr: string, n: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return toYMD(d);
};

type MarkedDates = Record<string, {
    color?: string;
    textColor?: string;
    startingDay?: boolean;
    endingDay?: boolean;
}>;

function buildMarkedDates(cycles: CycleEntry[]): MarkedDates {
    const marked: MarkedDates = {};

    const mark = (dateStr: string, color: string, textColor: string, startingDay = false, endingDay = false) => {
        marked[dateStr] = { color, textColor, startingDay, endingDay };
    };

    if (cycles.length === 0) return marked;

    // Mark actual period days as ranges
    cycles.forEach((c) => {
        const end = c.end_date ?? c.start_date;
        let cur = c.start_date;
        const isSingleDay = cur === end;
        while (cur <= end) {
            mark(cur, colors.primary, colors.white, cur === c.start_date || isSingleDay, cur === end || isSingleDay);
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

    // Predicted next period (7 days)
    const nextStart = addDays(latest.start_date, avgLength);
    for (let i = 0; i < 7; i++) {
        const d = addDays(nextStart, i);
        if (!marked[d]) {
            mark(d, colors.primaryLight, colors.primary, i === 0, i === 6);
        }
    }

    // Predicted next period (7 days)
    sorted.forEach((c, i) => {
        const nextCycleStart = i === 0 ? nextStart : sorted[i - 1].start_date;
        const ovulationMid = addDays(nextCycleStart, -14);
        for (let j = -2; j <= 2; j++) {
            const d = addDays(ovulationMid, j);
            if (!marked[d]) {
                mark(d, '#a8d8a8', '#2d6a2d', j === -2, j === 2);
            }
        }
    });

    return marked;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function CalendarScreen() {
    const [cycles, setCycles] = useState<CycleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

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

    const onDayPress = (day: { dateString: string }) => {
        setSelectedDay(day.dateString);
        setEndDate(null);
        setShowPicker(false);
        setNotes('');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!selectedDay) return;
        setSaving(true);
        try {
            await createCycle({
                start_date: selectedDay,
                end_date: endDate ? toYMD(endDate) : undefined,
                notes: notes || undefined,
            });
            setModalVisible(false);
            fetchCycles();
        } catch {
            Alert.alert('Error', 'Could not save cycle entry.');
        } finally {
            setSaving(false);
        }
    };

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
                    <View onStartShouldSetResponder={() => false}>
                        <Calendar
                            markingType="period"
                            style={{ minHeight: 300 }}
                            markedDates={markedDates}
                            onDayPress={onDayPress}
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
                    </View>
                )}

                {/* Legend */}
                <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: 4 }}>
                        LEGEND
                    </Text>
                    {[
                        { color: colors.primary, label: 'Period' },
                        { color: colors.primaryLight, label: 'Predicted period' },
                        { color: '#a8d8a8', label: 'Ovulation window' },
                    ].map(({ color, label }) => (
                        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color }} />
                            <Text style={{ color: colors.text, fontSize: 14 }}>{label}</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>

            {/* Log modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <View style={{
                        backgroundColor: colors.white,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 24,
                        paddingBottom: 40,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>
                            Log period
                        </Text>
                        <Text style={{ color: colors.textLight, marginBottom: 20 }}>
                            Start date: {selectedDay}
                        </Text>

                        <Text style={{ color: colors.text, marginBottom: 6, fontSize: 14 }}>End date (optional)</Text>
                        <TouchableOpacity
                            onPress={() => setShowPicker(true)}
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 16,
                                backgroundColor: colors.background,
                            }}
                        >
                            <Text style={{ color: endDate ? colors.text : colors.textLight }}>
                                {endDate ? toYMD(endDate) : 'Select end date'}
                            </Text>
                        </TouchableOpacity>
                        {showPicker && (
                            <DateTimePicker
                                value={endDate ?? (selectedDay ? new Date(selectedDay + 'T00:00:00') : new Date())}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={selectedDay ? new Date(selectedDay + 'T00:00:00') : undefined}
                                onChange={(event: DateTimePickerEvent, date?: Date) => {
                                    setShowPicker(Platform.OS === 'ios');
                                    if (date) setEndDate(date);
                                }}
                            />
                        )}

                        <Text style={{ color: colors.text, marginBottom: 6, fontSize: 14 }}>Notes (optional)</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 24,
                                backgroundColor: colors.background,
                                color: colors.text,
                                minHeight: 80,
                                textAlignVertical: 'top',
                            }}
                            placeholder="How are you feeling?"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.primary,
                                padding: 16,
                                borderRadius: 8,
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color={colors.white} />
                                : <Text style={{ color: colors.white, fontWeight: 'bold' }}>Save</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={{ color: colors.textLight, textAlign: 'center' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}