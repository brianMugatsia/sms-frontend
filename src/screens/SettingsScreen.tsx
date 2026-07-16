import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardEvent,
  Platform,
  UIManager,
  findNodeHandle,
  ActivityIndicator,
} from "react-native";

import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getSettings, saveSettings, testConnection } from "../services/api";

const COLORS = {
  primary: "#4F46E5",
  primarySoft: "#EEF2FF",
  background: "#F7F8FB",
  card: "#FFFFFF",
  text: "#1F2333",
  subtext: "#6B7280",
  border: "#E5E7EB",
  borderFocus: "#4F46E5",
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",
  success: "#16A34A",
  successSoft: "#ECFDF3",
};

type FieldKey = "storageEndpoint" | "storageApiKey";

function isValidUrl(value: string): boolean {
  if (value.trim() === "") return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SettingsScreen() {
  const [storageEndpoint, setStorageEndpoint] = useState("");
  const [storageApiKey, setStorageApiKey] = useState("");
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [secureKeyEntry, setSecureKeyEntry] = useState(true);

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionValid, setConnectionValid] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const storageUrlRef = useRef<TextInput>(null);
  const storageKeyRef = useRef<TextInput>(null);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates?.height ?? 0);
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadSettingsData = useCallback(async () => {
    try {
      const settings = await getSettings();
      setStorageEndpoint(settings.storage_endpoint ?? "");
      setStorageApiKey(settings.storage_api_key ?? "");
      setConnectionValid(false);
      setConnectionMessage("");
    } catch (e) {
      console.error("Failed loading settings", e);
      Alert.alert("Unable to load settings", "Please check your internet connection.");
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const onEndpointChanged = (value: string) => {
    setStorageEndpoint(value);
    setConnectionValid(false);
    setConnectionMessage("");
  };

  const onApiKeyChanged = (value: string) => {
    setStorageApiKey(value);
    setConnectionValid(false);
    setConnectionMessage("");
  };

  const testEndpoint = async () => {
    if (testingConnection) return;
    Keyboard.dismiss();

    const endpoint = storageEndpoint.trim();
    const apiKey = storageApiKey.trim();

    if (!endpoint) {
      Alert.alert("Endpoint Required", "Please enter a storage endpoint to test.");
      return;
    }

    if (!isValidUrl(endpoint)) {
      Alert.alert("Invalid URL", "Enter a valid HTTP or HTTPS URL.");
      return;
    }

    try {
      setTestingConnection(true);
      setConnectionValid(false);
      setConnectionMessage("");

      const result = await testConnection({
        storage_endpoint: endpoint,
        storage_api_key: apiKey,
      });

      setConnectionValid(result.success);
      setConnectionMessage(result.message);

      if (result.success) {
        Alert.alert("Connection Successful", result.message);
      }
    } catch (error: any) {
      setConnectionValid(false);
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.detail ??
        error?.message ??
        "Unable to connect to the server.";
      setConnectionMessage(message);
    } finally {
      setTestingConnection(false);
    }
  };

  const proceedWithSave = async () => {
    if (saving) return;
    const endpoint = storageEndpoint.trim();
    const apiKey = storageApiKey.trim();

    try {
      setSaving(true);
      await saveSettings({ storage_endpoint: endpoint, storage_api_key: apiKey });
      Alert.alert("Success", "Settings saved successfully.");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.response?.data?.detail ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    Keyboard.dismiss();
    const endpoint = storageEndpoint.trim();

    if (endpoint === "") {
      Alert.alert(
        "Use Default Storage",
        "No custom storage endpoint has been provided.\n\nThe backend's default storage endpoint will be used.\n\nDo you want to continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: proceedWithSave },
        ]
      );
      return;
    }

    if (!isValidUrl(endpoint)) {
      Alert.alert("Invalid URL", "Storage endpoint is invalid.");
      return;
    }

    if (!connectionValid) {
      Alert.alert(
        "Connection Required",
        "Please test your custom endpoint and get a successful connection before saving."
      );
      return;
    }

    await proceedWithSave();
  };

  const scrollToInput = (inputRef?: React.RefObject<TextInput>) => {
    if (!inputRef?.current || !scrollRef.current) return;

    setTimeout(() => {
      const scrollHandle = findNodeHandle(scrollRef.current);
      const inputHandle = findNodeHandle(inputRef.current);

      if (!scrollHandle || !inputHandle) return;

      UIManager.measureLayout(
        inputHandle,
        scrollHandle,
        () => {},
        (_x, y) => {
          scrollRef.current?.scrollTo({
            y: Math.max(y - 24, 0),
            animated: true,
          });
        }
      );
    }, Platform.OS === "ios" ? 60 : 120);
  };

  const handleFocus = (fieldKey: FieldKey, inputRef?: React.RefObject<TextInput>) => {
    setFocusedField(fieldKey);
    scrollToInput(inputRef);
  };

  const renderField = (opts: {
    fieldKey: FieldKey;
    label: string;
    icon: keyof typeof Icon.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (v: string) => void;
    secure?: boolean;
    showSecureToggle?: boolean;
    invalid?: boolean;
    errorText?: string;
    inputRef?: React.RefObject<TextInput>;
    returnKeyType?: "next" | "done";
    onSubmitEditing?: () => void;
  }) => {
    const isFocused = focusedField === opts.fieldKey;

    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{opts.label}</Text>
        <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused, opts.invalid && styles.inputWrapError]}>
          <Icon
            name={opts.icon}
            size={18}
            color={opts.invalid ? COLORS.danger : isFocused ? COLORS.primary : COLORS.subtext}
            style={styles.inputIcon}
          />
          <TextInput
            ref={opts.inputRef}
            style={styles.input}
            placeholder={opts.placeholder}
            placeholderTextColor="#9CA3AF"
            value={opts.value}
            onChangeText={opts.onChangeText}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={opts.secure}
            keyboardType={opts.secure ? "default" : "url"}
            returnKeyType={opts.returnKeyType ?? "next"}
            blurOnSubmit={opts.returnKeyType === "done"}
            onSubmitEditing={opts.onSubmitEditing}
            onFocus={() => handleFocus(opts.fieldKey, opts.inputRef)}
            onBlur={() => setFocusedField(null)}
          />
          {opts.showSecureToggle && (
            <TouchableOpacity onPress={() => setSecureKeyEntry((prev) => !prev)} hitSlop={10}>
              <Icon name={opts.secure ? "visibility-off" : "visibility"} size={20} color={COLORS.subtext} />
            </TouchableOpacity>
          )}
        </View>
        {opts.invalid && <Text style={styles.errorText}>{opts.errorText ?? "Enter a valid URL."}</Text>}
      </View>
    );
  };

  const isTestButtonDisabled = testingConnection || !isValidUrl(storageEndpoint) || storageEndpoint.trim() === "";
  const isSaveButtonDisabled = saving || (storageEndpoint.trim() !== "" && !connectionValid);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: 40 + insets.bottom + 60 + (keyboardHeight > 0 ? keyboardHeight : 0) },
          ]}
        >
          <View style={styles.headerSection}>
            <View style={styles.headerIconWrap}>
              <Icon name="dns" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.header}>Storage Settings</Text>
            <Text style={styles.description}>
              Configure the endpoint where SMS messages will be forwarded. Before saving, verify that the endpoint is reachable.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Storage Endpoint</Text>
            <Text style={styles.sectionSubtitle}>
              Enter your webhook or API endpoint. Leave blank to use the backend default. Custom endpoints must be verified before saving.
            </Text>

            {renderField({
              fieldKey: "storageEndpoint",
              label: "STORAGE ENDPOINT",
              icon: "cloud-upload",
              placeholder: "https://example.com/api/store",
              value: storageEndpoint,
              onChangeText: onEndpointChanged,
              invalid: !isValidUrl(storageEndpoint),
              inputRef: storageUrlRef,
              returnKeyType: "next",
              onSubmitEditing: () => storageKeyRef.current?.focus(),
            })}

            {renderField({
              fieldKey: "storageApiKey",
              label: "API KEY (OPTIONAL)",
              icon: "vpn-key",
              placeholder: "Bearer/API Key",
              value: storageApiKey,
              onChangeText: onApiKeyChanged,
              secure: secureKeyEntry,
              showSecureToggle: true,
              inputRef: storageKeyRef,
              returnKeyType: "done",
              onSubmitEditing: isTestButtonDisabled ? undefined : testEndpoint,
            })}

            {!!connectionMessage && (
              <View style={[styles.statusBox, connectionValid ? styles.statusSuccess : styles.statusError]}>
                <Icon
                  name={connectionValid ? "check-circle" : "error"}
                  size={18}
                  color={connectionValid ? COLORS.success : COLORS.danger}
                />
                <Text style={[styles.statusText, { color: connectionValid ? COLORS.success : COLORS.danger }]}>
                  {connectionMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.testButton, isTestButtonDisabled && styles.disabledButton]}
              disabled={isTestButtonDisabled}
              onPress={testEndpoint}
              activeOpacity={0.85}
            >
              {testingConnection ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.buttonText}>Testing connection...</Text>
                </>
              ) : (
                <>
                  <Icon name="wifi" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Test Connection</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isSaveButtonDisabled && styles.disabledButton]}
            disabled={isSaveButtonDisabled}
            onPress={save}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.buttonText}>Save Settings</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { flexGrow: 1, padding: 20 },
  headerSection: { marginBottom: 24 },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  header: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 8, letterSpacing: -0.4 },
  description: { color: COLORS.subtext, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, letterSpacing: -0.2 },
  sectionSubtitle: { marginTop: 4, marginBottom: 10, color: COLORS.subtext, fontSize: 13, lineHeight: 18 },
  fieldGroup: { marginTop: 16 },
  label: { fontSize: 11, fontWeight: "700", color: COLORS.subtext, letterSpacing: 0.6, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: "#FAFAFB",
  },
  inputWrapFocused: { borderColor: COLORS.borderFocus, backgroundColor: "#FFFFFF" },
  inputWrapError: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerSoft },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: "100%", padding: 0, color: COLORS.text, fontSize: 15 },
  errorText: { marginTop: 6, fontSize: 12, color: COLORS.danger },
  statusBox: { marginTop: 18, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center" },
  statusSuccess: { backgroundColor: COLORS.successSoft, borderWidth: 1, borderColor: "#BBF7D0" },
  statusError: { backgroundColor: COLORS.dangerSoft, borderWidth: 1, borderColor: "#FECACA" },
  statusText: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  testButton: {
    height: 52,
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: "#0F766E",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    height: 54,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonText: { color: "#FFFFFF", fontSize: 15.5, fontWeight: "700", letterSpacing: 0.2 },
  disabledButton: { opacity: 0.45 },
});