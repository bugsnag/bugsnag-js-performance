<script>
	let { children } = $props();

    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import { SvelteKitRoutingProvider } from '@bugsnag/svelte-kit-performance';
    import BugsnagPerformance from '@bugsnag/browser-performance';

    // BugsnagPerformance.start({
    //     apiKey: 'your-api-key',
    //     routingProvider: new SvelteKitRoutingProvider(beforeNavigate, afterNavigate)
    // })
</script>

<nav>
  <a href="/">Home</a>
  <a href="/contact/1" id="contact">Contact 1</a>
  <a href="/contact/1/profile" id="profile">Contact 1 profile</a>
</nav>

{@render children()}
