<script>
    let { children } = $props();

    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import BugsnagPerformance from '@bugsnag/browser-performance';
    import { SvelteKitRoutingProvider } from '@bugsnag/svelte-kit-performance';

        BugsnagPerformance.start({
        apiKey: 'd87bab7258fc1b8c236c1d21a6665634',
        routingProvider: new SvelteKitRoutingProvider(beforeNavigate, afterNavigate)
    })
</script>

<nav>
  <a href="/">Home</a>
  <a href="/contact/1" id="contact">Contact 1</a>
  <a href="/contact/2" id="contact-2">Contact 2</a>
  <a href="/contact/3" id="contact-3">Contact 3</a>
</nav>

{@render children()}
