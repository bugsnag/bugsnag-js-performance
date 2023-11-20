import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { getCurrentCommand } from '../lib/CommandRunner'

export const config = {
  maximumBatchSize: 1,
  autoInstrumentAppStarts: false,
}

export function App () {
  const [currentCommand, setCurrentCommand] = useState(null)

  useEffect(() => {
    getCurrentCommand(Infinity).then(command => {
      setCurrentCommand(command)

      console.error(`[BugsnagPerformance] SpanTriggeredByCommandScenario got command: ${JSON.stringify(command)}`)

      if (command.action === 'start-span') {
        BugsnagPerformance.startSpan('SpanTriggeredByCommandScenario').end()
      } else {
        throw new Error(`Unknown command: ${JSON.stringify(command)}`)
      }
    })
  })

  return (
    <View>
      <Text>SpanTriggeredByCommandScenario</Text>
      <Text>Current command: {JSON.stringify(currentCommand)}</Text>
    </View>
  )
}
