import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import Root from './routes/root';
import Contact from './routes/contact';
import BugsnagPerformance, { ReactRouterRoutingProvider } from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

const basename = '/react-router'

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
