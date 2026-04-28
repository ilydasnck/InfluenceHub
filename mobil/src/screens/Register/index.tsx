import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { authStrings } from '../../assets/Constants/authStrings';
import { AuthCard } from '../../components';
import { createAuthFormStyles } from '../../components/AuthForm/styles';
import { registerWithCredentials } from '../../service/api/auth';

interface RegisterScreenProps {
  onSuccess: (token: string) => void;
  onGoToLogin: () => void;
}

export default function RegisterScreen({
  onSuccess,
  onGoToLogin,
}: RegisterScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createAuthFormStyles(isDark), [isDark]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('E-posta ve şifre gerekli');
      return;
    }
    if (password.length < 8) {
      setError(authStrings.passwordMin);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await registerWithCredentials(
      trimmedEmail,
      password,
      name.trim() || undefined,
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess(result.token);
  }

  const placeholderColor = isDark ? 'rgba(148, 163, 184, 0.9)' : '#94a3b8';

  return (
    <AuthCard>
      <Text style={styles.subtitle}>{authStrings.registerSubtitle}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{authStrings.nameOptional}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          editable={!loading}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{authStrings.email}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={authStrings.emailPlaceholder}
          placeholderTextColor={placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{authStrings.password}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
          editable={!loading}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={isDark ? '#0f172a' : '#ffffff'} />
        ) : (
          <Text style={styles.submitLabel}>
            {loading ? authStrings.registering : authStrings.signUp}
          </Text>
        )}
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerMuted}>{authStrings.hasAccount} </Text>
        <Pressable onPress={onGoToLogin} hitSlop={8} disabled={loading}>
          <Text style={styles.footerLink}>{authStrings.signIn}</Text>
        </Pressable>
      </View>
    </AuthCard>
  );
}
