import { createQuery } from '@tanstack/svelte-query';

export function createAuthQuery() {
	return createQuery({
		queryKey: ['auth'],
		queryFn: async () => {
			return Promise.resolve({ id: 1, email: 'admin@gmail.com', role: 'admin' });
		}
	});
}
