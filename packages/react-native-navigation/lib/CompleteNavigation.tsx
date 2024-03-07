import BugsnagPerformance from '@bugsnag/react-native-performance'
import type React from 'react'
import { useEffect, useRef, type PropsWithChildren } from 'react'
import ReactNativeNavigationPlugin from './react-native-navigation-plugin'

interface Props extends PropsWithChildren {
  on: 'mount' | 'unmount' | boolean
}

/** End the current navigation span when the component is mounted, unmounted or the `on` prop is `true` */
export const CompleteNavigation: React.FunctionComponent<Props> = ({ children, on }) => {
  const pluginRef = useRef<ReactNativeNavigationPlugin>()

  function getPlugin () {
    if (pluginRef.current) return pluginRef.current

    // @ts-expect-error signature does not match
    pluginRef.current = BugsnagPerformance.getPlugin(ReactNativeNavigationPlugin)

    return pluginRef.current
  }

  useEffect(() => {
    const plugin = getPlugin()

    if (plugin) {
      plugin.blockNavigationEnd()
    }

    if (on === 'mount') {
      setTimeout(() => {
        if (plugin) {
          plugin.unblockNavigationEnd('mount')
        }
      })
    }

    return () => {
      if (plugin && on === 'unmount') {
        plugin.unblockNavigationEnd('unmount')
      }
    }
  }, [])

  useEffect(() => {
    if (typeof on === 'boolean') {
      if (on === true) {
        const plugin = getPlugin()
        if (plugin) {
          plugin.unblockNavigationEnd('condition')
        }
      }
    }
  }, [on])

  return children
}
