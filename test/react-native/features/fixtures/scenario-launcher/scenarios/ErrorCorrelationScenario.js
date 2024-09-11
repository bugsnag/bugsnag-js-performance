import BugsnagPerformance from '@bugsnag/react-native-performance'
import Bugsnag from '@bugsnag/react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Button, Text, View } from 'react-native'
import { getCurrentCommand } from '../lib/CommandRunner'
import { NativeScenarioLauncher } from '../lib/native'

export const initialise = async (config) => {
  // set the performance config
  config.bugsnag = Bugsnag
  config.maximumBatchSize = 1

  // start the native notifier SDK
  const notifyEndpoint = config.endpoint.replace('traces', 'notify')
  const sessionsEndpoint = config.endpoint.replace('traces', 'sessions')

  await NativeScenarioLauncher.startBugsnag({
    apiKey: config.apiKey,
    notifyEndpoint,
    sessionsEndpoint
  })

  // start the JS notifier SDK
  Bugsnag.start()

  // clear notifier persisted data
  await NativeScenarioLauncher.clearPersistentData()
}

export function App() {
  const [id, setId] = useState(1)
  const span = useRef()

  function startSpan () {
    console.log("[BugsnagPerformance] ErrorCorrelationScenario starting span")
    span.current = BugsnagPerformance.startSpan(`ErrorCorrelationScenario ${id}`)
  }
  
  function endSpan () {
    if (span.current) {
      console.log("[BugsnagPerformance] ErrorCorrelationScenario ending span")
      span.current?.end()
    } else {
      console.log("[BugsnagPerformance] ErrorCorrelationScenario no span to end")
    }
  }

  function sendError () {
    console.log("[BugsnagPerformance] ErrorCorrelationScenario sending error")
    Bugsnag.notify(new Error("ErrorCorrelationScenario"))
  }

  useEffect(() => {
    (async () => {
      console.error(`[BugsnagPerformance] ErrorCorrelationScenario waiting for command...`)

      const command = await getCurrentCommand(Infinity)

      console.error(`[BugsnagPerformance] ErrorCorrelationScenario got command: ${JSON.stringify(command)}`)
      console.error(`[BugsnagPerformance] ErrorCorrelationScenario has id: ${id}`)

      switch (command.action) {
        case 'start-span':
          startSpan()
          setId(id => id + 1)
          break
        case 'end-span':
          endSpan()
          setId(id => id + 1)
          break
        case 'send-error':
          sendError()
          setId(id => id + 1)
          break
        default:
          throw new Error(`Unknown command: ${JSON.stringify(command)}`)
      }
    })()
  }, [id, startSpan, endSpan, sendError])

  return (
    <View>
      <Text>ErrorCorrelationScenario</Text>
      <Text>Current Command ID: {id}</Text>
      <Button onPress={() => startSpan()} title="startSpan" />
      <Button onPress={() => sendError()} title="sendError" />
      <Button onPress={() => endSpan()} title="endSpan" />
    </View>
  )
}
