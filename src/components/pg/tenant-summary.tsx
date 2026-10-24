import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PgTenant } from '@/lib/api';
import { formatMoney, initials, memberName } from '@/lib/format';
import { bedLabel } from '@/lib/pg';

/** The tenant a form is for: name, bed and what they owe. */
export function TenantSummary({ tenant }: { tenant: PgTenant }) {
  const theme = useTheme();
  const due = Number(tenant.total_due);

  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>{initials(memberName(tenant))}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
            {memberName(tenant)}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {tenant.tenancy ? bedLabel(tenant.tenancy) : `#${tenant.member_code}`}
          </Text>
        </View>
        <View style={[styles.due, { borderColor: theme.border }]}>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>Due</Text>
          <Text style={[styles.dueValue, { color: due > 0 ? theme.danger : theme.success }]}>{formatMoney(due)}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  flex: {
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '800',
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  due: {
    alignItems: 'flex-end',
    paddingLeft: Spacing.three - 4,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  dueValue: {
    fontSize: 22,
    fontWeight: '800',
  },
});
