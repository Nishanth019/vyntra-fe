import { Pressable, StyleSheet } from 'react-native';

import { PersonRow } from '@/components/member-row';
import { StatusPill } from '@/components/status-pill';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import type { PgTenant } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatDate } from '@/lib/dates';
import { formatMoney, memberName } from '@/lib/format';
import { bedLabel, rentMessage, tenantStatus } from '@/lib/pg';
import { openWhatsApp } from '@/lib/whatsapp';

/** A tenant in a list: bed, rent, what they owe, and a one-tap WhatsApp reminder when rent is due. */
export function TenantRow({ tenant, upiId, onPress }: { tenant: PgTenant; upiId?: string | null; onPress?: () => void }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const status = tenantStatus(tenant);
  const owes = Number(tenant.total_due) > 0;

  return (
    <PersonRow
      name={memberName(tenant)}
      details={[
        tenant.tenancy ? `${bedLabel(tenant.tenancy)} · ${formatMoney(tenant.tenancy.rent)}/month` : null,
        tenant.phone,
      ]}
      alert={
        owes
          ? `Due ${formatMoney(tenant.total_due)}${tenant.oldest_due_date ? ` since ${formatDate(tenant.oldest_due_date)}` : ''}`
          : undefined
      }
      badge={<StatusPill {...status} />}
      muted={status.tone === 'neutral'}
      trailing={
        owes && tenant.phone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`WhatsApp ${memberName(tenant)}`}
            hitSlop={8}
            onPress={() => openWhatsApp(tenant.phone!, rentMessage(tenant, account.name, upiId))}
            style={({ pressed }) => [styles.whatsapp, { backgroundColor: theme.primarySoft }, pressed && styles.pressed]}>
            <Icon name="chat" color={theme.primary} size={20} />
          </Pressable>
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  whatsapp: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
