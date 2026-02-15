import { View, Text, StyleSheet, Button, Alert, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore, AI_MODELS, ACCENTS, THEMES } from '../../stores/useSettingsStore';
import { useWordStore } from '../../stores/useWordStore';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';

export default function SettingsScreen() {
    const { setUser } = useAuthStore();
    const { aiModel, setAiModel, accent, setAccent, theme, setTheme } = useSettingsStore();
    const backfillExamples = useWordStore(s => s.backfillExamples);
    const backfillImages = useWordStore(s => s.backfillImages);
    const [isBackfilling, setIsBackfilling] = useState(false);
    const [isBackfillingImages, setIsBackfillingImages] = useState(false);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [showAccentPicker, setShowAccentPicker] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const colors = useColors();

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }
        try {
            const user = auth.currentUser;
            if (!user || !user.email) return;
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            Alert.alert('Success', 'Password updated.');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            // Router will handle redirect via layout effect
        } catch (error: any) {
            Alert.alert('Error signing out', error.message);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: colors.background,
        },
        section: {
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        header: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 10,
            color: colors.textSecondary,
        },
        email: {
            fontSize: 16,
            marginBottom: 10,
            color: colors.textTertiary,
        },
        text: {
            fontSize: 16,
            color: colors.textTertiary,
            marginTop: 5,
        },
        settingRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
        },
        settingLabel: {
            fontSize: 16,
            color: colors.textSecondary,
        },
        settingValue: {
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 4,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            maxHeight: '70%',
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: colors.text,
        },
        modelOption: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
        },
        selectedOption: {
            backgroundColor: colors.surfaceAlt,
        },
        modelText: {
            fontSize: 16,
            color: colors.textSecondary,
        },
        selectedModelText: {
            color: colors.primary,
            fontWeight: 'bold',
        },
        input: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            marginBottom: 10,
            color: colors.text,
        },
        passwordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            marginBottom: 10,
        },
        passwordInput: {
            flex: 1,
            padding: 12,
            fontSize: 16,
            color: colors.text,
        },
        eyeButton: {
            padding: 12,
        }
    }), [colors]);

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.header}>Account</Text>
                <Text style={styles.email}>{auth.currentUser?.email}</Text>
                <View style={{ marginTop: 10, gap: 10 }}>
                    <Button title="Change Password" onPress={() => setShowPasswordModal(true)} />
                    <Button title="Sign Out" onPress={handleSignOut} color="#FF3B30" />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.header}>Appearance</Text>
                <TouchableOpacity style={styles.settingRow} onPress={() => setShowThemePicker(true)}>
                    <View>
                        <Text style={styles.settingLabel}>Theme</Text>
                        <Text style={styles.settingValue}>{THEMES.find(t => t.value === theme)?.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.disabled} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.header}>AI Settings</Text>
                <TouchableOpacity style={styles.settingRow} onPress={() => setShowModelPicker(true)}>
                    <View>
                        <Text style={styles.settingLabel}>Model</Text>
                        <Text style={styles.settingValue}>{aiModel}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.disabled} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingRow} onPress={() => setShowAccentPicker(true)}>
                    <View>
                        <Text style={styles.settingLabel}>Pronunciation Accent</Text>
                        <Text style={styles.settingValue}>{ACCENTS.find(a => a.value === accent)?.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.disabled} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.header}>Data</Text>
                <Button
                    title={isBackfilling ? "Updating..." : "Update existing words"}
                    onPress={async () => {
                        setIsBackfilling(true);
                        try {
                            const { updated, skipped, failed } = await backfillExamples();
                            Alert.alert('Done', `${updated} updated, ${skipped} skipped, ${failed} failed`);
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setIsBackfilling(false);
                        }
                    }}
                    disabled={isBackfilling}
                />
                <Text style={styles.text}>Fetches example sentences and source info for words that are missing them.</Text>
                <View style={{ marginTop: 12 }}>
                    <Button
                        title={isBackfillingImages ? "Updating images..." : "Update word images"}
                        onPress={async () => {
                            setIsBackfillingImages(true);
                            try {
                                const { updated, skipped, failed } = await backfillImages();
                                Alert.alert('Done', `${updated} updated, ${skipped} skipped, ${failed} failed`);
                            } catch (error: any) {
                                Alert.alert('Error', error.message);
                            } finally {
                                setIsBackfillingImages(false);
                            }
                        }}
                        disabled={isBackfillingImages}
                    />
                    <Text style={styles.text}>Fetches images from Pixabay for words that are missing them.</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.header}>About</Text>
                <Text style={styles.text}>Tangoroid</Text>
                <Text style={styles.text}>Version 1.0.0</Text>
            </View>


            <Modal
                visible={showThemePicker}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Theme</Text>
                        <ScrollView>
                            {THEMES.map(item => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[styles.modelOption, theme === item.value && styles.selectedOption]}
                                    onPress={() => { setTheme(item.value); setShowThemePicker(false); }}
                                >
                                    <Text style={[styles.modelText, theme === item.value && styles.selectedModelText]}>{item.label}</Text>
                                    {theme === item.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={{ marginTop: 15 }}>
                            <Button title="Cancel" onPress={() => setShowThemePicker(false)} />
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showModelPicker}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select AI Model</Text>
                        <ScrollView>
                            {AI_MODELS.map(model => (
                                <TouchableOpacity
                                    key={model}
                                    style={[styles.modelOption, aiModel === model && styles.selectedOption]}
                                    onPress={() => { setAiModel(model); setShowModelPicker(false); }}
                                >
                                    <Text style={[styles.modelText, aiModel === model && styles.selectedModelText]}>{model}</Text>
                                    {aiModel === model && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={{ marginTop: 15 }}>
                            <Button title="Cancel" onPress={() => setShowModelPicker(false)} />
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showAccentPicker}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Pronunciation Accent</Text>
                        <ScrollView>
                            {ACCENTS.map(item => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[styles.modelOption, accent === item.value && styles.selectedOption]}
                                    onPress={() => { setAccent(item.value); setShowAccentPicker(false); }}
                                >
                                    <Text style={[styles.modelText, accent === item.value && styles.selectedModelText]}>{item.label}</Text>
                                    {accent === item.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={{ marginTop: 15 }}>
                            <Button title="Cancel" onPress={() => setShowAccentPicker(false)} />
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showPasswordModal}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Current password"
                                placeholderTextColor={colors.placeholder}
                                secureTextEntry={!showCurrentPassword}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeButton}>
                                <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={22} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="New password"
                                placeholderTextColor={colors.placeholder}
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                                <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={22} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Confirm new password"
                                placeholderTextColor={colors.placeholder}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginTop: 15, gap: 10 }}>
                            <Button title="Update Password" onPress={handleChangePassword} />
                            <Button title="Cancel" onPress={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false); }} color="#999" />
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}
