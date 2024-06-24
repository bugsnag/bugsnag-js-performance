import BugsnagPerformance from '@bugsnag/react-native-performance'
import Bugsnag from '@bugsnag/react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Text, View } from 'react-native'
import { getCurrentCommand } from '../lib/CommandRunner'

Bugsnag.start()

export const config = {
  appVersion: '1.2.3',
  bugsnag: Bugsnag,
  maximumBatchSize: 1,
  autoInstrumentAppStarts: false
}

export function App () {
  const [id, setId] = useState(1)
  const span = useRef()

  useEffect(() => {
    (async () => {
      console.error(`[BugsnagPerformance] ErrorCorrelationScenario waiting for command...`)

      const command = await getCurrentCommand(Infinity)

      console.error(`[BugsnagPerformance] ErrorCorrelationScenario got command: ${JSON.stringify(command)}`)
      console.error(`[BugsnagPerformance] ErrorCorrelationScenario has id: ${id}`)

      switch (command.action) {
        case 'start-span':
            span.current = BugsnagPerformance.startSpan(`ErrorCorrelationScenario ${id}`)
            setId(id => id + 1)
            break
        case 'end-span':
            span.current?.end()
            setId(id => id + 1)
            break
        case 'send-error':
            console.log("[BugsnagPerformance] ErrorCorrelationScenario sending error")
            Bugsnag.notify(new Error(`ErrorCorrelationScenario`))
            setId(id => id + 1)
            break
        default:
            throw new Error(`Unknown command: ${JSON.stringify(command)}`)
      }
    })()
  }, [id])

  return (
    <View>
      <Text>ErrorCorrelationScenario</Text>
      <Text>ID: {id}</Text>
    </View>
  )
}
