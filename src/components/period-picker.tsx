import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
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
  const [menu, setMenu] = useState<{ top: number; left: number; width: number } | null>(null);
  const selected = periods.find((period) => period.key === value)!;

  function open() {
    anchor.current?.measureInWindow((left, top, width, height) => setMenu({ top: top + height + 4, left, width }));
  }

  return (
    <>
      <Pressable
        ref={anchor}
        accessibilityRole="button"
        accessibilityLabel={`Period: ${selected.label}`}
        onPress={open}
        style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
        <Text style={[styles.value, { color: theme.text }]}>{selected.label}</Text>
        <Icon name="chevronDown" color={theme.textSecondary} size={20} />
      </Pressable>

      <Modal visible={menu !== null} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={() => setMenu(null)} />
        {menu ? (
          <View
            style={[
              styles.menu,
              { top: menu.top, left: menu.left, minWidth: menu.width, backgroundColor: theme.surface, borderColor: theme.border },
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
    minWidth: 160,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderWidth: 1.5,
    borderRadius: Radius.md,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
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
