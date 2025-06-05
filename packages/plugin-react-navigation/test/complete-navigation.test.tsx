import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React, { useState } from 'react'
import { Button, View } from 'react-native'
import { CompleteNavigation } from '../lib/complete-navigation'
import BugsnagPluginReactNavigationNativePerformance from '../lib/react-navigation-native-plugin'
import type { Configuration, Plugin } from '@bugsnag/core-performance'

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
      // const getPluginSpy = jest.spyOn(BugsnagPerformance, 'getPlugin')
      const plugin = new BugsnagPluginReactNavigationNativePerformance()

      BugsnagPerformance.start({
        apiKey: VALID_API_KEY,
        plugins: [plugin as unknown as Plugin<Configuration>]
      })

      render(
      <View>
        <CompleteNavigation on='mount' />
      </View>
      )

      expect(jest.mocked(BugsnagPerformance.getPlugin)).toHaveBeenCalledWith(BugsnagPluginReactNavigationNativePerformance)
      expect(jest.mocked(BugsnagPerformance.getPlugin).mock.results[0].value).toBe(plugin)
    })

    it('handles missing plugin gracefully', () => {
      jest.spyOn(BugsnagPerformance, 'getPlugin').mockReturnValue(undefined)

      render(
    <CompleteNavigation on="mount">
      <View testID='view' />
    </CompleteNavigation>
      )

      // Should not throw and should render children
      expect(screen.getByTestId('view')).toBeTruthy()
    })
  })

  describe('conditions', () => {
    let plugin: BugsnagPluginReactNavigationNativePerformance

    beforeEach(() => {
      plugin = new BugsnagPluginReactNavigationNativePerformance()
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

      expect(plugin.blockNavigationEnd).toHaveBeenCalled()

      // wait for next tick
      jest.advanceTimersByTime(1)

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
      expect(plugin.blockNavigationEnd).toHaveBeenCalled()
      // wait for next tick
      jest.advanceTimersByTime(1)
      expect(plugin.unblockNavigationEnd).not.toHaveBeenCalled()

      fireEvent.press(screen.getByText('Unmount component'))

      expect(plugin.unblockNavigationEnd).toHaveBeenCalledWith('unmount')
    })

    it('calls the appropriate method when the "on" condition changes to true', () => {
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
})
