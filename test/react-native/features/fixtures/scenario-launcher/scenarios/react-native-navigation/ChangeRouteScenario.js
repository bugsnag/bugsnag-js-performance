import { CompleteNavigation, ReactNativeNavigationPlugin } from '@bugsnag/react-native-navigation-performance'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'

export const config = {
    maximumBatchSize: 2,
    autoInstrumentAppStarts: false,
    appVersion: '1.2.3',
    plugins: [new ReactNativeNavigationPlugin(Navigation)]
}

export function registerScreens() {
    Navigation.registerComponent('Screen 1', () => Screen1);
    Navigation.registerComponent('Screen 2', () => Screen2);

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
    const [counter, setCounter] = useState(3)

    useEffect(() => {
        function decrementCounter() {
            if (counter > 0) {
                setTimeout(() => {
                    setCounter(c => c - 1)
                    decrementCounter()
                }, 1000)
            }
        }

        decrementCounter()
    }, [])

    useEffect(() => {
        if (counter === 0) {
            Navigation.push(props.componentId, {
                component: {
                    name: 'Screen 2'
                }
            })
        }
    }, [counter])

    return (
        <SafeAreaView>
            <Text>Screen 1</Text>
            <Text>Navigating in {counter}...</Text>
        </SafeAreaView>
    )
}

function Screen2(props) {
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            setLoaded(true)
        }, 50)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen 2</Text>
            {loaded && <CompleteNavigation on="mount"/>}
        </SafeAreaView>
    )
}
