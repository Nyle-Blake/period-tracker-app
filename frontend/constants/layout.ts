import { Platform, useWindowDimensions } from 'react-native';

export function useLayout() {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isWide = width > 600;

    return {
        isWeb,
        isWide,
        contentWidth: isWide ? 480 : undefined,
        padding: isWide ? 48 : 24,
        fontSize: {
            title: isWide ? 36 : 28,
            body: isWide ? 18 : 16,
            small: isWide ? 14 : 12,
            stat: isWide ? 24 : 20,
        },
        inputPadding: isWide ? 16 : 12,
        buttonPadding: isWide ? 18 : 16,
    };
}