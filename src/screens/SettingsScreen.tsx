import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";

import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getSettings,
  saveSettings,
} from "../services/api";

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
};

type FieldKey =
  | "storageEndpoint"
  | "storageApiKey";

function isValidUrl(value: string): boolean {
  if (value.trim() === "") return true;

  try {
    const url = new URL(value.trim());

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export default function SettingsScreen() {
  const [storageEndpoint, setStorageEndpoint] =
    useState("");

  const [storageApiKey, setStorageApiKey] =
    useState("");

  const [focusedField, setFocusedField] =
    useState<FieldKey | null>(null);

  const [keyboardHeight, setKeyboardHeight] =
    useState(0);

  const insets = useSafeAreaInsets();

  const scrollRef =
    useRef<ScrollView>(null);

  const storageUrlRef =
    useRef<TextInput>(null);

  const storageKeyRef =
    useRef<TextInput>(null);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios"
        ? "keyboardWillShow"
        : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios"
        ? "keyboardWillHide"
        : "keyboardDidHide";

    const onShow = (
      e: KeyboardEvent
    ) => {
      setKeyboardHeight(
        e.endCoordinates?.height ?? 0
      );
    };

    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub =
      Keyboard.addListener(
        showEvent,
        onShow
      );

    const hideSub =
      Keyboard.addListener(
        hideEvent,
        onHide
      );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const settings =
        await getSettings();

      setStorageEndpoint(
        settings.storage_endpoint ?? ""
      );

      setStorageApiKey(
        settings.storage_api_key ?? ""
      );
    } catch (e) {
      console.log(
        "Failed loading settings",
        e
      );
    }
  };

  const save = async () => {
    Keyboard.dismiss();

    if (
      !isValidUrl(storageEndpoint)
    ) {
      Alert.alert(
        "Invalid URL",
        "Storage endpoint is invalid."
      );

      return;
    }

    try {
      await saveSettings({
        storage_endpoint:
          storageEndpoint.trim(),

        storage_api_key:
          storageApiKey.trim(),
      });

      Alert.alert(
        "Success",
        "Settings saved successfully."
      );
    } catch (error: any) {
      console.error(error);

      Alert.alert(
        "Error",
        error?.response?.data?.detail ??
          "Failed to save settings."
      );
    }
  };

  const scrollToInput = (
    inputRef?: React.RefObject<TextInput>
  ) => {
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
    }, Platform.OS === "ios" ? 50 : 100);
  };

  const handleFocus = (
    fieldKey: FieldKey,
    inputRef?: React.RefObject<TextInput>
  ) => {
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

        <View
          style={[
            styles.inputWrap,
            isFocused && styles.inputWrapFocused,
            opts.invalid && styles.inputWrapError,
          ]}
        >
          <Icon
            name={opts.icon}
            size={18}
            color={
              opts.invalid
                ? COLORS.danger
                : isFocused
                ? COLORS.primary
                : COLORS.subtext
            }
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
            onFocus={() =>
              handleFocus(opts.fieldKey, opts.inputRef)
            }
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {opts.invalid && (
          <Text style={styles.errorText}>
            {opts.errorText ?? "Enter a valid URL."}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingBottom:
                40 +
                insets.bottom +
                60 +
                (keyboardHeight > 0
                  ? keyboardHeight
                  : 0),
            },
          ]}
        >
          <View style={styles.headerSection}>
            <View style={styles.headerIconWrap}>
              <Icon
                name="dns"
                size={24}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.header}>
              Storage Settings
            </Text>

            <Text style={styles.description}>
              Configure the endpoint where SMS messages
              will be forwarded. Leave the endpoint empty
              to use the backend default endpoint.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Storage Endpoint
            </Text>

            <Text style={styles.sectionSubtitle}>
              SMS messages will be forwarded to this
              endpoint.
            </Text>

            {renderField({
              fieldKey: "storageEndpoint",
              label: "STORAGE ENDPOINT",
              icon: "cloud-upload",
              placeholder:
                "https://example.com/api/store",
              value: storageEndpoint,
              onChangeText: setStorageEndpoint,
              invalid: !isValidUrl(storageEndpoint),
              inputRef: storageUrlRef,
              returnKeyType: "next",
              onSubmitEditing: () =>
                storageKeyRef.current?.focus(),
            })}

            {renderField({
              fieldKey: "storageApiKey",
              label: "API KEY (OPTIONAL)",
              icon: "vpn-key",
              placeholder: "Bearer/API Key",
              value: storageApiKey,
              onChangeText: setStorageApiKey,
              secure: true,
              inputRef: storageKeyRef,
              returnKeyType: "done",
              onSubmitEditing: save,
            })}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={save}
            activeOpacity={0.85}
          >
            <Icon
              name="save"
              size={20}
              color="#fff"
            />
            <Text style={styles.buttonText}>
              Save Settings
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },

  headerSection: {
    marginBottom: 24,
  },

  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  header: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.4,
  },

  description: {
    color: COLORS.subtext,
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#111827",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: COLORS.subtext,
    fontSize: 13,
    lineHeight: 18,
  },

  fieldGroup: {
    marginTop: 16,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.subtext,
    letterSpacing: 0.6,
    marginBottom: 8,
  },

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

  inputWrapFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: "#FFFFFF",
  },

  inputWrapError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerSoft,
  },

  inputIcon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: "100%",
    padding: 0,
    color: COLORS.text,
    fontSize: 15,
  },

  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.danger,
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});