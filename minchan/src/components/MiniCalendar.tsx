import _ from "lodash";
import { IsoDate, Year, MonthZeroBased } from "../types";
import { cn } from "@/lib/utils";

interface MiniCalendarProps {
	year: Year;
	month: MonthZeroBased; // 0-index
	selectedDates: IsoDate[];
	onToggleDate: (iso: IsoDate) => void;
}

export function MiniCalendar({
	year,
	month,
	selectedDates,
	onToggleDate,
}: MiniCalendarProps) {
	const first = new Date(year, month, 1);
	const last = new Date(year, month + 1, 0);

	const days = _.times(last.getDate(), (d) => new Date(year, month, d + 1));

	const isWeekend = (date: Date) => {
		const day = date.getDay();
		return day === 0 || day === 6;
	};

	const toIso = (date: Date): IsoDate =>
		`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
			date.getDate(),
		).padStart(2, "0")}`;

	return (
		<div className="grid grid-cols-7 gap-2 max-w-[560px]">
			{_.map(["일", "월", "화", "수", "목", "금", "토"], (label) => (
				<div key={label} className="text-center font-semibold text-sm">
					{label}
				</div>
			))}
			{/* 시작 요일 이전 빈칸 */}
			{_.times(first.getDay(), (i) => (
				<div key={`empty-${i}`} />
			))}
			{_.map(days, (date) => {
				const iso = toIso(date);
				const selected = _.includes(selectedDates, iso);
				const weekend = isWeekend(date);
				return (
					<button
						key={iso}
						onClick={() => onToggleDate(iso)}
						className={cn(
							"aspect-square rounded-lg border transition-colors",
							selected
								? weekend
									? "bg-primary text-primary-foreground border-primary"
									: "bg-primary/80 text-primary-foreground border-primary/80"
								: weekend
									? "bg-accent text-accent-foreground border-border hover:bg-accent/80"
									: "bg-background text-foreground border-border hover:bg-accent",
							weekend && "font-semibold"
						)}
					>
						{date.getDate()}
					</button>
				);
			})}
		</div>
	);
}

