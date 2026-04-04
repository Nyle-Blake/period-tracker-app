import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

export const PET_OPTIONS = [
    { emoji: '🐢', label: 'Turtle' },
    { emoji: '🐱', label: 'Cat' },
    { emoji: '🐶', label: 'Dog' },
    { emoji: '🐰', label: 'Bunny' },
    { emoji: '🐼', label: 'Panda' },
    { emoji: '🦊', label: 'Fox' },
    { emoji: '🐸', label: 'Frog' },
    { emoji: '🦋', label: 'Butterfly' },
];

export function Pet({ emoji, size = 40 }: { emoji: string; size?: number }) {
    const wobble = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(wobble, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(wobble, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rotate = wobble.interpolate({
        inputRange: [0, 1],
        outputRange: ['-8deg', '8deg'],
    });

    const translateY = wobble.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -4, 0],
    });

    return (
        <Animated.Text
            style={{
                fontSize: size,
                transform: [{ rotate }, { translateY }],
            }}
        >
            {emoji}
        </Animated.Text>
    );
}

export function CornerPet({ emoji }: { emoji: string }) {
    return (
        <View style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10 }} pointerEvents="none">
            <Pet emoji={emoji} size={48} />
        </View>
    );
}
