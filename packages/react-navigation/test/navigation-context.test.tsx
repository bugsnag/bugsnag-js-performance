import { fireEvent, render, screen } from '@testing-library/react-native'
import { useContext } from 'react'
import { Button, View } from 'react-native'
import { NavigationContext, NavigationContextProvider } from '../lib/navigation-context'
import { createTestClient, createTestSpan } from './utils'

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

const TestApp = () => {
  const { blockNavigationEnd, unblockNavigationEnd, triggerNavigationEnd } = useContext(NavigationContext)

  return (
    <View>
      <Button title="Trigger Navigation End" onPress={triggerNavigationEnd} />
      <Button title="Block Navigation" onPress={blockNavigationEnd} />
      <Button title="Unblock Navigation" onPress={unblockNavigationEnd} />
    </View>
  )
}

describe('NavigationContextProvider', () => {
  it('Automatically creates a navigation span when currentRoute is provided', () => {
    const testSpan = createTestSpan()
    const testClient = createTestClient(testSpan)

    render(
      <NavigationContextProvider client={testClient} currentRoute="test-route" >
        <TestApp />
      </NavigationContextProvider>
    )

    fireEvent.press(screen.getByText('Trigger Navigation End'))
    jest.advanceTimersByTime(100)
    expect(testSpan.end).toHaveBeenCalled()
  })

  it('Prevents a navigation span from ending when navigation is blocked', () => {
    const testSpan = createTestSpan()
    const testClient = createTestClient(testSpan)

    render(
      <NavigationContextProvider client={testClient} currentRoute="test-route" >
        <TestApp />
      </NavigationContextProvider>
    )

    fireEvent.press(screen.getByText('Trigger Navigation End'))
    jest.advanceTimersByTime(90) // not enough time to end the span
    fireEvent.press(screen.getByText('Block Navigation'))
    jest.advanceTimersByTime(100)
    expect(testSpan.end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    expect(testSpan.end).not.toHaveBeenCalled()
    jest.advanceTimersByTime(100)
    expect(testSpan.end).toHaveBeenCalled()
  })

  it('Does not end a navigation span while multiple components are blocking', () => {
    const testSpan = createTestSpan()
    const testClient = createTestClient(testSpan)

    render(
      <NavigationContextProvider client={testClient} currentRoute="test-route" >
        <TestApp />
      </NavigationContextProvider>
    )

    fireEvent.press(screen.getByText('Trigger Navigation End'))
    fireEvent.press(screen.getByText('Block Navigation'))
    fireEvent.press(screen.getByText('Block Navigation'))
    jest.advanceTimersByTime(100)
    expect(testSpan.end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)
    expect(testSpan.end).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Unblock Navigation'))
    jest.advanceTimersByTime(100)
    expect(testSpan.end).toHaveBeenCalled()
  })
})
