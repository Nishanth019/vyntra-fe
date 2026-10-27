import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TextField } from '@/components/ui/text-field';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';

type Fields = 'login' | 'password';

export default function LoginScreen() {
  const { signIn } = useSession();
  const passwordRef = useRef<TextInput>(null);

  const [values, setValues] = useState<Record<Fields, string>>({ login: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field: Fields, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    const login = values.login.trim();
    const nextErrors: Partial<Record<Fields, string>> = {};
    if (!login) nextErrors.login = 'Enter your email or mobile number.';
    if (!values.password) nextErrors.password = 'Enter your password.';

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(await api.login(login, values.password));
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setErrors(error.fieldErrors);
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your business"
      footer={{ prompt: 'New to Manaze?', linkLabel: 'Create an account', href: '/signup' }}>
      {formError ? <ErrorBanner message={formError} /> : null}

      <TextField
        label="Email or mobile number"
        hideLabel
        icon="mail"
        placeholder="Email or mobile number"
        value={values.login}
        onChangeText={(text) => update('login', text)}
        error={errors.login}
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
        keyboardType="email-address"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        hideLabel
        icon="lock"
        placeholder="Password"
        password
        value={values.password}
        onChangeText={(text) => update('password', text)}
        error={errors.password}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Button title="Log in" trailingIcon="arrowRight" loading={submitting} onPress={submit} />
    </AuthLayout>
  );
}
