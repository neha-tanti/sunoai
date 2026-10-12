import { useSyncExternalStore } from 'react';

const subscribeToNothing = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
