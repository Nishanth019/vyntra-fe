import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MemberRow } from '@/components/member-row';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member } from '@/lib/api';
import { useBusiness } from '@/lib/business';

type MemberPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: Member) => void;
  /** Only list active members, e.g. when marking attendance. */
  activeOnly?: boolean;
};

/** A searchable sheet for choosing one member. */
export function MemberPicker({ visible, onClose, onSelect, activeOnly = false }: MemberPickerProps) {
  const theme = useTheme();
  const { account } = useBusiness();

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<Member[] | null>(null);
  const [error, setError] = useState('');

  // Search once typing pauses (immediately when the sheet opens).
  useEffect(() => {
    if (!visible) return;
    const search = searchText.trim();
    // A slower answer to an earlier search mustn't replace the newer one.
    let stale = false;
    const timer = setTimeout(
      () => {
        api
          .members({
            business_account_id: account.id,
            search: search || undefined,
            is_active: activeOnly ? true : undefined,
          })
          .then(
            ({ results: members }) => {
              if (stale) return;
              setResults(members);
              setError('');
            },
            (e) => {
              if (!(e instanceof ApiError)) throw e;
              if (!stale) setError(e.message);
            },
          );
      },
      search ? 350 : 0,
    );
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [visible, searchText, account.id, activeOnly]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Select Member</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={onClose}>
            <Icon name="close" color={theme.text} size={24} />
          </Pressable>
        </View>
        <View style={styles.search}>
          <TextField
            label="Search members"
            hideLabel
            icon="search"
            placeholder="Name, phone or member ID"
            autoCapitalize="none"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        {error ? (
          <View style={styles.search}>
            <ErrorBanner message={error} />
          </View>
        ) : null}
        {results === null ? (
          error ? null : <ActivityIndicator color={theme.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(member) => String(member.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <MemberRow
                member={item}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="personOff"
                title="No members found"
                message={searchText ? 'Try a different name, phone or ID.' : undefined}
              />
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  search: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  loader: {
    marginTop: Spacing.five,
  },
  list: {
    gap: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
});
