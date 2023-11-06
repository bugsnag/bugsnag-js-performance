import {useNavigationContainerRef} from '@react-navigation/native';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type Callback = (time: number) => void;

export const NavigationContext = React.createContext({
  resetRenderTimer: () => {},
  setRouteChangeCallback: (_cb: Callback) => {},
  notifyLoadingWrapperMounted: () => {},
  notifyLoadingWrapperUnmounted: () => {},
});

interface ComponentProps {
  children?: React.ReactNode;
}

export function BugsnagNavigationProvider({children}: ComponentProps) {
  const [loadingWrappersStarted, setLoadingWrappersStarted] = useState(0);
  const [loadingWrappersEnded, setLoadingWrappersEnded] = useState(0);
  const timer = useRef<number>();
  const callback = useRef<Callback>();

  const stillLoading = loadingWrappersStarted > loadingWrappersEnded;

  const resetRenderTimer = useCallback(() => {
    const endTime = Date.now(); // Get the time of the render

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!stillLoading) {
        callback.current?.(endTime);
      }
    }, 100);
  }, [stillLoading]);

  function setRouteChangeCallback(cb: Callback) {
    callback.current = cb;
  }

  useEffect(() => {
    if (loadingWrappersStarted > loadingWrappersEnded) {
      console.log('still loading');
    } else {
      console.log('done loading');
      resetRenderTimer();
    }
  }, [loadingWrappersStarted, loadingWrappersEnded, resetRenderTimer]);

  const notifyLoadingWrapperMounted = useCallback(() => {
    console.log('loading wrapper mounted');
    setLoadingWrappersStarted(prev => prev + 1);
  }, []);

  const notifyLoadingWrapperUnmounted = useCallback(() => {
    console.log('loading wrapper unmounted');
    setLoadingWrappersEnded(prev => prev + 1);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        resetRenderTimer,
        setRouteChangeCallback,
        notifyLoadingWrapperMounted,
        notifyLoadingWrapperUnmounted,
      }}>
      {children}
    </NavigationContext.Provider>
  );
}

// Detect when a render happens and reset the timer
export function RenderDetector({children}: ComponentProps) {
  const {resetRenderTimer} = useContext(NavigationContext);

  useEffect(() => {
    resetRenderTimer();
  }, [resetRenderTimer]);

  useEffect(() => {
    resetRenderTimer();
  });

  return children;
}

/** This component will prevent any open navigation span from ending while it is present */
function LoadingWrapper({children}: ComponentProps) {
  const {notifyLoadingWrapperMounted, notifyLoadingWrapperUnmounted} =
    useContext(NavigationContext);

  useEffect(() => {
    // on mount
    notifyLoadingWrapperMounted();

    // on dismount
    return notifyLoadingWrapperUnmounted;
  }, [notifyLoadingWrapperMounted, notifyLoadingWrapperUnmounted]);

  return children;
}

export function useBugsnagNavigation() {
  const [route, setRoute] = useState<string>();
  const [startTime, setStartTime] = useState<number>();
  const {setRouteChangeCallback} = useContext(NavigationContext);
  const navigationContainerRef = useNavigationContainerRef();

  // Log start time when navigation starts
  useEffect(() => {
    if (startTime) {
      console.log('navigation started at: ' + startTime);
    }
  }, [startTime]);

  // Log route when route is updated
  useEffect(() => {
    if (route) {
      console.log(`route found, starting navigation span to ${route}`);
    }
  }, [route]);

  // Set callback to be called when navigation ends
  useEffect(() => {
    setRouteChangeCallback(time => {
      console.log(`navigation ended at: ${time}`);
    });
  }, [setRouteChangeCallback]);

  useEffect(() => {
    if (navigationContainerRef.current) {
      console.info('navigation container ready.');

      // Get start time for navigation span when __unsafe_action__ is called (dispatch)
      navigationContainerRef.current.addListener('__unsafe_action__', () => {
        console.log('starting navigation span...');
        setStartTime(Date.now());
      });

      // Get updated route when state changes
      navigationContainerRef.current.addListener('state', state => {
        if (state.data.state && state.data.state.index !== undefined) {
          setRoute(state.data.state.routes[state.data.state.index].name);
        }
      });
    }
  }, [navigationContainerRef]);

  return {
    navigationContainerRef,
    BugsnagNavigationProvider,
    RenderDetector,
    LoadingWrapper,
  };
}
