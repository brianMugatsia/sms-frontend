import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MaterialIcons as Icon } from "@expo/vector-icons";

import {
  loadSettings,
  saveSettings,
} from "../services/settingsService";

import { ForwardingSettings } from "../types/settings";

const COLORS = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  primarySoft: "#EEF2FF",
  background: "#F5F6FA",
  card: "#FFFFFF",
  text: "#111827",
  subtext: "#6B7280",
  border: "#E5E7EB",
  borderFocus: "#4F46E5",
  divider: "#F0F1F5",
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",
};

export default function ForwardingRulesScreen() {
  const [settings, setSettings] =
    useState<ForwardingSettings | null>(null);

  const [keyword, setKeyword] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Accounts for the home-indicator / bottom tab bar area so the
  // Save button and last list item are never covered by it.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const s = await loadSettings();
    setSettings(s);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const update = (
    key: keyof ForwardingSettings,
    value: boolean
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const addKeyword = () => {
    if (!settings) return;

    const value = keyword.trim();

    if (!value) {
      Alert.alert("Keyword Required", "Enter a keyword.");
      return;
    }

    const exists = settings.keywords.some(
      k => k.toLowerCase() === value.toLowerCase()
    );

    if (exists) {
      Alert.alert("Duplicate", "Keyword already exists.");
      return;
    }

    setSettings({
      ...settings,
      keywords: [...settings.keywords, value],
    });

    setKeyword("");

    // Keep focus on the input so the user can keep typing
    // keywords one after another without tapping back in.
    inputRef.current?.focus();
  };

  const removeKeyword = (item: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      keywords: settings.keywords.filter(
        k => k !== item
      ),
    });
  };

  const save = async () => {
    if (!settings) return;

    Keyboard.dismiss();
    setSaving(true);

    try {
      await saveSettings(settings);

      Alert.alert(
        "Success",
        "Settings saved successfully."
      );
    } catch {
      Alert.alert(
        "Error",
        "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: 40 + insets.bottom + 60 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={true}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <View style={styles.headerSection}>
              <View style={styles.headerIconWrap}>
                <Icon
                  name="forward-to-inbox"
                  size={26}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.header}>
                Forwarding Rules
              </Text>

              <Text style={styles.subtitle}>
                Forward SMS using keywords you choose.
              </Text>
            </View>

            {/* Enable Forwarding */}
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.title}>
                    Enable Forwarding
                  </Text>

                  <Text style={styles.rowSubtitle}>
                    Turn SMS forwarding on or off.
                  </Text>
                </View>

                <Switch
                  value={settings.enabled}
                  onValueChange={(v) =>
                    update("enabled", v)
                  }
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primary,
                  }}
                  thumbColor="#fff"
                  ios_backgroundColor={COLORS.border}
                />
              </View>
            </View>

            {/* Forward All */}
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.title}>
                    Forward All SMS
                  </Text>

                  <Text style={styles.rowSubtitle}>
                    Ignore keywords and forward every
                    incoming SMS.
                  </Text>
                </View>

                <Switch
                  value={settings.forwardAll}
                  onValueChange={(v) =>
                    update("forwardAll", v)
                  }
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primary,
                  }}
                  thumbColor="#fff"
                  ios_backgroundColor={COLORS.border}
                />
              </View>
            </View>

            {/* Keywords */}
            {!settings.forwardAll && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Keywords
                </Text>

                <Text style={styles.subtitle}>
                  Any SMS containing one of these
                  words will be forwarded.
                </Text>

                <Text style={styles.fieldLabel}>
                  ADD A KEYWORD
                </Text>

                <View style={styles.inputRow}>
                  <View
                    style={[
                      styles.inputWrap,
                      inputFocused && styles.inputWrapFocused,
                    ]}
                  >
                    <Icon
                      name="sell"
                      size={18}
                      color={
                        inputFocused
                          ? COLORS.primary
                          : COLORS.subtext
                      }
                      style={styles.inputIcon}
                    />

                    <TextInput
                      ref={inputRef}
                      value={keyword}
                      onChangeText={setKeyword}
                      placeholder="e.g. M-PESA"
                      placeholderTextColor="#9CA3AF"
                      style={styles.input}
                      returnKeyType="done"
                      onSubmitEditing={addKeyword}
                      blurOnSubmit={false}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      onFocus={() => {
                        setInputFocused(true);
                        setTimeout(
                          () =>
                            scrollRef.current?.scrollToEnd({
                              animated: true,
                            }),
                          150
                        );
                      }}
                      onBlur={() => setInputFocused(false)}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      !keyword.trim() && styles.addButtonDisabled,
                    ]}
                    onPress={addKeyword}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="add"
                      size={22}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>

                {settings.keywords.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Icon
                      name="label-off"
                      size={18}
                      color={COLORS.subtext}
                    />
                    <Text style={styles.emptyText}>
                      No keywords added yet
                    </Text>
                  </View>
                ) : (
                  <View style={styles.keywordList}>
                    {settings.keywords.map((item, index) => (
                      <View
                        key={item}
                        style={[
                          styles.keywordRow,
                          index === settings.keywords.length - 1 &&
                            styles.keywordRowLast,
                        ]}
                      >
                        <View style={styles.keywordLeft}>
                          <View style={styles.keywordDot} />
                          <Text style={styles.keywordText}>
                            {item}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => removeKeyword(item)}
                          hitSlop={{
                            top: 8,
                            bottom: 8,
                            left: 8,
                            right: 8,
                          }}
                        >
                          <Icon
                            name="close"
                            size={18}
                            color={COLORS.subtext}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                saving && styles.buttonDisabled,
              ]}
              onPress={save}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Icon
                name="save"
                size={19}
                color="#fff"
              />

              <Text style={styles.buttonText}>
                {saving
                  ? "Saving..."
                  : "Save Settings"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    color: COLORS.subtext,
    fontSize: 16,
  },

  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },

  headerSection: {
    marginBottom: 28,
  },

  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  header: {
    fontSize: 25,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 20,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowTextWrap: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 15.5,
    fontWeight: "600",
    color: COLORS.text,
  },

  rowSubtitle: {
    marginTop: 3,
    color: COLORS.subtext,
    fontSize: 13,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.subtext,
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: "#FAFAFB",
    paddingHorizontal: 14,
    height: 48,
  },

  inputWrapFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: "#fff",
  },

  inputIcon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
    height: "100%",
  },

  addButton: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },

  addButtonDisabled: {
    backgroundColor: "#C7C9D9",
    shadowOpacity: 0,
    elevation: 0,
  },

  emptyWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },

  emptyText: {
    color: COLORS.subtext,
    fontSize: 13.5,
    marginLeft: 6,
  },

  keywordList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },

  keywordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  keywordRowLast: {
    borderBottomWidth: 0,
  },

  keywordLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  keywordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },

  keywordText: {
    fontSize: 14.5,
    color: COLORS.text,
    fontWeight: "500",
  },

  button: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },

  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonText: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "700",
    marginLeft: 8,
    letterSpacing: 0.2,
  },
});