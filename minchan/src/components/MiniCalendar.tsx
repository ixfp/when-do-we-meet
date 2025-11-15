import _ from "lodash";
import { IsoDate, Year, MonthZeroBased, User } from "../types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { SchedulingResult } from "../scheduler/schedule";

interface MiniCalendarProps {
	year: Year;
	month: MonthZeroBased; // 0-index
	selectedDates: IsoDate[];
	onToggleDate: (iso: IsoDate) => void;
	users: User[];
	schedule: SchedulingResult | null;
	activeUserId: string | null;
}

export function MiniCalendar({
	year,
	month,
	selectedDates,
	onToggleDate,
	users,
	schedule,
	activeUserId,
}: MiniCalendarProps) {
	const monthDate = useMemo(() => new Date(year, month, 1), [year, month]);
	
	// 달력 날짜 범위 계산 (주 시작일부터 주 종료일까지)
	const calendarDays = useMemo(() => {
		const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
		const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
		return eachDayOfInterval({ start, end });
	}, [monthDate]);

	// 날짜별 참석 가능한 사용자 맵 (youngwoo의 availabilityMap 기반)
	const availabilityMap = useMemo(() => {
		const map = new Map<IsoDate, string[]>();
		users.forEach((user) => {
			user.selectedDates.forEach((date) => {
				if (!isSameMonth(parseISO(date), monthDate)) return;
				const existing = map.get(date) ?? [];
				map.set(date, [...existing, user.name]);
			});
		});
		return map;
	}, [users, monthDate]);

	// 추천 날짜 집합 (schedule의 coreDates 또는 finalDates)
	const recommendedDates = useMemo(() => {
		if (!schedule) return new Set<IsoDate>();
		// coreDates를 우선 사용하고, 없으면 assignments에서 추출
		const recommended = new Set<IsoDate>();
		schedule.coreDates.forEach((date) => {
			if (isSameMonth(parseISO(date), monthDate)) {
				recommended.add(date);
			}
		});
		// assignments에서도 추천 날짜 추출
		schedule.assignments.forEach((dates) => {
			dates.forEach((date) => {
				if (isSameMonth(parseISO(date), monthDate)) {
					recommended.add(date);
				}
			});
		});
		return recommended;
	}, [schedule, monthDate]);

	const toIso = (date: Date): IsoDate =>
		`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
			date.getDate(),
		).padStart(2, "0")}`;

	const isWeekend = (date: Date) => {
		const day = date.getDay();
		return day === 0 || day === 6;
	};

	return (
		<div className="grid grid-cols-7 gap-3 max-w-[800px]">
			{_.map(["일", "월", "화", "수", "목", "금", "토"], (label) => (
				<div key={label} className="text-center font-semibold text-sm">
					{label}
				</div>
			))}
			{calendarDays.map((date) => {
				const iso = toIso(date);
				const selected = _.includes(selectedDates, iso);
				const weekend = isWeekend(date);
				const isCurrentMonth = isSameMonth(date, monthDate);
				const isRecommended = recommendedDates.has(iso);
				const attendees = availabilityMap.get(iso) ?? [];
				const activeUser = users.find((u) => u.id === activeUserId);
				const isSelectedByActive = Boolean(activeUser?.selectedDates.includes(iso));

				return (
					<button
						key={iso}
						onClick={() => onToggleDate(iso)}
						disabled={!isCurrentMonth || !weekend}
						className={cn(
							"aspect-square rounded-lg border transition-colors text-left p-3 relative min-w-[90px] min-h-[90px]",
							!isCurrentMonth && "opacity-30 cursor-not-allowed",
							isCurrentMonth && "cursor-pointer",
							// 추천 날짜 강조 (youngwoo 스타일)
							isRecommended && "bg-blue-100 border-blue-400 dark:bg-blue-900 dark:border-blue-600",
							// 선택된 날짜
							selected && !isRecommended && weekend
								? "bg-blue-200 border-primary"
								: selected && !isRecommended
									? "bg-primary/80 text-primary-foreground border-primary/80"
									: "",
							// 주말 스타일
							weekend && !selected && !isRecommended
								? "bg-accent text-accent-foreground border-border hover:bg-accent/80"
								: !selected && !isRecommended
									? "bg-background text-foreground border-border hover:bg-accent"
									: "",
							weekend && "font-semibold",
							// 활성 사용자가 선택한 날짜
							isSelectedByActive && isCurrentMonth && "ring-2 ring-offset-2 ring-primary",
						)}
					>
						<span className="text-sm font-medium">{date.getDate()}</span>
						{isRecommended && (
							<span className="absolute top-1 right-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
								추천
							</span>
						)}
						<div className="mt-1 space-y-0.5">
							{attendees.length === 0 && isCurrentMonth && (
								<span className="text-xs text-muted-foreground">미정</span>
							)}
							{attendees.slice(0, 2).map((name, index) => (
								<span
									key={`${iso}-${name}-${index}`}
									className="text-xs block bg-muted px-1 py-0.5 rounded truncate"
								>
									{name}
								</span>
							))}
							{attendees.length > 2 && (
								<span className="text-xs text-muted-foreground">
									+{attendees.length - 2}
								</span>
							)}
						</div>
					</button>
				);
			})}
		</div>
	);
}
