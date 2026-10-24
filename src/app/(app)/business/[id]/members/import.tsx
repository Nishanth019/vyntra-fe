import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type MemberImportResult, type UploadFile } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { MEMBER_IMPORT_TEMPLATE_URL } from '@/lib/links';

const FILE_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/** Bring a gym's existing members in from Excel or CSV: check the file first, then import the good rows. */
export default function ImportMembersScreen() {
  const theme = useTheme();
  const { account } = useBusiness();

  const [file, setFile] = useState<UploadFile | null>(null);
  const [check, setCheck] = useState<MemberImportResult | null>(null);
  const [done, setDone] = useState<MemberImportResult | null>(null);
  const [busy, setBusy] = useState<'checking' | 'importing' | null>(null);
  const [error, setError] = useState('');

  async function chooseFile() {
    const picked = await DocumentPicker.getDocumentAsync({ type: FILE_TYPES, copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    const upload = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, file: asset.file };
    setFile(upload);
    setCheck(null);
    setDone(null);
    setError('');
    setBusy('checking');
    try {
      setCheck(await api.importMembers(account.id, upload, true));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setBusy(null);
    }
  }

  async function importGoodRows() {
    if (!file) return;
    setError('');
    setBusy('importing');
    try {
      setDone(await api.importMembers(account.id, file, false));
      setCheck(null);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setBusy(null);
    }
  }

  const problems = (done ?? check)?.rows.filter((row) => !row.ok) ?? [];

  return (
    <Screen>
      <Card title="Import members from Excel" subtitle="Move your whole register into Vyntra in one go." tone="accent">
        <Step number={1} text="Add your membership plans first. The Plan column must match a plan name, e.g. Monthly." />
        <Step number={2} text="Download the template, or use your own sheet with the same column headings." />
        <Step number={3} text="Fill one member per row and save as Excel (.xlsx) or CSV, then choose the file below." />
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Required: First Name, Plan, Start Date. Dates as DD-MM-YYYY. Leave Member ID empty to number them
          automatically. Add End Date if a plan doesn&apos;t end on its usual day, and Amount Paid to record what
          they&apos;ve paid.
        </Text>
        <Button
          title="Download Template"
          icon="download"
          variant="secondary"
          onPress={() => Linking.openURL(MEMBER_IMPORT_TEMPLATE_URL)}
        />
      </Card>

      {error ? <ErrorBanner message={error} /> : null}

      <Button
        title={file ? 'Choose Another File' : 'Choose File'}
        icon="upload"
        variant={check?.ok ? 'secondary' : 'primary'}
        loading={busy === 'checking'}
        disabled={busy !== null}
        onPress={chooseFile}
      />

      {check ? (
        <Card title={file?.name ?? 'Your file'} subtitle={`${check.total} member(s) found`}>
          <Summary ok={check.ok} problems={check.total - check.ok} />
          {check.ok > 0 ? (
            <Button
              title={`Import ${check.ok} Member${check.ok === 1 ? '' : 's'}`}
              icon="check"
              loading={busy === 'importing'}
              disabled={busy !== null}
              onPress={importGoodRows}
            />
          ) : null}
          {problems.length ? (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Rows with problems are skipped. Fix them in your file and import it again later; members already
              imported will show as duplicate Member IDs.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {done ? (
        <Card title="Import finished" tone="success">
          <Text style={[styles.doneText, { color: theme.text }]}>
            {done.created} member{done.created === 1 ? '' : 's'} added
            {problems.length ? `, ${problems.length} skipped` : ''}.
          </Text>
          <Button
            title="Go to Members"
            icon="people"
            onPress={() => router.replace({ pathname: '/business/[id]/members', params: { id: account.id } })}
          />
        </Card>
      ) : null}

      {problems.length ? (
        <Card title="Rows with problems" subtitle="Row numbers match your file.">
          {problems.slice(0, 100).map((row) => (
            <View key={row.row} style={styles.problem}>
              <Text style={[styles.problemTitle, { color: theme.text }]}>
                Row {row.row}
                {row.name ? ` · ${row.name}` : ''}
              </Text>
              {row.errors.map((message) => (
                <Text key={message} style={[styles.problemText, { color: theme.danger }]}>
                  {message}
                </Text>
              ))}
            </View>
          ))}
          {problems.length > 100 ? (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              …and {problems.length - 100} more.
            </Text>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
        <Text style={[styles.stepNumberText, { color: theme.onPrimary }]}>{number}</Text>
      </View>
      <Text style={[styles.stepText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

function Summary({ ok, problems }: { ok: number; problems: number }) {
  const theme = useTheme();
  return (
    <View style={styles.summary}>
      <View style={styles.summaryItem}>
        <Icon name="checkCircle" color={theme.success} size={20} />
        <Text style={[styles.summaryText, { color: theme.text }]}>{ok} ready to import</Text>
      </View>
      {problems ? (
        <View style={styles.summaryItem}>
          <Icon name="warning" color={theme.danger} size={20} />
          <Text style={[styles.summaryText, { color: theme.text }]}>{problems} with problems</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
  },
  summary: {
    gap: Spacing.two,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  problem: {
    gap: 2,
    paddingVertical: Spacing.one,
  },
  problemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  problemText: {
    fontSize: 14,
    lineHeight: 19,
  },
});
