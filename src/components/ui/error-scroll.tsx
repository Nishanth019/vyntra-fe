import { createContext, useContext, useEffect, useMemo, useRef, type RefObject } from 'react';
import type { View } from 'react-native';

/**
 * Scrolls a form to its first error after the user taps a button: `Screen` provides it, `Button` arms it, and each
 * field showing an error reports itself (`useErrorAnchor`). The topmost reported field is scrolled into view.
 */
type ErrorScroll = {
  arm: () => void;
  report: (ref: RefObject<View | null>) => void;
};

const ErrorScrollContext = createContext<ErrorScroll | null>(null);

/** How long after a tap errors still count as its result (server replies can take a while). */
const ARMED_MS = 15_000;
const TOP_GAP = 24;

type Scrollable = { scrollTo: (options: { y: number; animated?: boolean }) => void };

export function useErrorScrollProvider(
  scrollRef: RefObject<Scrollable | null>,
  contentRef: RefObject<View | null>,
): ErrorScroll {
  const armedUntil = useRef(0);
  const pending = useRef(new Set<RefObject<View | null>>());
  const scheduled = useRef(false);

  return useMemo(() => {
    function scroll() {
      scheduled.current = false;
      const refs = [...pending.current];
      pending.current.clear();
      const content = contentRef.current;
      if (!content || !refs.length || Date.now() > armedUntil.current) return;
      armedUntil.current = 0;
      content.measureInWindow((_x, contentY) => {
        let measured = 0;
        let top = Infinity;
        for (const ref of refs) {
          const node = ref.current;
          if (!node) {
            measured += 1;
            continue;
          }
          node.measureInWindow((_fx, fieldY, _w, height) => {
            if (height > 0) top = Math.min(top, fieldY - contentY);
            measured += 1;
            if (measured === refs.length && top !== Infinity) {
              scrollRef.current?.scrollTo({ y: Math.max(0, top - TOP_GAP), animated: true });
            }
          });
        }
      });
    }

    return {
      arm: () => {
        armedUntil.current = Date.now() + ARMED_MS;
      },
      report: (ref) => {
        if (Date.now() > armedUntil.current) return;
        pending.current.add(ref);
        if (!scheduled.current) {
          scheduled.current = true;
          // Wait a frame so every field with an error has rendered and reported.
          requestAnimationFrame(() => requestAnimationFrame(scroll));
        }
      },
    };
  }, [scrollRef, contentRef]);
}

export const ErrorScrollProvider = ErrorScrollContext.Provider;

/** Arms the scroll; called by buttons before they run their action. */
export function useArmErrorScroll() {
  return useContext(ErrorScrollContext)?.arm;
}

/** A ref for a field's outer view: while `error` is shown, a button tap scrolls the form to it. */
export function useErrorAnchor(error?: string | false | null) {
  const ref = useRef<View>(null);
  const context = useContext(ErrorScrollContext);
  useEffect(() => {
    if (error) context?.report(ref);
  });
  return ref;
}
