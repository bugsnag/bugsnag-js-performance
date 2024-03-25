import { fireEvent, render, screen } from '@testing-library/react-native'
import React, { useState } from 'react'
import { Button } from 'react-native'
import { CompleteNavigation } from '../lib/complete-navigation'
import { NavigationContext } from '../lib/navigation-context'
jest.useFakeTimers()
describe('CompleteNavigation', () => {
  it('calls the appropriate methods on mount', () => {
    const blockNavigationEnd = jest.fn()
    const unblockNavigationEnd = jest.fn()
    const triggerNavigationEnd = jest.fn()

    render(
      <NavigationContext.Provider value={{ blockNavigationEnd, unblockNavigationEnd, triggerNavigationEnd }} >
        <CompleteNavigation on='mount' />
      </NavigationContext.Provider>
    )

    expect(blockNavigationEnd).toHaveBeenCalled()

    // wait for next tick
    jest.advanceTimersByTime(1)

    expect(unblockNavigationEnd).toHaveBeenCalledWith('mount')
  })

  it('calls the appropriate methods on unmount', () => {
    const blockNavigationEnd = jest.fn()
    const unblockNavigationEnd = jest.fn()
    const triggerNavigationEnd = jest.fn()
    function TestApp () {
      const [showComponent, setShowComponent] = useState(true)

      return (
        <NavigationContext.Provider value={{ blockNavigationEnd, unblockNavigationEnd, triggerNavigationEnd }} >
          {showComponent && <CompleteNavigation on='unmount' />}
          <Button title='Unmount component' onPress={() => { setShowComponent(false) }} />
        </NavigationContext.Provider>
      )
    }
    render(<TestApp />)
    expect(blockNavigationEnd).toHaveBeenCalled()
    // wait for next tick
    jest.advanceTimersByTime(1)
    expect(unblockNavigationEnd).not.toHaveBeenCalled()

    fireEvent.press(screen.getByText('Unmount component'))

    expect(unblockNavigationEnd).toHaveBeenCalledWith('unmount')
  })

  it('calls the appropriate method when the "on" condition changes to true', () => {
    const blockNavigationEnd = jest.fn()
    const unblockNavigationEnd = jest.fn()
    const triggerNavigationEnd = jest.fn()

    function TestApp () {
      const [loaded, setLoaded] = useState(false)

      return (
        <NavigationContext.Provider value={{ blockNavigationEnd, unblockNavigationEnd, triggerNavigationEnd }} >
          {<CompleteNavigation on={loaded} />}
          <Button title='Finish loading' onPress={() => { setLoaded(true) }} />
        </NavigationContext.Provider>
      )
    }

    render(<TestApp />)
    expect(blockNavigationEnd).toHaveBeenCalled()
    jest.advanceTimersByTime(100)
    expect(unblockNavigationEnd).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Finish loading'))
    expect(unblockNavigationEnd).toHaveBeenCalledWith('condition')
  })
})
