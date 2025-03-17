import BugsnagPerformance from '@bugsnag/browser-performance'
import { withInstrumentedComponent } from '@bugsnag/plugin-react-performance'
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

const basename = '/docs/react'

function Component(count) {
  return (
    <>
      <div>
        <p>I am a wrapped component!</p>
      </div>
      <div>{count}</div>
    </>
  )
}

const WrappedComponent = withInstrumentedComponent(Component)

function Root() {
  const [show, setShow] = useState(true)
  const [count, setCount] = useState(0)

  return (
    <div>
      <button id='update-component' onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button
        id='unmount-component'
        onClick={() => {
          setShow(!show)
        }}
      >
        {show ? 'Unmount Component' : 'Mount Component'}
      </button>
      {show && <WrappedComponent count={count} />}
    </div>
  )
}

BugsnagPerformance.start({
  apiKey,
  endpoint,
  maximumBatchSize: 10,
  batchInactivityTimeoutMs: 5000,
  autoInstrumentNetworkRequests: false,
})

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
