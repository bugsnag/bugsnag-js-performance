import * as Scenarios from '../scenarios'
import { getCurrentCommand } from './CommandRunner'
import { clearPersistedState, setDeviceId, setSamplingProbability } from './Persistence'
import { NativeScenarioLauncher } from './native'
import { wrapperComponentProvider } from '../scenarios/core/WrapperComponentProviderScenario'
import React from 'react'
import BugsnagPerformance from '@bugsnag/react-native-performance'

async function runScenario (setScenario, scenarioName, apiKey, endpoint) {
  console.error(`[BugsnagPerformance] Launching scenario: ${scenarioName}`)
  const scenario = Scenarios[scenarioName]

  const scenarioConfig = {
    apiKey,
    endpoint,
    autoInstrumentAppStarts: false,
    autoInstrumentNetworkRequests: false,
    appVersion: '1.2.3',
    networkRequestCallback: (requestInfo) => {
      // ignore requests to the maze runner command endpoint
      if (requestInfo.url.includes('/command?after=')) {
        console.error(`[BugsnagPerformance] ignoring request to ${requestInfo.url}`)
        return null
      }

      return requestInfo
    }
  }

  await scenario.initialise(scenarioConfig)

  if (!scenario.doNotStartBugsnagPerformance) {
    BugsnagPerformance.start(scenarioConfig)
  }
  
  setScenario({ name: scenarioName, config: scenarioConfig })
}

export async function launchScenario (setScenario, clearPersistedData = true) {
  if (clearPersistedData) {
    await clearPersistedState()
  }

  const command = await getCurrentCommand()
  switch (command.action) {
    case 'run-scenario':
      return await runScenario(
        setScenario,
        command.scenario_name,
        command.api_key,
        command.endpoint
      )

    case 'clear-all-persistent-data':
      return await launchScenario(setScenario, true)

    case 'set-sampling-probability-to-0':
      await setSamplingProbability(0)

      return await launchScenario(setScenario, false)

    case 'set-device-id':
      await setDeviceId('c1234567890abcdefghijklmnop')

      return await launchScenario(setScenario, false)

    case 'set-invalid-sampling-probability':
      await setSamplingProbability('this is not a valid sampling probability')

      return await launchScenario(setScenario, false)

    case 'set-expired-sampling-probability':
      // Friday February 13th 2009 23:31:30
      await setSamplingProbability(0, 1234567890)

      return await launchScenario(setScenario, false)

    case 'set-invalid-device-id':
      await setDeviceId('this is not a valid device ID')

      return await launchScenario(setScenario, false)

    default:
      throw new Error(`Unknown action '${command.action}'`)
  }
}

export function launchFromStartupConfig () {
  const startupConfig = NativeScenarioLauncher.readStartupConfig()?.reactNative

  if (startupConfig) {
    startupConfig.wrapperComponentProvider = startupConfig.useWrapperComponentProvider ? wrapperComponentProvider : null
    BugsnagPerformance.start(startupConfig)
  }

  return startupConfig
}
