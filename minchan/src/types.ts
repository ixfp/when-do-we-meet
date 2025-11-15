import { z } from "zod";
import { MAX_USERS } from "./constants";

export type UserId = string;
export type IsoDate = string; // YYYY-MM-DD
export type Year = number;
export type MonthZeroBased = number; // 0 - 11

const userSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	selectedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export type User = z.infer<typeof userSchema>;

export const selectionSchema = z.object({
	users: z.array(userSchema).max(MAX_USERS),
});

