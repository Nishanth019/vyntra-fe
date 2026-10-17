import { useCallback, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, type NotificationSettings } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { registerForPush } from '@/lib/push';

const OPTIONS: { key: keyof NotificationSettings; title: string; detail: string }[] = [
  {
    key: 'morning_summary',
    title: 'Morning summary · 8 AM',
    detail: 'One push with what needs attention today. Turn off to get each alert below as its own push.',
  },
  { key: 'expiry_reminders', title: 'Plans ending', detail: 'Plans ending today, tomorrow and in 3 days.' },
  {
    key: 'expired_followups',
    title: 'Expired plans',
    detail: 'Expired yesterday, and a last call 2 days before they move to Inactive.',
  },
  { key: 'dues_reminders', title: 'Dues pending', detail: 'Every Monday: who still owes money.' },
  { key: 'no_show_alerts', title: "Members not showing up", detail: 'Every Monday: live members with no check-in for a week.' },
  { key: 'birthday_alerts', title: 'Birthdays', detail: "Members' birthdays today." },
  { key: 'activity_alerts', title: 'Team activity', detail: 'When another admin adds a member or records a payment.' },
  { key: 'evening_summary', title: 'Evening summary · 9 PM', detail: "Today's collections, new members and check-ins." },
];

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const { account } = useBusiness();

  const fetchSettings = useCallback(() => api.notificationSettings(account.id), [account.id]);
  const { data: settings, setData, error, retry } = useResource(fetchSettings);

  if (!settings) return <LoadingState error={error} onRetry={retry} />;

  function toggle(key: keyof NotificationSettings, value: boolean) {
    setData({ ...settings!, [key]: value });
    api.updateNotificationSettings(account.id, { [key]: value }).then(setData, () => {
      setData({ ...settings!, [key]: !value });
    });
  }

  return (
    <Screen subtitle="These apply to everyone who manages this business. Everything also appears under Notifications.">
      <Card>
        {OPTIONS.map((option) => (
          <View key={option.key} style={styles.row}>
            <View style={styles.text}>
              <Text style={[styles.title, { color: theme.text }]}>{option.title}</Text>
              <Text style={[styles.detail, { color: theme.textSecondary }]}>{option.detail}</Text>
            </View>
            <Switch
              value={settings[option.key]}
              onValueChange={(value) => toggle(option.key, value)}
              trackColor={{ true: theme.primary, false: theme.border }}
              accessibilityLabel={option.title}
            />
          </View>
        ))}
      </Card>
      <TestPush />
    </Screen>
  );
}

/** Registers this phone (if needed) and sends it a test push, showing why when it can't. */
function TestPush() {
  const theme = useTheme();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const { problem } = await registerForPush();
      if (problem) {
        setResult({ ok: false, text: problem });
        return;
      }
      await api.sendTestPush();
      setResult({ ok: true, text: 'Sent! It should arrive within a few seconds.' });
    } catch (e) {
      setResult({ ok: false, text: `Couldn't set up push on this phone: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card icon="bell" title="Test on this phone" subtitle="Check that notifications pop up on this phone.">
      <Button title="Send Test Notification" icon="bell" variant="secondary" loading={sending} onPress={send} />
      {result ? (
        <Text style={[styles.detail, { color: result.ok ? theme.success : theme.danger }]}>{result.text}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
  },
});
