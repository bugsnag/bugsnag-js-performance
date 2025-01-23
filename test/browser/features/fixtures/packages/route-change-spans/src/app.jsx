import React, { useEffect } from "react"
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom"

function Navigation() {
  return (
    <div>
      <nav>
        <li>
          <Link to="/docs/route-change-spans">Home</Link>
        </li>
        <li>
          <Link to="/new-route" id="change-route">Change Route</Link>
        </li>
      </nav>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route index element={<Home />} />
        <Route path="/docs/route-change-spans" element={<Home />} />
        <Route path="/new-route" element={<About />} />
      </Routes>
    </Router>
  )
}

function Home() {
  return (
    <div>
      <h2>RouteChange Spans</h2>
      <a href="#anchor-link" id="go-to-anchor">Anchor Link</a>
      <h3 id="anchor-link">Anchor</h3>
    </div>
  )
}

function About() {
  useEffect(() => {
    document.title = "New Route"
  }, [])

  return <h2>New Route</h2>
}

const container = document.getElementById('app')
const root = createRoot(container)
root.render(<App />)
