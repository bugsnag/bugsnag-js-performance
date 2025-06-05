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
  jest.clearAllMocks()
  jest.useRealTimers()
})

describe('CompleteNavigation', () => {
  describe('getPlugin', () => {
    it('gets the plugin instance from BugsnagPerformance', () => {
      const plugin = new ReactNativeNavigationPlugin(Navigation)

      BugsnagPerformance.start({
        apiKey: VALID_API_KEY,
        plugins: [plugin]
      })

      render(
        <View>
          <CompleteNavigation on='mount' />
        </View>
      )

      expect(BugsnagPerformance.getPlugin).toHaveBeenCalledWith(ReactNativeNavigationPlugin)
      expect(jest.mocked(BugsnagPerformance.getPlugin).mock.results[0].value).toBe(plugin)
    })

    it('handles missing plugin gracefully', () => {
      jest.spyOn(BugsnagPerformance, 'getPlugin').mockReturnValue(undefined)

      render(
        <CompleteNavigation on='mount'>
          <View testID='view' />
        </CompleteNavigation>
      )

      // Should not throw and should render children
      expect(screen.getByTestId('view')).toBeTruthy()
    })
  })

  describe('conditions', () => {
    let plugin: ReactNativeNavigationPlugin

    beforeEach(() => {
      plugin = new ReactNativeNavigationPlugin(Navigation)
      jest.spyOn(plugin, 'blockNavigationEnd')
      jest.spyOn(plugin, 'unblockNavigationEnd')
      jest.spyOn(BugsnagPerformance, 'getPlugin').mockReturnValue(plugin)
    })

    it('calls the appropriate methods on mount', () => {
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
})
