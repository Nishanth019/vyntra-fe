import { StyleSheet, Text, View } from 'react-native';

import { useErrorAnchor } from '@/components/ui/error-scroll';
import { useTheme } from '@/hooks/use-theme';

/** A red error under a custom input (chips, pickers). Like the built-in fields, the form scrolls to it on submit. */
export function FieldError({ message }: { message?: string | null }) {
  const theme = useTheme();
  const anchor = useErrorAnchor(message);
  if (!message) return null;
  return (
    <View ref={anchor}>
      <Text style={[styles.error, { color: theme.danger }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 13,
  },
});
