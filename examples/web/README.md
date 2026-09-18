# Bugsnag Performance Web Example

A minimal example showing how to use `@bugsnag/browser-performance` in a React application with React Router and Vite.

For instructions on how to install and configure Bugsnag Performance in your own application, see the [Browser Performance documentation](https://docs.bugsnag.com/performance/integration-guides/web/).

## Getting Started

1. Clone the `bugsnag-js-performance` repo and build the packages:

```bash
git clone git@github.com:bugsnag/bugsnag-js-performance.git
cd bugsnag-js-performance
npm install
npm run build
```

2. Install the example dependencies:

```bash
cd examples/web
npm install
```

3. In `main.tsx`, replace `'YOUR_API_KEY'` with your Bugsnag project's API Key.

4. Start the dev server:

```bash
npm run dev
```

## What This Example Demonstrates

- **SDK initialization** &ndash; `BugsnagPerformance.start()` configured in `main.tsx` before the app renders
- **Full page load spans** &ndash; automatically instrumented on initial page load
- **Route change spans** &ndash; automatically tracked via `ReactRouterRoutingProvider`
- **Network request spans** &ndash; all fetch requests are tracked automatically
- **Custom spans** &ndash; creating spans with `startSpan()`, adding attributes, and nesting spans

## Project Structure

```
src/
├── main.tsx                  # SDK initialization and app entry point
├── App.tsx                   # Router setup and navigation
├── index.css                 # Styles
└── pages/
    ├── Home.tsx              # Overview of what's being tracked
    ├── CustomSpans.tsx       # Custom span creation examples
    └── NetworkRequests.tsx   # Triggers for network request tracking
```

## Generating Performance Data

Navigate between pages to generate route change spans. Use the buttons on the Custom Spans and Network Requests pages to generate additional spans. View the data in the Performance tab of your [Bugsnag dashboard](https://app.bugsnag.com/).

For a full list of configuration options, see the [documentation](https://docs.bugsnag.com/performance/integration-guides/web/).
