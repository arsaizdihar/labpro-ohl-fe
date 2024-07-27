import { z } from 'zod';
import { client, makeSchema } from './client';
import { SimpleFilmSchema } from './schema';

const FilmsResponseSchema = makeSchema(z.array(SimpleFilmSchema));

export async function getFilms(q?: string) {
	const searchParams = new URLSearchParams();
	if (q) {
		searchParams.set('q', q);
	}

	const data = await client()
		.get(`/films?${searchParams.toString()}`)
		.then((res) => res.data);
	const parsed = FilmsResponseSchema.parse(data);

	if (parsed.status === 'error') {
		throw new Error(parsed.message);
	}

	return parsed.data;
}

export async function deleteFilm(id: string) {
	const data = await client()
		.delete(`/films/${id}`)
		.then((res) => res.data);
	const parsed = FilmsResponseSchema.parse(data);

	if (parsed.status === 'error') {
		throw new Error(parsed.message);
	}

	return parsed.data;
}
