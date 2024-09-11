import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { getCurrentCommand } from '../lib/CommandRunner'

export const initialise = async (config) => {
  config.maximumBatchSize = 1
}

export function App () {
  const [id, setId] = useState(1)

  useEffect(() => {
    (async () => {
      console.error(`[BugsnagPerformance] SpanTriggeredByCommandScenario waiting for command...`)
      const command = await getCurrentCommand(Infinity)

      console.error(`[BugsnagPerformance] SpanTriggeredByCommandScenario got command: ${JSON.stringify(command)}`)
      console.error(`[BugsnagPerformance] SpanTriggeredByCommandScenario has id: ${id}`)

      if (command.action === 'start-span') {
        BugsnagPerformance.startSpan(`SpanTriggeredByCommandScenario ${id}`).end()
        setId(a => a + 1)
      } else {
        throw new Error(`Unknown command: ${JSON.stringify(command)}`)
      }
    })()
  }, [id])

  return (
    <View>
      <Text>SpanTriggeredByCommandScenario</Text>
      <Text>ID: {id}</Text>
    </View>
  )
}
