import { client, makeSchema } from './client';
import { SimpleUserSchema } from './schema';

const LoginResponseSchema = makeSchema(SimpleUserSchema);

export async function login(body: { username: string; password: string }) {
	const data = await client()
		.post('/login', body)
		.then((res) => res.data);

	return LoginResponseSchema.parse(data);
}
