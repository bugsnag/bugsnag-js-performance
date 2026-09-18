import { useState } from 'react'

function NetworkRequests () {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const showStatus = (message: string) => {
    setStatus(message)
    setTimeout(() => { setStatus('') }, 2000)
  }

  const makeGetRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      await response.json()
      showStatus(`GET ${response.status}`)
    } catch (error) {
      showStatus('Request failed')
    } finally {
      setLoading(false)
    }
  }

  const makePostRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', body: 'Test post', userId: 1 }),
        headers: { 'Content-Type': 'application/json' }
      })
      await response.json()
      showStatus(`POST ${response.status}`)
    } catch (error) {
      showStatus('Request failed')
    } finally {
      setLoading(false)
    }
  }

  const makeFailingRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/nonexistent')
      showStatus(`GET ${response.status}`)
    } catch (error) {
      showStatus('Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>Network Requests</h1>

      <div className="section">
        <p>
          The SDK automatically tracks all fetch and XHR requests. Click the buttons below
          to make requests and check your Bugsnag dashboard to see the network spans.
        </p>
      </div>

      <div className="section">
        <h3>Make requests</h3>
        <div className="button-group">
          <button onClick={makeGetRequest} disabled={loading}>GET Request</button>
          <button onClick={makePostRequest} disabled={loading}>POST Request</button>
          <button onClick={makeFailingRequest} disabled={loading}>404 Request</button>
        </div>
      </div>

      {status && <div className="success">{status}</div>}
    </div>
  )
}

export default NetworkRequests
