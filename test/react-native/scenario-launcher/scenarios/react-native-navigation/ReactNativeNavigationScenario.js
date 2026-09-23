import BugsnagPluginReactNativeNavigationPerformance, { CompleteNavigation } from '@bugsnag/plugin-react-native-navigation-performance'
import React, { useEffect, useState, useRef } from 'react'
import { Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { getCurrentCommand } from '../../lib/CommandRunner'

export const initialise = async (config) => {
    // 1. Explicitly configure sampling endpoint for Maze Runner BitBar / CI
    const endpoint = config.endpoint
    config.samplingEndpoint = config.samplingEndpoint ||
        config.sampling_endpoint ||
        (endpoint ? endpoint.replace(/\/traces\/?$/, '/sampling') : undefined)

    config.maximumBatchSize = 1
    config.batchInactivityTimeoutMs = 5000
    config.plugins = [new BugsnagPluginReactNativeNavigationPerformance(Navigation)]

    // 2. Register all screens and set the initial root stack
    registerScreens()
}

const COMMAND_INTERVAL = 500
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function useCommandRunner(componentId) {
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true

        async function commandRunner() {
            if (!isMounted.current) return

            console.error(`[Bugsnag] ReactNativeNavigationScenario (${componentId}) waiting for command...`)
            const command = await getCurrentCommand(Infinity)

            if (!isMounted.current) return

            switch (command.action) {
                case 'navigate': {
                    const targetScreen = command.screen || command.payload
                    console.error(`[Bugsnag] Navigating to screen: ${targetScreen}`)
                    Navigation.push(componentId, {
                        component: {
                            name: targetScreen
                        }
                    })
                    break
                }
                default:
                    console.error(`[Bugsnag] Unknown command received: ${JSON.stringify(command)}`)
                    await delay(COMMAND_INTERVAL)
                    if (isMounted.current) {
                        commandRunner()
                    }
            }
        }

        commandRunner()

        return () => {
            isMounted.current = false
        }
    }, [componentId])
}

export function registerScreens() {
    Navigation.registerComponent('Screen 1', () => Screen1)
    Navigation.registerComponent('Screen 2', () => Screen2)
    Navigation.registerComponent('Screen 3', () => Screen3)
    Navigation.registerComponent('Screen 4', () => Screen4)

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
    })
}

function Screen1(props) {
    useCommandRunner(props.componentId)

    return (
        <View>
            <Text>Screen 1</Text>
        </View>
    )
}

function Screen2(props) {
    useCommandRunner(props.componentId)

    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoaded(true)
        }, 50)
        return () => clearTimeout(timer)
    }, [])

    return (
        <View>
            <Text>Screen 2</Text>
            <CompleteNavigation on={loaded} />
        </View>
    )
}

function Screen3(props) {
    useCommandRunner(props.componentId)

    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoaded(true)
        }, 50)
        return () => clearTimeout(timer)
    }, [])

    return (
        <View>
            <Text>Screen 3</Text>
            {loaded ? <CompleteNavigation on="mount" /> : null}
        </View>
    )
}

function Screen4(props) {
    useCommandRunner(props.componentId)

    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoaded(true)
        }, 50)
        return () => clearTimeout(timer)
    }, [])

    return (
        <View>
            <Text>Screen 4</Text>
            {loaded ? null : <CompleteNavigation on="unmount" />}
        </View>
    )
}