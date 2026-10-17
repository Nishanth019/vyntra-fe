import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Fills its parent with a left-to-right gradient; put it first inside a View with `overflow: 'hidden'`. */
export function Gradient({ from, to }: { from: string; to: string }) {
  const id = useId().replace(/:/g, '');

  return (
    <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, styles.passThrough]}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  passThrough: {
    pointerEvents: 'none',
  },
});
