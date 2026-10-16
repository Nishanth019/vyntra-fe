import { useCallback } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, type NotificationSettings } from '@/lib/api';
import { useBusiness } from '@/lib/business';

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
    </Screen>
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
