import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import BugsnagPerformance from '@bugsnag/browser-performance'
import { ReactRouterRoutingProvider } from '@bugsnag/react-router-performance'

import Home from './pages/Home'
import CustomSpans from './pages/CustomSpans'
import NetworkRequests from './pages/NetworkRequests'
import Dashboard from './pages/Dashboard'

// Define your routes for the routing provider
const routes = [
  { path: '/' },
  { path: '/custom-spans' },
  { path: '/network-requests' },
  { path: '/dashboard' }
]

function App() {
  useEffect(() => {
    // Initialize Bugsnag Performance with URL sanitization
    BugsnagPerformance.start({
      apiKey: import.meta.env.VITE_BUGSNAG_API_KEY || 'YOUR_API_KEY',
      // Use the React Router integration for automatic route tracking
      routingProvider: new ReactRouterRoutingProvider(routes)
    })

    // Sanitize URLs in network requests by intercepting fetch
    const originalFetch = window.fetch
    window.fetch = function(...args: any[]) {
      const url = args[0] instanceof Request ? args[0].url : args[0]
      if (typeof url === 'string') {
        try {
          const parsedUrl = new URL(url, window.location.origin)
          const sensitiveParams = ['token', 'apikey', 'api_key', 'password', 'secret', 'auth']
          for (const param of sensitiveParams) {
            parsedUrl.searchParams.delete(param)
          }
          args[0] = parsedUrl.toString()
        } catch (e) {
          // Invalid URL, skip sanitization
        }
      }
      return originalFetch.apply(this, args)
    }
  }, [])

  return (
    <Router>
      <div className="app">
        <nav className="nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/custom-spans">Custom Spans</Link></li>
            <li><Link to="/network-requests">Network Requests</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/custom-spans" element={<CustomSpans />} />
            <Route path="/network-requests" element={<NetworkRequests />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
