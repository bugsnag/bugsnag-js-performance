# `@bugsnag/svelte-kit-performance`

> A svelte kit integration for BugSnag performance

## Usage

We recommend initializing BugSnag in a shared `+layout.svelte` component at the top level of your application 

```
import BugsnagPerformance from '@bugsnag/browser-performance'
import { SvelteKitRoutingProvider } from '@bugsnag/svelte-kit-performance'
import { beforeNavigate, afterNavigate } from '$app/navigation';

BugsnagPerformance.start({
    apiKey,
    routingProvider: new SvelteKitRoutingProvider(beforeNavigate, afterNavigate)
})
```
