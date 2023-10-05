# `@bugsnag/react-router-performance`

> A react router integration for BugSnag performance

## Usage

```
import BugsnagPerformance from '@bugsnag/browser-performance'
import { ReactRouterRoutingProvider } from '@bugsnag/react-router-performance'

const basename = '/my-app'

const routes = [
    {
        path: '/',
        element: <Root />,
        children: [
          {
              path: 'contacts/:contactId',
              element: <Contact />,
          },
        ]
    },
]

// basename can be omitted if your application is served from the root
const router = createBrowserRouter(routes, { basename })

BugsnagPerformance.start({
    apiKey,
    routingProvider: new ReactRouterRoutingProvider(routes, basename)
})


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
```
