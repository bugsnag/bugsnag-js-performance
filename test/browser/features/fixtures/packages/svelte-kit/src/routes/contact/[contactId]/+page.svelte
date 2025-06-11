<script>
    import { page } from '$app/state';

    const title = `Contact ${page.data.contactId}`;
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<h1>{title}</h1>