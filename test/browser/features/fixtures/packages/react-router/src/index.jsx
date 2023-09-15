import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Outlet
} from 'react-router-dom';
import BugsnagPerformance from '@bugsnag/browser-performance'
import { ReactRouterRoutingProvider } from '@bugsnag/react-router-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

const basename = '/react-router'

function Root() {
  return (
    <>
      <Link id="change-route" to="/contacts/1">
        Contact 1
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

const routes = [
    {
        path: '/',
        element: <Root />,
        children: [
          {
              path: 'contacts/:contactId',
              element: <Contact />,
          },
        ]
    },
]

const router = createBrowserRouter(routes, { basename })

BugsnagPerformance.start({
    apiKey,
    endpoint,
    maximumBatchSize: 13,
    batchInactivityTimeoutMs: 5000,
    autoInstrumentNetworkRequests: false,
    routingProvider: new ReactRouterRoutingProvider(routes, basename)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
