import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React, { useState } from 'react'
import { Button, View } from 'react-native'
import { CompleteNavigation } from '../lib/complete-navigation'
import BugsnagPluginReactNavigationNativePerformance from '../lib/react-navigation-native-plugin'

// The CompleteNavigation component calls the BugsnagPerformance.getPlugin() method
// to retrieve the instance of the plugin, so we need to mock the client
function createMockClient (plugin: BugsnagPluginReactNavigationNativePerformance) {
  jest.spyOn(plugin, 'blockNavigationEnd')
  jest.spyOn(plugin, 'unblockNavigationEnd')

  BugsnagPerformance.start({
    apiKey: VALID_API_KEY,
    plugins: [plugin]
  })

  return BugsnagPerformance
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('CompleteNavigation', () => {
  it('calls the appropriate methods on mount', () => {
    const plugin = new BugsnagPluginReactNavigationNativePerformance()
    createMockClient(plugin)

    render(
      <View>
        <CompleteNavigation on='mount' />
      </View>
    )

    expect(plugin.blockNavigationEnd).toHaveBeenCalled()

    // wait for next tick
    jest.advanceTimersByTime(1)

    expect(plugin.unblockNavigationEnd).toHaveBeenCalledWith('mount')
  })

  it('calls the appropriate methods on unmount', () => {
    const plugin = new BugsnagPluginReactNavigationNativePerformance()
    createMockClient(plugin)

    function TestApp () {
      const [showComponent, setShowComponent] = useState(true)

      return (
        <View>
          {showComponent && <CompleteNavigation on='unmount' />}
          <Button title='Unmount component' onPress={() => { setShowComponent(false) }} />
        </View>
      )
    }
    render(<TestApp />)
    expect(plugin.blockNavigationEnd).toHaveBeenCalled()
    // wait for next tick
    jest.advanceTimersByTime(1)
    expect(plugin.unblockNavigationEnd).not.toHaveBeenCalled()

    fireEvent.press(screen.getByText('Unmount component'))

    expect(plugin.unblockNavigationEnd).toHaveBeenCalledWith('unmount')
  })

  it('calls the appropriate method when the "on" condition changes to true', () => {
    const plugin = new BugsnagPluginReactNavigationNativePerformance()
    createMockClient(plugin)

    function TestApp () {
      const [loaded, setLoaded] = useState(false)

      return (
        <View >
          {<CompleteNavigation on={loaded} />}
          <Button title='Finish loading' onPress={() => { setLoaded(true) }} />
        </View>
      )
    }

    render(<TestApp />)
    expect(plugin.blockNavigationEnd).toHaveBeenCalled()
    jest.advanceTimersByTime(100)
    expect(plugin.unblockNavigationEnd).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Finish loading'))
    expect(plugin.unblockNavigationEnd).toHaveBeenCalledWith('condition')
  })
})
