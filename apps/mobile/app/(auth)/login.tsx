import { Link, router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth/AuthContext'
import { AuthLegalLinks } from '@/components/auth/AuthLegalLinks'
import { colors, fontSize, space } from '@/theme/tokens'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await signIn(email, password)
      if (err) {
        setError(err)
        return
      }
      router.replace('/(tabs)/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + space.xxl }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Välkommen tillbaka</Text>
      <View style={styles.field}>
        <Text style={styles.label}>E-post</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          placeholder="du@exempel.se"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Lösenord</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : (
        <View style={styles.errorSpacer} />
      )}
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading || !email || !password}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.buttonLabel}>Logga in</Text>
        )}
      </Pressable>
      <Text style={styles.sub}>
        Inget konto?{' '}
        <Link href="/(auth)/register" style={styles.link}>
          Skapa konto
        </Link>
      </Text>
      <AuthLegalLinks />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: space.xxl,
  },
  field: {
    marginBottom: space.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.lg,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginBottom: space.lg,
    minHeight: 18,
  },
  errorSpacer: {
    minHeight: 18,
    marginBottom: space.lg,
  },
  button: {
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: colors.surface,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  sub: {
    marginTop: space.xl,
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
})
