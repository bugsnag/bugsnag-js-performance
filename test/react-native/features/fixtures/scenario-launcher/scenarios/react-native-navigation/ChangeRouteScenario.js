import { ReactNativeNavigationPlugin } from '@bugsnag/react-native-navigation-performance'
import React from 'react'
import { Button, SafeAreaView, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'

export const config = {
    maximumBatchSize: 1,
    autoInstrumentAppStarts: false,
    appVersion: '1.2.3',
    plugins: [new ReactNativeNavigationPlugin(Navigation)]
}

export function getRoot() {
    Navigation.registerComponent('Screen 1', () => Screen1);
    Navigation.registerComponent('Screen 2', () => Screen2);

    return {
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
    }
}

function Screen1(props) {
    return (
        <SafeAreaView>
            <Text>Screen 1</Text>
            <Button
                title='Go to screen 2'
                onPress={() => { 
                    Navigation.push(props.componentId, { 
                        component: { 
                            name: 'Screen 2' 
                        } 
                    }) 
                }} />
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
