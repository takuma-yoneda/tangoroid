import { useSettingsStore } from '../stores/useSettingsStore';
import { lightColors, darkColors } from '../constants/colors';

export function useColors() {
    const theme = useSettingsStore(s => s.theme);
    return theme === 'dark' ? darkColors : lightColors;
}
