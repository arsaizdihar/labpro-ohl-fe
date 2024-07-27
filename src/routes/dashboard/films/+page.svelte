<script lang="ts">
	import { deleteFilm, getFilms } from '$lib/api/films';
	import type { SimpleFilm, User } from '$lib/api/schema';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import type { EventHandler } from 'svelte/elements';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	let q = '';
	let deleteDialog: HTMLDialogElement;
	let formDialog: HTMLDialogElement;
	let toDelete: SimpleFilm | null = null;
	let editId: string | null = null;
	let timeout: number | null = null;

	$: films = createQuery({
		queryKey: ['films', q],
		queryFn: async () => getFilms(q)
	});
	const queryClient = useQueryClient();

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: ['films'] });
	}

	$: deleteMutation = createMutation({
		mutationFn: deleteFilm,
		onMutate(id) {
			const prev = $films.data;
			queryClient.setQueryData(['films', q], (old: SimpleFilm[] | undefined) => {
				if (!old) return undefined;
				return old.filter((u) => u.id !== id);
			});
			return prev;
		},
		onSuccess: invalidate,
		onError: invalidate
	});

	const onSearchSubmit: EventHandler<SubmitEvent, HTMLFormElement> = (e) => {
		const input = e.currentTarget.querySelector('input');
		if (input) {
			q = input.value;
		}
	};

	const schema = z.object({
		title: z.string().min(1, 'Title is required'),
		description: z.string(),
		release_year: z.number({ message: 'Invalid year' }).refine((v) => v > 1000, 'Invalid year'),
		genre: z.array(z.string()),
		price: z.number({ message: 'Invalid price' }).int().positive('Invalid price'),
		duration: z.string().regex(/^([0-9]{2}):([0-9]{2}):([0-9]{2})$/, 'Invalid duration'),
		cover_image: z.any().refine((v) => v === null || v instanceof File, 'Cover image is required'),
		video: z.any().refine((v) => v === null || v instanceof File, 'Video is required')
	});

	const form = superForm(
		{
			title: '',
			description: '',
			release_year: new Date().getFullYear(),
			genre: [] as string[],
			price: '' as unknown as number,
			duration: '',
			cover_image: null as File | null,
			video: null as File | null
		},
		{
			validators: zodClient(schema),
			SPA: true,
			resetForm: false,
			async onUpdate({ form }) {
				if (!editId) {
					if (!form.data.cover_image || !form.data.video) {
						form.errors.cover_image = form.data.cover_image ? [] : ['Cover image is required'];
						form.errors.video = form.data.video ? [] : ['Video is required'];
					}
				}
				if (!form.valid) return;
			}
		}
	);

	const { form: formData, enhance } = form;
</script>

<div class="flex-1">
	<div class="flex justify-between items-center my-4">
		<h1 class="text-xl font-bold mb-4 px-4">Films Management</h1>
		<button
			class="btn btn-primary btn-sm"
			on:click={() => {
				formDialog.showModal();
			}}
		>
			Create
		</button>
	</div>
	<form on:submit|preventDefault={onSearchSubmit}>
		<label class="input input-bordered flex items-center gap-2 input-sm">
			<input
				type="text"
				class="grow"
				placeholder="Search"
				on:input={(e) => {
					if (timeout) {
						clearTimeout(timeout);
					}
					const value = e.currentTarget.value;

					timeout = setTimeout(() => {
						q = value;
						$films.refetch();
					}, 500);
				}}
			/>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 16"
				fill="currentColor"
				class="h-4 w-4 opacity-70"
			>
				<path
					fill-rule="evenodd"
					d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
					clip-rule="evenodd"
				/>
			</svg>
		</label>
	</form>
	<dialog bind:this={deleteDialog} class="modal">
		<div class="modal-box">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
			</form>
			<h3 class="text-lg font-bold">Delete Film</h3>
			<p class="py-4">
				Are you sure you want to delete film
				<span class="font-bold italic">`{toDelete?.title}`</span>?
			</p>
			<div class="flex justify-end space-x-2">
				<button
					class="btn btn-outline btn-sm"
					on:click={() => {
						deleteDialog.close();
					}}
				>
					Cancel
				</button>
				<button
					class="btn btn-error btn-sm"
					on:click={() => {
						if (!toDelete) return;
						$deleteMutation.mutate(toDelete.id);
						deleteDialog.close();
					}}
				>
					Delete
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button>close</button>
		</form>
	</dialog>
	<dialog bind:this={formDialog} class="modal" on:close={() => {}}>
		<div class="modal-box">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
			</form>
			<h3 class="text-lg font-bold">Create Film</h3>
			<form method="post" use:enhance enctype="multipart/form-data">
				<Field {form} name="title">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Title</span>
							</Label>
							<input
								type="text"
								class="input input-bordered w-full"
								class:input-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								bind:value={$formData.title}
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<Field {form} name="description">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Description</span>
							</Label>
							<textarea
								class="textarea textarea-bordered w-full"
								class:textarea-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								bind:value={$formData.description}
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<Field {form} name="release_year">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Release year</span>
							</Label>
							<input
								type="number"
								class="input input-bordered w-full"
								class:input-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								bind:value={$formData.release_year}
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<Field {form} name="price">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Price</span>
							</Label>
							<input
								type="number"
								class="input input-bordered w-full"
								class:input-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								bind:value={$formData.price}
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<Field {form} name="duration">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Duration (hh:mm:ss)</span>
							</Label>
							<input
								type="text"
								class="input input-bordered w-full"
								class:input-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								bind:value={$formData.duration}
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<Field {form} name="cover_image">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Cover Image</span>
							</Label>
							<input
								type="file"
								class="file-input file-input-bordered w-full"
								class:file-input-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								on:input={(e) => {
									const file = e.currentTarget.files?.[0];
									if (file) {
										$formData.cover_image = file;
									}
								}}
								accept="image/*"
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<Field {form} name="video">
					<div class="form-control w-full">
						<Control let:attrs>
							<Label class="label">
								<span class="label-text">Film Video</span>
							</Label>
							<input
								type="file"
								class="file-input file-input-bordered w-full"
								class:file-input-error={attrs['data-fs-error'] !== undefined}
								{...attrs}
								on:input={(e) => {
									const file = e.currentTarget.files?.[0];
									if (file) {
										$formData.video = file;
									}
								}}
								accept="video/*"
							/>
						</Control>
						<FieldErrors class="text-error mt-1 text-sm" />
					</div>
				</Field>
				<button class="btn btn-primary w-full mt-4">Save</button>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button>close</button>
		</form>
	</dialog>
	<ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-8">
		{#if $films.data}
			{#each $films.data as film}
				<li class="card card-compact bg-base-300 hover:shadow-xl duration-300">
					<figure class="w-full aspect-[4/3] bg-black">
						<img src={film.cover_image_url} alt={film.title} class="aspect-[4/3] object-cover" />
					</figure>
					<div class="card-body">
						<h2 class="card-title">{film.title} ({film.release_year})</h2>
						<ul class="flex flex-wrap gap-x-1">
							{#each film.genre as genre}
								<li class="badge badge-sm font-medium">{genre}</li>
							{/each}
						</ul>
						<div class="card-actions justify-end">
							<button class="btn btn-neutral btn-sm w-16">Edit</button>
							<button
								class="btn btn-error btn-sm w-16"
								on:click={() => {
									toDelete = film;
									deleteDialog.showModal();
								}}
							>
								Delete
							</button>
						</div>
					</div>
				</li>
			{/each}
		{/if}
	</ul>
</div>
