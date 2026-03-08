import { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getCycles, CycleEntry } from '../../services/cycles';
import { getProfile, UserProfile } from '../../services/profile';
import { colors } from '../../constants/colors';

const RING_SIZE = 240;
const STROKE_WIDTH = 16;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getCycleInfo(cycles: CycleEntry[], profile: UserProfile | null) {
    if (cycles.length === 0) return null;

    const sorted = [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date));
    const latest = sorted[0];

    // Average cycle length from history, fallback to profile, fallback to 28
    let cycleLength = profile?.cycle_length ?? 28;
    if (sorted.length >= 2) {
        const lengths: number[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
            const a = new Date(sorted[i].start_date);
            const b = new Date(sorted[i + 1].start_date);
            const diff = Math.round((a.getTime() - b.getTime()) / 86400000);
            if (diff > 0 && diff < 60) lengths.push(diff);
        }
        if (lengths.length > 0) {
            cycleLength = Math.round(lengths.reduce((s, v) => s + v, 0) / lengths.length);
        }
    }

    // Period length from latest cycle, fallback to profile, fallback to 5
    let periodLength = profile?.period_length ?? 5;
    if (latest.end_date) {
        const diff = Math.round(
            (new Date(latest.end_date).getTime() - new Date(latest.start_date).getTime()) / 86400000
        ) + 1;
        periodLength = diff;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(latest.start_date);
    startDate.setHours(0, 0, 0, 0);
    const currentDay = Math.round((today.getTime() - startDate.getTime()) / 86400000) + 1;
    const daysLeft = Math.max(0, cycleLength - currentDay + 1);
    const onPeriod = currentDay <= periodLength;

    return { currentDay, cycleLength, periodLength, daysLeft, onPeriod };
}

export default function HomeScreen() {
    const [cycles, setCycles] = useState<CycleEntry[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [cyclesData, profileData] = await Promise.all([getCycles(), getProfile()]);
            setCycles(cyclesData);
            setProfile(profileData);
        } catch {
            // silently fail, user will see empty state
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    const info = getCycleInfo(cycles, profile);

    if (!info) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>Welcome</Text>
                <Text style={{ color: colors.textLight, textAlign: 'center' }}>
                    Log your first period in the Calendar tab to see your cycle overview here.
                </Text>
            </View>
        );
    }

    const progress = Math.min(info.currentDay / info.cycleLength, 1);
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    // Period portion of the ring
    const periodProgress = info.periodLength / info.cycleLength;
    const periodDashArray = `${CIRCUMFERENCE * periodProgress} ${CIRCUMFERENCE * (1 - periodProgress)}`;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                    <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                        {/* Background ring */}
                        <Circle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RADIUS}
                            stroke={colors.border}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                        />
                        {/* Period portion */}
                        <Circle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RADIUS}
                            stroke={colors.primaryLight}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                            strokeDasharray={periodDashArray}
                            strokeLinecap="round"
                        />
                        {/* Progress arc */}
                        <Circle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RADIUS}
                            stroke={info.onPeriod ? colors.primary : colors.success}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                            strokeDasharray={`${CIRCUMFERENCE}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </Svg>
                    {/* Center text */}
                    <View style={{ position: 'absolute', alignItems: 'center' }}>
                        <Text style={{ fontSize: 42, fontWeight: 'bold', color: colors.text }}>
                            {info.currentDay}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textLight }}>
                            of {info.cycleLength} days
                        </Text>
                    </View>
                </View>
            </View>

            <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                {info.onPeriod ? 'On your period' : 'Not on your period'}
            </Text>
            <Text style={{ color: colors.textLight, marginBottom: 32 }}>
                {info.onPeriod
                    ? `Day ${info.currentDay} of your period`
                    : `${info.daysLeft} day${info.daysLeft !== 1 ? 's' : ''} until next period`
                }
            </Text>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
                {[
                    { label: 'Cycle length', value: `${info.cycleLength}d` },
                    { label: 'Period length', value: `${info.periodLength}d` },
                    { label: 'Cycle day', value: `${info.currentDay}` },
                ].map(({ label, value }) => (
                    <View key={label} style={{
                        flex: 1,
                        backgroundColor: colors.white,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{value}</Text>
                        <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }}>{label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}