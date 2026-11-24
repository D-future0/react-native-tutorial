import { useQueryClient, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import ErrorState from '../../src/components/ErrorState';
import LoadingState from '../../src/components/LoadingState';
import { fetchCurrentUser, login, register } from '../../src/features/auth/api';
import { saveSessionTokens } from '../../src/features/auth/session';
import { logoutSession } from '../../src/features/auth/session-manager';
import { useAuthStore } from '../../src/features/auth/store';
import { loginSchema, registerSchema } from '../../src/features/auth/validation';
import { theme } from '../../src/theme';

type AuthMode = 'login' | 'register';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: ({ signal }) => fetchCurrentUser(accessToken ?? '', signal),
    enabled: Boolean(accessToken),
  });

  async function submitAuth() {
    setFormError(null);
    const schema = mode === 'register' ? registerSchema : loginSchema;
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Check your email and password.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setFormError('Those passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const response =
        mode === 'register'
          ? await register(result.data.email, result.data.password)
          : await login(result.data.email, result.data.password);
      setAccessToken(null);
      await saveSessionTokens(response.accessToken, response.refreshToken);
      setAccessToken(response.accessToken);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not sign in right now.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setFormError(null);
    setBusy(true);
    try {
      await logoutSession();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not sign out right now.',
      );
    } finally {
      setAccessToken(null);
      queryClient.removeQueries({ queryKey: ['auth', 'me'] });
      queryClient.removeQueries({ queryKey: ['orders'] });
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : Platform.OS === 'android'
              ? 'height'
              : undefined
        }
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>A LITTLE ABOUT YOU</Text>
            <Text style={styles.title}>Your account</Text>
          </View>
          <Text style={styles.brand}>S.</Text>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Keep the good things close.</Text>
          <Text style={styles.welcomeCopy}>
            Sign in to your account to place an order and view your order history.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/orders')}
            style={styles.ordersLink}
          >
            <Text style={styles.ordersLinkText}>View your orders  ↗</Text>
          </Pressable>
        </View>

        {accessToken ? (
          profile.isLoading ? (
            <View style={styles.accountLoading}>
              <LoadingState label="Checking your account…" />
            </View>
          ) : profile.isError ? (
            <View style={styles.accountCard}>
              <ErrorState
                message={
                  profile.error instanceof Error
                    ? profile.error.message
                    : 'Your profile could not be loaded.'
                }
                onRetry={() => void profile.refetch()}
              />
              <Button
                title="Sign out"
                variant="secondary"
                onPress={() => void signOut()}
                loading={busy}
              />
            </View>
          ) : (
            <View style={styles.accountCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile.data?.email.charAt(0).toUpperCase() ?? 'M'}
                </Text>
              </View>
              <Text style={styles.accountEyebrow}>SIGNED IN AS</Text>
              <Text style={styles.accountEmail}>{profile.data?.email}</Text>
              <Text style={styles.accountNote}>
                Your account is ready for all the things you find here.
              </Text>
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <Button
                title="Sign out"
                variant="secondary"
                onPress={() => void signOut()}
                loading={busy}
                style={styles.signOut}
              />
            </View>
          )
        ) : (
          <View style={styles.formCard}>
            <View style={styles.modeTabs}>
              {(['login', 'register'] as const).map((authMode) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === authMode }}
                  key={authMode}
                  onPress={() => {
                    setMode(authMode);
                    setFormError(null);
                  }}
                  style={[
                    styles.modeTab,
                    mode === authMode && styles.modeTabSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeLabel,
                      mode === authMode && styles.modeLabelSelected,
                    ]}
                  >
                    {authMode === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.formTitle}>
              {mode === 'login' ? 'Welcome back.' : 'Join the good list.'}
            </Text>
            <Text style={styles.formCopy}>
              {mode === 'login'
                ? 'Sign in to pick up where you left off.'
                : 'A few details and you’re all set.'}
            </Text>

            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.muted}
              returnKeyType="next"
              style={styles.input}
              value={email}
            />

            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onChangeText={setPassword}
              onSubmitEditing={() => void submitAuth()}
              placeholder={mode === 'login' ? 'Your password' : 'At least 8 characters'}
              placeholderTextColor={theme.colors.muted}
              returnKeyType="done"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            {mode === 'register' ? (
              <>
                <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  accessibilityLabel="Confirm password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={() => void submitAuth()}
                  placeholder="Type it once more"
                  placeholderTextColor={theme.colors.muted}
                  returnKeyType="done"
                  secureTextEntry
                  style={styles.input}
                  value={confirmPassword}
                />
              </>
            ) : null}

            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <Button
              title={mode === 'login' ? 'Sign in' : 'Create account'}
              loading={busy}
              disabled={busy}
              onPress={() => void submitAuth()}
              style={styles.submitButton}
            />
            <Text style={styles.privacy}>
              Your password is never saved on this device.
            </Text>
          </View>
        )}

        <Text style={styles.footerNote}>Thoughtfully chosen. Yours to enjoy.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  keyboardAvoiding: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  eyebrow: { color: theme.colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 4, color: theme.colors.ink, fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  brand: { color: theme.colors.primary, fontSize: 28, fontWeight: '800' },
  welcomeCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.primary,
  },
  welcomeTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  welcomeCopy: { marginTop: 6, color: '#E1E9E0', fontSize: 13, lineHeight: 19 },
  ordersLink: { alignSelf: 'flex-start', marginTop: 15 },
  ordersLinkText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  formCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
  },
  modeTabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.background,
  },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: theme.radius.pill, alignItems: 'center' },
  modeTabSelected: { backgroundColor: theme.colors.surface },
  modeLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  modeLabelSelected: { color: theme.colors.ink },
  formTitle: { marginTop: 20, color: theme.colors.ink, fontSize: 22, fontWeight: '700' },
  formCopy: { marginTop: 4, marginBottom: 18, color: theme.colors.muted, fontSize: 13 },
  fieldLabel: { marginTop: 13, marginBottom: 7, color: theme.colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.small,
    color: theme.colors.ink,
    backgroundColor: '#FDFDFC',
    fontSize: 14,
  },
  error: { marginTop: 12, color: theme.colors.danger, fontSize: 12, lineHeight: 18 },
  submitButton: { marginTop: 20 },
  privacy: { marginTop: 12, color: theme.colors.muted, fontSize: 11, textAlign: 'center' },
  accountLoading: { minHeight: 180, marginTop: 16 },
  accountCard: {
    marginTop: 18,
    padding: 22,
    alignItems: 'center',
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: theme.colors.primary, fontSize: 22, fontWeight: '800' },
  accountEyebrow: { marginTop: 16, color: theme.colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  accountEmail: { marginTop: 5, color: theme.colors.ink, fontSize: 17, fontWeight: '700' },
  accountNote: { marginTop: 7, color: theme.colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  signOut: { width: '100%', marginTop: 19 },
  footerNote: { marginTop: 25, color: theme.colors.muted, fontSize: 11, textAlign: 'center' },
});