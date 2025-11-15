import { MiniCalendar } from "./MiniCalendar";
import { useCalendar } from "../hooks/useCalendar";
import { useSelections } from "../hooks/useSelections";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { User } from "../types";
import { SchedulingResult } from "../scheduler/schedule";

interface CalendarSectionProps {
	calendarHook: ReturnType<typeof useCalendar>;
	selectionsHook: ReturnType<typeof useSelections>;
	users: User[];
	schedule: SchedulingResult | null;
	settings: { minDatesPerPerson: number };
}

export function CalendarSection({
	calendarHook,
	selectionsHook,
	users,
	schedule,
	settings,
}: CalendarSectionProps) {
	const {
		displayYear,
		displayMonth,
		handlePrevMonth,
		handleNextMonth,
		handleMonthInput,
	} = calendarHook;
	const { activeUser, activeUserId, toggleDateForActiveUser } = selectionsHook;

	return (
		<section className="mt-6">
			<h2 className="text-xl font-semibold mb-4">
				{activeUser ? `${activeUser.name}의 달력` : "사용자를 선택하세요"}
			</h2>
			<div className="flex gap-2 items-center mb-4">
				<Button variant="outline" size="icon" onClick={handlePrevMonth}>
					◀︎
				</Button>
				<Input
					type="month"
					value={`${displayYear}-${String(displayMonth + 1).padStart(2, "0")}`}
					onChange={(e) => handleMonthInput(e.target.value)}
					aria-label="월 선택"
					className="w-[180px]"
				/>
				<Button variant="outline" size="icon" onClick={handleNextMonth}>
					▶︎
				</Button>
			</div>
			<MiniCalendar
				year={displayYear}
				month={displayMonth}
				selectedDates={activeUser?.selectedDates ?? []}
				onToggleDate={toggleDateForActiveUser}
				users={users}
				schedule={schedule}
				activeUserId={activeUserId}
			/>
			<p className="text-muted-foreground mt-4 text-sm">
				주말은 하이라이트되며 선택/해제가 가능합니다. 각 사용자는 최소{" "}
				{settings.minDatesPerPerson}일을 선택해야 합니다. 추천 날짜는 파란색으로
				표시됩니다.
			</p>
		</section>
	);
}
