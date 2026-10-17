import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { TextField } from '@/components/ui/text-field';
import { api, ApiError, type SignupInput } from '@/lib/api';
import { useSession } from '@/lib/session';

type Fields = keyof SignupInput;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\d{10,15}$/;

function validate(values: SignupInput) {
  const errors: Partial<Record<Fields, string>> = {};
  if (!values.full_name) errors.full_name = 'Enter your full name.';
  if (!MOBILE_PATTERN.test(values.mobile_no)) errors.mobile_no = 'Enter a valid mobile number (10–15 digits).';
  if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Enter a valid email address.';
  if (values.password.length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}

export default function SignupScreen() {
  const { signIn } = useSession();
  const mobileRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [values, setValues] = useState<SignupInput>({ full_name: '', mobile_no: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field: Fields, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    const input: SignupInput = {
      full_name: values.full_name.trim(),
      mobile_no: values.mobile_no.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };
    const nextErrors = validate(input);

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(await api.signup(input));
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setErrors(error.fieldErrors);
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up Vyntra and start managing your members in minutes."
      footer={{ prompt: 'Already have an account?', linkLabel: 'Log in', href: '/login' }}>
      {formError ? <ErrorBanner message={formError} /> : null}

      <TextField
        label="Full name"
        icon="person"
        placeholder="Your name"
        value={values.full_name}
        onChangeText={(text) => update('full_name', text)}
        error={errors.full_name}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => mobileRef.current?.focus()}
      />
      <TextField
        ref={mobileRef}
        label="Mobile number"
        icon="phone"
        placeholder="9876543210"
        value={values.mobile_no}
        onChangeText={(text) => update('mobile_no', text.replace(/\D/g, ''))}
        error={errors.mobile_no}
        maxLength={15}
        autoComplete="tel"
        textContentType="telephoneNumber"
        keyboardType="number-pad"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
        label="Email"
        icon="mail"
        placeholder="you@example.com"
        value={values.email}
        onChangeText={(text) => update('email', text)}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        icon="lock"
        placeholder="At least 8 characters"
        password
        value={values.password}
        onChangeText={(text) => update('password', text)}
        error={errors.password}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Button title="Create account" trailingIcon="arrowRight" loading={submitting} onPress={submit} />
    </AuthLayout>
  );
}
