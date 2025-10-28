# `@bugsnag/svelte-kit-performance`

> A svelte kit integration for BugSnag performance

## Usage

We recommend initializing BugSnag in a shared `+layout.svelte` component at the top level of your application 

```svelte
<script>
    let { children, data } = $props();

    import BugsnagPerformance from '@bugsnag/browser-performance'
    import { SvelteKitRoutingProvider } from '@bugsnag/svelte-kit-performance'
    import { beforeNavigate, afterNavigate } from '$app/navigation'
    import { page } from '$app/state'

    BugsnagPerformance.start({
        apiKey: 'YOUR_API_KEY',
        routingProvider: new SvelteKitRoutingProvider(beforeNavigate, afterNavigate, page.route.id)
    })
</script>

{@render children()}
```
