import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PAYMENT_METHODS } from '@/lib/payments';

/** Cash / UPI / Card / Bank, one row of options. */
export function PaymentMethodPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>Payment Method</Text>
      <View style={styles.row}>
        {PAYMENT_METHODS.map((method) => (
          <View key={method.value} style={styles.flex}>
            <Chip
              label={method.label}
              icon={method.icon}
              selected={value === method.value}
              onPress={() => onChange(method.value)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
