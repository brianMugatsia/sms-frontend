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
import axios from "axios";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("https://sms-backend-w6d5.onrender.com/api/users/register", {
        username,
        email,
        password,
        role: "user",
      });
      setSuccess("Registration successful! You can now log in.");
      navigation.replace("Login");
    } catch (err) {
      setError("Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: 20, borderRadius: 12 }}>
          <Card.Title title="Create Account" />
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
              label="Email"
              value={email}
              keyboardType="email-address"
              onChangeText={setEmail}
              mode="outlined"
              left={<TextInput.Icon icon={() => <Icon name="email" size={20} />} />}
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
            {success ? <Text style={{ color: "green", marginBottom: 10 }}>{success}</Text> : null}
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <Button mode="contained" onPress={handleRegister}>Register</Button>
            )}
          </Card.Content>
        </Card>
        <TouchableOpacity onPress={() => navigation.replace("Login")} style={{ marginTop: 20, alignSelf: "center" }}>
          <Text style={{ color: "#007AFF" }}>Already registered? Log in here</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
