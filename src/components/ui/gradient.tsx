import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Fills its parent with a diagonal gradient; put it first inside a View with `overflow: 'hidden'`. */
export function Gradient({ from, to }: { from: string; to: string }) {
  const id = useId().replace(/:/g, '');
  // Android draws percentage-sized SVGs only partly, so size it in pixels once laid out.
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.passThrough, { backgroundColor: from }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}>
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  passThrough: {
    pointerEvents: 'none',
  },
});
