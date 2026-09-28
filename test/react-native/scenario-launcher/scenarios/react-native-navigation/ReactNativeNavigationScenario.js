import React, { useEffect, useState, useRef } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'
import BugsnagPluginReactNativeNavigationPerformance, { CompleteNavigation } from '@bugsnag/plugin-react-native-navigation-performance'
import { getCurrentCommand } from '../../lib/CommandRunner'

export function registerScreens () {
  Navigation.registerComponent('Screen 1', () => Screen1)
  Navigation.registerComponent('Screen 2', () => Screen2)
  Navigation.registerComponent('Screen 3', () => Screen3)
  Navigation.registerComponent('Screen 4', () => Screen4)
}

export function startScenario () {
  setRootNavigation()
}

export const initialise = async (config) => {
  config.maximumBatchSize = 1
  config.batchInactivityTimeoutMs = 1000
  config.plugins = [
    new BugsnagPluginReactNativeNavigationPerformance(Navigation)
  ]

  registerScreens()
}

export const postInitialise = async () => {
  setRootNavigation()
}

function setRootNavigation () {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'Screen 1'
            }
          }
        ]
      }
    }
  }).catch((err) => {
    console.error('[Bugsnag] Failed to set navigation root:', err)
  })
}

const COMMAND_INTERVAL = 250
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function useCommandRunner (componentId) {
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    async function pollCommands () {
      while (isMounted.current) {
        try {
          const command = await getCurrentCommand(Infinity)
          if (!isMounted.current) break

          if (command && (command.action === 'navigate' || command.command === 'navigate')) {
            const targetScreen = command.screen || command.payload || command.target
            if (targetScreen) {
              await Navigation.push(componentId, {
                component: {
                  name: targetScreen
                }
              })
              break
            }
          }
        } catch (e) {
          // retry
        }
        await delay(COMMAND_INTERVAL)
      }
    }

    pollCommands()

    return () => {
      isMounted.current = false
    }
  }, [componentId])
}

function Screen1 (props) {
  useCommandRunner(props.componentId)

  return (
    <View style={styles.container}>
      <Text>Screen 1</Text>
    </View>
  )
}

function Screen2 (props) {
  useCommandRunner(props.componentId)

  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Text>Screen 2</Text>
      <CompleteNavigation on={loaded} />
    </View>
  )
}

function Screen3 (props) {
  useCommandRunner(props.componentId)

  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Text>Screen 3</Text>
      {loaded ? <CompleteNavigation on='mount' /> : null}
    </View>
  )
}

function Screen4 (props) {
  useCommandRunner(props.componentId)

  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Text>Screen 4</Text>
      {loaded ? null : <CompleteNavigation on='unmount' />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})