import { useEffect, useState } from 'react'
import BugsnagPerformance from '@bugsnag/browser-performance'

interface PerformanceMetrics {
  navigationTiming: {
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
  }
  memoryUsage: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  networkInfo: {
    effectiveType: string
    downlink: number
    rtt: number
  }
}

function Dashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [spans, setSpans] = useState<string[]>([])

  useEffect(() => {
    const span = BugsnagPerformance.startSpan('Dashboard Page', { parentContext: null })

    // Collect performance metrics
    const collectMetrics = () => {
      const perfData: PerformanceMetrics = {
        navigationTiming: {
          domContentLoaded: 0,
          loadComplete: 0,
          firstPaint: 0
        },
        memoryUsage: {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0
        },
        networkInfo: {
          effectiveType: 'unknown',
          downlink: 0,
          rtt: 0
        }
      }

      // Navigation Timing API
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navTiming) {
        perfData.navigationTiming.domContentLoaded = Math.round(navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart)
        perfData.navigationTiming.loadComplete = Math.round(navTiming.loadEventEnd - navTiming.loadEventStart)
      }

      // Paint Timing API
      const paintEntries = performance.getEntriesByType('paint')
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
      if (firstPaint) {
        perfData.navigationTiming.firstPaint = Math.round(firstPaint.startTime)
      }

      // Memory API (Chrome only)
      if ((performance as any).memory) {
        const memory = (performance as any).memory
        perfData.memoryUsage.usedJSHeapSize = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100
        perfData.memoryUsage.totalJSHeapSize = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100
        perfData.memoryUsage.jsHeapSizeLimit = Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100
      }

      // Network Information API (if available)
      const nav = navigator as any
      if (nav.connection) {
        const conn = nav.connection
        perfData.networkInfo.effectiveType = conn.effectiveType || 'unknown'
        perfData.networkInfo.downlink = conn.downlink || 0
        perfData.networkInfo.rtt = conn.rtt || 0
      }

      setMetrics(perfData)
    }

    // Give the page time to fully load before collecting metrics
    setTimeout(collectMetrics, 1000)

    return () => span.end()
  }, [])

  const triggerMultipleSpans = () => {
    const newSpans = []
    
    for (let i = 1; i <= 5; i++) {
      const spanName = `Dashboard Action ${i}`
      const s = BugsnagPerformance.startSpan(spanName)
      newSpans.push(spanName)
      
      setTimeout(() => {
        s.setAttribute('action_id', `action-${i}`)
        s.end()
      }, i * 300)
    }
    
    setSpans(newSpans)
    setTimeout(() => setSpans([]), 3000)
  }

  const recordCustomMetric = () => {
    const span = BugsnagPerformance.startSpan('Custom Metric Recording')
    
    span.setAttribute('metric_type', 'user_engagement')
    span.setAttribute('engagement_score', Math.random() * 100)
    span.setAttribute('session_duration', Date.now() % 3600000)
    
    setTimeout(() => {
      span.end()
    }, 500)
  }

  return (
    <div className="page">
      <h1>📈 Performance Dashboard</h1>

      <div className="section">
        <h2>Real-Time Performance Metrics</h2>
        <p>
          This dashboard displays real-time performance metrics collected by the Bugsnag Performance SDK.
          Use the buttons below to trigger actions that will be tracked in your Bugsnag dashboard.
        </p>
      </div>

      <div className="section">
        <h3>Performance Metrics</h3>
        {metrics ? (
          <div className="stats">
            {metrics.navigationTiming.domContentLoaded > 0 && (
              <div className="stat-card">
                <h4>DOM Content Loaded</h4>
                <p>{metrics.navigationTiming.domContentLoaded}ms</p>
              </div>
            )}
            {metrics.navigationTiming.loadComplete > 0 && (
              <div className="stat-card">
                <h4>Page Load Complete</h4>
                <p>{metrics.navigationTiming.loadComplete}ms</p>
              </div>
            )}
            {metrics.navigationTiming.firstPaint > 0 && (
              <div className="stat-card">
                <h4>First Paint</h4>
                <p>{metrics.navigationTiming.firstPaint}ms</p>
              </div>
            )}
            {metrics.memoryUsage.usedJSHeapSize > 0 && (
              <div className="stat-card">
                <h4>Heap Memory Used</h4>
                <p>{metrics.memoryUsage.usedJSHeapSize} MB</p>
              </div>
            )}
            {metrics.networkInfo.effectiveType !== 'unknown' && (
              <div className="stat-card">
                <h4>Connection Type</h4>
                <p>{metrics.networkInfo.effectiveType}</p>
              </div>
            )}
            {metrics.networkInfo.rtt > 0 && (
              <div className="stat-card">
                <h4>Network RTT</h4>
                <p>{metrics.networkInfo.rtt}ms</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#999' }}>Loading metrics...</div>
        )}
      </div>

      <div className="section">
        <h3>Trigger Performance Events</h3>
        <p>
          Click the buttons below to trigger various performance tracking events
          that will appear in your Bugsnag dashboard.
        </p>
        <div className="button-group">
          <button onClick={triggerMultipleSpans}>
            Trigger Multiple Spans
          </button>
          <button onClick={recordCustomMetric} className="secondary">
            Record Custom Metric
          </button>
        </div>
        {spans.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <strong>Active spans:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              {spans.map((span, idx) => (
                <li key={idx}>{span}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="section">
        <h3>What Gets Tracked</h3>
        <p>The Bugsnag Performance SDK automatically tracks:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Page Navigation:</strong> Route changes and page transitions</li>
          <li><strong>Custom Spans:</strong> User-created performance markers</li>
          <li><strong>Network Requests:</strong> All HTTP requests with timing data</li>
          <li><strong>Resource Timing:</strong> Script, stylesheet, and image load times</li>
          <li><strong>Long Tasks:</strong> JavaScript execution tasks over 50ms</li>
          <li><strong>Core Web Vitals:</strong> LCP, FID, CLS, and other key metrics</li>
          <li><strong>Memory Usage:</strong> JavaScript heap size (where available)</li>
          <li><strong>User Interactions:</strong> Clicks and other interactions</li>
        </ul>
      </div>

      <div className="section">
        <h3>Integration with React Router</h3>
        <p>
          This application uses the React Router integration provided by <code>@bugsnag/react-router-performance</code>.
          This allows automatic tracking of route changes with meaningful route names instead of just URLs.
        </p>
        <div className="example-code">
{`import { ReactRouterRoutingProvider } from '@bugsnag/react-router-performance'

const routes = [
  { path: '/' },
  { path: '/custom-spans' },
  { path: '/network-requests' },
  { path: '/dashboard' }
]

BugsnagPerformance.start({
  apiKey: 'YOUR_API_KEY',
  routingProvider: new ReactRouterRoutingProvider(routes)
})`}
        </div>
      </div>

      <div className="section">
        <h3>Next Steps</h3>
        <ol style={{ marginLeft: '20px' }}>
          <li>Check your Bugsnag dashboard to see the collected metrics</li>
          <li>Navigate between different pages to see route tracking in action</li>
          <li>Use custom spans to track your application-specific operations</li>
          <li>Enable URL sanitization to protect sensitive data</li>
          <li>Set custom attributes on spans for better filtering and analysis</li>
        </ol>
      </div>

      <div className="footer">
        <p>
          For more information about Bugsnag Performance Monitoring,
          visit <a href="https://docs.bugsnag.com/performance-monitoring/" target="_blank" rel="noopener noreferrer">the documentation</a>
        </p>
      </div>
    </div>
  )
}

export default Dashboard
