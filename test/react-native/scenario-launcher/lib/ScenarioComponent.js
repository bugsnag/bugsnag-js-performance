import React, { useContext } from 'react'
import { ScenarioContext } from './ScenarioContext'
import * as Scenarios from '../scenarios'
import BugsnagPerformance from '@bugsnag/react-native-performance'

export const ScenarioComponent = () => {
  const scenarioContext = useContext(ScenarioContext)

  if (scenarioContext) {
    const scenario = Scenarios[scenarioContext.name]
    const Scenario = scenario.withInstrumentedAppStarts ? BugsnagPerformance.withInstrumentedAppStarts(scenario.App) : scenario.App
    return <Scenario />
  }

  return null
}
