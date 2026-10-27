import { Link, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/ui/brand-mark';
import { Gradient } from '@/components/ui/gradient';
import { Icon } from '@/components/ui/icon';
import { MaxFormWidth, Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { POLICY_LINKS } from '@/lib/links';

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  /** Link to the other auth screen, e.g. "New to Manaze? Create an account". */
  footer: { prompt: string; linkLabel: string; href: Href };
}>;

export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.art}>
        <Icon name="dumbbell" color={theme.primary} size={260} />
      </View>
      {/* Scrolls the focused field above the keyboard on both Android and iOS. */}
      <KeyboardAwareScrollView
        bottomOffset={Spacing.four}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.brand}>
            <View style={[styles.logo, shadow(theme.primary, 3)]}>
              <Gradient from={theme.primary} to={theme.primaryEnd} />
              <BrandMark color={theme.onPrimary} size={48} />
            </View>
            <Text style={[styles.brandName, { color: theme.text }]}>Manaze</Text>
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

          <View style={styles.policies}>
            {POLICY_LINKS.map((policy) => (
              <Pressable key={policy.url} accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(policy.url)}>
                <Text style={[styles.policyLink, { color: theme.textSecondary }]}>{policy.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  art: {
    position: 'absolute',
    opacity: 0.14,
    right: -50,
    bottom: -40,
    transform: [{ rotate: '-25deg' }],
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  brandName: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heading: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
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
  policies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  policyLink: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
