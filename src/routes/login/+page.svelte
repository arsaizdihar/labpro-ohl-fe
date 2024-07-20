<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createAuthQuery } from '$lib/user';

	const user = createAuthQuery();

	$: if (browser && $user.data) {
		goto('/dashboard');
	}
</script>
