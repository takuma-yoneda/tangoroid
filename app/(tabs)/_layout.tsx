import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../hooks/useColors";

export default function TabLayout() {
    const colors = useColors();

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name="words"
                options={{
                    title: "Words",
                    tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name="read"
                options={{
                    title: "Read",
                    tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />
                }}
            />
        </Tabs>
    );
}
