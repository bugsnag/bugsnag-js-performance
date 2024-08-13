import BugsnagPerformance from '@bugsnag/react-native-performance'
import { REACT_APP_API_KEY, REACT_APP_ENDPOINT, REACT_APP_SCENARIO_NAME } from '@env'
import React from 'react'
import { AppRegistry, SafeAreaView } from 'react-native'
import * as Scenarios from '../scenarios'
import { getCurrentCommand } from './CommandRunner'
import { clearPersistedState, setDeviceId, setSamplingProbability } from './Persistence'
import { ScenarioContext } from './ScenarioContext' 

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

async function loadReactNavigationScenario (scenario) {
  if (typeof scenario.registerScreens === 'function') {
    scenario.registerScreens()
  } else {
    import('react-native-navigation').then(({ Navigation }) => {
      Navigation.registerComponent('Scenario', () => scenario.App)
      Navigation.setRoot({
        root: {
          component: {
            name: 'Scenario'
          }
        }
      })
    })
  }
}

async function runScenario (rootTag, scenarioName, apiKey, endpoint) {
  console.error(`[BugsnagPerformance] Launching scenario: ${scenarioName}`)
  const scenario = Scenarios[scenarioName]

  BugsnagPerformance.start({
    apiKey,
    endpoint,
    networkRequestCallback (requestInfo) {
      // ignore requests to the maze runner command endpoint
      if (requestInfo.url.endsWith('/command')) {
        console.error(`[BugsnagPerformance] ignoring request to ${requestInfo.url}`)
        return null
      }

      return requestInfo
    },
    ...scenario.config
  })

  if (process.env.REACT_NATIVE_NAVIGATION) {
    loadReactNavigationScenario(scenario)
  } else {
    const appParams = { rootTag }
    if (isTurboModuleEnabled()) {
      appParams.fabric = true
      appParams.initialProps = { concurrentRoot: true }
    }

    const reflectEndpoint = endpoint.replace('traces', 'reflect')

    console.error(`[BugsnagPerformance] Reflect endpoint: ${reflectEndpoint}`)

    const Scenario = () => 
      <ScenarioContext.Provider value={{ reflectEndpoint }}>
        <SafeAreaView>
          <scenario.App />
        </SafeAreaView>
      </ScenarioContext.Provider>
  
    AppRegistry.registerComponent(scenarioName, () => Scenario)
    AppRegistry.runApplication(scenarioName, appParams)
  }
}

export async function launchScenario (rootTag, clearPersistedData = true) {
  if (clearPersistedData) {
    await clearPersistedState()
  }

  let command

  if (REACT_APP_SCENARIO_NAME && REACT_APP_API_KEY) {
    command = {
      action: 'run-scenario',
      scenario_name: REACT_APP_SCENARIO_NAME,
      api_key: REACT_APP_API_KEY,
      endpoint: REACT_APP_ENDPOINT
    }
  } else {
    command = await getCurrentCommand()
  }

  switch (command.action) {
    case 'run-scenario':
      return await runScenario(
        rootTag,
        command.scenario_name,
        command.api_key,
        command.endpoint
      )

    case 'clear-all-persistent-data':
      return await launchScenario(rootTag, true)

    case 'set-sampling-probability-to-0':
      await setSamplingProbability(0)

      return await launchScenario(rootTag, false)

    case 'set-device-id':
      await setDeviceId('c1234567890abcdefghijklmnop')

      return await launchScenario(rootTag, false)

    case 'set-invalid-sampling-probability':
      await setSamplingProbability('this is not a valid sampling probability')

      return await launchScenario(rootTag, false)

    case 'set-expired-sampling-probability':
      // Friday February 13th 2009 23:31:30
      await setSamplingProbability(0, 1234567890)

      return await launchScenario(rootTag, false)

    case 'set-invalid-device-id':
      await setDeviceId('this is not a valid device ID')

      return await launchScenario(rootTag, false)

    default:
      throw new Error(`Unknown action '${command.action}'`)
  }
}
