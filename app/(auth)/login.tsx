import { useState, useMemo } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const colors = useColors();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            padding: 20,
            backgroundColor: colors.background,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: colors.text,
        },
        input: {
            borderWidth: 1,
            borderColor: colors.border,
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
            color: colors.text,
            backgroundColor: colors.surface,
        },
        passwordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 5,
            marginBottom: 10,
            backgroundColor: colors.surface,
        },
        passwordInput: {
            flex: 1,
            padding: 10,
            color: colors.text,
        },
        eyeButton: {
            padding: 10,
        },
        link: {
            marginTop: 15,
            textAlign: 'center',
            color: colors.primary,
        },
    }), [colors]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.textMuted} />
                </TouchableOpacity>
            </View>
            {loading ? (
                <ActivityIndicator size="large" />
            ) : (
                <Button title="Login" onPress={handleLogin} />
            )}
            <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                    <Text style={styles.link}>Don't have an account? Sign Up</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}
