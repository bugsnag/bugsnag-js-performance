import { CompleteNavigation, ReactNativeNavigationPlugin } from '@bugsnag/react-native-navigation-performance'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'

export const config = {
    maximumBatchSize: 6,
    batchInactivityTimeoutMs: 5000,
    appVersion: '1.2.3',
    plugins: [new ReactNativeNavigationPlugin(Navigation)]
}

let parentSpan

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
    useEffect(() => {
        parentSpan = BugsnagPerformance.startSpan('ParentSpan')

        setTimeout(() => {
            Navigation.push(props.componentId, {
                component: {
                    name: 'Screen 2'
                }
            })
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen 1</Text>
        </SafeAreaView>
    )
}

function Screen2(props) {
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            setLoaded(true)
        }, 50)

        setTimeout(() => {
            Navigation.push(props.componentId, {
                component: {
                    name: 'Screen 3'
                }
            })
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen 2</Text>
            <CompleteNavigation on={loaded} />
        </SafeAreaView>
    )
}

function Screen3(props) {
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            setLoaded(true)
        }, 50)

        setTimeout(() => {
            Navigation.push(props.componentId, {
                component: {
                    name: 'Screen 4'
                }
            })
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen 3</Text>
            {loaded ? <CompleteNavigation on="mount" /> : null}
        </SafeAreaView>
    )
}

function Screen4(props) {
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            setLoaded(true)
        }, 50)

        setTimeout(() => {
            if (parentSpan && typeof parentSpan.end === 'function') {
                parentSpan.end()
            }
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen 4</Text>
            {loaded ? null : <CompleteNavigation on="unmount" />}
        </SafeAreaView>
    )
}
