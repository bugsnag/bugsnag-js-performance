import { Link, Outlet } from 'react-router-dom'

function App () {
  return (
    <div className="app">
      <nav className="nav">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/custom-spans">Custom Spans</Link></li>
          <li><Link to="/network-requests">Network Requests</Link></li>
        </ul>
      </nav>

      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}

export default App
