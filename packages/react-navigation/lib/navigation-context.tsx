import type { BugsnagPerformance, Span } from '@bugsnag/core-performance';
import type { ReactNativeConfiguration, PlatformExtensions } from '@bugsnag/react-native-performance';
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export const NavigationContext = React.createContext({
  blockNavigationEnd: () => {},
  unblockNavigationEnd: () => {},
  triggerNavigationEnd: () => {}
})

interface Props extends PropsWithChildren {
  currentRoute?: string;
  client: BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>
}

export function NavigationContextProvider({ currentRoute, client, ...rest }: Props) {
  const span = useRef<Span>();
  const timerRef = React.useRef<NodeJS.Timeout>();

  const [componentsLoading, setComponentsLoading] = useState(0)
  const [lastRenderTime, setLastRenderTime] = useState(performance.now()) // is there a better way to get the initial render time?

  const blockNavigationEnd = useCallback(() => {
    setComponentsLoading(prev => prev + 1);
    setLastRenderTime(0)
  }, []);

  const unblockNavigationEnd = useCallback(() => {
    setComponentsLoading(prev => Math.max(prev - 1, 0));
    setLastRenderTime(performance.now())
  }, []);

  // End the current span in 100ms if no more components are loading
  const triggerNavigationEnd = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (componentsLoading === 0) {
        if (span.current) {
          span.current.end(lastRenderTime);
          span.current = undefined;
        }
      }
    }, 100);
  }, [lastRenderTime, componentsLoading]);

  // On route update, start a new span
  useEffect(() => {
    if (currentRoute) {
      span.current = client.startNavigationSpan(currentRoute); // TODO: can we pass a reference to BugsnagPerformance instead of importing?

      // on next tick, trigger navigation end
      setTimeout(() => {
        triggerNavigationEnd();
      });
    }
  }, [currentRoute, triggerNavigationEnd]);

  // When loading has finished, trigger navigation end
  useEffect(() => {
    if (componentsLoading > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    } else {
      triggerNavigationEnd();
    }
  }, [componentsLoading, triggerNavigationEnd]);

  return (
    <NavigationContext.Provider
      {...rest}
      value={{
        blockNavigationEnd,
        unblockNavigationEnd,
        triggerNavigationEnd
      }}
    />
  );
}
