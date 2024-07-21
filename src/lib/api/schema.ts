import { z } from 'zod';

export const SimpleUserSchema = z.object({
	username: z.string(),
	name: z.string()
});

export const UserSchema = z.object({
	id: z.union([z.string(), z.number()]),
	username: z.string(),
	name: z.string(),
	email: z.string().email(),
	balance: z.number()
});
