import { CompleteNavigation, ReactNativeNavigationPlugin } from '@bugsnag/react-native-navigation-performance'
// import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { getCurrentCommand } from '../lib/CommandRunner'

export const config = {
    maximumBatchSize: 1,
    autoInstrumentAppStarts: false,
    batchInactivityTimeoutMs: 5000,
    appVersion: '1.2.3',
    plugins: [new ReactNativeNavigationPlugin(Navigation)]
}

const COMMAND_INTERVAL = 500

// let parentSpan

function delay(ms) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

function useCommandRunner(componentId) {
    useEffect(() => {
        async function commandRunner () {
            console.error(`[BugsnagPerformance] ReactNativeNavigationScenario waiting for command...`)
            const command = await getCurrentCommand(Infinity)
    
            switch (command.action) {
                case 'navigate':
                    console.error(`[BugsnagPerformance] Navigating to route ${command.payload}`)
                    Navigation.push(componentId, {
                        component: {
                            name: command.payload
                        }
                    })
                    break
                default:
                    console.error(`Unknown command: ${JSON.stringify(command)}`)
                    delay(COMMAND_INTERVAL)
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

    // TODO: Handle with command runner
    // useEffect(() => {
    //     parentSpan = BugsnagPerformance.startSpan('ParentSpan')
    // }, [])

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

    // TODO: Handle with command runner
    // useEffect(() => {
    //     if (loaded) {
    //         setTimeout(() => {
    //             if (parentSpan && typeof parentSpan.end === 'function') {
    //                 parentSpan.end()
    //             }
    //         }, 250)
    //     }
    // }, [loaded])

    return (
        <View>
            <Text>Screen 4</Text>
            {loaded ? null : <CompleteNavigation on="unmount" />}
        </View>
    )
}
