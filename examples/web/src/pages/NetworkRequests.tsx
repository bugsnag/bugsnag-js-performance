import { useEffect, useState } from 'react'
import BugsnagPerformance from '@bugsnag/browser-performance'

interface RequestLog {
  id: string
  url: string
  method: string
  status?: number
  duration?: number
  timestamp: string
  error?: string
}

function NetworkRequests() {
  const [requests, setRequests] = useState<RequestLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const span = BugsnagPerformance.startSpan('Network Requests Page')
    return () => span.end()
  }, [])

  const addRequest = (url: string, method: string, status?: number, duration?: number, error?: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setRequests(prev => [{
      id: Math.random().toString(36),
      url,
      method,
      status,
      duration,
      timestamp,
      error
    }, ...prev].slice(0, 10)) // Keep last 10 requests
  }

  const makeGetRequest = async () => {
    setLoading(true)
    const startTime = Date.now()
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      const duration = Date.now() - startTime
      
      if (response.ok) {
        await response.json()
        addRequest(
          'https://jsonplaceholder.typicode.com/posts/1',
          'GET',
          response.status,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addRequest(
        'https://jsonplaceholder.typicode.com/posts/1',
        'GET',
        undefined,
        duration,
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      setLoading(false)
    }
  }

  const makePostRequest = async () => {
    setLoading(true)
    const startTime = Date.now()
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Post',
          body: 'This is a test post created by Bugsnag Performance example',
          userId: 1
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const duration = Date.now() - startTime
      
      if (response.ok) {
        await response.json()
        addRequest(
          'https://jsonplaceholder.typicode.com/posts',
          'POST',
          response.status,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addRequest(
        'https://jsonplaceholder.typicode.com/posts',
        'POST',
        undefined,
        duration,
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      setLoading(false)
    }
  }

  const makeSanitizedRequest = async () => {
    setLoading(true)
    const startTime = Date.now()
    try {
      // URL with sensitive parameters that will be sanitized
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/posts/1?apikey=secret123&token=mytoken456'
      )
      const duration = Date.now() - startTime
      
      if (response.ok) {
        await response.json()
        addRequest(
          'https://jsonplaceholder.typicode.com/posts/1?apikey=***&token=***',
          'GET',
          response.status,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addRequest(
        'https://jsonplaceholder.typicode.com/posts/1',
        'GET',
        undefined,
        duration,
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      setLoading(false)
    }
  }

  const makeFailingRequest = async () => {
    setLoading(true)
    const startTime = Date.now()
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/nonexistent')
      const duration = Date.now() - startTime
      
      if (!response.ok) {
        addRequest(
          'https://jsonplaceholder.typicode.com/nonexistent',
          'GET',
          response.status,
          duration
        )
      } else {
        await response.json()
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addRequest(
        'https://jsonplaceholder.typicode.com/nonexistent',
        'GET',
        undefined,
        duration,
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      setLoading(false)
    }
  }

  const clearRequests = () => {
    setRequests([])
  }

  return (
    <div className="page">
      <h1>🌐 Network Requests</h1>

      <div className="section">
        <h2>Track Network Performance</h2>
        <p>
          The Bugsnag Performance SDK automatically tracks all network requests made by your application.
          It includes automatic URL sanitization to remove sensitive parameters like tokens and API keys.
        </p>
      </div>

      <div className="section">
        <h3>Make Network Requests</h3>
        <p>
          Click the buttons below to make different types of network requests.
          Each request will be tracked and sent to your Bugsnag dashboard.
        </p>
        <div className="button-group">
          <button onClick={makeGetRequest} disabled={loading}>
            {loading ? 'Loading...' : 'GET Request'}
          </button>
          <button onClick={makePostRequest} disabled={loading} className="secondary">
            {loading ? 'Loading...' : 'POST Request'}
          </button>
          <button onClick={makeSanitizedRequest} disabled={loading} className="secondary">
            {loading ? 'Loading...' : 'Request with Sensitive Params'}
          </button>
          <button onClick={makeFailingRequest} disabled={loading} className="secondary">
            {loading ? 'Loading...' : 'Failing Request (404)'}
          </button>
        </div>
      </div>

      <div className="section">
        <h3>URL Sanitization</h3>
        <p>
          Sensitive parameters in URLs are automatically removed before being sent to Bugsnag:
        </p>
        <div className="example-code">
Original: https://api.example.com/data?apikey=secret123&token=mytoken456

Sanitized: https://api.example.com/data
        </div>
        <p>
          Removed parameters: <code>apikey</code>, <code>token</code>, <code>api_key</code>, 
          <code>password</code>, <code>secret</code>, <code>auth</code>
        </p>
      </div>

      <div className="section">
        <h3>Request Log</h3>
        <div className="button-group">
          <button onClick={clearRequests} className="secondary">Clear Log</button>
        </div>
        {requests.length === 0 ? (
          <p style={{ color: '#999' }}>No requests logged yet. Make a request above to see them here.</p>
        ) : (
          <div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#333' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#333' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#333' }}>URL</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#333' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: '#333' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '10px', color: '#666', fontSize: '12px' }}>{req.timestamp}</td>
                    <td style={{ padding: '10px', color: '#0066cc', fontWeight: 'bold' }}>{req.method}</td>
                    <td style={{ padding: '10px', color: '#666', fontSize: '12px' }}>
                      {req.url}
                      {req.error && <div style={{ color: '#f00' }}>Error: {req.error}</div>}
                    </td>
                    <td style={{ padding: '10px', color: req.status && req.status >= 400 ? '#f00' : '#666' }}>
                      {req.status || '-'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#666' }}>
                      {req.duration ? `${req.duration}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section">
        <h3>Automatic Tracking</h3>
        <p>
          The SDK automatically tracks:
        </p>
        <ul style={{ marginLeft: '20px' }}>
          <li>All HTTP requests (GET, POST, PUT, DELETE, etc.)</li>
          <li>Request duration and response status</li>
          <li>Network errors and timeouts</li>
          <li>Request headers (without sensitive data)</li>
          <li>Response timing and performance metrics</li>
        </ul>
      </div>
    </div>
  )
}

export default NetworkRequests
