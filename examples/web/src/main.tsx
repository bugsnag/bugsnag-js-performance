import React from 'react'
import ReactDOM from 'react-dom/client'
import BugsnagPerformance from '@bugsnag/browser-performance'
import { ReactRouterRoutingProvider } from '@bugsnag/react-router-performance'
import App from './App.tsx'
import './index.css'

// Define routes for React Router tracking
const routes = [
  { path: '/' },
  { path: '/custom-spans' },
  { path: '/network-requests' }
]

// Initialize Bugsnag Performance SDK before rendering the app
BugsnagPerformance.start({
  apiKey: 'YOUR_API_KEY',
  routingProvider: new ReactRouterRoutingProvider(routes)
})

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
