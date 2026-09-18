import { useState } from 'react'
import BugsnagPerformance from '@bugsnag/browser-performance'

function CustomSpans () {
  const [status, setStatus] = useState('')

  const showStatus = (message: string) => {
    setStatus(message)
    setTimeout(() => { setStatus('') }, 2000)
  }

  const createSimpleSpan = () => {
    const span = BugsnagPerformance.startSpan('Simple Operation')
    setTimeout(() => {
      span.end()
      showStatus('Simple span sent')
    }, 500)
  }

  const createSpanWithAttributes = () => {
    const span = BugsnagPerformance.startSpan('Operation with Attributes')
    span.setAttribute('user_type', 'premium')
    span.setAttribute('region', 'us-east-1')
    setTimeout(() => {
      span.end()
      showStatus('Span with attributes sent')
    }, 300)
  }

  const createNestedSpans = () => {
    const parent = BugsnagPerformance.startSpan('Parent Operation', { parentContext: null })

    const child1 = BugsnagPerformance.startSpan('Child Operation 1')
    setTimeout(() => { child1.end() }, 200)

    const child2 = BugsnagPerformance.startSpan('Child Operation 2')
    setTimeout(() => {
      child2.end()
      parent.end()
      showStatus('Nested spans sent')
    }, 400)
  }

  return (
    <div className="page">
      <h1>Custom Spans</h1>

      <div className="section">
        <p>
          Use <code>BugsnagPerformance.startSpan()</code> to measure specific operations in your app.
          Click the buttons below and check your Bugsnag dashboard to see the spans.
        </p>
      </div>

      <div className="section">
        <h3>Simple span</h3>
        <p>A basic span that measures a single operation.</p>
        <div className="button-group">
          <button onClick={createSimpleSpan}>Create Simple Span</button>
        </div>
      </div>

      <div className="section">
        <h3>Span with attributes</h3>
        <p>Spans can have custom attributes attached for filtering in the dashboard.</p>
        <div className="button-group">
          <button onClick={createSpanWithAttributes}>Create Span with Attributes</button>
        </div>
      </div>

      <div className="section">
        <h3>Nested spans</h3>
        <p>
          Child spans are automatically nested under the current parent context.
          Pass <code>parentContext: null</code> to start a new trace.
        </p>
        <div className="button-group">
          <button onClick={createNestedSpans}>Create Nested Spans</button>
        </div>
      </div>

      {status && <div className="success">{status}</div>}
    </div>
  )
}

export default CustomSpans
