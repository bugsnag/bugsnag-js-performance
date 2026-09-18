function Home () {
  return (
    <div className="page">
      <h1>Bugsnag Browser Performance Example</h1>

      <div className="section">
        <p>
          This example demonstrates the <code>@bugsnag/browser-performance</code> SDK in a React application
          with React Router.
        </p>
        <p>
          The SDK is initialized in <code>main.tsx</code> before the app renders. Replace <code>'YOUR_API_KEY'</code> with
          your Bugsnag project API key, then check the Performance tab in your Bugsnag dashboard to see the data.
        </p>
      </div>

      <div className="section">
        <h3>What's being tracked</h3>
        <ul>
          <li><strong>Full page load</strong> &ndash; automatically instrumented on initial page load</li>
          <li><strong>Route changes</strong> &ndash; automatically tracked via <code>ReactRouterRoutingProvider</code></li>
          <li><strong>Network requests</strong> &ndash; all fetch/XHR requests are tracked automatically</li>
          <li><strong>Custom spans</strong> &ndash; see the Custom Spans page for examples</li>
        </ul>
      </div>
    </div>
  )
}

export default Home
