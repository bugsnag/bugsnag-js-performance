import React from 'react'
import ReactDOM from 'react-dom/client'
import BugsnagPerformance from '@bugsnag/browser-performance'
import { ReactRouterRoutingProvider } from '@bugsnag/react-router-performance'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import Home from './pages/Home'
import CustomSpans from './pages/CustomSpans'
import NetworkRequests from './pages/NetworkRequests'
import './index.css'

const routes = [
  { path: '/' },
  { path: '/custom-spans' },
  { path: '/network-requests' }
]

BugsnagPerformance.start({
  apiKey: 'YOUR_API_KEY',
  routingProvider: new ReactRouterRoutingProvider(routes)
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'custom-spans', element: <CustomSpans /> },
      { path: 'network-requests', element: <NetworkRequests /> }
    ]
  }
])

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
