import { ReactNativeNavigationPlugin } from '@bugsnag/react-native-navigation-performance'
import React, { useEffect } from 'react'
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
    useEffect(() => {
        setTimeout(() => {
            Navigation.push(props.componentId, {
                component: {
                    name: 'Screen 2'
                }
            })
        }, 50)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen 1</Text>
        </SafeAreaView>
    )
}

function Screen2(props) {
    return (
        <SafeAreaView>
            <Text>Screen 2</Text>
        </SafeAreaView>
    )
}
