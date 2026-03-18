import { Text } from 'react-native';

export function CornerFlowers() {
    return (
        <>
            <Text style={{ position: 'absolute', top: 24, left: 20, fontSize: 72, opacity: 0.35 }}>🌸</Text>
            <Text style={{ position: 'absolute', top: 40, right: 28, fontSize: 62, opacity: 0.3 }}>🌷</Text>
            <Text style={{ position: 'absolute', bottom: 28, left: 24, fontSize: 65, opacity: 0.3 }}>🌺</Text>
            <Text style={{ position: 'absolute', bottom: 24, right: 20, fontSize: 69, opacity: 0.35 }}>🌸</Text>
        </>
    );
}
