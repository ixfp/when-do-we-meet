import { z } from "zod";

const STORAGE_KEY = "calendar-scheduler/selections";

export function loadSelections<T extends z.ZodTypeAny>(
	schema: T,
): z.infer<T> | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return schema.parse(parsed);
	} catch {
		return null;
	}
}

export function saveSelections(value: unknown) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearSelections() {
	localStorage.removeItem(STORAGE_KEY);
}

