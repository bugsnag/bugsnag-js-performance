import { useEffect } from 'react'
import BugsnagPerformance from '@bugsnag/browser-performance'

function Home() {
  useEffect(() => {
    // Track page load with a unique trace ID for this route
    const span = BugsnagPerformance.startSpan('Home Page')
    
    return () => {
      span.end()
    }
  }, [])

  return (
    <div className="page">
      <h1>🐛 Bugsnag Performance Monitoring</h1>
      
      <div className="section">
        <h2>Welcome to the Web Example</h2>
        <p>
          This example demonstrates the Bugsnag Performance SDK in action with a modern React web application.
          It showcases automatic instrumentation, custom spans, network request tracking, and route monitoring.
        </p>
      </div>

      <div className="section">
        <h3>Features Included:</h3>
        <ul style={{ marginLeft: '20px', marginBottom: '10px' }}>
          <li><strong>Automatic Route Tracking:</strong> Navigate between pages to see route changes tracked automatically</li>
          <li><strong>Custom Spans:</strong> Create custom performance spans for your application logic</li>
          <li><strong>Network Monitoring:</strong> Track HTTP requests with automatic URL sanitization</li>
          <li><strong>Performance Dashboard:</strong> View performance metrics and span data in real-time</li>
          <li><strong>URL Sanitization:</strong> Sensitive parameters like tokens and API keys are automatically removed from tracked URLs</li>
        </ul>
      </div>

      <div className="section">
        <h3>Getting Started:</h3>
        <ol style={{ marginLeft: '20px', marginBottom: '10px' }}>
          <li>Set your Bugsnag API key in the <code>VITE_BUGSNAG_API_KEY</code> environment variable</li>
          <li>Navigate to different pages using the menu above</li>
          <li>Click buttons to create custom spans and make network requests</li>
          <li>Check your Bugsnag dashboard to see the performance data</li>
        </ol>
      </div>

      <div className="section">
        <h3>Configuration:</h3>
        <p>
          The SDK is configured in <code>App.tsx</code> with the following features:
        </p>
        <div className="example-code">
{`BugsnagPerformance.start({
  apiKey: 'YOUR_API_KEY',
  routingProvider: new ReactRouterRoutingProvider(routes),
  onNetworkRequestStart: (request) => {
    // Sanitize sensitive parameters
    // ...
  }
})`}
        </div>
      </div>

      <div className="section">
        <h3>Next Steps:</h3>
        <p>
          Explore the different sections of this example using the navigation menu above:
        </p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Custom Spans:</strong> Learn how to create and track custom performance spans</li>
          <li><strong>Network Requests:</strong> See how network requests are automatically tracked with URL sanitization</li>
          <li><strong>Dashboard:</strong> View real-time performance metrics and span data</li>
        </ul>
      </div>

      <div className="footer">
        <p>For more information, visit <a href="https://docs.bugsnag.com/performance-monitoring/" target="_blank" rel="noopener noreferrer">Bugsnag Performance Documentation</a></p>
      </div>
    </div>
  )
}

export default Home
