import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FAQS = [
  {
    question: 'How do I add a member?',
    answer:
      'Tap the add-member icon at the top of the dashboard (or "Add Member"). Enter their details, choose a plan and, if they paid, record the payment. Their membership end date is worked out from the plan.',
  },
  {
    question: 'Why do I need a plan before adding members?',
    answer:
      'Every member joins on a membership plan, which sets the price and how long the membership lasts. Create plans from the menu under Membership Plans.',
  },
  {
    question: 'How do I renew or change a membership?',
    answer:
      'Open the member, choose a different plan under Membership and save. The old membership ends and a new one starts on the date you pick.',
  },
  {
    question: 'How do I record a payment later?',
    answer:
      'Open the member, turn on Payment, enter the amount and method, and save. It is added to their current membership and shows in Payment History.',
  },
  {
    question: 'What do Live, Expired and Expiring mean?',
    answer:
      'Live members have a membership that ends today or later. Expired members are still active but their membership end date has passed. Expiring shows memberships ending in the next 0–3, 4–7 or 8–15 days, so you can follow up before they lapse.',
  },
  {
    question: 'How do I mark attendance?',
    answer:
      'Open Attendance from the menu and tap +, choose the member and the date. You can mark today or any of the last 30 days, and check people out from the daily list.',
  },
  {
    question: 'Can someone else manage my business?',
    answer:
      'Yes. Open Manage Users and add them with their own email or mobile and password. You can block their login access at any time.',
  },
  {
    question: 'What happens when I deactivate a member or staff?',
    answer:
      'They stay in your records but are marked inactive. A deactivated member’s current membership ends. You can reactivate them later.',
  },
];

export default function HelpScreen() {
  return (
    <Screen title="Need help?" subtitle="Answers to common questions about using Vyntra.">
      <View style={styles.list}>
        {FAQS.map((faq) => (
          <FaqItem key={faq.question} {...faq} />
        ))}
      </View>
      <Button title="Still stuck? Contact us" icon="support" variant="secondary" onPress={() => router.push('/contact')} />
    </Screen>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.item, { backgroundColor: theme.surface, borderColor: open ? theme.primary : theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.question}>
        <Text style={[styles.questionText, { color: theme.text }]}>{question}</Text>
        <View style={open && styles.rotated}>
          <Icon name="chevronDown" color={open ? theme.primary : theme.textSecondary} size={20} />
        </View>
      </Pressable>
      {open ? <Text style={[styles.answer, { color: theme.textSecondary }]}>{answer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two + 2,
  },
  item: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  rotated: {
    transform: [{ rotate: '180deg' }],
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    paddingBottom: Spacing.three,
  },
});
