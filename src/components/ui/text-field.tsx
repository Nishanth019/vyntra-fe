import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  /** Also used as the accessibility label, so it's required even when hidden. */
  label: string;
  hideLabel?: boolean;
  error?: string;
  required?: boolean;
  icon?: IconName;
  /** Short text on the right of the input, e.g. "available". */
  hint?: { text: string; tone: 'success' | 'danger' | 'muted' };
  /** Hides the value and adds a Show / Hide toggle. */
  password?: boolean;
  ref?: Ref<TextInput>;
};

export function TextField({
  label,
  hideLabel = false,
  error,
  required = false,
  icon,
  hint,
  password = false,
  multiline = false,
  ref,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;
  const hintColor = hint && { success: theme.success, danger: theme.danger, muted: theme.textSecondary }[hint.tone];

  return (
    <View style={styles.container}>
      {hideLabel ? null : (
        <Text style={[styles.label, { color: theme.text }]}>
          {label}
          {required ? <Text style={{ color: theme.danger }}> *</Text> : null}
        </Text>
      )}
      <View
        style={[
          styles.inputRow,
          multiline && styles.multilineRow,
          { backgroundColor: theme.surface, borderColor },
        ]}>
        {icon ? (
          <View style={[styles.icon, multiline && styles.multilineIcon]}>
            <Icon name={icon} size={20} color={focused ? theme.primary : theme.textSecondary} />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={password && hidden}
          autoCorrect={false}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            icon ? styles.inputWithIcon : null,
            { color: theme.text },
            style,
          ]}
          {...rest}
        />
        {hint ? <Text style={[styles.hint, { color: hintColor }]}>{hint.text}</Text> : null}
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            onPress={() => setHidden((value) => !value)}
            style={styles.toggle}>
            <Text style={[styles.toggleText, { color: theme.primary }]}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  multilineRow: {
    height: undefined,
    minHeight: 110,
    alignItems: 'flex-start',
  },
  icon: {
    paddingLeft: Spacing.three,
  },
  multilineIcon: {
    paddingTop: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingLeft: Spacing.two + 2,
  },
  multilineInput: {
    height: undefined,
    minHeight: 110,
    paddingTop: 14,
    paddingBottom: 14,
  },
  hint: {
    fontSize: 13,
    fontWeight: '600',
    paddingRight: Spacing.three,
  },
  toggle: {
    paddingHorizontal: Spacing.three,
    height: '100%',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    fontSize: 13,
  },
});
