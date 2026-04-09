import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

import Home from './pages/Home'
import CustomSpans from './pages/CustomSpans'
import NetworkRequests from './pages/NetworkRequests'

function App () {
  return (
    <Router>
      <div className="app">
        <nav className="nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/custom-spans">Custom Spans</Link></li>
            <li><Link to="/network-requests">Network Requests</Link></li>
          </ul>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/custom-spans" element={<CustomSpans />} />
            <Route path="/network-requests" element={<NetworkRequests />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
