import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { useState } from 'react'
import { Button, View } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { CompleteNavigation } from '../lib/CompleteNavigation'
import ReactNativeNavigationPlugin from '../lib/react-native-navigation-plugin'

jest.mock('react-native-navigation')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

// The CompleteNavigation component calls the BugsnagPerformance.getPlugin() method
// to retrieve the instance of the plugin, so we need to mock the client
function createMockClient (plugin: ReactNativeNavigationPlugin) {
  jest.spyOn(plugin, 'blockNavigationEnd')
  jest.spyOn(plugin, 'unblockNavigationEnd')

  BugsnagPerformance.start({
    apiKey: VALID_API_KEY,
    plugins: [plugin]
  })

  return BugsnagPerformance
}

describe('CompleteNavigation', () => {
  it('calls the appropriate methods on mount', () => {
    const plugin = new ReactNativeNavigationPlugin(Navigation)
    createMockClient(plugin)

    render(
      <View>
        <CompleteNavigation on='mount' />
      </View>
    )

    // Wait for component to mount
    jest.advanceTimersByTime(1)
    expect(plugin.blockNavigationEnd).toHaveBeenCalledTimes(1)
    expect(plugin.unblockNavigationEnd).toHaveBeenCalledTimes(1)
    expect(plugin.unblockNavigationEnd).toHaveBeenCalledWith('mount')
  })

  it('calls the appropriate methods on unmount', () => {
    const plugin = new ReactNativeNavigationPlugin(Navigation)
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

    // Wait for component to mount
    jest.advanceTimersByTime(1)
    expect(plugin.blockNavigationEnd).toHaveBeenCalledTimes(1)
    expect(plugin.unblockNavigationEnd).not.toHaveBeenCalled()

    fireEvent.press(screen.getByText('Unmount component'))
    expect(plugin.unblockNavigationEnd).toHaveBeenCalledTimes(1)
    expect(plugin.unblockNavigationEnd).toHaveBeenCalledWith('unmount')
  })

  it('calls the appropriate method when the "on" condition changes to true', () => {
    const plugin = new ReactNativeNavigationPlugin(Navigation)
    createMockClient(plugin)

    function TestApp () {
      const [loaded, setLoaded] = useState(false)

      return (
        <View>
          <CompleteNavigation on={loaded} />
          <Button title='Finish loading' onPress={() => { setLoaded(true) }} />
        </View>
      )
    }

    render(<TestApp />)

    // Wait for component to mount
    jest.advanceTimersByTime(1)
    expect(plugin.blockNavigationEnd).toHaveBeenCalledTimes(1)
    expect(plugin.unblockNavigationEnd).not.toHaveBeenCalled()

    // Update the condition prop
    fireEvent.press(screen.getByText('Finish loading'))
    expect(plugin.unblockNavigationEnd).toHaveBeenCalledTimes(1)
    expect(plugin.unblockNavigationEnd).toHaveBeenCalledWith('condition')
  })
})
