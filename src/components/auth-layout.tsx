import { Link, type Href } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  /** Link to the other auth screen, e.g. "New to Vyntra? Create an account". */
  footer: { prompt: string; linkLabel: string; href: Href };
}>;

export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.brand}>
              <View style={[styles.logo, { backgroundColor: theme.primary }]}>
                <Text style={[styles.logoText, { color: theme.onPrimary }]}>V</Text>
              </View>
              <Text style={[styles.brandName, { color: theme.text }]}>Vyntra</Text>
            </View>

            <View style={styles.heading}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
            </View>

            <View style={styles.form}>{children}</View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>{footer.prompt}</Text>
              <Link href={footer.href} replace style={[styles.footerLink, { color: theme.primary }]}>
                {footer.linkLabel}
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxFormWidth,
    alignSelf: 'center',
    gap: Spacing.five,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heading: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    gap: Spacing.three + 4,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
