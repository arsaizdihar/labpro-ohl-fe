import { z } from 'zod';

export const SimpleUserSchema = z.object({
	username: z.string(),
	name: z.string()
});

export const UserSchema = z.object({
	id: z.string(),
	username: z.string(),
	email: z.string().email(),
	balance: z.number()
});

export type User = z.infer<typeof UserSchema>;
