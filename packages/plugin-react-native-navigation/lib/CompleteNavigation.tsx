import BugsnagPerformance from '@bugsnag/react-native-performance'
import type React from 'react'
import { useEffect, useRef } from 'react'
import type { PropsWithChildren } from 'react'
import BugsnagPluginReactNativeNavigationPerformance from './react-native-navigation-plugin'

interface Props extends PropsWithChildren {
  on: 'mount' | 'unmount' | boolean
}

/** End the current navigation span when the component is mounted, unmounted or the `on` prop is `true` */
export const CompleteNavigation: React.FunctionComponent<Props> = ({ children, on }) => {
  const pluginRef = useRef<BugsnagPluginReactNativeNavigationPerformance>()

  function getPlugin () {
    if (pluginRef.current) return pluginRef.current

    // @ts-expect-error signature does not match
    pluginRef.current = BugsnagPerformance.getPlugin(BugsnagPluginReactNativeNavigationPerformance)

    return pluginRef.current
  }

  useEffect(() => {
    const plugin = getPlugin()

    if (plugin) {
      plugin.blockNavigationEnd()

      if (on === 'mount') {
        setTimeout(() => {
          plugin.unblockNavigationEnd('mount')
        }, 0)
      }

      if (on === 'unmount') {
        return () => {
          plugin.unblockNavigationEnd('unmount')
        }
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
