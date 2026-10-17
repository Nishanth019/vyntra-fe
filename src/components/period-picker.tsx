import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Period, PeriodKey } from '@/lib/periods';

type PeriodPickerProps = {
  periods: Period[];
  value: PeriodKey;
  onChange: (key: PeriodKey) => void;
};

/** A dropdown of report periods (This Month, Last Week, … Custom). */
export function PeriodPicker({ periods, value, onChange }: PeriodPickerProps) {
  const theme = useTheme();
  const anchor = useRef<View>(null);
  const [menu, setMenu] = useState<{ top: number; width: number } | null>(null);
  const selected = periods.find((period) => period.key === value)!;

  function open() {
    anchor.current?.measureInWindow((_left, top, width, height) => setMenu({ top: top + height + 4, width }));
  }

  return (
    <>
      <Pressable
        ref={anchor}
        accessibilityRole="button"
        accessibilityLabel={`Period: ${selected.label}`}
        onPress={open}
        style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }, shadow(theme.shadow)]}>
        <Text style={[styles.value, { color: theme.text }]}>{selected.label}</Text>
        <Icon name="chevronDown" color={theme.text} size={18} />
      </Pressable>

      <Modal
        visible={menu !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setMenu(null)}>
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={() => setMenu(null)} />
        {menu ? (
          <View
            style={[
              styles.menu,
              { top: menu.top, right: Spacing.three, minWidth: Math.max(menu.width, 180), backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            {periods.map((period) => (
              <Pressable
                key={period.key}
                accessibilityRole="menuitem"
                onPress={() => {
                  setMenu(null);
                  onChange(period.key);
                }}
                style={({ pressed }) => [
                  styles.option,
                  (pressed || period.key === value) && { backgroundColor: theme.primarySoft },
                ]}>
                <Text style={[styles.optionText, { color: period.key === value ? theme.primary : theme.text }]}>
                  {period.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
  menu: {
    position: 'absolute',
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  option: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  optionText: {
    fontSize: 16,
  },
});
