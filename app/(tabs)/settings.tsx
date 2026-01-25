import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../stores/useAuthStore';

export default function SettingsScreen() {
    const { setUser } = useAuthStore();

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
                <View style={{ marginTop: 10 }}>
                    <Button title="Sign Out" onPress={handleSignOut} color="#FF3B30" />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.header}>About</Text>
                <Text style={styles.text}>Tangoroid</Text>
                <Text style={styles.text}>Version 1.0.0</Text>
            </View>
        </View>
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
    }
});
