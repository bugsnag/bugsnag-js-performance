import React, { useState, useRef, useEffect } from "react"
import { createRoot } from "react-dom/client"
import BugsnagPerformance from "@bugsnag/browser-performance"
import { withInstrumentedComponent } from "@bugsnag/plugin-react-performance"

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get("api_key")
const endpoint = parameters.get("endpoint")

function Component({ count }) {
  return (
      <div>
        <p>I am a wrapped component!</p>
        <p>{count}</p>
      </div>
  )
}

const WrappedComponent = withInstrumentedComponent(Component)

const KeepAlive = () => {
  const [count, setCount] = useState(0)
  const timerRef = useRef()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCount(prevCount => prevCount + 1)
    }, 50)

    return () => {
      clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div>
      <p>I am here to keep the page load alive: {count}</p>
      <button id="end-page-load" onClick={() => { clearInterval(timerRef.current) }}>
        End page load
      </button>
    </div>
  )
}

const Root = () => {
  const [show, setShow] = React.useState(false)
  const [count, setCount] = React.useState(0)

  useEffect(() => {
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      setShow(true)
      await new Promise(resolve => setTimeout(resolve, 100))
      setCount(n => n + 1)
      await new Promise(resolve => setTimeout(resolve, 100))
      setShow(false)
      await new Promise(resolve => setTimeout(resolve, 100))
      document.getElementById("end-page-load").click()
    })()
  }, [])

  return (
    <div>
     <KeepAlive />
      {show && <WrappedComponent count={count} />}
    </div>
  )
}

BugsnagPerformance.start({
  apiKey,
  endpoint,
  maximumBatchSize: 15,
  batchInactivityTimeoutMs: 5000,
  autoInstrumentNetworkRequests: false,
})

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
