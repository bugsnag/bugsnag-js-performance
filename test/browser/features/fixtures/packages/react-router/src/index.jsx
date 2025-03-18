import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Outlet,
} from "react-router-dom";
import BugsnagPerformance from '@bugsnag/browser-performance'
import { withInstrumentedComponent } from '@bugsnag/plugin-react-performance'
import { ReactRouterRoutingProvider } from '@bugsnag/react-router-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

const basename = '/docs/react-router'

function Root() {
  return (
    <>
      <Link id="change-route" to="/contacts/1">
        Contact 1
      </Link>
      <Link id="change-route-nested-component" to="/nested-component">
        Nested Component
      </Link>
      <Outlet />
    </>
  )
}

function Contact() {
  useEffect(() => {
    document.title = 'Contact 1'
  }, [])

  return <div id="contact">Contact</div>
}

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

function NestedComponent() {
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

const routes = [
    {
        path: '/',
        element: <Root />,
        children: [
          {
              path: 'contacts/:contactId',
              element: <Contact />,
          },
          {
              path: 'nested-component',
              element: <NestedComponent />,
          },
        ],
    },
]

const router = createBrowserRouter(routes, { basename })

BugsnagPerformance.start({
    apiKey,
    endpoint,
    maximumBatchSize: 2,
    batchInactivityTimeoutMs: 5000,
    autoInstrumentFullPageLoads: false,
    autoInstrumentNetworkRequests: false,
    routingProvider: new ReactRouterRoutingProvider(routes, basename),
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
