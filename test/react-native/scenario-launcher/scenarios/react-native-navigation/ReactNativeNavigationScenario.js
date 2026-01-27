import BugsnagPluginReactNativeNavigationPerformance, { CompleteNavigation } from '@bugsnag/plugin-react-native-navigation-performance'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { getCurrentCommand } from '../../lib/CommandRunner'

export const initialise = async (config) => {
    config.maximumBatchSize = 1
    config.batchInactivityTimeoutMs = 5000
    config.plugins = [new BugsnagPluginReactNativeNavigationPerformance(Navigation)]
}

const COMMAND_INTERVAL = 500

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function useCommandRunner(componentId) {
    useEffect(() => {
        async function commandRunner() {
            console.error(`[Bugsnag] ReactNativeNavigationScenario waiting for command...`)
            const command = await getCurrentCommand(Infinity)

            switch (command.action) {
                case 'navigate':
                    console.error(`[Bugsnag] Navigating to route ${command.payload}`)
                    Navigation.push(componentId, {
                        component: {
                            name: command.screen
                        }
                    })
                    break
                default:
                    console.error(`Unknown command: ${JSON.stringify(command)}`)
                    await delay(COMMAND_INTERVAL)
                    commandRunner()
            }
        }

        commandRunner()
    }, [])
}

export function registerScreens() {
    Navigation.registerComponent('Screen 1', () => Screen1);
    Navigation.registerComponent('Screen 2', () => Screen2);
    Navigation.registerComponent('Screen 3', () => Screen3);
    Navigation.registerComponent('Screen 4', () => Screen4);

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
        setTimeout(() => {
            setLoaded(true)
        }, 50)
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
        setTimeout(() => {
            setLoaded(true)
        }, 50)
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
        setTimeout(() => {
            setLoaded(true)
        }, 50)
    }, [])

    return (
        <View>
            <Text>Screen 4</Text>
            {loaded ? null : <CompleteNavigation on="unmount" />}
        </View>
    )
}
