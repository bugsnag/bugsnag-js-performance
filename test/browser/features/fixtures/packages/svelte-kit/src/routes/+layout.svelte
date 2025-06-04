<script>
  let { children, data } = $props();
  
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { base } from '$app/paths';
  import { SvelteKitRoutingProvider } from '@bugsnag/svelte-kit-performance';
  import BugsnagPerformance from '@bugsnag/browser-performance';
  import { onMount } from 'svelte';
  
  onMount(() => {
    const apiKey = data.url.searchParams.get('api_key')
    const endpoint = data.url.searchParams.get('endpoint')
    
    BugsnagPerformance.start({
      apiKey,
      endpoint,
      maximumBatchSize: 5,
      batchInactivityTimeoutMs: 5000,
      autoInstrumentFullPageLoads: false,
      autoInstrumentNetworkRequests: false,
      routingProvider: new SvelteKitRoutingProvider(beforeNavigate, afterNavigate)
    })
  })
</script>

<nav>
  <a href="{base}/">Home</a>
  <a href="{base}/contact/1" id="contact">Contact 1</a>
  <a href="{base}/contact/1/profile" id="profile">Contact 1 profile</a>
</nav>

{@render children()}
