import Svg, { Path } from 'react-native-svg';

/** The Manaze "rising M": the second peak climbs higher, like a chart going up. Same path as the app icon. */
export function BrandMark({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="22 21 56 58">
      <Path
        d="M28 73 V45 L45 62 L72 27 V73"
        fill="none"
        stroke={color}
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
