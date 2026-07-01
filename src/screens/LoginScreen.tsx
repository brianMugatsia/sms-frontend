import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { TextInput, Card, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { login } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await login(username, password);
      await AsyncStorage.setItem("token", res.access_token);
      if (res.refresh_token) {
        await AsyncStorage.setItem("refresh_token", res.refresh_token);
      }
      navigation.replace("Dashboard");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: 20, borderRadius: 12 }}>
          <Card.Title title="Welcome Back" />
          <Card.Content>
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              left={<TextInput.Icon icon={() => <Icon name="person" size={20} />} />}
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Password"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              mode="outlined"
              left={<TextInput.Icon icon={() => <Icon name="lock" size={20} />} />}
              style={{ marginBottom: 12 }}
            />
            {error ? <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text> : null}
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <Button mode="contained" onPress={handleLogin}>Login</Button>
            )}
          </Card.Content>
        </Card>
        <TouchableOpacity onPress={() => navigation.replace("Register")} style={{ marginTop: 20, alignSelf: "center" }}>
          <Text style={{ color: "#007AFF" }}>Don’t have an account? Register here</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
