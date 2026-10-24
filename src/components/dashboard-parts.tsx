import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Tile = {
  label: string;
  value: number | string;
  icon: IconName;
  tone: Tone;
  href: Href;
};

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export function HeroButton({ title, icon, solid = false, onPress }: { title: string; icon: IconName; solid?: boolean; onPress: () => void }) {
  const theme = useTheme();
  const color = solid ? theme.primary : theme.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.heroButton,
        { backgroundColor: solid ? theme.onPrimary : 'rgba(255,255,255,0.18)' },
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} color={color} size={20} />
      <Text style={[styles.heroButtonText, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {title}
      </Text>
    </Pressable>
  );
}

export function SectionTitle({ title, href }: { title: string; href: Href }) {
  const theme = useTheme();

  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`See all ${title}`}
        hitSlop={8}
        onPress={() => router.navigate(href)}
        style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
        <Text style={[styles.seeAllText, { color: theme.primary }]}>See all</Text>
        <Icon name="chevronRight" color={theme.primary} size={16} />
      </Pressable>
    </View>
  );
}

export function TileGrid({ tiles, columns }: { tiles: Tile[]; columns: number }) {
  return (
    <View style={styles.grid}>
      {chunk(tiles, columns).map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((tile) => (
            <StatTile key={tile.label} tile={tile} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function StatTile({ tile }: { tile: Tile }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tile.label}: ${tile.value}`}
      onPress={() => router.navigate(tile.href)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.border },
        shadow(theme.shadow),
        pressed && styles.pressed,
      ]}>
      <View style={styles.tileTop}>
        <IconBadge name={tile.icon} tone={tile.tone} size={42} />
        <Icon name="chevronRight" color={theme.textSecondary} size={16} />
      </View>
      <Text style={[styles.tileLabel, { color: theme.textSecondary }]} numberOfLines={2}>
        {tile.label}
      </Text>
      <Text style={[styles.tileValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {tile.value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 48,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
  },
  heroButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: -Spacing.one,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
  },
  grid: {
    gap: Spacing.three - 4,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  tile: {
    flex: 1,
    gap: Spacing.one,
    padding: Spacing.three - 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '800',
  },
});
