<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createAuthQuery } from '$lib/user';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	const user = createAuthQuery();

	$: if (browser && $user.data) {
		goto('/dashboard');
	}

	const schema = z.object({
		username: z.string().trim().min(1, 'Username is required'),
		password: z.string().min(1, 'Password is required')
	});

	const form = superForm(
		{
			username: '',
			password: ''
		},
		{
			validators: zodClient(schema),
			SPA: true,
			async onUpdate({ form }) {
				if (!form.valid) return;
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
	);

	const { form: formData, enhance } = form;
</script>

<div class="flex flex-1 items-center justify-center">
	<div class="card shadow-xl bg-primary-content w-96 max-w-full">
		<div class="card-body">
			<h1 class="card-title">Login</h1>
			<form method="post" use:enhance>
				<Field {form} name="username">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Username</span>
							</Label>
							<input
								type="text"
								class="input input-bordered w-full"
								class:input-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								bind:value={$formData.username}
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<Field {form} name="password">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Password</span>
							</Label>
							<input
								type="password"
								class="input input-bordered w-full"
								class:input-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								bind:value={$formData.password}
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<div class="card-actions mt-4">
					<button class="btn btn-primary w-full">Save</button>
				</div>
			</form>
		</div>
	</div>
</div>
