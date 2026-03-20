# Bugsnag Performance Web Example

A modern React web application demonstrating the Bugsnag Performance SDK with automatic instrumentation, custom spans, network request tracking, and route monitoring.

## Features

- **Automatic Route Tracking**: React Router integration with `ReactRouterRoutingProvider` for automatic route change monitoring
- **Custom Performance Spans**: Create and track custom operations with `startSpan()` and `startNavigationSpan()`
- **Network Request Monitoring**: Automatic tracking of all HTTP requests with performance metrics
- **URL Sanitization**: Automatic removal of sensitive parameters (API keys, tokens, passwords) from tracked URLs
- **Real-Time Dashboard**: View performance metrics and triggers for testing
- **TypeScript Support**: Full TypeScript configuration for type-safe development

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set your Bugsnag API key:**

Create a `.env.local` file in the root directory:

```env
VITE_BUGSNAG_API_KEY=your-bugsnag-api-key
```

You can get your API key from the [Bugsnag Dashboard](https://app.bugsnag.com/).

### Running the Development Server

```bash
npm run dev
```

The application will open in your browser at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The optimized build will be in the `dist` directory.

## Project Structure

```
src/
├── App.tsx              # Main app component with router and SDK initialization
├── main.tsx             # Entry point
├── index.css            # Global styles
└── pages/
    ├── Home.tsx         # Welcome page with feature overview
    ├── CustomSpans.tsx  # Examples of creating custom spans
    ├── NetworkRequests.tsx # Network request tracking demo
    └── Dashboard.tsx    # Performance metrics dashboard
```

## Usage Examples

### Basic SDK Initialization

```typescript
import BugsnagPerformance from '@bugsnag/browser-performance'
import { ReactRouterRoutingProvider } from '@bugsnag/react-router-performance'

const routes = [
  { path: '/' },
  { path: '/custom-spans' },
  { path: '/network-requests' },
  { path: '/dashboard' }
]

BugsnagPerformance.start({
  apiKey: 'your-api-key',
  routingProvider: new ReactRouterRoutingProvider(routes),
  onNetworkRequestStart: (request) => {
    // Sanitize URLs automatically
    if (request.url) {
      const url = new URL(request.url, window.location.origin)
      const sensitiveParams = ['token', 'apikey', 'api_key', 'password', 'secret', 'auth']
      for (const param of sensitiveParams) {
        url.searchParams.delete(param)
      }
      request.url = url.pathname + (url.search ? url.search : '')
    }
    return request
  }
})
```

### Creating Custom Spans

```typescript
// Simple span
const span = BugsnagPerformance.startSpan('My Operation')
// ... do work ...
span.end()

// With context
const span = BugsnagPerformance.startSpan('API Call')
span.setAttribute('endpoint', '/api/users')
span.setAttribute('method', 'POST')
span.end()

// Navigation span
const navSpan = BugsnagPerformance.startNavigationSpan('User Profile Page')
// ... render component ...
navSpan.end()
```

### Automatic Tracking

The SDK automatically tracks:
- **Route changes** via the routing provider
- **Network requests** (HTTP/fetch)
- **Resource loading** (scripts, stylesheets, images)
- **Page load metrics** (First Paint, DOM Content Loaded)
- **Long tasks** (JavaScript execution > 50ms)
- **Core Web Vitals** (LCP, FID, CLS)

## Viewing Performance Data

After running this example and interacting with the various features:

1. Visit your [Bugsnag Dashboard](https://app.bugsnag.com/)
2. Navigate to the Performance section
3. You'll see:
   - Route change spans
   - Custom spans you created
   - Network request spans
   - Performance metrics

## Configuration Options

The `BugsnagPerformance.start()` method accepts various options:

```typescript
BugsnagPerformance.start({
  apiKey: 'your-api-key',
  releaseStage: 'development',
  enabled: true,
  samplingRate: 0.1, // Send 10% of spans
  routingProvider: new ReactRouterRoutingProvider(routes),
  onNetworkRequestStart: (request) => {
    // Customize network requests
    return request
  }
})
```

## API Reference

### Core Methods

- `BugsnagPerformance.start(options)` - Initialize the SDK
- `BugsnagPerformance.startSpan(name, options)` - Create a custom span
- `BugsnagPerformance.startNavigationSpan(name)` - Create a navigation span

### Span Methods

- `span.end()` - End the span
- `span.setAttribute(key, value)` - Add attributes to the span
- `span.getTraceContext()` - Get trace context for linking with other systems

## Network Request Sanitization

Sensitive parameters are automatically removed from tracked URLs. The default list includes:

- `token`
- `apikey` / `api_key`
- `password`
- `secret`
- `auth`

You can customize this in the `onNetworkRequestStart` callback.

## Troubleshooting

### Spans not appearing in Bugsnag

1. Verify your API key is correct
2. Check that the `releaseStage` matches your Bugsnag setup
3. Ensure `enabled` is set to `true`
4. Check browser console for any errors

### High memory usage

- Reduce the sampling rate with `samplingRate: 0.1`
- Limit the number of custom spans you create
- Ensure you're always calling `span.end()`

### Missing route names

- Verify all routes are defined in the `routes` array passed to `ReactRouterRoutingProvider`
- Ensure route paths match exactly

## Learn More

- [Bugsnag Performance Documentation](https://docs.bugsnag.com/performance-monitoring/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)

## Support

For issues or questions:
- [Bugsnag Support](https://support.bugsnag.com/)
- [GitHub Issues](https://github.com/bugsnag/bugsnag-js-performance/issues)
