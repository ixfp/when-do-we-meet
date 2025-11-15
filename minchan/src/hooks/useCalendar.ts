import { useState } from "react";
import { Year, MonthZeroBased } from "../types";

export function useCalendar() {
	const today = new Date();
	const [displayYear, setDisplayYear] = useState<Year>(today.getFullYear());
	const [displayMonth, setDisplayMonth] = useState<MonthZeroBased>(today.getMonth());

	const handlePrevMonth = () => {
		const prev = new Date(displayYear, displayMonth - 1, 1);
		setDisplayYear(prev.getFullYear());
		setDisplayMonth(prev.getMonth());
	};

	const handleNextMonth = () => {
		const next = new Date(displayYear, displayMonth + 1, 1);
		setDisplayYear(next.getFullYear());
		setDisplayMonth(next.getMonth());
	};

	const handleMonthInput = (value: string) => {
		// value format: YYYY-MM
		const match = /^(\d{4})-(\d{2})$/.exec(value);
		if (!match) return;
		const y = Number(match[1]);
		const m = Number(match[2]);
		setDisplayYear(y);
		setDisplayMonth(Math.max(0, Math.min(11, m - 1)));
	};

	const resetToToday = () => {
		const now = new Date();
		setDisplayYear(now.getFullYear());
		setDisplayMonth(now.getMonth());
	};

	return {
		displayYear,
		displayMonth,
		handlePrevMonth,
		handleNextMonth,
		handleMonthInput,
		resetToToday,
	};
}

