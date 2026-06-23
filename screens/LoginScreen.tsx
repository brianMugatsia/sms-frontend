import React, { useState } from "react";
import { View, TextInput, Button, ActivityIndicator, Text } from "react-native";
import { login } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      await AsyncStorage.setItem("refresh_token", res.refresh_token);
      onLoginSuccess(res.access_token);
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ marginBottom: 10, borderWidth: 1, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={{ marginBottom: 10, borderWidth: 1, padding: 8 }}
      />
      {error ? <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
