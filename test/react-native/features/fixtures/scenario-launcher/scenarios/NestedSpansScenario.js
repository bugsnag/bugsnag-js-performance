import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'

export const initialise = async (config) => {
    config.maximumBatchSize = 4
}

const createAndEndSpan = (name) => new Promise((resolve) => {
    const span = BugsnagPerformance.startSpan(name)
    setTimeout(() => {
        span.end()
        resolve()
    }, 100)
})

export const App = () => {
    useEffect(() => {
        (async () => {
            const parentSpan = BugsnagPerformance.startSpan('Parent Span')
            await createAndEndSpan('Nested Span 1')
            await createAndEndSpan('Nested Span 2')
            await createAndEndSpan('Nested Span 3')
            parentSpan.end()
        })()
    }, [])

    return (
        <View>
            <Text>NestedSpansScenario</Text>
        </View>
    )
}
