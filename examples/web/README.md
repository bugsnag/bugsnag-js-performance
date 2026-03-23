# Bugsnag Performance Web Example

This is an example project showing how to use `@bugsnag/browser-performance` in a modern React web application with React Router and Vite.

For instructions on how to install and configure BugSnag Performance in your own application please consult our [Browser Performance documentation](https://docs.bugsnag.com/performance/integration-guides/web/).

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the `bugsnag-js-performance` repo and build the packages:

```bash
git clone git@github.com:bugsnag/bugsnag-js-performance.git
cd bugsnag-js-performance
npm install
npm run build
```

2. `cd` into the directory of this example and install the project dependencies:

```bash
# using npm
npm install

# OR using Yarn
yarn install
```

3. In `App.tsx` or `.env.local`, set `VITE_BUGSNAG_API_KEY` to your BugSnag project's API Key.

## Build and run the app

### Development Server

To start the Vite dev server, run the following command from the root of this example project:

```bash
# Using npm
npm run dev

# OR using Yarn
yarn dev
```

The application will open in your browser at `http://localhost:3000/` with hot module replacement enabled for instant updates.

### Production Build

To create an optimized production build:

```bash
# Using npm
npm run build

# OR using Yarn
yarn build
```

The optimized build will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
# Using npm
npm run preview

# OR using Yarn
yarn preview
```

## Generating Performance Data

Use the buttons in the example app to generate different types of spans and send them to BugSnag. To view Performance data from the example app, navigate to the Performance tab of your BugSnag project in the BugSnag Dashboard.

Route spans will be generated automatically when navigating between pages. For a full list of configuration options please see the [documentation](https://docs.bugsnag.com/performance/integration-guides/web/).

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

## Key Features

- **Automatic Route Tracking**: React Router integration with `ReactRouterRoutingProvider` for automatic route change monitoring
- **Custom Performance Spans**: Create and track custom operations with `startSpan()`
- **Network Request Monitoring**: Automatic tracking of all HTTP requests with performance metrics
- **URL Sanitization**: Automatic removal of sensitive parameters (API keys, tokens, passwords) from tracked URLs
- **Real-Time Dashboard**: View performance metrics and triggers for testing
- **TypeScript Support**: Full TypeScript configuration for type-safe development


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
   - Route change spans (from page navigation)
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
  routingProvider: new ReactRouterRoutingProvider(routes)
})
```

## API Reference

### Core Methods

- `BugsnagPerformance.start(options)` - Initialize the SDK
- `BugsnagPerformance.startSpan(name, options)` - Create a custom span

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

You can customize URL sanitization by intercepting `window.fetch` in `App.tsx`.

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

- [Bugsnag Performance Documentation](https://docs.bugsnag.com/performance/web-vitals/)
- [Bugsnag JavaScript Integration Guide](https://docs.bugsnag.com/performance/integration-guides/web/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)

## Support

For issues or questions:
- [GitHub Issues](https://github.com/bugsnag/bugsnag-js-performance/issues)
