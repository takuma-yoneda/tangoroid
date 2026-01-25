import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
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
