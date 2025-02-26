import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { withInstrumentedComponentLifecycle } from '../lib/instrumented-component-lifecycle'
import BugsnagPerformance from '@bugsnag/browser-performance'
import { createTestClient } from '@bugsnag/js-performance-test-utilities'

const mockClient = createTestClient()

// Use doMock to prevent hoisting
jest.doMock('@bugsnag/browser-performance', () => {
  return mockClient
})

jest.useFakeTimers()

afterEach(() => {
  jest.clearAllMocks()
})

describe('withInstrumentedComponentLifecycle', () => {
  it('renders the provided component', () => {
    const Component = () => <div>Test Component</div>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, {
      name: 'TestComponent'
    })

    expect(BugsnagPerformance.appState).toBe('starting')

    render(<WrappedComponent />)

    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  it('creates componentMountSpan when a appState is not ready and component is mounted', () => {
    const Component = () => <div>Test Component</div>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, {
      name: 'TestComponent'
    })

    const spy = jest.spyOn(BugsnagPerformance, 'startSpan')
    expect(spy).toHaveBeenCalledTimes(0)
    expect(BugsnagPerformance.appState).toBe('starting')

    render(<WrappedComponent />)

    expect(screen.getByText('Test Component')).toBeTruthy()

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith('[ViewLoad/Component]TestComponent')
    expect(spy).toHaveBeenCalledWith('[ViewLoadPhase/Mount]TestComponent')
  })

  it('creates componentUnmountSpan when a component is unmounted', async () => {
    const Component = () => <div>Test Component</div>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, { name: 'TestComponent' })

    const spy = jest.spyOn(BugsnagPerformance, 'startSpan')

    expect(spy).toHaveBeenCalledTimes(0)
    const { unmount } = render(<WrappedComponent />)
    unmount()

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy).toHaveBeenCalledWith('[ViewLoadPhase/Unmount]TestComponent')
  })

  it('creates componentUpdateSpan when a component is updated', () => {
    const Counter = (props: { count: number }) => <div>{ props.count }</div>
    const WrappedComponent = withInstrumentedComponentLifecycle(Counter)
    const spy = jest.spyOn(BugsnagPerformance, 'startSpan')
    const { rerender } = render(<WrappedComponent count={0} />)

    expect(spy).toHaveBeenCalledTimes(2)

    rerender(<WrappedComponent count={1} />)
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy).toHaveBeenCalledWith('[ViewLoadPhase/Update]Counter')
  })

  it('does not create componentUpdateSpan if includeComponentUpdates false', () => {
    const Counter = (props: { count: number }) => <div>{props.count}</div>
    const WrappedComponent = withInstrumentedComponentLifecycle(Counter, {
      includeComponentUpdates: false
    })
    const spy = jest.spyOn(BugsnagPerformance, 'startSpan')
    const { rerender } = render(<WrappedComponent count={0} />)

    expect(spy).toHaveBeenCalledTimes(2)

    rerender(<WrappedComponent count={4} />)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).not.toHaveBeenCalledWith('[ViewLoadPhase/Update]Counter')
  })
})
