import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Outlet
} from "react-router-dom";
import BugsnagPerformance from "@bugsnag/browser-performance"
import { ReactRouterRoutingProvider } from "@bugsnag/react-router-performance"
import { withInstrumentedComponent } from "@bugsnag/plugin-react-performance"

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get("api_key")
const endpoint = parameters.get("endpoint")

const basename = "/docs/react-router"

function Root() {
  return (
    <>
      <Link id="change-route" to="/contacts/1">
        Contact 1
      </Link>
      <Link id="change-route-component-spans" to="/component-lifecycle-spans">
        Component Lifecycle Spans
      </Link>
      <Outlet />
    </>
  )
}

function Contact() {
  useEffect(() => {
    document.title = "Contact 1"
  }, [])

  return <div id="contact">Contact</div>
}

function Component({ count }) {
  return (
    <div>
      <p>Wrapped Component</p>
      <p>count: {count}</p>
    </div>
  )
}

const WrappedComponent = withInstrumentedComponent(Component)

function KeepAlive() {
  useEffect(() => {
        // stop the page from settling until the 'stop-clock' button is
        // clicked, otherwise we can't reliably get a first input delay event
  
        const node = document.getElementById("clock")
        let time = 0
  
        const interval = setInterval(() => {
          node.innerText += `${time++}\n`
        }, 50)
  
        document.getElementById("stop-clock").addEventListener("click", () => {
          document.title = "New title"
  
          // delay stopping the clock for a bit so the performance observers
          // have a chance to fire
          setTimeout(() => { clearInterval(interval) }, 1000)
        })

        return () => {
          clearInterval(interval)
        }
  }, [])

  return (
    <div>
      <button id="stop-clock">Stop</button>
      <pre id="clock"></pre>
      <p>I'm here to make the layout shift when the clock ticks</p>
    </div>
  )
}

function ComponentLifecycleSpans() {
  const [show, setShow] = useState(true)
  const [count, setCount] = useState(0)

  return (
    <div id="component-lifecycle-spans">
      <h1>Component Lifecycle Spans</h1>
      <button id="update-props" onClick={() => { setCount(n => n + 1) }}>Update props</button>
      <button id="hide-component" onClick={() => { setShow(n => !n) }}>Hide component</button>
      {show ? <WrappedComponent count={count} /> : null}
      <KeepAlive />
    </div>
  )
}

const routes = [
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "contacts/:contactId",
        element: <Contact />
      },
      {
        path: "component-lifecycle-spans",
        element: <ComponentLifecycleSpans />
      }
    ]
  }
]

const router = createBrowserRouter(routes, { basename })

BugsnagPerformance.start({
    apiKey,
    endpoint,
    maximumBatchSize: 6,
    batchInactivityTimeoutMs: 5000,
    autoInstrumentFullPageLoads: false,
    autoInstrumentNetworkRequests: false,
    routingProvider: new ReactRouterRoutingProvider(routes, basename)
})

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
