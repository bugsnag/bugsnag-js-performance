import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { withInstrumentedComponentLifecycle } from '../lib/instrumented-component-lifecycle'

jest.useFakeTimers()

describe('withInstrumentedComponentLifecycle', () => {
  it('renders the provided component', () => {
    const Component = () => <h1>Testing</h1>
    const WrappedComponent = withInstrumentedComponentLifecycle(Component, {
      name: 'TestComponent'
    })

    render(<WrappedComponent />)

    expect(screen.getByText('Testing')).toBeInTheDocument()
  })
})
