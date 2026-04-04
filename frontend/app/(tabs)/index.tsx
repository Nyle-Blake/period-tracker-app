import { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getPeriods, PeriodEntry, createPeriod, updatePeriod } from '../../services/cycles';
import { getProfile, UserProfile } from '../../services/profile';
import { colors } from '../../constants/colors';
import { useLayout } from '../../constants/layout';
import { CornerFlowers } from '../../components/Flowers';
import { CornerPet } from '../../components/Pet';
import usePetStore from '../../store/petStore';

const BASE_RING_SIZE = 260;
const BASE_RING_RADIUS = 105;
const BASE_DOT_RADIUS = 6;
const BASE_CURRENT_DOT_RADIUS = 9;

function getCycleInfo(cycles: PeriodEntry[], profile: UserProfile | null) {
    if (cycles.length === 0) return null;

    const sorted = [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date));
    const latest = sorted[0];

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

    // Ovulation window: ~14 days before next cycle start, ±2 days
    const ovulationMid = cycleLength - 14;
    const ovulationStart = ovulationMid - 2;
    const ovulationEnd = ovulationMid + 2;

    const latestEntry = latest;
    const periodActive = !latest.end_date && currentDay <= periodLength;

    return { currentDay, cycleLength, periodLength, daysLeft, onPeriod, ovulationStart, ovulationEnd, latestEntry, periodActive };
}

function getDotColor(day: number, periodLength: number, ovulationStart: number, ovulationEnd: number): string {
    if (day <= periodLength) return colors.primary;
    if (day >= ovulationStart && day <= ovulationEnd) return colors.ovulation;
    return colors.ovulationLight;
}

export default function HomeScreen() {
    const [cycles, setCycles] = useState<PeriodEntry[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const layout = useLayout();
    const { pet, setPet } = usePetStore();

    const ringScale = layout.isWide ? 1.3 : 1;
    const RING_SIZE = BASE_RING_SIZE * ringScale;
    const RING_RADIUS = BASE_RING_RADIUS * ringScale;
    const DOT_RADIUS = BASE_DOT_RADIUS * ringScale;
    const CURRENT_DOT_RADIUS = BASE_CURRENT_DOT_RADIUS * ringScale;

    const fetchData = useCallback(async () => {
        try {
            const [cyclesData, profileData] = await Promise.all([getPeriods(), getProfile()]);
            setCycles(cyclesData);
            setProfile(profileData);
            setPet(profileData.pet ?? null);
        } catch {
            // silently fail, user will see empty state
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePeriodStarted = async () => {
        setActionLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await createPeriod({ start_date: today });
            await fetchData();
        } catch {
            // silently fail
        } finally {
            setActionLoading(false);
        }
    };

    const handlePeriodEnded = async () => {
        const sorted = [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date));
        const latest = sorted[0];
        if (!latest?.id) return;
        setActionLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await updatePeriod(latest.id, { end_date: today });
            await fetchData();
        } catch {
            // silently fail
        } finally {
            setActionLoading(false);
        }
    };

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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: layout.padding }}>
                <Text style={{ fontSize: 72, marginBottom: 16, opacity: 0.7 }}>🌸🌷🌺</Text>
                <Text style={{ fontSize: layout.fontSize.title, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>Welcome</Text>
                <Text style={{ color: colors.textLight, textAlign: 'center', marginBottom: 24, fontSize: layout.fontSize.body }}>
                    Tap the button below to start tracking your cycle.
                </Text>
                <TouchableOpacity
                    onPress={handlePeriodStarted}
                    disabled={actionLoading}
                    style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 32,
                        paddingVertical: layout.isWide ? 16 : 14,
                        borderRadius: 12,
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: layout.fontSize.body }}>
                        {actionLoading ? 'Saving...' : 'My period started'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const cx = RING_SIZE / 2;
    const cy = RING_SIZE / 2;

    const dots = Array.from({ length: info.cycleLength }, (_, i) => {
        const day = i + 1;
        const angle = (2 * Math.PI * i) / info.cycleLength - Math.PI / 2;
        const x = cx + RING_RADIUS * Math.cos(angle);
        const y = cy + RING_RADIUS * Math.sin(angle);
        const isCurrent = day === info.currentDay;
        const dotColor = getDotColor(day, info.periodLength, info.ovulationStart, info.ovulationEnd);
        const r = isCurrent ? CURRENT_DOT_RADIUS : DOT_RADIUS;
        return { day, x, y, r, fill: dotColor, isCurrent };
    });

    return (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: layout.padding }}>
            <CornerFlowers />
            {pet && <CornerPet emoji={pet} />}
            <View style={{ alignItems: 'center', marginBottom: layout.isWide ? 48 : 40 }}>
                <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                    <Svg width={RING_SIZE} height={RING_SIZE}>
                        {dots.map((dot) => (
                            <Circle
                                key={dot.day}
                                cx={dot.x}
                                cy={dot.y}
                                r={dot.r}
                                fill={dot.fill}
                                stroke={dot.isCurrent ? colors.text : 'none'}
                                strokeWidth={dot.isCurrent ? 2 : 0}
                            />
                        ))}
                    </Svg>
                    <View style={{ position: 'absolute', alignItems: 'center' }}>
                        <Text style={{ fontSize: layout.isWide ? 52 : 42, fontWeight: 'bold', color: colors.text }}>
                            Day {info.currentDay}
                        </Text>
                        <Text style={{ fontSize: layout.fontSize.small, color: colors.textLight }}>
                            of {info.cycleLength} days
                        </Text>
                    </View>
                </View>
            </View>

            <Text style={{ fontSize: layout.fontSize.stat, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                {info.onPeriod ? 'On your period' : 'Not on your period'}
            </Text>
            <Text style={{ color: colors.textLight, marginBottom: 16, fontSize: layout.fontSize.body }}>
                {info.onPeriod
                    ? `Day ${info.currentDay} of your period`
                    : `${info.daysLeft} day${info.daysLeft !== 1 ? 's' : ''} until next period`
                }
            </Text>

            {info.periodActive ? (
                <TouchableOpacity
                    onPress={handlePeriodEnded}
                    disabled={actionLoading}
                    style={{
                        backgroundColor: colors.white,
                        paddingHorizontal: layout.isWide ? 36 : 28,
                        paddingVertical: layout.isWide ? 14 : 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        marginBottom: 32,
                    }}
                >
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: layout.fontSize.body }}>
                        {actionLoading ? 'Saving...' : 'My period ended'}
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={handlePeriodStarted}
                    disabled={actionLoading}
                    style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: layout.isWide ? 36 : 28,
                        paddingVertical: layout.isWide ? 14 : 12,
                        borderRadius: 12,
                        marginBottom: 32,
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: layout.fontSize.body }}>
                        {actionLoading ? 'Saving...' : 'My period started'}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Legend */}
            <View style={{ flexDirection: 'row', gap: layout.isWide ? 28 : 20, marginBottom: 32 }}>
                {[
                    { color: colors.primary, label: 'Period' },
                    { color: colors.ovulation, label: 'Ovulation' },
                    { color: colors.ovulationLight, label: 'Regular' },
                ].map(({ color, label }) => (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: layout.isWide ? 12 : 10, height: layout.isWide ? 12 : 10, borderRadius: 6, backgroundColor: color }} />
                        <Text style={{ color: colors.textLight, fontSize: layout.fontSize.small }}>{label}</Text>
                    </View>
                ))}
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 16, maxWidth: layout.isWide ? 480 : undefined, width: '100%' }}>
                {[
                    { label: 'Cycle length', value: `${info.cycleLength}d` },
                    { label: 'Period length', value: `${info.periodLength}d` },
                    { label: 'Cycle day', value: `${info.currentDay}` },
                ].map(({ label, value }) => (
                    <View key={label} style={{
                        flex: 1,
                        backgroundColor: colors.white,
                        borderRadius: 12,
                        padding: layout.isWide ? 20 : 16,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}>
                        <Text style={{ fontSize: layout.fontSize.stat, fontWeight: 'bold', color: colors.text }}>{value}</Text>
                        <Text style={{ fontSize: layout.fontSize.small, color: colors.textLight, marginTop: 4 }}>{label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}