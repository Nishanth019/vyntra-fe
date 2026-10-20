import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type BusinessAccount } from '@/lib/api';
import { defaultBusiness } from '@/lib/default-business';
import { useSession } from '@/lib/session';

type OrganisationSwitcherProps = {
  current: BusinessAccount;
  /** Called after any choice, so the menu can close. */
  onDone: () => void;
};

/** Every organisation the admin can open, grouped by business type, plus a way to add another. */
export function OrganisationSwitcher({ current, onDone }: OrganisationSwitcherProps) {
  const theme = useTheme();
  const { admin } = useSession();
  const [accounts, setAccounts] = useState<BusinessAccount[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.businessAccounts().then(
      ({ results }) => setAccounts(results),
      (e) => {
        if (!(e instanceof ApiError)) throw e;
        setError(e.message);
      },
    );
  }, []);

  // Goes through the home screen, which opens the default business from the top. Replacing the
  // route from inside the business would keep the open business's screens and their data.
  async function open(account: BusinessAccount) {
    onDone();
    if (account.id === current.id || !admin) return;
    await defaultBusiness.set(admin.id, account.id);
    router.replace('/');
  }

  function addOrganisation() {
    onDone();
    const type = current.business_type;
    router.push({ pathname: '/accounts/new', params: { typeId: type.id, typeName: type.name } });
  }

  function allBusinessTypes() {
    onDone();
    router.replace({ pathname: '/', params: { switch: '1' } });
  }

  return (
    <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {error ? <ErrorBanner message={error} /> : null}
      {!accounts && !error ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null}

      {accounts
        ? groupByType(accounts, current).map(({ typeName, items }) => (
            <View key={typeName}>
              <Text style={[styles.typeName, { color: theme.textSecondary }]}>{typeName}</Text>
              {items.map((account) => (
                <OrganisationRow
                  key={account.id}
                  account={account}
                  selected={account.id === current.id}
                  onPress={() => open(account)}
                />
              ))}
            </View>
          ))
        : null}

      <View style={[styles.actions, { borderColor: theme.border }]}>
        <Action icon="add" title={`Add ${current.business_type.name.toLowerCase()}`} onPress={addOrganisation} />
        <Action icon="store" title="Other business types" onPress={allBusinessTypes} />
      </View>
    </View>
  );
}

/** The current organisation's type comes first; the rest keep the order the API returned. */
function groupByType(accounts: BusinessAccount[], current: BusinessAccount) {
  const groups = new Map<number, { typeName: string; items: BusinessAccount[] }>();
  groups.set(current.business_type.id, { typeName: current.business_type.name, items: [] });
  for (const account of accounts) {
    const type = account.business_type;
    if (!groups.has(type.id)) groups.set(type.id, { typeName: type.name, items: [] });
    groups.get(type.id)!.items.push(account);
  }
  return [...groups.values()].filter((group) => group.items.length > 0);
}

function OrganisationRow({
  account,
  selected,
  onPress,
}: {
  account: BusinessAccount;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const place = [account.city, account.state].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, (pressed || selected) && { backgroundColor: theme.primarySoft }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
          {account.name}
        </Text>
        {place ? (
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {place}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon name="check" color={theme.primary} size={20} /> : null}
    </Pressable>
  );
}

function Action({ icon, title, onPress }: { icon: IconName; title: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.primarySoft }]}>
      <Icon name={icon} color={theme.primary} size={20} />
      <Text style={[styles.actionTitle, { color: theme.primary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  loading: {
    paddingVertical: Spacing.three,
  },
  typeName: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
  },
  actions: {
    marginTop: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});
