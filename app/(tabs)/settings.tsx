import { View, Text, StyleSheet, Button, Alert, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore, AI_MODELS, ACCENTS } from '../../stores/useSettingsStore';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const { setUser } = useAuthStore();
    const { aiModel, setAiModel, accent, setAccent } = useSettingsStore();
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [showAccentPicker, setShowAccentPicker] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
                <Text style={styles.header}>AI Settings</Text>
                <TouchableOpacity style={styles.settingRow} onPress={() => setShowModelPicker(true)}>
                    <View>
                        <Text style={styles.settingLabel}>Model</Text>
                        <Text style={styles.settingValue}>{aiModel}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingRow} onPress={() => setShowAccentPicker(true)}>
                    <View>
                        <Text style={styles.settingLabel}>Pronunciation Accent</Text>
                        <Text style={styles.settingValue}>{ACCENTS.find(a => a.value === accent)?.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.header}>About</Text>
                <Text style={styles.text}>Tangoroid</Text>
                <Text style={styles.text}>Version 1.0.0</Text>
            </View>


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
                                    {aiModel === model && <Ionicons name="checkmark" size={20} color="#007AFF" />}
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
                                    {accent === item.value && <Ionicons name="checkmark" size={20} color="#007AFF" />}
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
                        <TextInput
                            style={styles.input}
                            placeholder="Current password"
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="New password"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <View style={{ marginTop: 15, gap: 10 }}>
                            <Button title="Update Password" onPress={handleChangePassword} />
                            <Button title="Cancel" onPress={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} color="#999" />
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F2F2F7',
    },
    section: {
        backgroundColor: 'white',
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
        color: '#333',
    },
    email: {
        fontSize: 16,
        marginBottom: 10,
        color: '#666',
    },
    text: {
        fontSize: 16,
        color: '#666',
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
        color: '#333',
    },
    settingValue: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
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
    },
    modelOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedOption: {
        backgroundColor: '#F5F9FF',
    },
    modelText: {
        fontSize: 16,
        color: '#333',
    },
    selectedModelText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 10,
    }
});
