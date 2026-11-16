import {Easing, interpolate} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

export const {fontFamily} = loadFont('normal', {
  weights: ['500', '600', '700', '800'],
  subsets: ['latin'],
});

export const C = {
  sage: '#7D9D86',
  dark: '#355C4D',
  light: '#DDE8DF',
  cream: '#F8F7F2',
  char: '#28332D',
  mid: '#CAD9CE',
};

export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Clamped, eased interpolation between two frames.
export const tween = (
  f: number,
  [a, b]: [number, number],
  [from, to]: [number, number],
  easing = ease,
) =>
  interpolate(f, [a, b], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

export type Box = [number, number, number, number];

// Interpolates an [x, y, w, h] box through a list of keyframes.
export const boxAt = (f: number, keys: {f: number; box: Box}[]): Box =>
  [0, 1, 2, 3].map((i) =>
    interpolate(
      f,
      keys.map((k) => k.f),
      keys.map((k) => k.box[i]),
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease},
    ),
  ) as Box;
